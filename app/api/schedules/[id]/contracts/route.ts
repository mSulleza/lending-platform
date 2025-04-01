import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/app/utils/auth";
import fs from "fs-extra";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { PDFDocument } from "pdf-lib";
import { spawn } from "child_process";
import { promisify } from "util";
import { mkdir } from "fs/promises";

// Directory for storing generated contracts
const CONTRACTS_DIR = path.join(process.cwd(), "public", "contracts");

// Ensure contracts directory exists
async function ensureContractsDir() {
  await fs.ensureDir(CONTRACTS_DIR);
}

// Check if LibreOffice is available
async function isLibreOfficeAvailable() {
  return new Promise((resolve) => {
    const process = spawn('which', ['libreoffice']);
    
    process.on('close', (code) => {
      resolve(code === 0);
    });
    
    process.on('error', () => {
      resolve(false);
    });
  });
}

// Helper function to convert DOCX to PDF using libreoffice (requires libreoffice to be installed)
async function convertToPdf(docxPath: string, pdfPath: string): Promise<string> {
  // Check if libreoffice is available
  const libreOfficeAvailable = await isLibreOfficeAvailable();
  
  if (!libreOfficeAvailable) {
    console.warn("LibreOffice is not available for PDF conversion");
    throw new Error("PDF conversion not available");
  }
  
  return new Promise((resolve, reject) => {
    // Create a child process to convert docx to pdf using libreoffice
    const process = spawn('libreoffice', [
      '--headless',
      '--convert-to',
      'pdf',
      '--outdir',
      path.dirname(pdfPath),
      docxPath
    ]);

    process.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Conversion process exited with code ${code}`));
        return;
      }
      resolve(pdfPath);
    });

    process.on('error', (err) => {
      reject(new Error(`Failed to start conversion process: ${err.message}`));
    });
  });
}

// Helper function to generate a docx document from a template
async function generateDocx(templatePath: string, data: Record<string, any>, outputPath: string): Promise<string> {
  // Read the template
  const content = await fs.readFile(templatePath, "binary");
  
  // Create a zip of the read file content
  const zip = new PizZip(content);
  
  // Initialize docxtemplater with the zip file
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
  });
  
  // Set the template variables
  doc.render(data);
  
  // Get the document as a buffer
  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });
  
  // Write the document to disk
  await fs.writeFile(outputPath, buffer);
  
  return outputPath;
}

// POST /api/schedules/[id]/contracts - Generate contracts for a loan schedule
export const POST = withAuth(async (request: NextRequest, { params }: { params: { id: string } }): Promise<Response> => {
  try {
    const id = params.id;
    const body = await request.json();
    const { contractType = "promissory" } = body; // Default to promissory note if not specified
    
    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "Loan schedule ID is required" },
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
      clientFirstName: loanSchedule.client.firstName,
      clientLastName: loanSchedule.client.lastName,
      clientFullName: `${loanSchedule.client.firstName} ${loanSchedule.client.lastName}`,
      clientAddress: loanSchedule.client.address || "",
      clientCity: loanSchedule.client.city || "",
      clientState: loanSchedule.client.state || "",
      clientZipCode: loanSchedule.client.zipCode || "",
      clientEmail: loanSchedule.client.email,
      clientPhone: loanSchedule.client.phone || "",
      loanAmount: loanSchedule.loanAmount.toFixed(2),
      loanAmountWords: numberToWords(loanSchedule.loanAmount),
      monthlyInterest: loanSchedule.monthlyInterest.toFixed(2),
      loanTerms: loanSchedule.loanTerms,
      paymentScheme: loanSchedule.paymentScheme,
      startDate: formatDate(loanSchedule.startDate),
      firstPaymentDate: loanSchedule.payments.length > 0 
        ? formatDate(loanSchedule.payments[0].dueDate) 
        : "",
      lastPaymentDate: loanSchedule.payments.length > 0 
        ? formatDate(loanSchedule.payments[loanSchedule.payments.length - 1].dueDate) 
        : "",
      currentDate: formatDate(new Date()),
      paymentAmount: loanSchedule.payments.length > 0 
        ? loanSchedule.payments[0].amount.toFixed(2) 
        : "0.00",
      paymentAmountWords: loanSchedule.payments.length > 0 
        ? numberToWords(loanSchedule.payments[0].amount) 
        : "",
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
      docxPath: `/contracts/${contractFileName}.docx`,
      pdfPath: pdfAvailable ? `/contracts/${contractFileName}.pdf` : "",
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

// Helper function to format dates
function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// Helper function to convert numbers to words
function numberToWords(amount: number) {
  const ones = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
                'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
                'seventeen', 'eighteen', 'nineteen'];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  
  const numString = amount.toFixed(2);
  const [dollars, cents] = numString.split('.');
  
  let result = '';
  
  // Convert dollars part
  const numDollars = parseInt(dollars);
  if (numDollars === 0) {
    result = 'zero';
  } else {
    // Handle trillions
    if (numDollars >= 1000000000000) {
      result += `${numberToWords(Math.floor(numDollars / 1000000000000))} trillion `;
      if (numDollars % 1000000000000 !== 0) {
        result += numberToWords(numDollars % 1000000000000);
      }
    }
    // Handle billions
    else if (numDollars >= 1000000000) {
      result += `${numberToWords(Math.floor(numDollars / 1000000000))} billion `;
      if (numDollars % 1000000000 !== 0) {
        result += numberToWords(numDollars % 1000000000);
      }
    }
    // Handle millions
    else if (numDollars >= 1000000) {
      result += `${numberToWords(Math.floor(numDollars / 1000000))} million `;
      if (numDollars % 1000000 !== 0) {
        result += numberToWords(numDollars % 1000000);
      }
    }
    // Handle thousands
    else if (numDollars >= 1000) {
      result += `${numberToWords(Math.floor(numDollars / 1000))} thousand `;
      if (numDollars % 1000 !== 0) {
        result += numberToWords(numDollars % 1000);
      }
    }
    // Handle hundreds
    else if (numDollars >= 100) {
      result += `${numberToWords(Math.floor(numDollars / 100))} hundred `;
      if (numDollars % 100 !== 0) {
        result += numberToWords(numDollars % 100);
      }
    }
    // Handle tens and ones
    else if (numDollars >= 20) {
      result += tens[Math.floor(numDollars / 10)];
      if (numDollars % 10 !== 0) {
        result += `-${ones[numDollars % 10]}`;
      }
    }
    // Handle teens and ones
    else {
      result += ones[numDollars];
    }
  }
  
  // Add dollars
  result += ' dollars';
  
  // Add cents if any
  if (parseInt(cents) > 0) {
    result += ` and ${cents}/100`;
  }
  
  return result.charAt(0).toUpperCase() + result.slice(1);
} 