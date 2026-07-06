import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { RunStats, SaveData } from "../types";
import { Button } from "../components/Button";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { getCharacter } from "../data/characters";
import { sound } from "../audio/SoundEngine";

const ACCUSER_PORTRAIT = "/assets/characters/accuser/accuser_portrait.png";

/**
 * Cuts a flat-white background out of an image into real alpha transparency,
 * with a soft-edge falloff so anti-aliased outlines don't leave a white
 * fringe. The Accuser portrait's source PNG has no alpha channel (confirmed:
 * PNG color type 2 / RGB, not RGBA) — CSS mix-blend-mode was tried first but
 * doesn't reach through the Game Over screen's animated (Framer Motion)
 * wrapper's stacking context, so this processes real pixels instead.
 */
function useWhiteKeyedImage(src: string): { dataUrl: string | null; failed: boolean } {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.onload = () => {
      if (cancelled) return;
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = frame.data;
        const threshold = 235;
        const soft = 40;
        for (let i = 0; i < d.length; i += 4) {
          const minC = Math.min(d[i], d[i + 1], d[i + 2]);
          if (minC >= threshold) {
            d[i + 3] = 0;
          } else if (minC > threshold - soft) {
            d[i + 3] = Math.round((d[i + 3] * (threshold - minC)) / soft);
          }
        }
        ctx.putImageData(frame, 0, 0);
        if (!cancelled) setDataUrl(canvas.toDataURL("image/png"));
      } catch {
        if (!cancelled) setFailed(true);
      }
    };
    img.onerror = () => {
      if (!cancelled) setFailed(true);
    };
    img.src = src;
    return () => {
      cancelled = true;
    };
  }, [src]);

  return { dataUrl, failed };
}

/**
 * Phase — CS-ACCUSER-REVEAL-001. A brief, contained reveal shown only on the
 * "caught" flavor of Game Over — the live procedural chase Accuser
 * (drawSatan in render.ts) is untouched; this is a separate, static portrait
 * moment framing the catch as already-defeated, not scary. Image-first with
 * an automatic fallback (mirrors CharacterAvatar's onError pattern) so a
 * missing/broken asset never crashes or blanks the screen.
 */
function AccuserReveal() {
  const { dataUrl, failed } = useWhiteKeyedImage(ACCUSER_PORTRAIT);
  return (
    <div className="flex h-28 justify-center">
      {failed || !dataUrl ? (
        <div className="text-5xl">😈</div>
      ) : (
        <img
          src={dataUrl}
          alt="The Accuser"
          className="h-28 w-auto object-contain drop-shadow-[0_0_16px_rgba(220,40,60,0.45)]"
        />
      )}
    </div>
  );
}

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
            <AccuserReveal />
            <h2 className="mt-2 font-display text-3xl text-rose-400">
              THE ACCUSER CAUGHT UP
            </h2>
            <p className="mt-1 text-sm font-semibold italic text-white/60">
              "The accuser of our brethren is cast down." — Revelation 12:10
            </p>
            <p className="mt-1 text-lg font-bold text-gold-300">
              He pursued you... but he is already defeated. Rise and run again. ✝️
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
