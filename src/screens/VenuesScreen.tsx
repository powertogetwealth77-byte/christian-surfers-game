import { useState } from "react";
import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { KINGDOM_SCENES } from "../data/kingdomScenes";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";

export function VenuesScreen({
  save,
  onBack,
  onPlay,
  onEquip,
  onPurchase,
}: {
  save: SaveData;
  onBack: () => void;
  onPlay: () => void;
  onEquip: (id: string) => void;
  onPurchase: (id: string, cost: number) => boolean;
}) {
  const [notice, setNotice] = useState("Choose a venue for your next run.");

  return (
    <div className="safe-top safe-bottom flex h-full flex-col overflow-hidden bg-gradient-to-b from-night via-[#10265a] to-[#321a4a] px-4 py-6 text-white">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">VENUES</h2>
        <div className="w-16" />
      </div>

      <div className="mb-3 rounded-3xl border border-gold-300/30 bg-black/25 p-4 shadow-2xl shadow-gold-500/10 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-gold-200/80">
              Kingdom Runways
            </p>
            <p className="mt-1 text-sm text-white/70">
              Unlock and equip coastal venues for Christian Surfers gameplay.
            </p>
          </div>
          <div className="shrink-0 rounded-2xl border border-gold-300/30 bg-gold-300/15 px-3 py-2 text-right">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold-100/70">
              Balance
            </p>
            <motion.p
              key={save.totalCoins}
              initial={{ scale: 1.14 }}
              animate={{ scale: 1 }}
              className="font-display text-xl text-gold-300"
            >
              💰 {save.totalCoins.toLocaleString()}
            </motion.p>
          </div>
        </div>
        <p className="mt-3 rounded-2xl border border-white/10 bg-white/8 px-3 py-2 text-xs font-bold text-white/75">
          {notice}
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {KINGDOM_SCENES.map((scene, index) => {
          const owned = save.ownedVenues.includes(scene.id);
          const selected = save.selectedVenue === scene.id;
          const canAfford = save.totalCoins >= scene.cost;
          const rarity = RARITY[scene.rarity];
          return (
            <motion.div
              key={scene.id}
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: index * 0.045 }}
              className="group overflow-hidden rounded-3xl border bg-white/7 shadow-xl shadow-black/25"
              style={{
                borderColor: selected ? rarity.color : owned ? `${rarity.color}88` : "rgba(255,255,255,0.14)",
                boxShadow: selected ? `0 0 28px ${rarity.glow}, 0 18px 34px rgba(0,0,0,0.30)` : undefined,
              }}
            >
              <div
                className="relative h-40 bg-cover bg-center sm:h-52"
                style={{ backgroundImage: `url(${scene.image})` }}
              >
                {!owned && <div className="absolute inset-0 bg-black/32 backdrop-blur-[0.5px]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#040816] via-[#040816]/18 to-transparent" />
                <div
                  className="absolute left-3 top-3 rounded-full border border-white/20 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-night backdrop-blur-sm"
                  style={{ background: rarity.color }}
                >
                  {scene.rarity}
                </div>
                <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white backdrop-blur-sm">
                  {selected ? "✓ Equipped" : owned ? "Owned" : scene.cost === 0 ? "Free" : `💰 ${scene.cost.toLocaleString()}`}
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <h3 className="font-display text-2xl leading-none text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.85)]">
                    {scene.title}
                  </h3>
                  <p className="mt-1 text-xs font-semibold text-white/75 drop-shadow">
                    {scene.subtitle}
                  </p>
                </div>
              </div>
              <div className="space-y-3 px-3 py-3">
                <p className="text-xs text-white/60">{scene.description}</p>
                <div className="flex items-center justify-between gap-3">
                  <p className="min-w-0 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45">
                    {owned ? "Ready for gameplay" : canAfford ? "Available to unlock" : "Run more to earn Light Coins"}
                  </p>
                  {selected ? (
                    <button
                      onClick={() => {
                        sound.play("click");
                        onPlay();
                      }}
                      className="shrink-0 rounded-xl bg-emerald-400 px-4 py-2 text-xs font-black text-night shadow-lg shadow-emerald-400/20 transition-transform active:scale-95"
                    >
                      PLAY HERE
                    </button>
                  ) : owned ? (
                    <button
                      onClick={() => {
                        sound.unlock();
                        sound.play("click");
                        onEquip(scene.id);
                        setNotice(`${scene.title} equipped for your next run.`);
                      }}
                      className="shrink-0 rounded-xl bg-gold-400 px-4 py-2 text-xs font-black text-night shadow-lg shadow-gold-400/20 transition-transform active:scale-95"
                    >
                      EQUIP
                    </button>
                  ) : (
                    <button
                      disabled={!canAfford}
                      onClick={() => {
                        if (!canAfford) {
                          sound.play("click");
                          setNotice(`Need ${(scene.cost - save.totalCoins).toLocaleString()} more Light Coins for ${scene.title}.`);
                          return;
                        }
                        sound.unlock();
                        const purchased = onPurchase(scene.id, scene.cost);
                        setNotice(
                          purchased
                            ? `${scene.title} unlocked and equipped. ${scene.cost.toLocaleString()} Light Coins spent.`
                            : `${scene.title} could not be unlocked. Check your coin balance.`,
                        );
                      }}
                      className={`shrink-0 rounded-xl px-4 py-2 text-xs font-black shadow-lg transition-transform active:scale-95 ${
                        canAfford ? "bg-violet-500 text-white shadow-violet-500/20" : "bg-white/10 text-white/45"
                      }`}
                    >
                      {canAfford ? `UNLOCK · ${scene.cost.toLocaleString()}` : "NEED COINS"}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
