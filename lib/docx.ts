import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import fs from "fs-extra";

interface TemplateData {
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  loanAmount: string;
  loanAmountInWords: string;
  interestRate: string;
  termInMonths: number;
  startDate: string;
  endDate: string;
  monthlyPayment: string;
  monthlyPaymentInWords: string;
  totalPayment: string;
  totalPaymentInWords: string;
  totalInterest: string;
  totalInterestInWords: string;
}

export async function generateDocx(
  templatePath: string,
  data: TemplateData,
  outputPath: string
): Promise<void> {
  try {
    // Read the template file
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
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw new Error("Failed to generate DOCX file");
  }
} 