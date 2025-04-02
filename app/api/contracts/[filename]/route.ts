import { NextResponse } from "next/server";
import { join } from "path";
import { readFile } from "fs/promises";

export async function GET(
  request: Request,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params;
    const filePath = join('/tmp', 'contracts', filename);

    // Read the file
    const fileBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const contentType = filename.endsWith(".pdf")
      ? "application/pdf"
      : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    // Return the file with appropriate headers
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Error serving contract file:", error);
    return NextResponse.json(
      { error: "Failed to serve contract file" },
      { status: 500 }
    );
  }
} 