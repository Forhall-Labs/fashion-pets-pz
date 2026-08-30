"use client";

import { useLoginForm } from "./hooks/useLoginForm";

// Puerto de <section id="screen-login"> de docs/prototype/prototype.html.
export function LoginForm() {
  const { email, setEmail, password, setPassword, submitting, handleSubmit } = useLoginForm();

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
