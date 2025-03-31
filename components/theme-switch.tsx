"use client";

import clsx from "clsx";
import { useTheme } from "next-themes";
import { FC } from "react";

import { MoonFilledIcon, SunFilledIcon } from "@/components/icons";

export interface ThemeSwitchProps {
  className?: string;
}

export const ThemeSwitch: FC<ThemeSwitchProps> = ({ className }) => {
  const { theme, setTheme } = useTheme();

  const onChange = () => {
    theme === "light" ? setTheme("dark") : setTheme("light");
  };

  return (
    <button
      onClick={onChange}
      className={clsx(
        "p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800",
        className
      )}
      aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      {theme === "light" ? (
        <SunFilledIcon size={22} className="text-gray-900" />
      ) : (
        <MoonFilledIcon size={22} className="text-white" />
      )}
    </button>
  );
};
