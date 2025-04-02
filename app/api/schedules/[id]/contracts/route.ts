import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/app/utils/auth";
import fs from "fs-extra";
import path from "path";
import { promisify } from "util";
import { mkdir } from "fs/promises";
import { generateDocx } from "@/lib/docx";
import { writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import docxToPdf from "docx-pdf";

// Directory for storing generated contracts
const CONTRACTS_DIR = process.env.NODE_ENV === 'production' 
  ? path.join('/tmp', 'contracts')
  : path.join(process.cwd(), 'public', 'contracts');

// Ensure contracts directory exists
async function ensureContractsDir() {
  await fs.ensureDir(CONTRACTS_DIR);
}

// Helper function to convert DOCX to PDF using docx-pdf
async function convertToPdf(docxPath: string, pdfPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    docxToPdf(docxPath, pdfPath, (err: Error | null) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

// Helper function to format date
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to convert number to words
function numberToWords(num: number): string {
  const ones = [
    "",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
  ];
  const tens = [
    "",
    "",
    "twenty",
    "thirty",
    "forty",
    "fifty",
    "sixty",
    "seventy",
    "eighty",
    "ninety",
  ];

  if (num === 0) return "zero";
  if (num < 20) return ones[num];
  if (num < 100) {
    return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
  }
  if (num < 1000) {
    return (
      ones[Math.floor(num / 100)] +
      " hundred" +
      (num % 100 ? " and " + numberToWords(num % 100) : "")
    );
  }
  if (num < 1000000) {
    return (
      numberToWords(Math.floor(num / 1000)) +
      " thousand" +
      (num % 1000 ? " " + numberToWords(num % 1000) : "")
    );
  }
  return (
    numberToWords(Math.floor(num / 1000000)) +
    " million" +
    (num % 1000000 ? " " + numberToWords(num % 1000000) : "")
  );
}

// POST /api/schedules/[id]/contracts - Generate contracts for a loan schedule
export const POST = withAuth(async (request: NextRequest, { params }: { params: { id: string } }): Promise<Response> => {
  try {
    const id = params.id;
    const body = await request.json();
    const { contractType = "promissory", lenderName } = body; // Get lenderName from request body
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Loan schedule ID is required" },
        { status: 400 }
      );
    }
    
    if (!lenderName) {
      return NextResponse.json(
        { error: "Lender name is required" },
        { status: 400 }
      );
    }
    
    // Fetch the loan schedule with client details
    const loanSchedule = await prisma.loanSchedule.findUnique({
      where: { id },
      include: {
        client: true,
        payments: {
          orderBy: {
            dueDate: 'asc',
          },
        },
      },
    });
    
    if (!loanSchedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }
    
    // Ensure contracts directory exists
    await ensureContractsDir();
    
    // Define timestamp and filename for uniqueness
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '');
    const clientName = `${loanSchedule.client.lastName}_${loanSchedule.client.firstName}`.replace(/\s+/g, '_');
    const contractFileName = `${clientName}_${contractType}_${timestamp}`;
    
    // Template data for the contract
    const templateData = {
      // Required fields from TemplateData interface
      clientName: `${loanSchedule.client.firstName} ${loanSchedule.client.lastName}`,
      clientAddress: loanSchedule.client.address || "",
      clientPhone: loanSchedule.client.phone || "",
      clientEmail: loanSchedule.client.email || "",
      loanAmount: loanSchedule.loanAmount.toFixed(2),
      loanAmountInWords: numberToWords(loanSchedule.loanAmount),
      interestRate: loanSchedule.monthlyInterest.toString() + "%",
      termInMonths: loanSchedule.loanTerms,
      startDate: formatDate(loanSchedule.startDate),
      endDate: formatDate(new Date(loanSchedule.startDate.getTime() + loanSchedule.loanTerms * 30 * 24 * 60 * 60 * 1000)),
      monthlyPayment: loanSchedule.payments.length > 0 
        ? loanSchedule.payments[0].amount.toFixed(2) 
        : "0.00",
      monthlyPaymentInWords: loanSchedule.payments.length > 0 
        ? numberToWords(loanSchedule.payments[0].amount)
        : "zero",
      totalPayment: (loanSchedule.loanAmount + (loanSchedule.loanAmount * loanSchedule.monthlyInterest * loanSchedule.loanTerms / 100)).toFixed(2),
      totalPaymentInWords: numberToWords(loanSchedule.loanAmount + (loanSchedule.loanAmount * loanSchedule.monthlyInterest * loanSchedule.loanTerms / 100)),
      totalInterest: (loanSchedule.loanAmount * loanSchedule.monthlyInterest * loanSchedule.loanTerms / 100).toFixed(2),
      totalInterestInWords: numberToWords(loanSchedule.loanAmount * loanSchedule.monthlyInterest * loanSchedule.loanTerms / 100),
      
      // Additional custom fields for templates (can still be used in templates)
      releaseDate: formatDate(new Date()),
      releaseYear: new Date().getFullYear().toString(),
      grossLoanAmountWithCurrency: `Php ${loanSchedule.loanAmount.toFixed(2)}`,
      loanTerms: loanSchedule.loanTerms.toString() + " months",
      firstPaymentDate: loanSchedule.payments.length > 0 
        ? formatDate(loanSchedule.payments[0].dueDate)
        : "",
      lastPaymentDate: loanSchedule.payments.length > 0 
        ? formatDate(loanSchedule.payments[loanSchedule.payments.length - 1].dueDate)
        : "",
      lenderName: lenderName // Use the lenderName from request body
    };
    
    // Determine which template to use
    let templatePath = "";
    if (contractType === "guarantee") {
      templatePath = path.join(process.cwd(), "contract_templates", "Letter of Guarantee Template.docx");
    } else {
      templatePath = path.join(process.cwd(), "contract_templates", "Promissory Note Template.docx");
    }
    
    // Generate paths for output files
    const docxPath = path.join(CONTRACTS_DIR, `${contractFileName}.docx`);
    const pdfPath = path.join(CONTRACTS_DIR, `${contractFileName}.pdf`);
    
    // Generate the DOCX file
    await generateDocx(templatePath, templateData, docxPath);
    
    let pdfAvailable = false;
    try {
      // Convert the DOCX to PDF
      await convertToPdf(docxPath, pdfPath);
      pdfAvailable = true;
    } catch (error) {
      console.error("Error converting to PDF:", error);
      // If PDF conversion fails, we'll still return the DOCX file
    }
    
    // Update the loan schedule to indicate it has a contract
    await prisma.loanSchedule.update({
      where: { id },
      data: {
        hasContract: true,
      },
    });
    
    // Return the contract file paths
    return NextResponse.json({
      success: true,
      docxPath: process.env.NODE_ENV === 'production' 
        ? `/api/contracts/${contractFileName}.docx`
        : `/contracts/${contractFileName}.docx`,
      pdfPath: pdfAvailable 
        ? (process.env.NODE_ENV === 'production' 
            ? `/api/contracts/${contractFileName}.pdf`
            : `/contracts/${contractFileName}.pdf`)
        : "",
      pdfAvailable
    });
  } catch (error) {
    console.error("Error generating contract:", error);
    return NextResponse.json(
      { error: "Failed to generate contract" },
      { status: 500 }
    );
  }
});

// GET /api/schedules/[id]/contracts - Check contract status
export const GET = withAuth(async (request: NextRequest, { params }: { params: { id: string } }): Promise<Response> => {
  try {
    const id = params.id;
    
    // Fetch the loan schedule
    const loanSchedule = await prisma.loanSchedule.findUnique({
      where: { id },
    });
    
    if (!loanSchedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      hasContract: loanSchedule.hasContract
    });
  } catch (error) {
    console.error("Error checking contract status:", error);
    return NextResponse.json(
      { error: "Failed to check contract status" },
      { status: 500 }
    );
  }
}); 