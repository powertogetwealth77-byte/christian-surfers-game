import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { MISSIONS } from "../data/missions";
import { Button } from "../components/Button";

const METRIC_ICONS: Record<string, string> = {
  coins: "💰",
  dodges: "💨",
  scrolls: "📜",
  shields: "🛡",
  distance: "🏃",
  surviveSeconds: "⏱",
};

export function MissionsScreen({
  save,
  onBack,
}: {
  save: SaveData;
  onBack: () => void;
}) {
  const completed = save.completedMissions.length;
  const total = MISSIONS.length;

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>← Back</Button>
        <div className="text-center">
          <h2 className="font-display text-2xl text-gold-400">MISSIONS</h2>
          <p className="text-xs text-white/50">{completed}/{total} complete</p>
        </div>
        <div className="w-16" />
      </div>

      {/* Overall progress bar */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/30">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-gold-400 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${(completed / total) * 100}%` }}
          transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {MISSIONS.map((m, i) => {
          const done = save.completedMissions.includes(m.id);
          const icon = METRIC_ICONS[m.metric] ?? "⭐";
          return (
            <motion.div
              key={m.id}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className={`rounded-2xl border p-4 shadow-lg shadow-black/20 backdrop-blur-md transition-all ${
                done
                  ? "border-emerald-400/40 bg-emerald-400/10"
                  : "border-white/10 bg-white/5"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-2xl">{done ? "✅" : icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-extrabold truncate">{m.title}</p>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                        done
                          ? "bg-emerald-500/25 text-emerald-300"
                          : "bg-gold-400/15 text-gold-300"
                      }`}
                    >
                      {done ? "✓ DONE" : "ACTIVE"}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-white/55">
                    Reward: 💰 {m.rewardCoins} · ✨ {m.rewardXp} XP
                  </p>
                  {/* Progress bar — shown whether done or not */}
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30">
                    <motion.div
                      className={`h-full rounded-full ${done ? "bg-emerald-400" : "bg-gold-400"}`}
                      initial={{ width: 0 }}
                      animate={{ width: done ? "100%" : "0%" }}
                      transition={{ delay: 0.2 + i * 0.06, duration: 0.7 }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    Target: {m.target.toLocaleString()} {m.metric}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/60 backdrop-blur-md">
          Missions complete automatically during your run. Finished missions pay
          out on the Rewards screen.
        </div>
      </div>
    </div>
  );
}
