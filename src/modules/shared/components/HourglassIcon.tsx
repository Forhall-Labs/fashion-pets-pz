// Reloj de arena (lista de espera) — mismo lenguaje visual que EyeIcon/ErrorIcon.
export function HourglassIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 2.5h12" />
      <path d="M6 21.5h12" />
      <path d="M7 2.5v3.7a5 5 0 0 0 2 4 5 5 0 0 1 2 4v.6a5 5 0 0 1-2 4 5 5 0 0 0-2 4v.1" />
      <path d="M17 2.5v3.7a5 5 0 0 1-2 4 5 5 0 0 0-2 4v.6a5 5 0 0 0 2 4 5 5 0 0 1 2 4v.1" />
    </svg>
  );
}
