import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Verifies if the request is authenticated
 * @param request The incoming request
 * @returns A tuple with [isAuthenticated, response] where response is only set if not authenticated
 */
export async function verifyAuth(request: NextRequest): Promise<[boolean, NextResponse | null]> {
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
    return [true, null];
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
  handler: (request: NextRequest, context: any) => Promise<NextResponse>
) {
  return async (request: NextRequest, context: any) => {
    const [isAuthenticated, response] = await verifyAuth(request);
    
    if (!isAuthenticated) {
      return response;
    }
    
    return handler(request, context);
  };
} 