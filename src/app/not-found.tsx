import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Página no encontrada — Peluquería Canina" };

// 404 de toda la app: rutas que no existen. Sin sesión, el proxy manda a
// /login antes de llegar acá.
export default function NotFound() {
  return (
    <section className="screen-login">
      <div className="login-card card not-found-card">
        <div className="login-brand">
          <span className="login-brand-mark" aria-hidden="true">
            🐾
          </span>
          <p className="not-found-code">404</p>
          <h1 className="login-title">Página no encontrada</h1>
          <p className="login-subtitle">
            Esta dirección no existe o se movió. Revisá el enlace o volvé a la agenda.
          </p>
        </div>
        <Link href="/agenda" className="btn btn-primary btn-block">
          Ir a la agenda
        </Link>
      </div>
    </section>
  );
}
