interface BrandLogoProps {
  size?: number;
}

export function BrandLogo({ size = 28 }: BrandLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
      className="brand-logo-svg"
    >
      <defs>
        <linearGradient id="timelyLogoBg" x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="52%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#timelyLogoBg)" />
      <rect
        x="3"
        y="3"
        width="58"
        height="58"
        rx="15"
        stroke="#ffffff"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="33"
        r="18"
        stroke="#ffffff"
        strokeOpacity="0.95"
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray="92 22"
      />
      <path
        d="M32 23V33L39.5 37.5"
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M48 12L49.8 16.2L54 18L49.8 19.8L48 24L46.2 19.8L42 18L46.2 16.2L48 12Z"
        fill="#ffffff"
      />
    </svg>
  );
}
