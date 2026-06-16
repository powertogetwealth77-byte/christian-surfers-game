import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { UPGRADES, upgradeCost } from "../data/upgrades";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";

export function UpgradesScreen({
  save,
  onBuy,
  onBack,
}: {
  save: SaveData;
  onBuy: (id: string, cost: number) => void;
  onBack: () => void;
}) {
  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">UPGRADES</h2>
        <div className="w-16" />
      </div>
      <p className="mb-4 text-center font-bold text-gold-300">
        💰 {save.totalCoins.toLocaleString()} Light Coins
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {UPGRADES.map((u, i) => {
          const level = save.upgrades[u.id] ?? 0;
          const maxed = level >= u.maxLevel;
          const cost = upgradeCost(u, level);
          const affordable = save.totalCoins >= cost;
          return (
            <motion.div
              key={u.id}
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl border border-white/15 bg-white/5 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-extrabold">{u.name}</p>
                  <p className="text-sm text-white/60">{u.desc}</p>
                </div>
                <button
                  disabled={maxed || !affordable}
                  onClick={() => {
                    sound.unlock();
                    sound.play(maxed || !affordable ? "click" : "reward");
                    if (!maxed && affordable) onBuy(u.id, cost);
                  }}
                  className={`ml-3 shrink-0 rounded-xl px-4 py-2 text-sm font-extrabold ${
                    maxed
                      ? "bg-emerald-500/25 text-emerald-300"
                      : affordable
                        ? "bg-gradient-to-b from-gold-300 to-gold-600 text-night"
                        : "bg-white/10 text-white/40"
                  }`}
                >
                  {maxed ? "MAX" : `💰 ${cost}`}
                </button>
              </div>
              {/* Level pips */}
              <div className="mt-3 flex gap-1.5">
                {[...Array(u.maxLevel)].map((_, l) => (
                  <div
                    key={l}
                    className={`h-2 flex-1 rounded-full ${
                      l < level ? "bg-gold-400" : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
