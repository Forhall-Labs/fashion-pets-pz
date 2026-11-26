"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/modules/shared/lib/supabase-client";

import { translateAuthError } from "../lib/auth-errors";

const MIN_PASSWORD_LENGTH = 6;

export function useResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`La contraseña tiene que tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(translateAuthError(updateError));
      return;
    }

    // No dejamos la sesión de recuperación activa — vuelve a /login para
    // entrar de nuevo ya con la contraseña nueva.
    await supabase.auth.signOut();
    router.push("/login");
  }

  return {
    password,
    setPassword,
    confirmPassword,
    setConfirmPassword,
    submitting,
    error,
    clearError: () => setError(null),
    handleSubmit,
  };
}
