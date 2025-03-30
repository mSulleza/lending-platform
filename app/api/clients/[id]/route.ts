import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/clients/[id] - Get a client by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    const client = await prisma.client.findUnique({
      where: { id },
    });
    
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(client);
  } catch (error) {
    console.error("Error fetching client:", error);
    return NextResponse.json(
      { error: "Failed to fetch client" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a client
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    
    const { firstName, lastName, email, phone, address, city, state, zipCode, notes } = body;
    
    // Validate required fields
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }
    
    // Check if email is already used by another client
    if (email !== existingClient.email) {
      const emailExists = await prisma.client.findUnique({
        where: { email },
      });
      
      if (emailExists) {
        return NextResponse.json(
          { error: "A client with this email already exists" },
          { status: 409 }
        );
      }
    }
    
    const updatedClient = await prisma.client.update({
      where: { id },
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
      },
    });
    
    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Error updating client:", error);
    return NextResponse.json(
      { error: "Failed to update client" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id },
    });
    
    if (!existingClient) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }
    
    await prisma.client.delete({
      where: { id },
    });
    
    return NextResponse.json({ message: "Client deleted successfully" });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { error: "Failed to delete client" },
      { status: 500 }
    );
  }
} 