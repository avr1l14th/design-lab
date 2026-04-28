import { useEffect, useState } from "react";

/* SSR-safe: defaults to false on the server, then syncs from matchMedia
 * on mount. On Next.js static export the first paint is desktop, then
 * mobile users see a one-tick re-render to the mobile layout. */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [breakpoint]);
  return isMobile;
}
