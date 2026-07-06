import { motion } from "framer-motion";
import type { SaveData, VenueDef, VenueId } from "../types";
import { VENUES } from "../data/venues";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";

/**
 * Phase 16.8 — real painted-world preview using the venue's actual in-game
 * backdrop photo (object-cover), replacing the code-drawn mini scene. Sells
 * the exact world the player is about to run through, one-for-one with
 * what the live renderer now shows.
 */
function VenueScene({ v }: { v: VenueDef }) {
  if (!v.bgImage) return <div style={{ background: v.skyMid }} className="h-full w-full" />;
  return (
    <div
      className="h-full w-full bg-cover bg-center"
      style={{ backgroundImage: `url(${v.bgImage})`, backgroundPosition: "50% 30%" }}
    />
  );
}

export function VenuesScreen({
  save,
  onSelect,
  onBack,
}: {
  save: SaveData;
  onSelect: (id: VenueId) => void;
  onBack: () => void;
}) {
  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">VENUES</h2>
        <div className="w-16" />
      </div>

      <p className="mb-3 text-center text-xs text-white/55">
        Choose the world your runner journeys through.
      </p>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {VENUES.map((v, i) => {
          const selected = save.selectedVenue === v.id;
          return (
            <motion.div
              key={v.id}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                if (!selected) {
                  sound.play("click");
                  onSelect(v.id);
                }
              }}
              className="cursor-pointer overflow-hidden rounded-2xl border-2 backdrop-blur-md transition-all"
              style={{
                borderColor: selected ? v.roadEdge : "rgba(255,255,255,0.12)",
                boxShadow: selected ? `0 0 22px ${v.roadEdge}66` : "0 6px 16px rgba(0,0,0,0.25)",
              }}
            >
              {/* Scene preview */}
              <div className="relative h-28 w-full">
                <VenueScene v={v} />
                <span className="absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-lg backdrop-blur-sm">
                  {v.emblem}
                </span>
                {selected && (
                  <span
                    className="absolute right-2 top-2 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-night"
                    style={{ background: v.roadEdge }}
                  >
                    ✓ Running Here
                  </span>
                )}
              </div>
              {/* Info bar */}
              <div
                className="flex items-center justify-between gap-3 px-3 py-2.5"
                style={{ background: selected ? `${v.skyMid}40` : "rgba(255,255,255,0.05)" }}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-white">{v.name}</p>
                  <p className="line-clamp-1 text-[11px] text-white/55">{v.desc}</p>
                </div>
                {!selected && (
                  <span className="shrink-0 rounded-xl bg-violet-500 px-3 py-2 text-xs font-extrabold text-white shadow-lg shadow-violet-500/20">
                    Select
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
