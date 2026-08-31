import { supabase } from "./supabase-client";

// Único punto de contacto con la API NestJS — toda lectura/escritura de
// owners/pets/appointments/etc. pasa por acá. Nada en el frontend habla
// directo con Supabase salvo Auth (ver supabase-client.ts).

const API_URL = process.env.NEXT_PUBLIC_API_URL!;

// Respuesta paginada estándar de GET /owners y GET /pets.
export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Arma un query string a partir de params opcionales, omitiendo
// undefined/"" — evita mandar "?q=&page=1" cuando no hay búsqueda.
export function toQueryString<T extends Record<string, string | number | undefined>>(
  params: T,
): string {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") usp.set(key, String(value));
  }
  const qs = usp.toString();
  return qs ? `?${qs}` : "";
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages.join(" "));
    this.name = "ApiError";
  }
}

// El AllExceptionsFilter de la API devuelve { message }, donde message es un
// string (BusinessRuleViolationException/EntityNotFoundException) o un
// { message: string[] } anidado (errores de ValidationPipe/class-validator).
function extractMessages(body: unknown): string[] {
  if (typeof body === "object" && body !== null && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (Array.isArray(message)) return message.map(String);
    if (typeof message === "string") return [message];
    if (typeof message === "object" && message !== null && "message" in message) {
      return extractMessages(message);
    }
  }
  return ["Ocurrió un error inesperado."];
}

const HTTP_NO_CONTENT = 204;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === HTTP_NO_CONTENT) {
    return undefined as T;
  }

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(response.status, extractMessages(body));
  }

  return body as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
