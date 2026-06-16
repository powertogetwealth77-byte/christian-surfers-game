import { useEffect } from "react";
import { motion } from "framer-motion";
import type { BoardDef } from "../types";
import { RARITY } from "../data/rarity";
import { sound } from "../audio/SoundEngine";

/**
 * A dramatic unlock reveal: expanding rarity rings, a light burst, bursting
 * particles, the board rising in with a spin, a rarity banner and scripture.
 * Kingdom-tier unlocks feel unforgettable.
 */
export function UnlockReveal({ board, onDone }: { board: BoardDef; onDone: () => void }) {
  const meta = RARITY[board.rarity];
  const legendary = meta.order >= 3;

  useEffect(() => {
    sound.unlock();
    sound.playUnlock(meta.order);
    const t = setTimeout(onDone, legendary ? 3400 : 2600);
    return () => clearTimeout(t);
  }, [meta.order, legendary, onDone]);

  // Particle burst targets.
  const particles = Array.from({ length: legendary ? 22 : 14 }, (_, i) => {
    const a = (i / (legendary ? 22 : 14)) * Math.PI * 2;
    const dist = 120 + Math.random() * 120;
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist, d: Math.random() * 0.3 };
  });

  return (
    <motion.div
      className="absolute inset-0 z-[60] flex items-center justify-center overflow-hidden bg-black/80 px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onDone}
    >
      {/* Expanding rarity rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ border: `2px solid ${meta.color}`, width: 120, height: 120 }}
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 3.4 + i, opacity: 0 }}
          transition={{ duration: 1.4, delay: i * 0.18, ease: "easeOut" }}
        />
      ))}

      {/* Light burst */}
      <motion.div
        className="absolute h-64 w-64 rounded-full"
        style={{ background: `radial-gradient(circle, ${meta.glow}, transparent 70%)` }}
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: [0.4, 1.3, 1.1], opacity: [0, 1, 0.7] }}
        transition={{ duration: 0.9 }}
      />

      {/* Particles */}
      {particles.map((p, i) => (
        <motion.div
          key={i}
          className="absolute h-2 w-2 rounded-full"
          style={{ background: i % 2 ? meta.color : "#fff" }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.2 }}
          transition={{ duration: 1.1, delay: p.d, ease: "easeOut" }}
        />
      ))}

      <div className="relative flex flex-col items-center text-center">
        <motion.p
          className="font-display text-lg uppercase tracking-[0.3em]"
          style={{ color: meta.color }}
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {legendary ? `★ ${meta.label} Unlock ★` : `${meta.label} Unlock`}
        </motion.p>

        {/* Board emblem rising in with a spin */}
        <motion.div
          className="my-3 flex h-28 w-44 items-center justify-center rounded-2xl"
          style={{
            background: board.color,
            border: `3px solid ${board.edge}`,
            boxShadow: `0 0 32px ${meta.glow}`,
          }}
          initial={{ scale: 0, rotate: -25, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.25 }}
        >
          <div className="text-center">
            <div className="text-3xl">{board.emblem}</div>
            <div className="mt-1 font-display text-sm text-white">{board.text}</div>
          </div>
        </motion.div>

        <motion.h2
          className="font-display text-2xl text-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {board.name}
        </motion.h2>

        {/* Scripture banner */}
        <motion.div
          className="mt-3 max-w-xs rounded-full px-5 py-2"
          style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}66` }}
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: 1, opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <p className="text-xs italic text-white/85">"{board.lore}"</p>
        </motion.div>

        <motion.p
          className="mt-5 text-xs font-bold uppercase tracking-widest text-white/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1] }}
          transition={{ delay: 1, duration: 1.6, repeat: Infinity }}
        >
          Tap to continue
        </motion.p>
      </div>
    </motion.div>
  );
}
