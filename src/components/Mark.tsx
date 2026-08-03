interface MarkProps {
  size?: number;
  className?: string;
}

/**
 * Standalone brand mark — the "M" glyph + rally-point dot (see
 * `Branding logo and favicon kit/public/mark-transparent.svg`). Colored via
 * CSS variables (not the kit file's literal hex) so it repaints correctly
 * across themes, same convention as the category-color dots elsewhere.
 */
export function Mark({ size = 32, className = "" }: MarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      className={className}
      aria-hidden="true"
    >
      <polyline
        points="167,366 167,146 256,282 345,146 345,366"
        fill="none"
        stroke="var(--accent)"
        strokeWidth="52"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <circle cx="256" cy="278" r="22" fill="var(--signal)" />
    </svg>
  );
}
