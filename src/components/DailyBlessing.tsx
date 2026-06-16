import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { sound } from "../audio/SoundEngine";

const BLESSINGS = [
  { ref: "Lam 3:22-23", text: "His mercies are new every morning." },
  { ref: "Ps 118:24", text: "This is the day the LORD has made; rejoice in it." },
  { ref: "Zeph 3:17", text: "The LORD your God is with you, a mighty warrior who saves." },
  { ref: "Phil 4:13", text: "I can do all things through Christ who strengthens me." },
  { ref: "Josh 1:9", text: "Be strong and courageous; the LORD is with you wherever you go." },
];

/**
 * Daily Blessing — a once-per-day login reward. Coins scale with the day streak
 * (capped), and a fresh encouragement verse appears each day.
 */
export function DailyBlessing({
  streak,
  onClaim,
}: {
  streak: number; // streak the player will be ON after claiming (1-based)
  onClaim: (coins: number) => void;
}) {
  const [open, setOpen] = useState(true);
  const day = Math.max(1, streak);
  const reward = Math.min(500, 100 + (day - 1) * 50);
  const blessing = BLESSINGS[(day - 1) % BLESSINGS.length];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 px-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.8, y: 30, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="w-full max-w-xs rounded-3xl border border-gold-400/50 bg-gradient-to-b from-[#2a1f55] to-[#16204a] p-6 text-center shadow-2xl"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity }}
              className="text-5xl"
            >
              🎁
            </motion.div>
            <h2 className="mt-2 font-display text-2xl text-gold-300 text-glow-gold">
              DAILY BLESSING
            </h2>
            <p className="mt-1 text-sm font-bold text-violet-200">
              Day {day} streak 🔥
            </p>

            <div className="mt-4 rounded-2xl bg-black/30 p-4">
              <p className="font-display text-3xl text-gold-300">+{reward} 💰</p>
              <p className="text-xs text-white/60">Light Coins</p>
            </div>

            <p className="mt-4 text-sm font-bold text-gold-200">{blessing.ref}</p>
            <p className="text-sm italic text-white/80">"{blessing.text}"</p>

            <button
              onClick={() => {
                sound.unlock();
                sound.play("reward");
                onClaim(reward);
                setOpen(false);
              }}
              className="mt-5 w-full rounded-2xl bg-gradient-to-r from-gold-500 to-amber-400 py-3 font-display text-lg text-night shadow-lg active:scale-95"
            >
              ✝️ CLAIM BLESSING
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
