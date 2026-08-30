"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { NAV_LINKS, useAppShell } from "./hooks/useAppShell";

// Puerto del <header class="topbar"> + <nav class="main-nav"> de
// docs/prototype/prototype.html — la navegación real ahora la maneja
// next/navigation en vez de mostrar/ocultar <section data-screen>.
export function AppShell({ children }: { children: ReactNode }) {
  const { navOpen, isActive, closeNav, toggleNav, logout } = useAppShell();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <span className="login-brand-mark">🐾</span>
          <span className="topbar-title">Agenda</span>
        </div>
        <nav className={`main-nav ${navOpen ? "is-open" : ""}`} id="main-nav">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`nav-link ${isActive(link.href) ? "is-active" : ""}`}
              onClick={closeNav}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <button className="btn btn-ghost btn-sm" onClick={logout}>
          Salir
        </button>
      </header>

      <button className="mobile-nav-toggle" aria-label="Abrir menú" onClick={toggleNav}>
        ☰
      </button>

      <main className="main-content" id="main-content">
        {children}
      </main>
    </div>
  );
}
