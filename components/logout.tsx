"use client";

import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { signOut } from "next-auth/react";

export const Logout = () => {
  return (
    <button
      onClick={() => signOut()}
      className="inline-flex items-center gap-x-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 transition-transform hover:scale-105"
    >
      <ArrowRightOnRectangleIcon className="h-5 w-5" aria-hidden="true" />
      Logout
    </button>
  );
};
