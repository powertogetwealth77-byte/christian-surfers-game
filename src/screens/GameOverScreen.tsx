import { useEffect } from "react";
import { motion } from "framer-motion";
import type { RunStats, SaveData } from "../types";
import { Button } from "../components/Button";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { getCharacter } from "../data/characters";
import { sound } from "../audio/SoundEngine";

function Stat({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      initial={{ y: 16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay }}
      className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-2.5"
    >
      <span className="text-white/70">{label}</span>
      <span className="font-extrabold text-gold-300">{value}</span>
    </motion.div>
  );
}

export function GameOverScreen({
  stats,
  save,
  onRetry,
  onRewards,
  onHome,
}: {
  stats: RunStats;
  save: SaveData;
  onRetry: () => void;
  onRewards: () => void;
  onHome: () => void;
}) {
  const newBest = Math.floor(stats.score) >= save.bestScore && stats.score > 0;
  const ch = getCharacter(save.selectedCharacter);

  useEffect(() => {
    const t = setTimeout(() => sound.play(newBest ? "missionComplete" : "reward"), 450);
    return () => clearTimeout(t);
  }, [newBest]);

  return (
    <div className="flex h-full flex-col items-center justify-center bg-gradient-to-b from-[#1a0a14] via-night to-[#16204a] px-6 py-8 safe-top safe-bottom">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative text-center"
      >
        {newBest ? (
          <>
            {/* Victory celebration burst behind the hero */}
            <motion.div
              className="pointer-events-none absolute inset-0 -z-10 mx-auto h-40 w-40 self-center rounded-full"
              style={{ background: "radial-gradient(circle, rgba(255,221,120,0.5), rgba(255,221,120,0))" }}
              animate={{ scale: [0.8, 1.15, 1], opacity: [0, 1, 0.85] }}
              transition={{ duration: 0.7 }}
            />
            <div className="flex justify-center">
              <CharacterAvatar ch={ch} pose="victory" className="h-28 w-auto drop-shadow-[0_0_18px_rgba(255,221,120,0.6)]" />
            </div>
            <h2 className="mt-1 font-display text-3xl text-gold-300 text-glow-gold">VICTORY!</h2>
            <p className="mt-1 text-base font-bold text-sky-200">
              {ch.name}: "{ch.voiceLine}"
            </p>
          </>
        ) : (
          <>
            <div className="text-5xl">😈</div>
            <h2 className="mt-2 font-display text-3xl text-rose-400">
              THE ACCUSER CAUGHT UP
            </h2>
            <p className="mt-1 text-lg font-bold text-gold-300">
              — rise and run again. ✝️
            </p>
          </>
        )}
      </motion.div>

      <div className="mt-6 w-full max-w-sm space-y-2">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-center"
        >
          <p className="text-sm text-white/60">FINAL SCORE</p>
          <p className="font-display text-4xl text-gold-300 text-glow-gold">
            {Math.floor(stats.score).toLocaleString()}
          </p>
          {newBest && (
            <motion.p
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
              className="mt-1 text-sm font-extrabold text-emerald-300"
            >
              🏆 NEW BEST!
            </motion.p>
          )}
        </motion.div>

        <Stat label="🏃 Distance" value={`${Math.floor(stats.distance).toLocaleString()} m`} delay={0.2} />
        <Stat label="💰 Light Coins" value={`${stats.coins}`} delay={0.26} />
        <Stat label="📜 Scripture Scrolls" value={`${stats.scrolls}`} delay={0.32} />
        <Stat label="🔗 Best Combo · ✨ Perfect Dodges" value={`${stats.bestCombo} · ${stats.perfectDodges}`} delay={0.38} />
        <Stat label="👑 Crowns · 🔑 Keys · 💎 Gems" value={`${stats.crowns} · ${stats.keys} · ${stats.gems}`} delay={0.44} />
      </div>

      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 flex w-full max-w-sm flex-col gap-3"
      >
        <Button onClick={onRetry} shine className="py-4 text-xl">
          🔄 RUN AGAIN
        </Button>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onRewards}>
            🎁 Rewards
          </Button>
          <Button variant="secondary" onClick={onHome}>
            🏠 Home
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
