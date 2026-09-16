// Auto (pickups) — mismo lenguaje visual que EyeIcon/ErrorIcon.
export function CarIcon({ size = 20 }: { size?: number }) {
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
      <path d="M3.5 15.5 5 9.8a2 2 0 0 1 1.9-1.5h10.2a2 2 0 0 1 1.9 1.5l1.5 5.7" />
      <rect x="2.5" y="15.5" width="19" height="4.5" rx="1.5" />
      <line x1="6" y1="20" x2="6" y2="21.5" />
      <line x1="18" y1="20" x2="18" y2="21.5" />
      <line x1="6" y1="12.5" x2="18" y2="12.5" />
    </svg>
  );
}
