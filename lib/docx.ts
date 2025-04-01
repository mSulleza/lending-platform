import { readFile, writeFile } from "fs/promises";
import { join } from "path";

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
    const template = await readFile(templatePath, "utf-8");

    // Replace all placeholders in the template with actual data
    let content = template;
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`{{${key}}}`, "g");
      content = content.replace(placeholder, String(value));
    });

    // Write the generated content to the output file
    await writeFile(outputPath, content);
  } catch (error) {
    console.error("Error generating DOCX:", error);
    throw new Error("Failed to generate DOCX file");
  }
} 