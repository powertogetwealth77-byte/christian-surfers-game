import { useState } from "react";
import { motion } from "framer-motion";
import type { BoardDef, Rarity, SaveData } from "../types";
import { BOARDS } from "../data/boards";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { UnlockReveal } from "../components/UnlockReveal";
import { sound } from "../audio/SoundEngine";

/** Mini pseudo-3D board preview matching the in-game look. */
function BoardPreview({ color, edge, text }: { color: string; edge: string; text: string }) {
  const id = `bp-${color.replace("#", "")}-${edge.replace("#", "")}`;
  return (
    <svg viewBox="0 0 120 56" className="h-14 w-full">
      <defs>
        <radialGradient id={id} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor={edge} stopOpacity="0.5" />
          <stop offset="100%" stopColor={edge} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="60" cy="40" rx="52" ry="14" fill={`url(#${id})`} />
      <ellipse cx="60" cy="32" rx="44" ry="12" fill={color} stroke={edge} strokeWidth="2" />
      <text x="60" y="33" textAnchor="middle" dominantBaseline="middle" fontSize="10" fontWeight="800" fill="#fff">
        {text}
      </text>
    </svg>
  );
}

const TIERS: Rarity[] = ["common", "rare", "epic", "legendary", "kingdom"];

export function BoardStoreScreen({
  save,
  onBuy,
  onEquip,
  onBack,
}: {
  save: SaveData;
  onBuy: (id: string, cost: number) => void;
  onEquip: (id: string) => void;
  onBack: () => void;
}) {
  const ownedCount = save.ownedBoards.length;
  const [reveal, setReveal] = useState<BoardDef | null>(null);

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      {reveal && <UnlockReveal board={reveal} onDone={() => setReveal(null)} />}
      <div className="mb-2 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">BOARD COLLECTION</h2>
        <div className="w-16" />
      </div>

      <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2">
        <p className="text-sm font-bold text-white/80">
          📚 Collected{" "}
          <span className="text-gold-300">
            {ownedCount}/{BOARDS.length}
          </span>
        </p>
        <p className="text-sm font-bold text-gold-300">
          💰 {save.totalCoins.toLocaleString()}
        </p>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto pb-4">
        {TIERS.map((tier) => {
          const boards = BOARDS.filter((b) => b.rarity === tier);
          if (!boards.length) return null;
          const meta = RARITY[tier];
          return (
            <div key={tier}>
              <div className="mb-2 flex items-center gap-2">
                <span
                  className="rounded-md px-2 py-0.5 text-xs font-black uppercase tracking-wider"
                  style={{ background: meta.color, color: "#1a1020" }}
                >
                  {meta.label}
                </span>
                <span className="h-px flex-1" style={{ background: `${meta.color}55` }} />
              </div>

              <div className="space-y-2">
                {boards.map((b, i) => {
                  const owned = save.ownedBoards.includes(b.id);
                  const equipped = save.equippedBoard === b.id;
                  const canAfford = save.totalCoins >= b.cost;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-2xl border-2 p-3"
                      style={{
                        borderColor: equipped ? meta.color : `${meta.color}66`,
                        background: equipped ? `${meta.color}1f` : "rgba(255,255,255,0.04)",
                        boxShadow: equipped ? `0 0 18px ${meta.glow}` : "none",
                      }}
                    >
                      <div className="w-24 shrink-0">
                        <BoardPreview color={b.color} edge={b.edge} text={b.text} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">
                          {b.emblem} {b.name}
                        </p>
                        <p className="line-clamp-2 text-[11px] italic text-white/55">
                          "{b.lore}"
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-gold-300">
                          {b.cost === 0 ? "FREE" : `💰 ${b.cost.toLocaleString()}`}
                        </p>
                      </div>
                      <div className="shrink-0">
                        {equipped ? (
                          <span
                            className="rounded-xl px-3 py-2 text-xs font-extrabold text-night"
                            style={{ background: meta.color }}
                          >
                            ✓ RIDING
                          </span>
                        ) : owned ? (
                          <button
                            onClick={() => {
                              sound.unlock();
                              sound.play("click");
                              onEquip(b.id);
                            }}
                            className="rounded-xl bg-emerald-500/80 px-3 py-2 text-xs font-extrabold text-white"
                          >
                            EQUIP
                          </button>
                        ) : (
                          <button
                            disabled={!canAfford}
                            onClick={() => {
                              if (!canAfford) return;
                              sound.unlock();
                              onBuy(b.id, b.cost);
                              setReveal(b);
                            }}
                            className={`rounded-xl px-3 py-2 text-xs font-extrabold ${
                              canAfford ? "bg-violet-500 text-white" : "bg-white/10 text-white/40"
                            }`}
                          >
                            {canAfford ? "BUY" : "🔒"}
                          </button>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
