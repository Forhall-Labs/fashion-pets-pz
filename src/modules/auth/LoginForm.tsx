"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Puerto de <section id="screen-login"> de docs/prototype/prototype.html.
// Todavía no hay Supabase Auth wireado del lado del backend — "Ingresar"
// valida solo lo que se puede validar client-side (campos requeridos) y
// navega a /agenda. Cuando exista el login real, esto pasa a llamar a la
// API y el manejo de error de credenciales se agrega acá mismo.
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@peluqueria.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setSubmitting(true);
    router.push("/agenda");
  }

  return (
    <section className="screen-login">
      <form className="login-card card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="login-brand-mark">🐾</span>
          <h1 className="login-title">Agenda</h1>
          <p className="login-subtitle">Peluquería Canina — acceso Admin</p>
        </div>
        <div className="field">
          <label htmlFor="login-email">Usuario</label>
          <input
            id="login-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="login-password">Contraseña</label>
          <input
            id="login-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Cualquier valor funciona (todavía)"
            required
          />
        </div>
        <button
          type="submit"
          className={`btn btn-primary btn-block ${submitting ? "btn-loading" : ""}`}
        >
          Ingresar
        </button>
        <p className="login-hint">Prototipo — cualquier valor funciona.</p>
      </form>
    </section>
  );
}
