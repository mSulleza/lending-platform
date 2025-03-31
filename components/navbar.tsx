"use client";
import { Disclosure } from "@headlessui/react";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useSession } from "next-auth/react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/icons";
import { siteConfig } from "@/config/site";
import CurrencySettings from "./CurrencySettings";
import { Logout } from "./Logout";

export const Navbar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();

  if (!session) return null;

  return (
    <Disclosure as="nav" className="bg-white dark:bg-gray-900 shadow-sm">
      {({ open }: { open: boolean }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <NextLink href="/" className="flex items-center gap-2">
                    <Logo />
                    <span className="font-bold text-lg">Lending Management</span>
                  </NextLink>
                </div>
                <div className="hidden lg:ml-6 lg:flex lg:space-x-8">
                  {siteConfig.navItems.map((item) => (
                    <NextLink
                      key={item.href}
                      href={item.href}
                      className={clsx(
                        "inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors",
                        pathname === item.href
                          ? "text-primary border-b-2 border-primary"
                          : "text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200"
                      )}
                    >
                      {item.label}
                    </NextLink>
                  ))}
                </div>
              </div>
              <div className="hidden lg:ml-6 lg:flex lg:items-center gap-4">
                <CurrencySettings />
                <Logout />
              </div>
              <div className="-mr-2 flex items-center lg:hidden">
                <CurrencySettings />
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary dark:hover:bg-gray-800">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="lg:hidden">
            <div className="space-y-1 pb-3 pt-2">
              {siteConfig.navMenuItems.map((item) => (
                <NextLink
                  key={item.href}
                  href={item.href}
                  className={clsx(
                    "block w-full px-3 py-2 text-base font-medium transition-colors",
                    pathname === item.href
                      ? "bg-primary-50 text-primary dark:bg-primary-900/20"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                  )}
                >
                  {item.label}
                </NextLink>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
};
