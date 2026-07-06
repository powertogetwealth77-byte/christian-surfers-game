import { useState } from "react";
import { motion } from "framer-motion";
import type { BoardDef, Rarity, SaveData } from "../types";
import { BOARDS } from "../data/boards";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { UnlockReveal } from "../components/UnlockReveal";
import { HolographicSkateboard } from "../components/HolographicSkateboard";
import { sound } from "../audio/SoundEngine";

const TIERS: Rarity[] = ["common", "rare", "epic", "legendary", "kingdom"];

/** Future in-app packs — display only; no real payments are wired yet. */
const FUTURE_PACKS = [
  { icon: "✨", name: "Starter Light Pack", desc: "Coins, a board and a head start" },
  { icon: "🛹", name: "Board Collector Pack", desc: "A bundle of premium decks" },
  { icon: "👑", name: "Kingdom Pass", desc: "Seasonal rewards and exclusives" },
  { icon: "👨‍👩‍👧‍👦", name: "Family Safe Bundle", desc: "Everything for the whole household" },
];

export function BoardStoreScreen({
  save,
  onBuy,
  onPurchasePremium,
  onEquip,
  onBack,
}: {
  save: SaveData;
  onBuy: (id: string, cost: number) => void;
  /** Phase 16.5 — Real-money purchase for isPremium boards (price in cents). */
  onPurchasePremium: (id: string) => Promise<boolean>;
  onEquip: (id: string) => void;
  onBack: () => void;
}) {
  const ownedCount = save.ownedBoards.length;
  const [reveal, setReveal] = useState<BoardDef | null>(null);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

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

      <div className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 shadow-lg shadow-black/20 backdrop-blur-md">
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
                  className="rounded-full px-2 py-0.5 text-xs font-black uppercase tracking-wider shadow-sm shadow-black/30"
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
                  const isPurchasing = purchasingId === b.id;
                  return (
                    <motion.div
                      key={b.id}
                      initial={{ y: 14, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-center gap-3 rounded-2xl border-2 p-3 backdrop-blur-md transition-all"
                      style={{
                        borderColor: equipped ? meta.color : `${meta.color}66`,
                        background: equipped ? `${meta.color}1f` : "rgba(255,255,255,0.04)",
                        boxShadow: equipped ? `0 0 18px ${meta.glow}` : "0 6px 16px rgba(0,0,0,0.2)",
                      }}
                    >
                      <div className="h-20 w-20 shrink-0">
                        <HolographicSkateboard
                          color={b.color}
                          edge={b.edge}
                          trail={b.trail}
                          rarity={b.rarity}
                          text={b.text}
                          className="h-full w-full"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-extrabold">
                          {b.emblem} {b.name}
                        </p>
                        <p className="line-clamp-2 text-[11px] italic text-white/55">
                          "{b.lore}"
                        </p>
                        <p className="mt-0.5 text-xs font-bold text-gold-300">
                          {b.cost === 0
                            ? "FREE"
                            : b.isPremium
                              ? `💳 $${(b.cost / 100).toFixed(2)}`
                              : `💰 ${b.cost.toLocaleString()}`}
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
                            className="rounded-xl bg-emerald-500/80 px-3 py-2 text-xs font-extrabold text-white shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
                          >
                            EQUIP
                          </button>
                        ) : b.isPremium ? (
                          <button
                            disabled={isPurchasing}
                            onClick={async () => {
                              sound.unlock();
                              setPurchasingId(b.id);
                              const ok = await onPurchasePremium(b.id);
                              setPurchasingId(null);
                              if (ok) setReveal(b);
                            }}
                            className="rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 px-3 py-2 text-xs font-extrabold text-night shadow-lg shadow-gold-500/20 transition-all active:scale-95 disabled:opacity-50"
                          >
                            {isPurchasing ? "…" : `💳 $${(b.cost / 100).toFixed(2)}`}
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
                            className={`rounded-xl px-3 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                              canAfford ? "bg-violet-500 text-white shadow-lg shadow-violet-500/20" : "bg-white/10 text-white/40"
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

        {/* Future Packs — Coming Soon (no real payments yet) */}
        <div>
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md bg-white/80 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-night">
              Future Packs
            </span>
            <span className="h-px flex-1 bg-white/20" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FUTURE_PACKS.map((p) => (
              <div
                key={p.name}
                className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-3 shadow-lg shadow-black/20 backdrop-blur-md"
              >
                <span className="absolute right-2 top-2 rounded-full bg-gold-400/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-gold-300">
                  Coming Soon
                </span>
                <p className="text-2xl">{p.icon}</p>
                <p className="mt-1 text-xs font-extrabold leading-tight">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-white/55">{p.desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[10px] italic text-white/35">
            In-app packs arrive in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
