import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/app/utils/auth";
import { getToken } from "next-auth/jwt";

// GET /api/schedules - Get all loan schedules for the current user's clients
export const GET = withAuth(async (request: NextRequest): Promise<Response> => {
  try {
    // Get the current user from the token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get all clients belonging to this user
    const userClients = await prisma.client.findMany({
      where: { userId: user.id },
      select: { id: true }
    });

    const clientIds = userClients.map(client => client.id);

    // Get all loan schedules for these clients
    const schedules = await prisma.loanSchedule.findMany({
      where: {
        clientId: { in: clientIds }
      },
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
    
    // Get the current user from the token
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get the user from the database
    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if client exists and belongs to the current user
    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        userId: user.id
      },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: "Client not found or does not belong to you" },
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