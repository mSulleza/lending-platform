import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST /api/schedules/[id]/close
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id;
    const body = await request.json();
    const { action, notes } = body;

    // Validate the loan exists
    const loanSchedule = await prisma.loanSchedule.findUnique({
      where: { id: loanId },
      include: {
        payments: true,
      },
    });

    if (!loanSchedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }

    // Check if loan is already closed
    if (loanSchedule.status !== "active") {
      return NextResponse.json(
        { 
          error: `Loan is already ${loanSchedule.status}. Only active loans can be closed.` 
        },
        { status: 400 }
      );
    }

    if (action !== "default" && action !== "complete") {
      return NextResponse.json(
        { error: "Invalid action specified" },
        { status: 400 }
      );
    }

    // For completing a loan, verify that all payments are made
    if (action === "complete") {
      const unpaidPayments = loanSchedule.payments.filter((payment: { isPaid: boolean }) => !payment.isPaid);
      if (unpaidPayments.length > 0) {
        return NextResponse.json(
          { 
            error: `Cannot mark as completed. There are still ${unpaidPayments.length} unpaid payments.` 
          },
          { status: 400 }
        );
      }
    }

    // Update the loan schedule status based on action
    const status = action === "default" ? "defaulted" : "completed";
    
    // Update loan status
    const updatedLoan = await prisma.loanSchedule.update({
      where: { id: loanId },
      data: {
        status,
        closedDate: new Date(),
        closingNotes: notes,
      },
    });

    return NextResponse.json(updatedLoan);
  } catch (error) {
    console.error("Error closing loan:", error);
    return NextResponse.json(
      { error: "Failed to close loan" },
      { status: 500 }
    );
  }
} 