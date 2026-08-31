"use client";

import Link from "next/link";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { PasswordInput } from "@/modules/shared/components/PasswordInput";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";

import { useLoginForm } from "./hooks/useLoginForm";

// Puerto de <section id="screen-login"> de docs/prototype/prototype.html.
export function LoginForm() {
  const { email, setEmail, password, setPassword, submitting, error, clearError, handleSubmit } =
    useLoginForm();

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
          <PasswordInput
            id="login-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>
        <div style={{ textAlign: "right", marginBottom: "var(--space-3)" }}>
          <Link href="/forgot-password" className="btn btn-text btn-sm">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <button
          type="submit"
          className={`btn btn-primary btn-block ${submitting ? "btn-loading" : ""}`}
          disabled={submitting}
        >
          {submitting ? <PawPrintsSpinner /> : "Ingresar"}
        </button>
      </form>
      {error && (
        <ErrorModal title="No se pudo iniciar sesión" message={error} onClose={clearError} />
      )}
    </section>
  );
}
