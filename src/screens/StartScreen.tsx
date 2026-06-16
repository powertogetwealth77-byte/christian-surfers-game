import { motion } from "framer-motion";
import type { SaveData, Screen } from "../types";
import { Button } from "../components/Button";
import { DailyBlessing } from "../components/DailyBlessing";
import { getCharacter } from "../data/characters";
import { todayKey, yesterdayKey } from "../utils/storage";

export function StartScreen({
  save,
  go,
  onClaimDaily,
}: {
  save: SaveData;
  go: (s: Screen) => void;
  onClaimDaily: (coins: number, nextStreak: number) => void;
}) {
  const ch = getCharacter(save.selectedCharacter);
  const dailyEligible = save.lastDailyClaim !== todayKey();
  const nextStreak = save.lastDailyClaim === yesterdayKey() ? save.dailyStreak + 1 : 1;

  return (
    <div className="relative flex h-full flex-col items-center justify-between overflow-hidden bg-gradient-to-b from-[#1e2a78] via-[#7a4fb0] to-[#f08a4b] px-6 py-10 safe-top safe-bottom">
      {dailyEligible && (
        <DailyBlessing
          streak={nextStreak}
          onClaim={(coins) => onClaimDaily(coins, nextStreak)}
        />
      )}
      {/* Animated background orbs */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-3 w-3 rounded-full bg-gold-300/60"
          style={{ left: `${8 + i * 12}%` }}
          initial={{ y: "110vh" }}
          animate={{ y: "-10vh" }}
          transition={{
            duration: 7 + i * 1.3,
            repeat: Infinity,
            ease: "linear",
            delay: i * 0.9,
          }}
        />
      ))}

      <motion.div
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="z-10 mt-6 text-center"
      >
        <motion.div
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="text-5xl"
        >
          ✝️
        </motion.div>
        <h1 className="font-display text-5xl leading-tight text-gold-300 text-glow-gold sm:text-6xl">
          CHRISTIAN
          <br />
          SURFERS
        </h1>
        <p className="mt-2 text-base font-bold tracking-[0.35em] text-white/85">
          RUN IN THE LIGHT
        </p>
      </motion.div>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="z-10 flex items-center gap-3 rounded-2xl bg-black/30 px-5 py-3 backdrop-blur-sm"
      >
        <span className="text-2xl">🏃</span>
        <div className="text-left">
          <p className="text-sm text-white/60">Running as</p>
          <p className="font-extrabold" style={{ color: ch.colors.secondary }}>
            {ch.name} · {ch.clothingText}
          </p>
        </div>
        <div className="ml-4 border-l border-white/20 pl-4 text-left">
          <p className="text-sm text-white/60">Best</p>
          <p className="font-extrabold text-gold-300">
            {save.bestScore.toLocaleString()}
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="z-10 flex w-full max-w-xs flex-col gap-3 pb-4"
      >
        <motion.div
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          <Button onClick={() => go("game")} shine className="w-full py-4 text-2xl">
            ▶ PLAY
          </Button>
        </motion.div>
        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => go("characters")}>
            🏃 Characters
          </Button>
          <Button variant="secondary" onClick={() => go("boards")}>
            🛹 Boards
          </Button>
          <Button variant="secondary" onClick={() => go("collection")}>
            📚 Collection
          </Button>
          <Button variant="secondary" onClick={() => go("missions")}>
            ⭐ Missions
          </Button>
          <Button variant="secondary" onClick={() => go("upgrades")}>
            ⬆ Upgrades
          </Button>
          <Button variant="secondary" onClick={() => go("settings")}>
            ⚙ Settings
          </Button>
        </div>
        <p className="mt-1 text-center text-sm text-white/70">
          💰 {save.totalCoins.toLocaleString()} Light Coins · ✨{" "}
          {save.totalXp.toLocaleString()} XP
        </p>
      </motion.div>
    </div>
  );
}
