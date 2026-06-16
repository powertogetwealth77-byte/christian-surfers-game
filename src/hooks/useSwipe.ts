import { useEffect, useRef } from "react";

export type SwipeDir = "left" | "right" | "up" | "down";

const THRESHOLD = 28; // px before a touch counts as a swipe

/** Attaches swipe detection to an element. */
export function useSwipe(
  ref: React.RefObject<HTMLElement | null>,
  onSwipe: (dir: SwipeDir) => void,
) {
  const handler = useRef(onSwipe);
  handler.current = onSwipe;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;

    const onStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
    };
    const onMove = (e: TouchEvent) => {
      const t = e.touches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return;
      // Re-anchor after each swipe so one continuous drag can chain
      // multiple moves (e.g. two quick lane changes).
      startX = t.clientX;
      startY = t.clientY;
      if (Math.abs(dx) > Math.abs(dy)) {
        handler.current(dx > 0 ? "right" : "left");
      } else {
        handler.current(dy > 0 ? "down" : "up");
      }
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
    };
  }, [ref]);
}
