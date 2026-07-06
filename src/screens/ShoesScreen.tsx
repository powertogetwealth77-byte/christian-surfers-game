import { useState } from "react";
import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { SHOES, RARITY_COLORS, RARITY_LABELS } from "../data/shoes";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";

/** Stat pill for a shoe attribute. */
function StatPill({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/5 px-2 py-1">
      <span className="text-sm">{icon}</span>
      <span className="text-[10px] text-white/45">{label}</span>
      <span className="text-[10px] font-extrabold text-white">{value}</span>
    </div>
  );
}

export function ShoesScreen({
  save,
  onBuy,
  onPurchasePremium,
  onEquip,
  onBack,
}: {
  save: SaveData;
  onBuy: (id: string, cost: number) => void;
  /** Phase 16.5 — Real-money purchase for isPremium shoes (price in cents). */
  onPurchasePremium: (id: string) => Promise<boolean>;
  onEquip: (id: string) => void;
  onBack: () => void;
}) {
  const ownedShoes = save.ownedShoes ?? ["gospelSprint"];
  const equipped = save.equippedShoe ?? "gospelSprint";
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-[#0d1230] via-[#12184a] to-[#1e0f40] text-white">
      {/* header glow */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-48"
        style={{
          background:
            "radial-gradient(60% 55% at 50% 0%, rgba(167,139,250,0.18), transparent 70%)",
        }}
      />

      <div className="relative mb-1 flex items-center justify-between px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-center">
          <h2 className="font-display text-2xl leading-none text-violet-300">
            SCRIPTURE SHOES
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
            Gear up for the Kingdom run
          </p>
        </div>
        <div className="flex flex-col items-end">
          <p className="text-[10px] text-white/40">Balance</p>
          <p className="text-sm font-extrabold text-gold-300">
            💰 {save.totalCoins.toLocaleString()}
          </p>
        </div>
      </div>

      <p className="px-4 pb-3 text-center text-xs text-white/45">
        Equipped shoes boost speed, coin streaks, and Spirit of the Lord protection.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto px-4 pb-6">
        {SHOES.map((shoe, i) => {
          const owned = ownedShoes.includes(shoe.id);
          const isEquipped = shoe.id === equipped;
          const canAfford = save.totalCoins >= shoe.cost;
          const rarityColor = RARITY_COLORS[shoe.rarity];
          const isPurchasing = purchasingId === shoe.id;

          return (
            <motion.div
              key={shoe.id}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className="relative overflow-hidden rounded-2xl border p-3.5"
              style={{
                borderColor: isEquipped ? shoe.accent : "rgba(255,255,255,0.1)",
                background: isEquipped
                  ? `${shoe.color}18`
                  : "rgba(255,255,255,0.04)",
                boxShadow: isEquipped
                  ? `0 0 20px ${shoe.accent}40`
                  : undefined,
              }}
            >
              {/* inner glow when equipped */}
              {isEquipped && (
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(60% 60% at 10% 50%, ${shoe.color}28, transparent 65%)`,
                  }}
                />
              )}

              <div className="relative flex items-start gap-3">
                {/* Shoe icon */}
                <div
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-3xl shadow-lg shadow-black/30"
                  style={{
                    background: `linear-gradient(145deg, ${shoe.color}55, ${shoe.color}22)`,
                    border: `1.5px solid ${shoe.accent}40`,
                  }}
                >
                  {shoe.emblem}
                </div>

                <div className="min-w-0 flex-1">
                  {/* Name + rarity */}
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-extrabold text-white">
                      {shoe.name}
                    </p>
                    <span
                      className="shrink-0 rounded-md px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider"
                      style={{
                        color: rarityColor,
                        background: `${rarityColor}20`,
                        border: `1px solid ${rarityColor}40`,
                      }}
                    >
                      {RARITY_LABELS[shoe.rarity]}
                    </span>
                  </div>

                  {/* Scripture reference */}
                  <p className="mt-0.5 text-[10px] font-bold text-white/45">
                    {shoe.scripture}
                  </p>
                  <p className="mt-0.5 text-[11px] italic leading-snug text-white/65 line-clamp-2">
                    "{shoe.desc}"
                  </p>

                  {/* Stat pills */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {shoe.gameplayMods?.speedMult && shoe.gameplayMods.speedMult > 1.0 && (
                      <StatPill
                        icon="⚡"
                        label="Speed"
                        value={`+${Math.round((shoe.gameplayMods.speedMult - 1) * 100)}%`}
                      />
                    )}
                    {shoe.gameplayMods?.coinMagnetRange && shoe.gameplayMods.coinMagnetRange > 1.0 && (
                      <StatPill
                        icon="🔗"
                        label="Magnet"
                        value={`+${Math.round((shoe.gameplayMods.coinMagnetRange - 1) * 100)}%`}
                      />
                    )}
                    {shoe.gameplayMods?.shieldDuration && shoe.gameplayMods.shieldDuration > 1.0 && (
                      <StatPill
                        icon="🛡"
                        label="Shield"
                        value={`+${Math.round((shoe.gameplayMods.shieldDuration - 1) * 100)}%`}
                      />
                    )}
                  </div>
                </div>

                {/* Action */}
                <div className="shrink-0 pt-1">
                  {isEquipped ? (
                    <span
                      className="block rounded-xl px-3 py-2 text-xs font-extrabold text-night"
                      style={{ background: shoe.accent }}
                    >
                      ✓ ON
                    </span>
                  ) : owned ? (
                    <button
                      onClick={() => {
                        sound.play("shoeEquip");
                        onEquip(shoe.id);
                      }}
                      className="block rounded-xl bg-violet-500 px-3 py-2 text-xs font-extrabold text-white shadow-lg shadow-violet-500/20 active:scale-95"
                    >
                      Equip
                    </button>
                  ) : shoe.isPremium ? (
                    <button
                      disabled={isPurchasing}
                      onClick={async () => {
                        sound.unlock();
                        setPurchasingId(shoe.id);
                        await onPurchasePremium(shoe.id);
                        setPurchasingId(null);
                      }}
                      className="block rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 px-3 py-2 text-xs font-extrabold text-night shadow-lg shadow-gold-500/20 active:scale-95 disabled:opacity-50"
                    >
                      {isPurchasing ? "…" : `💳 $${(shoe.cost / 100).toFixed(2)}`}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (canAfford) {
                          sound.play("shoeEquip");
                          onBuy(shoe.id, shoe.cost);
                        }
                      }}
                      disabled={!canAfford}
                      className={`block rounded-xl px-3 py-2 text-xs font-extrabold text-white transition-all active:scale-95 ${
                        canAfford
                          ? "bg-gradient-to-b from-gold-300 to-gold-600 text-night shadow-lg shadow-gold-500/20"
                          : "border border-white/15 bg-white/5 text-white/30"
                      }`}
                    >
                      💰 {shoe.cost.toLocaleString()}
                    </button>
                  )}
                </div>
              </div>

              {/* Design description at bottom */}
              <p className="relative mt-2 line-clamp-1 text-[10px] italic text-white/30">
                {shoe.mood}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
