import GoogleProvider from "next-auth/providers/google";
import { AuthOptions } from "next-auth";

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

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.error("Missing Google OAuth credentials. Please check your environment variables.");
}

if (!process.env.NEXTAUTH_SECRET) {
    console.warn("Missing NEXTAUTH_SECRET. Using a default secret is not recommended for production.");
}

export const authOptions: AuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID ?? "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
        }),
    ],
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    callbacks: {
        async jwt({ token, account, profile }) {
            // Persist the OAuth access_token to the token right after signin
            if (account) {
                token.accessToken = account.access_token;
            }
            return token;
        },
        async session({ session, token }) {
            // Send properties to the client, like an access_token from a provider
            session.accessToken = token.accessToken;
            return session;
        },
    },
    pages: {
        signIn: "/",
        error: "/",
    },
    secret: process.env.NEXTAUTH_SECRET,
}; 