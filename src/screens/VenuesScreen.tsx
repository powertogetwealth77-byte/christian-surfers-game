import { motion } from "framer-motion";
import { KINGDOM_SCENES } from "../data/kingdomScenes";
import { Button } from "../components/Button";

export function VenuesScreen({ onBack, onPlay }: { onBack: () => void; onPlay: () => void }) {
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
        <p className="text-xs font-black uppercase tracking-[0.28em] text-gold-200/80">
          Kingdom Runways
        </p>
        <p className="mt-1 text-sm text-white/70">
          Choose the coastal world mood for Christian Surfers. These are the new premium
          venues you sent over, staged as collectible level destinations.
        </p>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {KINGDOM_SCENES.map((scene, index) => (
          <motion.div
            key={scene.id}
            initial={{ y: 18, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: index * 0.045 }}
            className="group overflow-hidden rounded-3xl border border-white/15 bg-white/7 shadow-xl shadow-black/25"
          >
            <div
              className="relative h-40 bg-cover bg-center sm:h-52"
              style={{ backgroundImage: `url(${scene.image})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-[#040816] via-[#040816]/18 to-transparent" />
              <div className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold-200 backdrop-blur-sm">
                Venue {index + 1}
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
            <div className="flex items-center justify-between gap-3 px-3 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/45">
                Premium coastal kingdom path
              </p>
              <button
                onClick={onPlay}
                className="shrink-0 rounded-xl bg-gold-400 px-4 py-2 text-xs font-black text-night shadow-lg shadow-gold-400/20 transition-transform active:scale-95"
              >
                PLAY HERE
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
