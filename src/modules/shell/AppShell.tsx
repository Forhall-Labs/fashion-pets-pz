"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

const NAV_LINKS = [
  { href: "/agenda", label: "Agenda" },
  { href: "/owners", label: "Dueños" },
  { href: "/waiting-list", label: "Lista de espera" },
  { href: "/pickups", label: "Pickups" },
  { href: "/config", label: "Configuración" },
];

// Puerto del <header class="topbar"> + <nav class="main-nav"> de
// docs/prototype/prototype.html — la navegación real ahora la maneja
// next/navigation en vez de mostrar/ocultar <section data-screen>.
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="login-brand-mark">🐾</span>
          <span className="topbar-title">Agenda</span>
        </div>
        <nav className={`main-nav ${navOpen ? "is-open" : ""}`} id="main-nav">
          {NAV_LINKS.map((link) => {
            const active =
              pathname === link.href || (link.href !== "/agenda" && pathname.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`nav-link ${active ? "is-active" : ""}`}
                onClick={() => setNavOpen(false)}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <button className="btn btn-ghost btn-sm" onClick={() => router.push("/login")}>
          Salir
        </button>
      </header>

      <button
        className="mobile-nav-toggle"
        aria-label="Abrir menú"
        onClick={() => setNavOpen((v) => !v)}
      >
        ☰
      </button>

      <main className="main-content" id="main-content">
        {children}
      </main>
    </div>
  );
}
