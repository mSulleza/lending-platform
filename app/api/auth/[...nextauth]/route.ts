import NextAuth from "next-auth";
import { authOptions } from "../options";

// Extend the built-in session types
declare module "next-auth" {
    interface Session {
        accessToken?: string;
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        accessToken?: string;
    }
}

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };