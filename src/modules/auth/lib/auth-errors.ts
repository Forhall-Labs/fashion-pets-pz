// Supabase Auth solo devuelve mensajes en inglés — todo lo que ve el Admin
// tiene que estar en español, así que se traduce acá por código de error
// (más confiable que matchear el texto en inglés). Compartido entre login,
// forgot-password y reset-password.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: "Usuario o contraseña incorrectos.",
  email_not_confirmed: "La cuenta todavía no confirmó el email.",
  user_not_found: "Usuario o contraseña incorrectos.",
  over_request_rate_limit: "Demasiados intentos. Probá de nuevo en unos minutos.",
  weak_password: "La contraseña es muy débil. Usá al menos 6 caracteres.",
  same_password: "La nueva contraseña tiene que ser distinta a la actual.",
  session_not_found: "El link expiró o no es válido. Pedí uno nuevo.",
};

export function translateAuthError(error: { code?: string; message: string }): string {
  if (error.code && AUTH_ERROR_MESSAGES[error.code]) {
    return AUTH_ERROR_MESSAGES[error.code];
  }
  if (error.message === "Failed to fetch") {
    return "No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.";
  }
  return "Ocurrió un error. Intentá de nuevo.";
}
