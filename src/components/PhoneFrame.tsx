import type { ReactNode } from "react";

/**
 * Dev/review convenience only: renders the decorative 390x844 iPhone-style
 * bezel between 640px and 1023px viewports so the shell can be reviewed on
 * a desktop browser. Flip to false to always render full-bleed. Real mobile
 * viewports (<640px) always go full-bleed regardless of this flag — and so
 * does >=1024px, since that's the real desktop two-pane layout (see
 * AppShell/MapScreen), not a mockup review — the bezel would just get in
 * its way.
 */
const SHOW_DEV_BEZEL = true;

export function PhoneFrame({ children }: { children: ReactNode }) {
  const bezelClasses = SHOW_DEV_BEZEL
    ? "sm:h-[844px] sm:w-[390px] sm:rounded-[52px] sm:p-[14px] sm:shadow-[0_40px_90px_rgba(0,0,0,0.6)] sm:ring-1 sm:ring-white/5 lg:h-dvh lg:w-full lg:rounded-none lg:p-0 lg:shadow-none lg:ring-0"
    : "";
  const screenClasses = SHOW_DEV_BEZEL ? "sm:rounded-[38px] lg:rounded-none" : "";

  return (
    <div className="flex min-h-dvh w-full items-center justify-center bg-bg2 sm:p-10 lg:p-0">
      <div className={`h-dvh w-full bg-black ${bezelClasses}`}>
        <div
          className={`relative flex h-full w-full flex-col overflow-hidden bg-bg font-sans ${screenClasses}`}
          style={{
            paddingTop: "env(safe-area-inset-top)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
