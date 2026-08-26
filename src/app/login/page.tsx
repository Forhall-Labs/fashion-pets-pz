"use client";

import { useRouter } from "next/navigation";

// Puerto de <section id="screen-login"> de docs/prototype/prototype.html.
// Todavía no hay Supabase Auth wireado — "Ingresar" solo navega a /agenda,
// igual que el prototipo ("cualquier valor funciona").
export default function LoginPage() {
  const router = useRouter();

  return (
    <section className="screen-login">
      <form
        className="login-card card"
        onSubmit={(e) => {
          e.preventDefault();
          router.push("/agenda");
        }}
      >
        <div className="login-brand">
          <span className="login-brand-mark">🐾</span>
          <h1 className="login-title">Agenda</h1>
          <p className="login-subtitle">Peluquería Canina — acceso Admin</p>
        </div>
        <div className="field">
          <label htmlFor="login-email">Usuario</label>
          <input id="login-email" type="text" defaultValue="admin@peluqueria.com" required />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input id="login-password" type="password" defaultValue="********" required />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          Ingresar
        </button>
        <p className="login-hint">Prototipo — cualquier valor funciona.</p>
      </form>
    </section>
  );
}
