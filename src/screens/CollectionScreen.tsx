import { useState } from "react";
import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { CHARACTERS } from "../data/characters";
import { BOARDS } from "../data/boards";
import { ACHIEVEMENTS, achievementProgress, achievementComplete } from "../data/achievements";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";

type Tab = "characters" | "boards" | "achievements";

export function CollectionScreen({
  save,
  onClaim,
  onBack,
}: {
  save: SaveData;
  onClaim: (id: string, reward: number) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<Tab>("characters");

  const boardsOwned = save.ownedBoards.length;
  const achDone = ACHIEVEMENTS.filter((a) => achievementComplete(a, save)).length;

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">COLLECTION</h2>
        <div className="w-16" />
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {([
          ["characters", `Heroes ${CHARACTERS.length}`],
          ["boards", `Boards ${boardsOwned}/${BOARDS.length}`],
          ["achievements", `Awards ${achDone}/${ACHIEVEMENTS.length}`],
        ] as [Tab, string][]).map(([t, label]) => (
          <button
            key={t}
            onClick={() => {
              sound.play("click");
              setTab(t);
            }}
            className={`rounded-xl py-2 text-xs font-extrabold transition-colors ${
              tab === t ? "bg-gold-400 text-night" : "bg-white/10 text-white/70"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto pb-4">
        {tab === "characters" &&
          CHARACTERS.map((ch, i) => {
            const rm = RARITY[ch.rarity];
            return (
              <motion.div
                key={ch.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="rounded-2xl border-2 p-3"
                style={{ borderColor: `${rm.color}66`, background: "rgba(255,255,255,0.04)" }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-extrabold" style={{ color: ch.colors.secondary }}>
                    {ch.name} <span className="text-xs text-white/50">· {ch.tagline}</span>
                  </p>
                  <span
                    className="rounded-md px-2 py-0.5 text-[10px] font-black uppercase"
                    style={{ background: rm.color, color: "#1a1020" }}
                  >
                    {rm.label}
                  </span>
                </div>
                <p className="mt-1 text-[11px] italic text-white/55">{ch.bio}</p>
                <p className="mt-1 text-[11px] text-white/70">📖 {ch.scripture} · ✨ {ch.signaturePower}</p>
              </motion.div>
            );
          })}

        {tab === "boards" &&
          BOARDS.map((b, i) => {
            const owned = save.ownedBoards.includes(b.id);
            const rm = RARITY[b.rarity];
            return (
              <motion.div
                key={b.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.02 }}
                className="flex items-center gap-3 rounded-2xl border-2 p-3"
                style={{ borderColor: owned ? `${rm.color}88` : "rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)" }}
              >
                <div
                  className="flex h-10 w-14 shrink-0 items-center justify-center rounded-lg text-xl"
                  style={{
                    background: owned ? b.color : "#0d1430",
                    border: `2px solid ${owned ? b.edge : "#33405f"}`,
                    filter: owned ? "none" : "grayscale(1) brightness(0.5)",
                  }}
                >
                  {owned ? b.emblem : "🔒"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-extrabold">
                    {owned ? b.name : "???"}{" "}
                    <span className="text-[10px] uppercase" style={{ color: rm.color }}>
                      {rm.label}
                    </span>
                  </p>
                  <p className="truncate text-[11px] italic text-white/55">
                    {owned ? `"${b.lore}"` : "Locked — keep running to collect this board."}
                  </p>
                </div>
              </motion.div>
            );
          })}

        {tab === "achievements" &&
          ACHIEVEMENTS.map((a, i) => {
            const prog = achievementProgress(a, save);
            const done = prog >= a.target;
            const claimed = save.claimedAchievements.includes(a.id);
            const pct = Math.min(1, prog / a.target);
            return (
              <motion.div
                key={a.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className={`rounded-2xl border-2 p-3 ${
                  done ? "border-gold-400/60 bg-gold-400/10" : "border-white/12 bg-white/5"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`text-2xl ${done ? "" : "opacity-40 grayscale"}`}>{a.icon}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-extrabold">{a.name}</p>
                    <p className="text-[11px] text-white/55">{a.desc}</p>
                  </div>
                  {done && !claimed ? (
                    <button
                      onClick={() => {
                        sound.unlock();
                        sound.play("achievement");
                        onClaim(a.id, a.reward);
                      }}
                      className="shrink-0 rounded-xl bg-violet-500 px-3 py-2 text-xs font-extrabold text-white"
                    >
                      +{a.reward} 💰
                    </button>
                  ) : claimed ? (
                    <span className="shrink-0 text-xs font-extrabold text-emerald-300">✓ CLAIMED</span>
                  ) : null}
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-gold-400"
                    style={{ width: `${pct * 100}%` }}
                  />
                </div>
                <p className="mt-1 text-right text-[10px] text-white/50">
                  {Math.min(prog, a.target).toLocaleString()}/{a.target.toLocaleString()}
                </p>
              </motion.div>
            );
          })}
      </div>
    </div>
  );
}
