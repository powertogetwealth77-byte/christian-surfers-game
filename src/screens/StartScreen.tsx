import { motion } from "framer-motion";
import type { SaveData, Screen } from "../types";
import { Button } from "../components/Button";
import { DailyBlessing } from "../components/DailyBlessing";
import { getCharacter } from "../data/characters";
import { todayKey, yesterdayKey } from "../utils/storage";
import {
  accountLevel,
  accountLevelProgress,
  boardFraction,
  achievementFraction,
  kingdomRank,
} from "../data/progression";
import { masteryFraction } from "../data/challenges";

function MiniBar({ label, frac, color }: { label: string; frac: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="flex items-center justify-between text-[10px] font-bold text-white/70">
        <span>{label}</span>
        <span>{Math.round(frac * 100)}%</span>
      </div>
      <div className="mt-0.5 h-1.5 overflow-hidden rounded-full bg-black/30">
        <div className="h-full rounded-full transition-all" style={{ width: `${frac * 100}%`, background: color }} />
      </div>
    </div>
  );
}

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
  const level = accountLevel(save);
  const rank = kingdomRank(save);
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
      {/* Distant heaven-light — the victory glow we run toward. */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-[140%] -translate-x-1/2"
        style={{
          background:
            "radial-gradient(60% 80% at 50% 0%, rgba(255,244,204,0.5), rgba(255,224,138,0.18) 45%, transparent 70%)",
        }}
      />
      <motion.div
        className="pointer-events-none absolute left-1/2 top-10 h-40 w-1.5 -translate-x-1/2 rounded-full"
        style={{ background: "linear-gradient(to bottom, rgba(255,247,204,0.85), transparent)" }}
        animate={{ opacity: [0.4, 0.9, 0.4] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Subtle light beams — slow diagonal gradient streaks. */}
      {[
        { left: "20%", delay: 0, dur: 9 },
        { left: "52%", delay: 3, dur: 11 },
        { left: "78%", delay: 6, dur: 10 },
      ].map((b, i) => (
        <motion.div
          key={`beam-${i}`}
          className="pointer-events-none absolute top-[-30%] h-[160%] w-24 -translate-x-1/2"
          style={{
            left: b.left,
            transform: "rotate(18deg)",
            background:
              "linear-gradient(to bottom, transparent, rgba(255,247,214,0.10) 45%, transparent)",
          }}
          animate={{ opacity: [0, 0.7, 0], x: ["-10px", "10px", "-10px"] }}
          transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut", delay: b.delay }}
        />
      ))}

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
        className="z-10 flex items-center gap-3 rounded-2xl border border-white/10 bg-black/30 px-5 py-3.5 shadow-lg shadow-black/20 backdrop-blur-md"
      >
        <div className="relative flex h-10 w-10 items-center justify-center">
          <motion.div
            className="pointer-events-none absolute inset-0 rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,224,138,0.85) 0%, rgba(255,224,138,0.25) 45%, transparent 70%)",
            }}
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative text-2xl">🏃</span>
        </div>
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
        <div className="grid grid-cols-2 gap-2.5">
          <Button variant="secondary" className="w-full" onClick={() => go("characters")}>
            🏃 Characters
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("boards")}>
            🛹 Boards
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("collection")}>
            📚 Collection
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("missions")}>
            ⭐ Missions
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("scripture")}>
            📖 Scripture
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("upgrades")}>
            ⬆ Upgrades
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("venues")}>
            🗺️ Venues
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("shoes")}>
            👟 Shoes
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => go("settings")}>
            ⚙ Settings
          </Button>
        </div>
        <Button
          variant="secondary"
          className="w-full border-violet-300/40 bg-violet-400/10"
          onClick={() => go("cosmetics")}
        >
          🛍️ Cosmetics Shop
        </Button>
        <Button
          variant="secondary"
          className="w-full border-gold-300/40 bg-gold-400/10"
          onClick={() => go("dashboard")}
        >
          👨‍👩‍👧 Parent Hub
        </Button>
        {/* Layered progression — always something climbing. */}
        <div className="rounded-2xl border border-white/10 bg-black/30 px-4 py-3.5 shadow-lg shadow-black/20 backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-extrabold text-white/90">
              {rank.icon} Lvl {level} · <span className="text-gold-300">{rank.name}</span>
            </p>
            <p className="text-xs font-bold text-white/70">
              💰 {save.totalCoins.toLocaleString()} · ✨ {save.totalXp.toLocaleString()}
            </p>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/30">
            <div
              className="h-full rounded-full bg-gradient-to-r from-gold-300 to-gold-500 transition-all"
              style={{ width: `${accountLevelProgress(save) * 100}%` }}
            />
          </div>
          <div className="mt-2 flex gap-3">
            <MiniBar label="🛹 Boards" frac={boardFraction(save)} color="#38bdf8" />
            <MiniBar label="📖 Scripture" frac={masteryFraction(save)} color="#fbbf24" />
            <MiniBar label="🏆 Awards" frac={achievementFraction(save)} color="#34d399" />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
