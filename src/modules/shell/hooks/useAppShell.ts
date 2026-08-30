"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export const NAV_LINKS = [
  { href: "/agenda", label: "Agenda" },
  { href: "/owners", label: "Dueños" },
  { href: "/waiting-list", label: "Lista de espera" },
  { href: "/pickups", label: "Pickups" },
  { href: "/config", label: "Configuración" },
];

export function useAppShell() {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  function isActive(href: string) {
    return pathname === href || (href !== "/agenda" && pathname.startsWith(href));
  }

  function closeNav() {
    setNavOpen(false);
  }

  function toggleNav() {
    setNavOpen((v) => !v);
  }

  function logout() {
    router.push("/login");
  }

  return { navOpen, isActive, closeNav, toggleNav, logout };
}
