import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = new URLSearchParams(url.search);
    
    // Get potential loan amount from query params (default to 50000)
    const potentialLoanAmount = parseFloat(searchParams.get("amount") || "50000");
    
    // Get additional options if provided
    const interestRate = parseFloat(searchParams.get("interest") || "1.5"); // Default 1.5%
    const loanTerms = parseInt(searchParams.get("terms") || "12"); // Default 12 months
    const paymentScheme = searchParams.get("scheme") || "monthly"; // Default monthly
    const rollingLoans = searchParams.get("rolling") === "true"; // Check if rolling loans is enabled
    const projectionPeriod = parseInt(searchParams.get("period") || "0"); // Custom projection period
    const useManualReceivables = searchParams.get("useManual") === "true"; // Check if using manual receivables
    
    // Get current date and create projection window based on user preferences or defaults
    const today = new Date();
    const defaultPeriod = rollingLoans ? 12 : 24;
    const projectionMonths = projectionPeriod > 0 ? projectionPeriod : defaultPeriod;
    
    // Initialize monthly receivables object
    let monthlyReceivables: { [key: string]: number } = {};
    
    if (useManualReceivables) {
      // Use the manual receivables provided by the user
      const manualReceivablesParam = searchParams.get("manualReceivables");
      
      if (manualReceivablesParam) {
        try {
          const manualReceivables = JSON.parse(manualReceivablesParam);
          
          // Group manual receivables by month
          manualReceivables.forEach((receivable: { monthKey: string; amount: number }) => {
            const { monthKey, amount } = receivable;
            
            if (!monthlyReceivables[monthKey]) {
              monthlyReceivables[monthKey] = 0;
            }
            
            monthlyReceivables[monthKey] += amount;
          });
        } catch (err) {
          console.error("Error parsing manual receivables:", err);
        }
      }
      
      // Process recurring receivables if provided
      const recurringReceivablesParam = searchParams.get("recurringReceivables");
      
      if (recurringReceivablesParam) {
        try {
          const recurringReceivables = JSON.parse(recurringReceivablesParam);
          
          // Process each recurring receivable
          recurringReceivables.forEach((recurring: { 
            startMonthKey: string; 
            amount: number;
            frequency: "monthly" | "quarterly" | "annually";
          }) => {
            const { startMonthKey, amount, frequency } = recurring;
            
            // Parse the start month
            const [startYear, startMonth] = startMonthKey.split("-").map(n => parseInt(n));
            
            // Calculate all occurrences for the projection period
            for (let i = 0; i < projectionMonths; i++) {
              // Only add receivables for months that match the frequency pattern
              // For monthly: every month
              // For quarterly: every 3 months
              // For annually: every 12 months
              
              // Calculate the current month from the starting point
              const currentMonthIndex = (startMonth - 1) + i; // 0-based index
              const currentMonth = (currentMonthIndex % 12) + 1; // 1-12 format
              const yearOffset = Math.floor(currentMonthIndex / 12);
              const currentYear = startYear + yearOffset;
              const monthKey = `${currentYear}-${String(currentMonth).padStart(2, "0")}`;
              
              // Determine if this month should have a recurring payment
              let shouldAddReceivable = false;
              
              if (frequency === "monthly") {
                // Add every month
                shouldAddReceivable = true;
              } else if (frequency === "quarterly") {
                // Add every 3 months from start month
                shouldAddReceivable = i % 3 === 0;
              } else if (frequency === "annually") {
                // Add every 12 months from start month
                shouldAddReceivable = i % 12 === 0;
              }
              
              if (shouldAddReceivable) {
                // Add to monthly receivables
                if (!monthlyReceivables[monthKey]) {
                  monthlyReceivables[monthKey] = 0;
                }
                
                monthlyReceivables[monthKey] += amount;
              }
            }
          });
        } catch (err) {
          console.error("Error processing recurring receivables:", err);
        }
      }
    } else {
      // Get all future payments (scheduled receivables) from the database
      const futurePayments = await prisma.payment.findMany({
        where: {
          isPaid: false,
          dueDate: {
            gte: today,
          },
        },
        orderBy: {
          dueDate: 'asc',
        },
        include: {
          loanSchedule: {
            select: {
              paymentScheme: true,
            }
          }
        }
      });
      
      // Group payments by month
      futurePayments.forEach((payment: {
        dueDate: Date | string;
        amount: number;
        loanSchedule: { paymentScheme: string };
      }) => {
        const paymentDate = new Date(payment.dueDate);
        const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyReceivables[monthKey]) {
          monthlyReceivables[monthKey] = 0;
        }
        
        monthlyReceivables[monthKey] += payment.amount;
      });
    }
    
    // Generate projection based on whether rolling loans is enabled
    let cashFlowProjection;
    let potentialLoanPayments;
    let statistics = {};
    
    if (rollingLoans) {
      // Generate rolling loans projection (new loans as receivables reach 50k threshold)
      const rollingProjection = generateRollingLoanProjection(
        monthlyReceivables,
        potentialLoanAmount,
        interestRate,
        loanTerms,
        paymentScheme,
        today,
        projectionMonths
      );
      
      cashFlowProjection = rollingProjection.projection;
      potentialLoanPayments = rollingProjection.allNewLoanPayments;
      
      // Calculate additional statistics for rolling loans
      const totalNewLoans = rollingProjection.newLoans.length;
      const totalPrincipal = totalNewLoans * potentialLoanAmount;
      
      // Calculate total interest from all new loans
      const totalInterest = rollingProjection.newLoans.reduce((sum, loan) => {
        const totalPayments = loan.payments.reduce((paymentSum, payment) => paymentSum + payment.amount, 0);
        const interest = totalPayments - loan.amount;
        return sum + interest;
      }, 0);
      
      // Calculate final capital at the end of projection period
      const finalCapital = cashFlowProjection.length > 0 ? 
        cashFlowProjection[cashFlowProjection.length - 1].runningCapital || 0 : 0;
      
      // Total payments from all loans over the projection period
      const totalPayments = rollingProjection.allNewLoanPayments.reduce((sum, payment) => sum + payment.amount, 0);
      
      // Add extended statistics
      statistics = {
        totalNewLoans,
        totalPrincipal,
        totalInterest,
        totalPayments,
        finalCapital,
        interestToLoanRatio: totalPrincipal > 0 ? (totalInterest / totalPrincipal) * 100 : 0,
        projectionPeriodMonths: projectionMonths,
        averageMonthlyLoanIssue: projectionMonths > 0 ? totalNewLoans / projectionMonths : 0,
        averageMonthlyReturn: projectionMonths > 0 ? totalPayments / projectionMonths : 0
      };
    } else {
      // Generate potential loan payments for a single loan
      potentialLoanPayments = generatePotentialLoanPayments(
        potentialLoanAmount,
        interestRate,
        loanTerms,
        paymentScheme,
        today
      );
      
      // Combine existing and potential payments for a complete cash flow projection
      cashFlowProjection = combinePayments(monthlyReceivables, potentialLoanPayments, projectionMonths);
      
      // Calculate total interest and principal for single loan
      const totalPayments = potentialLoanPayments.reduce((sum, payment) => sum + payment.amount, 0);
      const totalInterest = totalPayments - potentialLoanAmount;
      
      // Add statistics for single loan
      statistics = {
        loanPrincipal: potentialLoanAmount,
        totalInterest,
        totalPayments,
        interestToLoanRatio: potentialLoanAmount > 0 ? (totalInterest / potentialLoanAmount) * 100 : 0,
        projectionPeriodMonths: projectionMonths,
        monthsWithPayments: potentialLoanPayments.length
      };
    }
    
    return NextResponse.json({
      existingReceivables: monthlyReceivables,
      potentialLoanPayments,
      cashFlowProjection,
      loanAmount: potentialLoanAmount,
      interestRate,
      loanTerms,
      paymentScheme,
      rollingLoans,
      projectionMonths,
      useManualReceivables,
      receivablesSource: useManualReceivables ? "manual" : "scheduled",
      statistics
    });
  } catch (error) {
    console.error("Error generating cash flow projections:", error);
    return NextResponse.json(
      { error: "Failed to generate cash flow projections" },
      { status: 500 }
    );
  }
}

// Helper function to calculate payment for the new loan
function calculatePayment(
  loanAmount: number,
  monthlyInterest: number,
  loanTerms: number,
  paymentScheme: string
) {
  // Convert interest rate from percentage to decimal
  const monthlyInterestRate = monthlyInterest / 100;
  
  // Calculate total interest over the loan period
  const totalInterest = loanAmount * monthlyInterestRate * loanTerms;
  
  // Calculate total repayment amount (principal + interest)
  const totalRepayment = loanAmount + totalInterest;
  
  // Calculate base monthly payment
  const baseMonthlyPayment = totalRepayment / loanTerms;
  
  // Adjust payment based on payment scheme
  switch (paymentScheme.toLowerCase()) {
    case 'weekly':
      return baseMonthlyPayment / 4; // 4 weeks per month (approximate)
    case 'bi-weekly':
      return baseMonthlyPayment / 2; // 2 bi-weeks per month
    case 'monthly':
      return baseMonthlyPayment;
    case 'quarterly':
      return baseMonthlyPayment * 3; // 3 months per quarter
    default:
      return baseMonthlyPayment;
  }
}

// Function to generate payment dates and amounts for potential loan
function generatePotentialLoanPayments(
  loanAmount: number,
  interestRate: number,
  loanTerms: number,
  paymentScheme: string,
  startDate: Date
) {
  // Validate inputs
  if (isNaN(loanAmount) || loanAmount <= 0) {
    loanAmount = 50000; // Default to 50,000 if invalid
  }
  
  if (isNaN(interestRate) || interestRate < 0) {
    interestRate = 1.5; // Default to 1.5% if invalid
  }
  
  if (isNaN(loanTerms) || loanTerms <= 0) {
    loanTerms = 12; // Default to 12 months if invalid
  }
  
  if (!paymentScheme) {
    paymentScheme = 'monthly'; // Default to monthly if invalid
  }
  
  if (!startDate || !(startDate instanceof Date) || isNaN(startDate.getTime())) {
    startDate = new Date(); // Default to current date if invalid
  }
  
  const payments: { date: Date; amount: number; monthKey: string }[] = [];
  const paymentAmount = calculatePayment(loanAmount, interestRate, loanTerms, paymentScheme);
  
  // Determine payment interval and count based on scheme
  let daysToAdd = 30; // Default: monthly
  let numberOfPayments = loanTerms;
  
  switch (paymentScheme.toLowerCase()) {
    case 'weekly':
      numberOfPayments = loanTerms * 4;
      daysToAdd = 7;
      break;
    case 'bi-weekly':
      numberOfPayments = loanTerms * 2;
      daysToAdd = 14;
      break;
    case 'monthly':
      numberOfPayments = loanTerms;
      daysToAdd = 30;
      break;
    case 'quarterly':
      numberOfPayments = Math.ceil(loanTerms / 3);
      daysToAdd = 90;
      break;
  }
  
  // Create a clone of the start date to avoid modifying the original
  let currentDate = new Date(startDate);
  
  // Include the first payment in the current month
  // For a monthly scheme, the first payment is typically in the same month
  if (paymentScheme.toLowerCase() === 'monthly') {
    // Set the day to the last day of the current month to ensure it's counted in this month
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    currentDate.setDate(lastDayOfMonth);
  } else {
    // For other schemes, add the appropriate interval
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }
  
  // Generate dates and payment amounts
  for (let i = 0; i < numberOfPayments; i++) {
    const paymentDate = new Date(currentDate);
    const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`;
    
    payments.push({
      date: paymentDate,
      amount: paymentAmount,
      monthKey
    });
    
    // Move to next payment date
    if (paymentScheme.toLowerCase() === 'monthly' && i === 0) {
      // For monthly payments after the first one, move to the same day next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    } else {
      // For other schemes or subsequent monthly payments
      currentDate.setDate(currentDate.getDate() + daysToAdd);
    }
  }
  
  return payments;
}

// Function to combine existing and potential payments into a single projection
function combinePayments(
  existingReceivables: { [key: string]: number },
  potentialPayments: { date: Date; amount: number; monthKey: string }[],
  projectionMonths: number
) {
  // Validate inputs to prevent errors
  if (projectionMonths <= 0) {
    projectionMonths = 12; // Default to 12 months if invalid
  }
  
  if (!existingReceivables) {
    existingReceivables = {};
  }
  
  if (!potentialPayments || !Array.isArray(potentialPayments)) {
    potentialPayments = [];
  }
  
  const startDate = new Date();
  const projection: {
    monthKey: string;
    month: string;
    existingReceivables: number;
    potentialPayment: number;
    totalReceivables: number;
  }[] = [];
  
  // Ensure we start from the current month
  const currentMonthKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
  
  // Create entries for each month in the projection period
  for (let i = 0; i < projectionMonths; i++) {
    const projectionDate = new Date(startDate);
    projectionDate.setMonth(projectionDate.getMonth() + i);
    
    const monthKey = `${projectionDate.getFullYear()}-${String(projectionDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = projectionDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Sum potential payments for this month (with error handling)
    const potentialMonthlyPayment = potentialPayments
      .filter(payment => payment && payment.monthKey === monthKey)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Get existing receivables for this month (or 0 if none)
    const existingMonthlyReceivables = existingReceivables[monthKey] || 0;
    
    projection.push({
      monthKey,
      month: monthName,
      existingReceivables: existingMonthlyReceivables,
      potentialPayment: potentialMonthlyPayment,
      totalReceivables: existingMonthlyReceivables + potentialMonthlyPayment
    });
  }
  
  return projection;
}

// Function to generate a rolling loan projection where new loans are created when receivables reach 50k threshold
function generateRollingLoanProjection(
  existingReceivables: { [key: string]: number },
  loanAmount: number,
  interestRate: number,
  loanTerms: number,
  paymentScheme: string,
  startDate: Date,
  projectionMonths: number
) {
  // Validate inputs to prevent errors
  if (projectionMonths <= 0) {
    projectionMonths = 12; // Default to 12 months if invalid
  }
  
  if (!existingReceivables) {
    existingReceivables = {};
  }
  
  if (isNaN(loanAmount) || loanAmount <= 0) {
    loanAmount = 50000; // Default to 50,000 if invalid
  }
  
  // Starting with a working capital pool of 0
  let availableCapital = 0;
  
  // New loans that will be generated throughout the projection period
  const newLoans: Array<{
    startDate: Date;
    amount: number;
    payments: Array<{ date: Date; amount: number; monthKey: string }>;
  }> = [];
  
  // All payments from all new loans
  const allNewLoanPayments: Array<{ date: Date; amount: number; monthKey: string }> = [];
  
  // Start from the current month for the projection
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();
  
  // Initialize monthly projection data
  const projection: Array<{
    monthKey: string;
    month: string;
    existingReceivables: number;
    potentialPayment: number;
    newLoansIssued: number;
    totalReceivables: number;
    runningCapital: number;
  }> = [];
  
  // Process each month in the projection period
  for (let i = 0; i < projectionMonths; i++) {
    // Calculate the current month's date
    const currentDate = new Date(startYear, startMonth + i, 15); // Use middle of month for consistency
    const monthKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    
    // Get existing receivables for this month (or 0 if none)
    const existingMonthlyReceivables = existingReceivables[monthKey] || 0;
    
    // Calculate payments from all new loans for this month
    const newLoanPaymentsThisMonth = allNewLoanPayments
      .filter(payment => payment && payment.monthKey === monthKey)
      .reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    // Total receivables for this month from existing and new loans
    const totalMonthlyReceivables = existingMonthlyReceivables + newLoanPaymentsThisMonth;
    
    // Add this month's receivables to available capital
    availableCapital += totalMonthlyReceivables;
    
    // Determine how many new loans can be issued with the available capital
    const loansToIssue = Math.floor(availableCapital / loanAmount);
    const totalAmountToLend = loansToIssue * loanAmount;
    
    // Update available capital after issuing loans
    availableCapital -= totalAmountToLend;
    
    // New loans issued this month
    let newLoansIssuedThisMonth = 0;
    
    // If we can issue new loans, create them
    if (loansToIssue > 0) {
      // Create new loans for this month
      for (let j = 0; j < loansToIssue; j++) {
        // Set the loan start date to the end of the current month
        const loanStartDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        
        // Generate payments for this new loan
        const loanPayments = generatePotentialLoanPayments(
          loanAmount,
          interestRate,
          loanTerms,
          paymentScheme,
          loanStartDate
        );
        
        // Add the loan to our list of new loans
        newLoans.push({
          startDate: loanStartDate,
          amount: loanAmount,
          payments: loanPayments
        });
        
        // Add this loan's payments to all new loan payments
        allNewLoanPayments.push(...loanPayments);
        
        // Increment new loans counter
        newLoansIssuedThisMonth++;
      }
    }
    
    // Add this month to the projection
    projection.push({
      monthKey,
      month: monthName,
      existingReceivables: existingMonthlyReceivables,
      potentialPayment: newLoanPaymentsThisMonth,
      newLoansIssued: newLoansIssuedThisMonth,
      totalReceivables: totalMonthlyReceivables,
      runningCapital: availableCapital
    });
  }
  
  return {
    projection,
    newLoans,
    allNewLoanPayments
  };
} 