"use client"

import { Button } from "@nextui-org/button"
import { signOut } from "next-auth/react"
import { useTheme } from "next-themes"
import { LogoutIcon } from "./icons/logout"
export const Logout = () => {
    const { theme } = useTheme();
    return (
        <Button onClick={() => signOut()} startContent={<LogoutIcon />} variant={theme === "dark" ? "solid" : "light"} />
    )
}
