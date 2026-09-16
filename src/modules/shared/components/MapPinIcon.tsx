// Pin de ubicación (badge "ubicación faltante") — mismo lenguaje visual
// que EyeIcon/ErrorIcon.
export function MapPinIcon({ size = 20 }: { size?: number }) {
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
      <path d="M12 21.5s7.5-6.6 7.5-12.3A7.5 7.5 0 0 0 4.5 9.2c0 5.7 7.5 12.3 7.5 12.3z" />
      <circle cx="12" cy="9.2" r="2.6" />
    </svg>
  );
}
