"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function Login() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Check for error in the URL
    const errorParam = searchParams?.get("error");
    if (errorParam === "AccessDenied") {
      setError("Your email is not authorized to access this application.");
    } else if (errorParam) {
      setError("An error occurred during sign in. Please try again.");
    }
  }, [searchParams]);

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-primary">Loading...</span>
      </div>
    );
  }

  if (session) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="max-w-md w-full shadow-lg rounded-xl p-2 bg-gradient-to-r from-background to-background/80 backdrop-blur-sm border border-foreground/10">
          <div className="flex flex-col items-center gap-6 p-6">
            <div className="flex items-center justify-center w-full">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Welcome Back
              </h1>
            </div>
            <div className="flex flex-col items-center gap-4 w-full">
              {session.user?.image && (
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary blur-sm opacity-50 animate-pulse"></div>
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    className="relative rounded-full w-24 h-24 object-cover border-2 border-background"
                  />
                </div>
              )}
              <div className="text-center">
                <p className="text-2xl font-semibold">{session.user?.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {session.user?.email}
                </p>
              </div>
              <a
                href="/clients"
                className="inline-flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-[70vh]">
      <div className="max-w-md w-full shadow-lg rounded-xl p-2 bg-gradient-to-r from-background to-background/80 backdrop-blur-sm border border-foreground/10">
        <div className="flex flex-col gap-6 p-6">
          <div className="flex flex-col gap-2 items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Sign In
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-center">
              Sign in to access your lending management platform
            </p>
          </div>
          
          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div className="flex justify-center py-5 w-full">
            <button
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full relative overflow-visible flex items-center justify-center gap-2 py-6 group border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <svg
                viewBox="0 0 24 24"
                width="24"
                height="24"
                className="text-gray-900 dark:text-white"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                  <path
                    fill="#4285F4"
                    d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                  ></path>
                  <path
                    fill="#34A853"
                    d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                  ></path>
                  <path
                    fill="#FBBC05"
                    d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                  ></path>
                  <path
                    fill="#EA4335"
                    d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                  ></path>
                </g>
              </svg>
              <span className="font-medium">Sign in with Google</span>
              <span className="absolute -bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-1/2 group-hover:transition-all"></span>
              <span className="absolute -bottom-1 right-1/2 w-0 h-0.5 bg-gradient-to-l from-primary to-secondary group-hover:w-1/2 group-hover:transition-all"></span>
            </button>
          </div>
          <div className="flex flex-col gap-2 items-center text-sm">
            <p className="text-gray-500 dark:text-gray-400 text-center">
              By signing in, you agree to our Terms of Service
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-xs text-center">
              Only authorized email addresses are allowed to access this platform
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
