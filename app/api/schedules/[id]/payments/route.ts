import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/schedules/[id]/payments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanScheduleId = params.id;

    const payments = await prisma.payment.findMany({
      where: {
        loanScheduleId,
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}

// POST /api/schedules/[id]/payments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanScheduleId = params.id;
    const body = await request.json();

    // Validate request body
    if (!body.dueDate || !body.amount) {
      return NextResponse.json(
        { error: "Due date and amount are required" },
        { status: 400 }
      );
    }

    const payment = await prisma.payment.create({
      data: {
        loanScheduleId,
        dueDate: new Date(body.dueDate),
        amount: body.amount,
        isPaid: body.isPaid || false,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : null,
        chequeNumber: body.chequeNumber,
      },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json(
      { error: "Failed to create payment" },
      { status: 500 }
    );
  }
}

// Generate payments for a loan schedule
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanScheduleId = params.id;
    
    // Get the loan schedule
    const loanSchedule = await prisma.loanSchedule.findUnique({
      where: { id: loanScheduleId },
    });

    if (!loanSchedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }

    // Delete existing payments for this schedule (if any)
    await prisma.payment.deleteMany({
      where: { loanScheduleId },
    });

    // Calculate payment amount
    const paymentAmount = calculatePayment(
      loanSchedule.loanAmount,
      loanSchedule.monthlyInterest,
      loanSchedule.loanTerms,
      loanSchedule.paymentScheme
    );

    // Generate payment dates based on payment scheme
    const paymentDates = generatePaymentDates(
      new Date(loanSchedule.startDate),
      loanSchedule.loanTerms,
      loanSchedule.paymentScheme
    );

    // Create payment records
    const payments = await Promise.all(
      paymentDates.map((dueDate) =>
        prisma.payment.create({
          data: {
            loanScheduleId,
            dueDate,
            amount: paymentAmount,
            isPaid: false,
          },
        })
      )
    );

    return NextResponse.json(payments);
  } catch (error) {
    console.error("Error generating payments:", error);
    return NextResponse.json(
      { error: "Failed to generate payments" },
      { status: 500 }
    );
  }
}

// Helper function to calculate payment amount
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

// Helper function to generate payment dates
function generatePaymentDates(
  startDate: Date,
  loanTerms: number,
  paymentScheme: string
) {
  const dates: Date[] = [];
  
  // First, set up the payment interval
  let numberOfPayments = loanTerms;
  let daysToAdd = 30; // Default: monthly
  
  // Adjust number of payments and interval based on scheme
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
  
  // Start with the loan date
  let currentDate = new Date(startDate);
  
  // Add interval to the start date to get the first payment date
  // This ensures first payment comes after loan start date
  currentDate.setDate(currentDate.getDate() + daysToAdd);
  
  // Generate dates
  for (let i = 0; i < numberOfPayments; i++) {
    const paymentDate = new Date(currentDate);
    dates.push(paymentDate);
    
    // Move to next payment date
    currentDate.setDate(currentDate.getDate() + daysToAdd);
  }
  
  return dates;
} 