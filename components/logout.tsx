"use client";

import { LogoutIcon } from "@/components/icons";
import { Button } from "@nextui-org/button";
import { signOut } from "next-auth/react";

export const Logout = () => {
  return (
    <Button
      onClick={() => signOut()}
      startContent={<LogoutIcon />}
      color="danger"
      variant="flat"
      className="font-medium transition-transform hover:scale-105"
    >
      Logout
    </Button>
  );
};
