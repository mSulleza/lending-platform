"use client";
import { Link } from "@nextui-org/link";
import {
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Navbar as NextUINavbar,
} from "@nextui-org/navbar";
import { link as linkStyles } from "@nextui-org/theme";
import clsx from "clsx";
import NextLink from "next/link";

import { Logo } from "@/components/icons";
import { ThemeSwitch } from "@/components/theme-switch";
import { siteConfig } from "@/config/site";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import CurrencySettings from "./CurrencySettings";
import { Logout } from "./logout";

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  return (
    session && (
      <NextUINavbar
        maxWidth="xl"
        position="sticky"
        className="shadow-sm bg-background/80 backdrop-blur-md"
      >
        <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
          <NavbarBrand as="li" className="gap-3 max-w-fit">
            <NextLink
              className="flex justify-start items-center gap-2"
              href="/"
            >
              <Logo />
              <p className="font-bold text-inherit text-lg">
                Lending Management
              </p>
            </NextLink>
          </NavbarBrand>
          <ul className="hidden lg:flex gap-6 justify-start ml-4">
            {siteConfig.navItems.map((item) => (
              <NavbarItem key={item.href} isActive={pathname === item.href}>
                <NextLink
                  className={clsx(
                    linkStyles({ color: "foreground" }),
                    "data-[active=true]:text-primary data-[active=true]:font-medium transition-colors px-2 py-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800",
                    pathname === item.href &&
                      "text-primary font-medium bg-primary-100 dark:bg-primary-900/20"
                  )}
                  color="foreground"
                  href={item.href}
                >
                  {item.label}
                </NextLink>
              </NavbarItem>
            ))}
          </ul>
        </NavbarContent>

        <NavbarContent
          className="hidden sm:flex basis-1/5 sm:basis-full"
          justify="end"
        >
          <NavbarItem className="hidden sm:flex gap-3">
            <CurrencySettings />
            <Logout />
            <ThemeSwitch />
          </NavbarItem>
        </NavbarContent>

        <NavbarContent className="sm:hidden basis-1 pl-4" justify="end">
          <CurrencySettings />
          <ThemeSwitch />
          <NavbarMenuToggle />
        </NavbarContent>

        <NavbarMenu className="pt-6 bg-background/80 backdrop-blur-md">
          <div className="mx-4 mt-2 flex flex-col gap-3">
            {siteConfig.navMenuItems.map((item, index) => (
              <NavbarMenuItem key={`${item}-${index}`}>
                <Link
                  color={
                    pathname === item.href
                      ? "primary"
                      : index === siteConfig.navMenuItems.length - 1
                        ? "danger"
                        : "foreground"
                  }
                  className={clsx(
                    "w-full",
                    pathname === item.href && "font-medium"
                  )}
                  href={item.href}
                  size="lg"
                >
                  {item.label}
                </Link>
              </NavbarMenuItem>
            ))}
          </div>
        </NavbarMenu>
      </NextUINavbar>
    )
  );
};
