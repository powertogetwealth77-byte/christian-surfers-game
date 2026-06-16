import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / 1600);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setTimeout(onDone, 250);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [onDone]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-night via-[#16204a] to-[#2a1a4a] px-8">
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.8 }}
        className="text-center"
      >
        <div className="mb-2 text-6xl">✝️</div>
        <h1 className="font-display text-4xl text-gold-400 text-glow-gold sm:text-5xl">
          CHRISTIAN
          <br />
          SURFERS
        </h1>
        <p className="mt-3 text-lg font-bold tracking-[0.3em] text-white/70">
          RUN IN THE LIGHT
        </p>
      </motion.div>
      <div className="mt-12 h-2.5 w-64 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-gold-600 to-gold-300 transition-[width]"
          style={{ width: `${progress * 100}%` }}
        />
      </div>
      <p className="mt-4 text-sm text-white/50">
        {progress < 0.4
          ? "Lighting the boardwalk..."
          : progress < 0.8
            ? "Unrolling scripture scrolls..."
            : "Lacing up your sneakers..."}
      </p>
    </div>
  );
}
