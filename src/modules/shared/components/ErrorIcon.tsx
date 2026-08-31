// Ícono estándar de error (círculo + X) — blanco y negro, sin relleno.
export function ErrorIcon() {
  return (
    <svg
      width="56"
      height="56"
      viewBox="0 0 24 24"
      role="img"
      aria-label="Error"
      fill="none"
      stroke="var(--color-danger)"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}
