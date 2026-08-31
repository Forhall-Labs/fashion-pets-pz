"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { supabase } from "@/modules/shared/lib/supabase-client";

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
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!active) return;
      if (!session) {
        router.replace("/login");
        return;
      }
      setCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  function isActive(href: string) {
    return pathname === href || (href !== "/agenda" && pathname.startsWith(href));
  }

  function closeNav() {
    setNavOpen(false);
  }

  function toggleNav() {
    setNavOpen((v) => !v);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return { navOpen, checkingSession, isActive, closeNav, toggleNav, logout };
}
