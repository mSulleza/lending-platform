export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Next.js + NextUI",
  description: "Make beautiful websites regardless of your design experience.",
  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Clients",
      href: "/clients",
    },
    {
      label: "Schedules",
      href: "/schedules",
    },
  ],
  navMenuItems: [
    {
      label: "Profile",
      href: "/profile",
    },
    {
      label: "Dashboard",
      href: "/dashboard",
    },
    {
      label: "Clients",
      href: "/clients",
    },
    {
      label: "Schedules",
      href: "/schedules",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
};
