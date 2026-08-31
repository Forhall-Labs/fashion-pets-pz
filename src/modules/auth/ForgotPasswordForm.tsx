"use client";

import Link from "next/link";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";

import { useForgotPasswordForm } from "./hooks/useForgotPasswordForm";

// Pantalla previa al login para pedir el link de recuperación de contraseña
// por email (Supabase Auth) — mismo look que LoginForm.
export function ForgotPasswordForm() {
  const { email, setEmail, submitting, error, sent, clearError, handleSubmit } =
    useForgotPasswordForm();

  return (
    <section className="screen-login">
      <div className="login-card card">
        <div className="login-brand">
          <span className="login-brand-mark">🐾</span>
          <h1 className="login-title">Agenda</h1>
          <p className="login-subtitle">Peluquería Canina — acceso Admin</p>
        </div>

        {sent ? (
          <>
            <p className="modal-body-text" style={{ textAlign: "center" }}>
              Si <strong>{email}</strong> está registrado, te enviamos un email con un link para
              restablecer la contraseña.
            </p>
            <Link href="/login" className="btn btn-ghost btn-block">
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <p className="text-small" style={{ marginBottom: "var(--space-4)" }}>
              Ingresá tu email y te mandamos un link para restablecer la contraseña.
            </p>
            <div className="field">
              <label htmlFor="forgot-email">Email</label>
              <input
                id="forgot-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              className={`btn btn-primary btn-block ${submitting ? "btn-loading" : ""}`}
              disabled={submitting}
            >
              Enviar link
            </button>
            <Link
              href="/login"
              className="btn btn-text btn-sm btn-block"
              style={{ marginTop: "var(--space-3)", textAlign: "center" }}
            >
              Volver a iniciar sesión
            </Link>
          </form>
        )}
      </div>
      {error && (
        <ErrorModal title="No se pudo enviar el link" message={error} onClose={clearError} />
      )}
    </section>
  );
}
