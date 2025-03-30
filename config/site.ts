export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: "Lending Management",
  description: "A platform for managing lending activities and clients.",
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
    {
      label: "Settings",
      href: "/settings",
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
      label: "Settings",
      href: "/settings",
    },
    {
      label: "Logout",
      href: "/logout",
    },
  ],
};
