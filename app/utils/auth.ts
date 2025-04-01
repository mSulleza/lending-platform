import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";

/**
 * Gets the current user from the token or creates a new user if they don't exist
 * @param request The incoming request
 * @returns The user object or null if not authenticated
 */
export async function getCurrentUser(request: NextRequest) {
  try {
    // Get token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token is found, return null
    if (!token || !token.email) {
      return null;
    }

    // Find the user or create if they don't exist
    const user = await prisma.user.upsert({
      where: { email: token.email as string },
      update: {
        name: token.name as string,
        image: token.picture as string,
        updatedAt: new Date(),
      },
      create: {
        email: token.email as string,
        name: token.name as string,
        image: token.picture as string,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}

/**
 * Verifies if the request is authenticated
 * @param request The incoming request
 * @returns A tuple with [isAuthenticated, response] where response is the error response if not authenticated
 */
export async function verifyAuth(request: NextRequest): Promise<[boolean, Response]> {
  try {
    // Get token from the request
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If no token is found, return unauthorized
    if (!token) {
      return [
        false,
        NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        )
      ];
    }

    // Token is valid
    return [true, NextResponse.json({ success: true })];
  } catch (error) {
    console.error("Auth verification error:", error);
    return [
      false,
      NextResponse.json(
        { error: "Authentication error" },
        { status: 500 }
      )
    ];
  }
}

/**
 * Higher-order function that wraps an API handler with authentication check
 * @param handler The API handler function to wrap
 * @returns A function that verifies auth before calling the handler
 */
export function withAuth(
  handler: (request: NextRequest, context: any) => Promise<Response>
) {
  return async (request: NextRequest, context: any): Promise<Response> => {
    const [isAuthenticated, response] = await verifyAuth(request);
    
    if (!isAuthenticated) {
      return response;
    }
    
    return handler(request, context);
  };
} 