import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth } from "@/app/utils/auth";
import { getToken } from "next-auth/jwt";

// GET /api/clients - Get all clients for the current user
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

    // Get the user from the database or create if they don't exist
    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get all clients associated with this user
    const clients = await prisma.client.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    
    return NextResponse.json(clients);
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
});

// POST /api/clients - Create a new client
export const POST = withAuth(async (request: NextRequest): Promise<Response> => {
  try {
    const body = await request.json();
    
    const { firstName, lastName, email, phone, address, city, state, zipCode, notes } = body;
    
    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
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

    // Get the user from the database or create if they don't exist
    const user = await prisma.user.findUnique({
      where: { email: token.email as string },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if email already exists for this user's clients
    const existingClient = await prisma.client.findFirst({
      where: { 
        email,
        userId: user.id
      },
    });
    
    if (existingClient) {
      return NextResponse.json(
        { error: "A client with this email already exists" },
        { status: 409 }
      );
    }
    
    const client = await prisma.client.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        address,
        city,
        state,
        zipCode,
        notes,
        userId: user.id,
      },
    });
    
    return NextResponse.json(client, { status: 201 });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { error: "Failed to create client" },
      { status: 500 }
    );
  }
}); 