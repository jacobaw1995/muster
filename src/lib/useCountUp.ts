import { useEffect, useState } from "react";

const COUNT_UP_DURATION_MS = 900;

/**
 * Eases a set of numeric targets up from 0, replaying whenever the target
 * values change. Because components mount fresh on tab-switch (Impact's
 * YOU/OPERATOR STANDARD views are conditionally rendered, not just hidden),
 * this alone covers "on entry" + "on tab-switch" per the design spec; the
 * value-based dependency additionally covers "re-trigger after logging"
 * without needing a separate manual trigger.
 */
export function useCountUp<T extends Record<string, number>>(targets: T): T {
  const [display, setDisplay] = useState<T>(targets);
  const key = Object.values(targets).join(",");

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / COUNT_UP_DURATION_MS);
      const eased = 1 - Math.pow(1 - p, 3);
      const next = {} as T;
      for (const k of Object.keys(targets) as (keyof T)[]) {
        next[k] = (targets[k] * eased) as T[keyof T];
      }
      setDisplay(next);
      if (p < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return display;
}
