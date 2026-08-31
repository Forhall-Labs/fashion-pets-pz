"use client";

import { ErrorModal } from "@/modules/shared/components/ErrorModal";
import { PasswordInput } from "@/modules/shared/components/PasswordInput";
import { PawPrintsSpinner } from "@/modules/shared/components/PawPrintsSpinner";

import { useResetPasswordForm } from "./hooks/useResetPasswordForm";

// Pantalla a la que Supabase redirige desde el email de recuperación —
// mismo look que LoginForm. Al guardar, cierra la sesión de recuperación
// y vuelve a /login para entrar de nuevo con la contraseña nueva.
export function ResetPasswordForm() {
  const {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    submitting,
    error,
    clearError,
    handleSubmit,
  } = useResetPasswordForm();

  return (
    <section className="screen-login">
      <form className="login-card card" onSubmit={handleSubmit}>
        <div className="login-brand">
          <span className="login-brand-mark">🐾</span>
          <h1 className="login-title">Agenda</h1>
          <p className="login-subtitle">Elegí una contraseña nueva</p>
        </div>
        <div className="field">
          <label htmlFor="reset-password">Contraseña nueva</label>
          <PasswordInput
            id="reset-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="reset-password-confirm">Confirmar contraseña</label>
          <PasswordInput
            id="reset-password-confirm"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <button
          type="submit"
          className={`btn btn-primary btn-block ${submitting ? "btn-loading" : ""}`}
          disabled={submitting}
        >
          {submitting ? <PawPrintsSpinner /> : "Guardar contraseña"}
        </button>
      </form>
      {error && (
        <ErrorModal
          title="No se pudo actualizar la contraseña"
          message={error}
          onClose={clearError}
        />
      )}
    </section>
  );
}
