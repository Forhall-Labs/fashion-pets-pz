"use client";

import { useState } from "react";

import { supabase } from "@/modules/shared/lib/supabase-client";

import { translateAuthError } from "../lib/auth-errors";

export function useForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;

    setSubmitting(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setSubmitting(false);

    if (resetError) {
      setError(translateAuthError(resetError));
      return;
    }

    setSent(true);
  }

  return {
    email,
    setEmail,
    submitting,
    error,
    sent,
    clearError: () => setError(null),
    handleSubmit,
  };
}
