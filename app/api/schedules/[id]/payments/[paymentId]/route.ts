import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// GET /api/schedules/[id]/payments/[paymentId]
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const { paymentId } = params;

    const payment = await prisma.payment.findUnique({
      where: {
        id: paymentId,
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error("Error fetching payment:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}

// PATCH /api/schedules/[id]/payments/[paymentId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const { paymentId } = params;
    const body = await request.json();

    // Update payment record
    const updatedPayment = await prisma.payment.update({
      where: {
        id: paymentId,
      },
      data: {
        isPaid: body.isPaid !== undefined ? body.isPaid : undefined,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : undefined,
        chequeNumber: body.chequeNumber,
      },
    });

    return NextResponse.json(updatedPayment);
  } catch (error) {
    console.error("Error updating payment:", error);
    return NextResponse.json(
      { error: "Failed to update payment" },
      { status: 500 }
    );
  }
}

// DELETE /api/schedules/[id]/payments/[paymentId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; paymentId: string } }
) {
  try {
    const { paymentId } = params;

    await prisma.payment.delete({
      where: {
        id: paymentId,
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting payment:", error);
    return NextResponse.json(
      { error: "Failed to delete payment" },
      { status: 500 }
    );
  }
} 