import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const QUERY = "(orientation: landscape) and (max-height: 520px)";

/** Portrait-first: asks phone players to rotate back when in landscape. */
export function RotateOverlay() {
  const [landscape, setLandscape] = useState(
    () => window.matchMedia(QUERY).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setLandscape(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  if (!landscape) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-night/95 px-8 text-center backdrop-blur-sm">
      <motion.div
        animate={{ rotate: [0, -90, -90, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 0.6 }}
        className="text-6xl"
      >
        📱
      </motion.div>
      <h2 className="font-display text-2xl text-gold-400">ROTATE YOUR PHONE</h2>
      <p className="text-white/70">
        Christian Surfers is played in portrait — turn your device upright to
        keep running in the light.
      </p>
    </div>
  );
}
