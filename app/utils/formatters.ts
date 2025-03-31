import { getCurrencyConfig } from "@/config/currency";

/**
 * Format a number as currency using the configured currency settings
 */
export function formatCurrency(amount: number): string {
  const currencyConfig = getCurrencyConfig();
  
  return new Intl.NumberFormat(currencyConfig.locale, {
    style: 'currency',
    currency: currencyConfig.code,
    minimumFractionDigits: currencyConfig.minimumFractionDigits,
    maximumFractionDigits: currencyConfig.maximumFractionDigits,
  }).format(amount);
}

/**
 * Format a date in a user-friendly format
 */
export const formatDate = (dateString: string | Date): string => {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format a date with time
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Calculate monthly payment for a loan
 */
export function calculateMonthlyPayment(
  loanAmount: number,
  monthlyInterestRate: number,
  loanTermMonths: number
): number {
  // Convert percentage to decimal
  const interestRateDecimal = monthlyInterestRate / 100;
  
  // Calculate monthly payment using the formula:
  // P = L[r(1+r)^n]/[(1+r)^n-1]
  // where:
  // P = monthly payment
  // L = loan amount
  // r = monthly interest rate (decimal)
  // n = number of months
  
  if (interestRateDecimal === 0) {
    // Simple division for zero-interest loans
    return loanAmount / loanTermMonths;
  }
  
  const numerator = interestRateDecimal * Math.pow(1 + interestRateDecimal, loanTermMonths);
  const denominator = Math.pow(1 + interestRateDecimal, loanTermMonths) - 1;
  
  return loanAmount * (numerator / denominator);
}

/**
 * Calculate payment for a loan based on payment scheme
 * Supports weekly, bi-weekly, monthly and quarterly payment schemes
 */
export function calculatePayment(
  loanAmount: number,
  monthlyInterestRate: number,
  loanTermMonths: number,
  paymentScheme: string
): number {
  // Convert interest rate from percentage to decimal
  const interestRate = monthlyInterestRate / 100;
  
  // Calculate total interest over the loan period
  const totalInterest = loanAmount * interestRate * loanTermMonths;
  
  // Calculate total repayment amount (principal + interest)
  const totalRepayment = loanAmount + totalInterest;
  
  // Calculate base monthly payment
  const baseMonthlyPayment = totalRepayment / loanTermMonths;
  
  switch (paymentScheme.toLowerCase()) {
    case 'weekly':
      return baseMonthlyPayment / 4; // 4 weeks per month (approximate)
    case 'bi-weekly':
      return baseMonthlyPayment / 2; // 2 bi-weeks per month
    case 'quarterly':
      return baseMonthlyPayment * 3; // 3 months per quarter
    case 'monthly':
    default:
      return baseMonthlyPayment;
  }
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
} 