import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/schedules/[id] - Get a specific loan schedule
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    const schedule = await prisma.loanSchedule.findUnique({
      where: { id },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!schedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error("Error fetching loan schedule:", error);
    return NextResponse.json(
      { error: "Failed to fetch loan schedule" },
      { status: 500 }
    );
  }
}

// PUT /api/schedules/[id] - Update a loan schedule
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const body = await request.json();

    const {
      clientId,
      loanAmount,
      serviceCharge,
      monthlyInterest,
      loanTerms,
      paymentScheme,
      startDate,
      hasContract,
    } = body;

    // Validate required fields
    if (
      !clientId ||
      !loanAmount ||
      !monthlyInterest ||
      !loanTerms ||
      !paymentScheme ||
      !startDate
    ) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if schedule exists
    const existingSchedule = await prisma.loanSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }

    // Update schedule
    const updatedSchedule = await prisma.loanSchedule.update({
      where: { id },
      data: {
        clientId,
        loanAmount: parseFloat(loanAmount.toString()),
        serviceCharge: serviceCharge ? parseFloat(serviceCharge.toString()) : undefined,
        monthlyInterest: parseFloat(monthlyInterest.toString()),
        loanTerms: parseInt(loanTerms.toString()),
        paymentScheme,
        startDate: new Date(startDate),
        hasContract: hasContract ?? false,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSchedule);
  } catch (error) {
    console.error("Error updating loan schedule:", error);
    return NextResponse.json(
      { error: "Failed to update loan schedule" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id] - Delete a loan schedule
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Check if schedule exists
    const existingSchedule = await prisma.loanSchedule.findUnique({
      where: { id },
    });

    if (!existingSchedule) {
      return NextResponse.json(
        { error: "Loan schedule not found" },
        { status: 404 }
      );
    }

    // Delete schedule
    await prisma.loanSchedule.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Loan schedule deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting loan schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete loan schedule" },
      { status: 500 }
    );
  }
} 