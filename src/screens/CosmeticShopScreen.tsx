import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SaveData } from "../types";
import { SHOES, RARITY_COLORS as SHOE_RARITY_COLORS, RARITY_LABELS } from "../data/shoes";
import { BOARDS } from "../data/boards";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { HolographicSkateboard } from "../components/HolographicSkateboard";
import { sound } from "../audio/SoundEngine";
import { trackCosmeticBrowse } from "../services/AnalyticsService";

type ShopTab = "shoes" | "boards";

/**
 * Phase 16.5 §3 — Unified cosmetics storefront.
 *
 * Browses every shoe and board in one place, distinguishing free (coin)
 * cosmetics from premium (real-money) ones. Existing ShoesScreen /
 * BoardStoreScreen stay in place as the dedicated per-category views
 * reachable from the Start menu; this shop is the cross-category showcase
 * for premium items (deep-linkable from a "Shop" banner, missions, etc.).
 */
export function CosmeticShopScreen({
  save,
  onBuyCoins,
  onPurchasePremium,
  onEquip,
  onBack,
}: {
  save: SaveData;
  onBuyCoins: (id: string, cost: number, type: ShopTab) => void;
  onPurchasePremium: (id: string, type: ShopTab) => Promise<boolean>;
  onEquip: (id: string, type: ShopTab) => void;
  onBack: () => void;
}) {
  const [tab, setTab] = useState<ShopTab>("shoes");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const shoeList = useMemo(() => [...SHOES].sort((a, b) => a.cost - b.cost), []);
  const boardList = useMemo(
    () => [...BOARDS].filter((b) => b.isPremium).sort((a, b) => a.cost - b.cost),
    []
  );

  const list = tab === "shoes" ? shoeList : boardList;
  const selected = list.find((c) => c.id === selectedId) ?? null;
  const selectedOwned =
    selected &&
    (tab === "shoes"
      ? (save.ownedShoes ?? []).includes(selected.id)
      : save.ownedBoards.includes(selected.id));

  const select = (id: string) => {
    setSelectedId(id);
    trackCosmeticBrowse(id, tab === "shoes" ? "shoe" : "board");
    sound.play("click");
  };

  const handlePurchase = async () => {
    if (!selected) return;
    setPurchasing(true);
    const ok = selected.isPremium
      ? await onPurchasePremium(selected.id, tab)
      : (onBuyCoins(selected.id, selected.cost, tab), true);
    setPurchasing(false);
    if (ok) setSelectedId(null);
  };

  return (
    <div className="safe-top safe-bottom relative flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6 text-white">
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-48"
        style={{
          background: "radial-gradient(60% 55% at 50% 0%, rgba(251,191,36,0.14), transparent 70%)",
        }}
      />

      <div className="relative mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">COSMETICS SHOP</h2>
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-extrabold text-gold-300">
          💰 {save.totalCoins.toLocaleString()}
        </span>
      </div>

      {/* Tab Bar */}
      <div className="relative mb-4 flex gap-2">
        {(["shoes", "boards"] as ShopTab[]).map((t) => (
          <button
            key={t}
            onClick={() => {
              setTab(t);
              setSelectedId(null);
              sound.play("click");
            }}
            className={`flex-1 rounded-xl py-2 text-sm font-extrabold transition-all ${
              tab === t ? "bg-gold-400 text-night shadow-lg" : "bg-white/10 text-white/60"
            }`}
          >
            {t === "shoes" ? "👟 Shoes" : "🛹 Beast Boards"}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="relative flex-1 overflow-y-auto pb-4">
        <div className="grid grid-cols-2 gap-3">
          {list.map((cosmetic, i) => {
            const owned =
              tab === "shoes"
                ? (save.ownedShoes ?? []).includes(cosmetic.id)
                : save.ownedBoards.includes(cosmetic.id);
            const rarityColor =
              tab === "shoes"
                ? SHOE_RARITY_COLORS[cosmetic.rarity]
                : RARITY[cosmetic.rarity].color;

            return (
              <motion.div
                key={cosmetic.id}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => select(cosmetic.id)}
                className="cursor-pointer rounded-2xl border-2 p-3 backdrop-blur-md transition-all"
                style={{
                  borderColor: owned ? `${rarityColor}88` : `${cosmetic.color}44`,
                  background: owned ? `${rarityColor}14` : "rgba(255,255,255,0.05)",
                }}
              >
                <div
                  className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-xl text-4xl"
                  style={{ background: `linear-gradient(145deg, ${cosmetic.color}55, ${cosmetic.color}22)` }}
                >
                  {tab === "boards" && "trail" in cosmetic ? (
                    <HolographicSkateboard
                      color={cosmetic.color}
                      edge={cosmetic.edge}
                      trail={cosmetic.trail}
                      rarity={cosmetic.rarity}
                      text={cosmetic.text}
                      showText={false}
                      className="h-full w-full"
                    />
                  ) : (
                    cosmetic.emblem
                  )}
                </div>
                <p className="truncate text-xs font-extrabold text-white">{cosmetic.name}</p>
                {tab === "shoes" && (
                  <p
                    className="mt-0.5 text-[9px] font-black uppercase tracking-wider"
                    style={{ color: rarityColor }}
                  >
                    {RARITY_LABELS[cosmetic.rarity]}
                  </p>
                )}
                <div className="mt-1.5">
                  {owned ? (
                    <span className="text-[11px] font-bold text-emerald-300">✓ Owned</span>
                  ) : cosmetic.isPremium ? (
                    <span className="text-[11px] font-bold text-gold-300">
                      💳 ${(cosmetic.cost / 100).toFixed(2)}
                    </span>
                  ) : cosmetic.cost === 0 ? (
                    <span className="text-[11px] font-bold text-emerald-300">⭐ Free</span>
                  ) : (
                    <span className="text-[11px] font-bold text-white/70">
                      💰 {cosmetic.cost.toLocaleString()}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Detail / Purchase Panel */}
      <AnimatePresence>
        {selected && (
          <motion.div
            key="detail"
            initial={{ y: 320, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 26, stiffness: 260 }}
            className="absolute bottom-0 left-0 right-0 rounded-t-3xl border-t border-white/15 bg-gradient-to-t from-[#0d0820] to-[#1a1040] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-4xl"
                style={{ background: `linear-gradient(145deg, ${selected.color}55, ${selected.color}22)` }}
              >
                {tab === "boards" && "trail" in selected ? (
                  <HolographicSkateboard
                    color={selected.color}
                    edge={selected.edge}
                    trail={selected.trail}
                    rarity={selected.rarity}
                    text={selected.text}
                    showText={false}
                    className="h-full w-full"
                  />
                ) : (
                  selected.emblem
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-white">{selected.name}</p>
                {"scripture" in selected && selected.scripture && (
                  <p className="text-[11px] font-bold text-white/45">{selected.scripture}</p>
                )}
                <p className="mt-0.5 text-xs italic leading-snug text-white/60">
                  {"mood" in selected ? selected.mood : selected.desc}
                </p>
              </div>
              <button
                onClick={() => setSelectedId(null)}
                className="shrink-0 text-white/40 hover:text-white/70"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {selectedOwned ? (
              <button
                onClick={() => {
                  onEquip(selected.id, tab);
                  setSelectedId(null);
                }}
                className="mt-4 w-full rounded-xl bg-violet-500 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/20 active:scale-95"
              >
                Equip
              </button>
            ) : (
              <button
                onClick={handlePurchase}
                disabled={purchasing || (!selected.isPremium && save.totalCoins < selected.cost)}
                className="mt-4 w-full rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 py-3 text-sm font-extrabold text-night shadow-lg shadow-gold-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {purchasing
                  ? "Processing…"
                  : selected.isPremium
                    ? `Buy Now · $${(selected.cost / 100).toFixed(2)}`
                    : selected.cost === 0
                      ? "Unlock Free"
                      : `Buy Now · 💰 ${selected.cost.toLocaleString()}`}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
