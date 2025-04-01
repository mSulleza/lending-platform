import GoogleProvider from "next-auth/providers/google";
import { AuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

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

// Parse allowed emails from environment variable
const getAllowedEmails = (): string[] => {
    const allowedEmails = process.env.ALLOWED_EMAILS;
    if (!allowedEmails) {
        console.warn("ALLOWED_EMAILS environment variable not set. All Google accounts can log in.");
        return [];
    }
    return allowedEmails.split(',').map(email => email.trim().toLowerCase());
};

// Parse allowed domains from environment variable
const getAllowedDomains = (): string[] => {
    const allowedDomains = process.env.ALLOWED_DOMAINS;
    if (!allowedDomains) {
        console.warn("ALLOWED_DOMAINS environment variable not set. No domain restrictions applied.");
        return [];
    }
    return allowedDomains.split(',').map(domain => domain.trim().toLowerCase());
};

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
        async signIn({ user, account, profile, email, credentials }) {
            // If auth method is not Google, deny sign in
            if (account?.provider !== "google") {
                return false;
            }

            const userEmail = user.email?.toLowerCase();
            if (!userEmail) {
                console.error("User has no email");
                return false;
            }

            const allowedEmails = getAllowedEmails();
            const allowedDomains = getAllowedDomains();

            // If both arrays are empty, allow all users (default behavior)
            if (allowedEmails.length === 0 && allowedDomains.length === 0) {
                // Create or update user in the database
                try {
                    await prisma.user.upsert({
                        where: { email: userEmail },
                        update: {
                            name: user.name,
                            image: user.image,
                            updatedAt: new Date(),
                        },
                        create: {
                            email: userEmail,
                            name: user.name,
                            image: user.image,
                        },
                    });
                } catch (error) {
                    console.error("Error creating/updating user:", error);
                }
                return true;
            }

            // Check if email is in the allowed list
            if (allowedEmails.includes(userEmail)) {
                // Create or update user in the database
                try {
                    await prisma.user.upsert({
                        where: { email: userEmail },
                        update: {
                            name: user.name,
                            image: user.image,
                            updatedAt: new Date(),
                        },
                        create: {
                            email: userEmail,
                            name: user.name,
                            image: user.image,
                        },
                    });
                } catch (error) {
                    console.error("Error creating/updating user:", error);
                }
                return true;
            }

            // Check if email domain is in the allowed domains
            const emailDomain = userEmail.split('@')[1];
            if (emailDomain && allowedDomains.includes(emailDomain)) {
                // Create or update user in the database
                try {
                    await prisma.user.upsert({
                        where: { email: userEmail },
                        update: {
                            name: user.name,
                            image: user.image,
                            updatedAt: new Date(),
                        },
                        create: {
                            email: userEmail,
                            name: user.name,
                            image: user.image,
                        },
                    });
                } catch (error) {
                    console.error("Error creating/updating user:", error);
                }
                return true;
            }

            // Email not in allowed list and domain not in allowed domains
            console.warn(`Unauthorized sign in attempt: ${userEmail}`);
            return false;
        },
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