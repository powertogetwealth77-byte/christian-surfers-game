import { useEffect } from "react";
import { motion } from "framer-motion";
import type { RunStats, SaveData } from "../types";
import { Button } from "../components/Button";
import { MISSIONS } from "../data/missions";
import { SCRIPTURES } from "../data/scriptures";
import { getCharacter } from "../data/characters";
import { sound } from "../audio/SoundEngine";

export function RewardsScreen({
  stats,
  save,
  onContinue,
}: {
  stats: RunStats;
  save: SaveData;
  onContinue: () => void;
}) {
  const missionCoins = stats.missionsCompleted.reduce(
    (sum, id) => sum + (MISSIONS.find((m) => m.id === id)?.rewardCoins ?? 0),
    0,
  );
  const xp = stats.xpEarned + Math.floor(stats.score / 100);
  const level = Math.floor(save.totalXp / 500) + 1;
  const levelPct = ((save.totalXp % 500) / 500) * 100;
  const nextMission = MISSIONS.find((m) => !save.completedMissions.includes(m.id));
  const newScriptures = stats.scripturesSeen
    .map((ref) => SCRIPTURES.find((s) => s.ref === ref))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));
  const ch = getCharacter(save.selectedCharacter);

  useEffect(() => {
    sound.play("reward");
  }, []);

  return (
    <div className="flex h-full flex-col bg-gradient-to-b from-[#16204a] via-[#321a4a] to-night px-5 py-8 safe-top safe-bottom">
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-center font-display text-3xl text-gold-400 text-glow-gold"
      >
        🎁 REWARDS
      </motion.h2>

      <div className="mt-5 flex-1 space-y-3 overflow-y-auto pb-4">
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl border border-gold-400/40 bg-gold-400/10 p-4 text-center">
            <p className="text-3xl">💰</p>
            <p className="font-display text-2xl text-gold-300">
              +{stats.coins + missionCoins}
            </p>
            <p className="text-xs text-white/60">
              Coins earned{missionCoins > 0 ? ` (+${missionCoins} mission bonus)` : ""}
            </p>
          </div>
          <div className="rounded-2xl border border-violet-400/40 bg-violet-400/10 p-4 text-center">
            <p className="text-3xl">✨</p>
            <p className="font-display text-2xl text-violet-300">+{xp}</p>
            <p className="text-xs text-white/60">XP gained</p>
          </div>
        </motion.div>

        {/* Character progress */}
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-white/15 bg-white/5 p-4"
        >
          <div className="flex items-center justify-between">
            <p className="font-extrabold" style={{ color: ch.colors.secondary }}>
              🏃 {ch.name} — Level {level}
            </p>
            <p className="text-sm text-white/60">{save.totalXp} XP total</p>
          </div>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/15">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${levelPct}%` }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-gold-400"
            />
          </div>
        </motion.div>

        {/* Scriptures unlocked this run */}
        {newScriptures.length > 0 && (
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-gold-400/30 bg-white/5 p-4"
          >
            <p className="mb-2 font-extrabold text-gold-300">📜 Scripture Unlocked</p>
            {newScriptures.map((s) => (
              <div key={s.ref} className="mb-2 rounded-xl bg-black/30 p-3">
                <p className="text-sm font-bold text-gold-300">{s.ref}</p>
                <p className="text-sm italic text-white/80">"{s.text}"</p>
              </div>
            ))}
          </motion.div>
        )}

        {/* Missions completed + next mission */}
        {stats.missionsCompleted.length > 0 && (
          <motion.div
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.38 }}
            className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4"
          >
            <p className="font-extrabold text-emerald-300">⭐ Missions Complete</p>
            {stats.missionsCompleted.map((id) => (
              <p key={id} className="text-sm text-white/80">
                ✅ {MISSIONS.find((m) => m.id === id)?.title}
              </p>
            ))}
          </motion.div>
        )}
        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl border border-white/15 bg-white/5 p-4"
        >
          <p className="text-sm text-white/60">NEXT MISSION</p>
          <p className="font-extrabold">
            {nextMission ? `⭐ ${nextMission.title}` : "🏆 All demo missions complete!"}
          </p>
        </motion.div>
      </div>

      <Button onClick={onContinue} shine className="mx-auto w-full max-w-sm py-4 text-xl">
        ✝️ CONTINUE
      </Button>
    </div>
  );
}
