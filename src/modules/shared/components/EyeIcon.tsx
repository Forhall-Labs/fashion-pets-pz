// Íconos del toggle mostrar/ocultar contraseña — blanco y negro, sin relleno.
export function EyeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}

export function EyeOffIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.7a3.25 3.25 0 0 0 4.6 4.6" />
      <path d="M9.4 5.2A10 10 0 0 1 12 5c6.5 0 10.5 7 10.5 7a18 18 0 0 1-3.1 4.1M6.3 6.3C3.4 8.1 1.5 12 1.5 12a18 18 0 0 0 5.1 5.9A10 10 0 0 0 12 19" />
    </svg>
  );
}
