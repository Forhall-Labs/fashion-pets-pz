"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { supabase } from "@/modules/shared/lib/supabase-client";

import { translateAuthError } from "../lib/auth-errors";

export function useLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@peluqueria.com");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(translateAuthError(signInError));
      setSubmitting(false);
      return;
    }

    router.push("/agenda");
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    submitting,
    error,
    clearError: () => setError(null),
    handleSubmit,
  };
}
