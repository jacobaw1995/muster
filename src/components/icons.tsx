import type { SVGProps } from "react";

/**
 * Hand-drawn inline line icons matching the design reference
 * (design_handoff_muster_events_app). Simple placeholders — no icon
 * font/library. Swap for refined artwork in a later phase.
 */

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base({ size = 20, ...props }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export function SunIcon(props: IconProps) {
  return (
    <svg {...base({ size: 15, ...props })}>
      <circle cx="12" cy="12" r="4.5" />
      <path d="M12 2v2M12 20v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2 12h2M20 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <svg
      width={props.size ?? 15}
      height={props.size ?? 15}
      viewBox="0 0 24 24"
      fill="currentColor"
      {...props}
    >
      <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </svg>
  );
}

export function PersonIcon(props: IconProps) {
  return (
    <svg {...base({ size: 13, ...props })}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M4.5 20c1.5-4 5-5.5 7.5-5.5s6 1.5 7.5 5.5" />
    </svg>
  );
}

export function MapPinIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M12 21s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...base({ strokeWidth: 2.4, ...props })}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function BarChartIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor" stroke="none">
      <rect x="4" y="12" width="3" height="8" />
      <rect x="10.5" y="7" width="3" height="13" />
      <rect x="17" y="14" width="3" height="6" />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h8M8 17h5" />
    </svg>
  );
}

export function XIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...base({ size: 15, ...props })}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-4-4" />
    </svg>
  );
}

export function FilterIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })}>
      <path d="M4 7h16M4 12h16M4 17h16" />
      <circle cx="9" cy="7" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="15" cy="12" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="7" cy="17" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}

export function ClockIcon(props: IconProps) {
  return (
    <svg {...base({ size: 15, ...props })}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}

export function PeopleIcon(props: IconProps) {
  return (
    <svg {...base({ size: 15, ...props })}>
      <circle cx="9" cy="9" r="3" />
      <circle cx="16" cy="10" r="2.5" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
    </svg>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })}>
      <circle cx="6" cy="12" r="2" />
      <circle cx="18" cy="6" r="2" />
      <circle cx="18" cy="18" r="2" />
      <path d="M8 11l8-4M8 13l8 4" />
    </svg>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, strokeWidth: 2.2, ...props })}>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function NearMeIcon(props: IconProps) {
  return (
    <svg {...base({ size: 17, strokeWidth: 1.5, ...props })}>
      <path d="M12 2 L20 20 L12 16 L4 20 Z" />
    </svg>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <svg {...base({ size: 15, strokeWidth: 2.4, ...props })}>
      <path d="M4 12l5 5L20 6" />
    </svg>
  );
}

export function MapPinOffIcon(props: IconProps) {
  return (
    <svg {...base({ size: 26, strokeWidth: 1.6, ...props })}>
      <path d="M12 21s7-7.5 7-12a7 7 0 0 0-14 0c0 4.5 7 12 7 12Z" />
      <path d="M9 9l6 6M15 9l-6 6" />
    </svg>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <svg {...base({ size: 26, strokeWidth: 1.6, ...props })}>
      <path d="M12 3 L22.5 21 H1.5 Z" strokeLinejoin="round" />
      <path d="M12 9.5v5" />
      <circle cx="12" cy="17.3" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FlagIcon(props: IconProps) {
  return (
    <svg {...base({ size: 20, strokeWidth: 1.8, ...props })}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3.5 4L18 12H5" strokeLinejoin="round" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base({ size: 26, strokeWidth: 1.6, ...props })}>
      <rect x="2" y="4.5" width="20" height="15" rx="2" />
      <path d="M2.5 5.5l9.5 8 9.5-8" />
    </svg>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <svg {...base({ size: 14, ...props })}>
      <path d="M14 5h5v5M19 5l-8 8M9 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

/** Placeholder-drop-zone glyph — production swaps PhotoSlot for a real upload/CDN picker. */
export function PhotoIcon(props: IconProps) {
  return (
    <svg {...base({ size: 16, ...props })}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="9" r="1.5" fill="currentColor" stroke="none" />
      <path d="M21 15l-5-5-4 4-3-3-5 5" />
    </svg>
  );
}

export function CalendarPlusIcon(props: IconProps) {
  return (
    <svg {...base({ size: 13, ...props })}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M12 13v6M9 16h6" />
    </svg>
  );
}

/** Standard multi-color Google "G" logomark, per Google's own sign-in button guidelines. */
export function GoogleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M23 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.2c-.3 1.4-1.1 2.6-2.3 3.4v2.8h3.7c2.2-2 3.4-5 3.4-8.4z"
      />
      <path
        fill="#34A853"
        d="M12 23c3.1 0 5.7-1 7.6-2.8l-3.7-2.8c-1 .7-2.4 1.1-3.9 1.1-3 0-5.5-2-6.4-4.7H1.8v2.9C3.7 20.6 7.5 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 13.8c-.2-.7-.4-1.4-.4-2.3s.1-1.6.4-2.3V6.3H1.8C1 8 .6 9.9.6 11.5s.4 3.5 1.2 5.2z"
      />
      <path
        fill="#EA4335"
        d="M12 5.4c1.7 0 3.2.6 4.4 1.7l3.3-3.3C17.7 1.9 15.1 1 12 1 7.5 1 3.7 3.4 1.8 6.3l3.8 2.9c.9-2.7 3.4-4.7 6.4-4.7z"
      />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg
      {...base({ size: 15, fill: "currentColor", stroke: "none", ...props })}
    >
      <path d="M16.4 1c.1 1.2-.4 2.4-1.1 3.3-.8.9-2 1.6-3.2 1.5-.1-1.2.4-2.4 1.1-3.2.8-.9 2.1-1.6 3.2-1.6zM20 17.3c-.5 1.1-.8 1.6-1.4 2.6-1 1.4-2.3 3.2-4 3.2-1.5 0-1.9-1-3.9-1s-2.5 1-4 1c-1.7 0-2.9-1.6-3.9-3-2.7-3.8-3-8.3-1.3-10.7 1.2-1.7 3-2.7 4.7-2.7 1.7 0 2.8 1 4.2 1 1.4 0 2.2-1 4.2-1 1.5 0 3.1.8 4.2 2.2-3.7 2-3.1 7.3 1.2 8.4z" />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...base({ size: 18, strokeWidth: 1.8, ...props })}>
      <path d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function EyeOffIcon(props: IconProps) {
  return (
    <svg {...base({ size: 18, strokeWidth: 1.8, ...props })}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.2A10.8 10.8 0 0 1 12 5c7 0 10.5 7 10.5 7a15.3 15.3 0 0 1-3.4 4.3M6.8 6.8C3.7 8.8 1.5 12 1.5 12s3.5 7 10.5 7c1.4 0 2.6-.3 3.7-.7" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
    </svg>
  );
}
