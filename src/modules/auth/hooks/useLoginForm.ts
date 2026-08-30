"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

// Todavía no hay Supabase Auth wireado del lado del backend — "Ingresar"
// valida solo lo que se puede validar client-side (campos requeridos) y
// navega a /agenda. Cuando exista el login real, esto pasa a llamar a la
// API y el manejo de error de credenciales se agrega acá mismo.
export function useLoginForm() {
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

  return { email, setEmail, password, setPassword, submitting, handleSubmit };
}
