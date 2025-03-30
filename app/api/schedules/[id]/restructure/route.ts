import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PrismaClient, Prisma } from "@prisma/client";

// POST /api/schedules/[id]/restructure
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const loanId = params.id;
    const body = await request.json();
    const { 
      notes, 
      remainingBalance, 
      monthlyInterest, 
      loanTerms, 
      paymentScheme, 
      startDate 
    } = body;

    // Validate the loan exists
    const loanSchedule = await prisma.loanSchedule.findUnique({
      where: { id: loanId },
      include: {
        client: true,
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
        { error: `Loan is already ${loanSchedule.status}. Only active loans can be restructured.` },
        { status: 400 }
      );
    }

    // Start a transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. Update the original loan to mark as restructured
      const updatedOriginalLoan = await tx.loanSchedule.update({
        where: { id: loanId },
        data: {
          status: "restructured",
          closedDate: new Date(),
          closingNotes: notes,
        },
      });

      // 2. Create the new restructured loan
      const newLoan = await tx.loanSchedule.create({
        data: {
          clientId: loanSchedule.clientId,
          loanAmount: remainingBalance,
          monthlyInterest: monthlyInterest,
          loanTerms: loanTerms,
          paymentScheme: paymentScheme,
          startDate: new Date(startDate),
          originalLoanId: loanId,
          serviceCharge: 0, // No service charge for restructuring
          status: "active",
          hasContract: false,
        },
      });

      // 3. Create a record in the restructure history
      const restructureRecord = await tx.loanRestructure.create({
        data: {
          originalLoanId: loanId,
          newLoanId: newLoan.id,
          reason: notes,
          remainingBalance: remainingBalance,
        },
      });

      return { newLoan, updatedOriginalLoan, restructureRecord };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error restructuring loan:", error);
    return NextResponse.json(
      { error: "Failed to restructure loan" },
      { status: 500 }
    );
  }
} 