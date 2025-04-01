import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/app/utils/auth";

// GET /api/schedules - Get all loan schedules
export const GET = withAuth(async (request: NextRequest): Promise<Response> => {
  try {
    const schedules = await prisma.loanSchedule.findMany({
      orderBy: {
        createdAt: "desc",
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
    
    return NextResponse.json(schedules);
  } catch (error) {
    console.error("Error fetching loan schedules:", error);
    return NextResponse.json(
      { error: "Failed to fetch loan schedules" },
      { status: 500 }
    );
  }
});

// POST /api/schedules - Create a new loan schedule
export const POST = withAuth(async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    
    const { clientId, loanAmount, serviceCharge, monthlyInterest, loanTerms, paymentScheme, startDate } = body;
    
    // Validate required fields
    if (!clientId || !loanAmount || !monthlyInterest || !loanTerms || !paymentScheme || !startDate) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: clientId },
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }
    
    const schedule = await prisma.loanSchedule.create({
      data: {
        clientId,
        loanAmount: parseFloat(loanAmount.toString()),
        serviceCharge: serviceCharge ? parseFloat(serviceCharge.toString()) : 0,
        monthlyInterest: parseFloat(monthlyInterest.toString()),
        loanTerms: parseInt(loanTerms.toString()),
        paymentScheme,
        startDate: new Date(startDate),
        hasContract: false,
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
    
    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error("Error creating loan schedule:", error);
    return NextResponse.json(
      { error: "Failed to create loan schedule" },
      { status: 500 }
    );
  }
}); 