interface WordmarkProps {
  height?: number;
  className?: string;
}

const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 140;

/**
 * The brand wordmark lockup — the "M" glyph (mark-transparent.svg's shape,
 * scaled down) doubling as the word's first letter, plus "USTER" (see
 * `Branding logo and favicon kit/public/wordmark.svg`). Every fill/stroke
 * below is a CSS variable, not the kit file's literal hex — the kit's own
 * file hardcodes cream (#f5f3ea) for the text, which is the dark theme's
 * `ink` value and reads as near-invisible on the light theme's cream
 * background. Using `var(--ink)` etc. instead means this repaints
 * correctly in both themes, same as the rest of the app.
 */
export function Wordmark({ height = 26, className = "" }: WordmarkProps) {
  const width = (height / VIEW_HEIGHT) * VIEW_WIDTH;
  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      className={className}
      role="img"
      aria-label="Muster"
    >
      <path
        fill="none"
        stroke="var(--accent)"
        strokeWidth="13.236362"
        strokeLinecap="square"
        d="M 89.156456 106 L 89.156456 50 L 111.810997 84.618179 L 134.465546 50 L 134.465546 106"
      />
      <path
        fill="var(--signal)"
        stroke="none"
        d="M 117.410995 83.599991 C 117.410995 86.692795 114.903793 89.199997 111.810997 89.199997 C 108.718201 89.199997 106.210999 86.692795 106.210999 83.599991 C 106.210999 80.507202 108.718201 77.999992 111.810997 77.999992 C 114.903793 77.999992 117.410995 80.507202 117.410995 83.599991 Z"
      />
      <text
        x="149"
        y="112"
        fontFamily="Helvetica, Arial, sans-serif"
        fontWeight="bold"
        fontSize="112"
        letterSpacing="3"
        fill="var(--ink)"
      >
        USTER
      </text>
    </svg>
  );
}
