export default function Logo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32" 
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    > 
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-secondary)" />
          <stop offset="100%" stopColor="var(--color-primary)" />
        </linearGradient>
      </defs>
      {/* Sleek, continuous loop/swap path */}
      <path 
        d="M8 12C8 8.5 11 6 15 6C20 6 20 12 16 15C12 18 12 24 17 24C21 24 24 21.5 24 18" 
        stroke="url(#logo-grad)" 
        strokeWidth="3" 
        strokeLinecap="round"
      />
      {/* Crisp arrow heads */}
      <path d="M6 14L8 12L10 14" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 16L24 18L26 16" stroke="url(#logo-grad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}