import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { CHARACTERS } from "../data/characters";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { sound } from "../audio/SoundEngine";

export function CharacterSelectScreen({
  save,
  onSelect,
  onBack,
  onPlay,
}: {
  save: SaveData;
  onSelect: (id: string) => void;
  onBack: () => void;
  onPlay: () => void;
}) {
  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">CHOOSE A RUNNER</h2>
        <div className="w-16" />
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-4">
        {CHARACTERS.map((ch, i) => {
          const selected = save.selectedCharacter === ch.id;
          const rm = RARITY[ch.rarity];
          return (
            <motion.div
              key={ch.id}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.07 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                sound.unlock();
                sound.play("characterSelect");
                onSelect(ch.id);
              }}
              className="relative cursor-pointer rounded-3xl border-2 p-4 text-center transition-colors"
              style={{
                borderColor: selected ? rm.color : `${rm.color}55`,
                background: selected ? `${rm.color}1f` : "rgba(255,255,255,0.05)",
                boxShadow: selected ? `0 0 20px ${rm.glow}` : "none",
              }}
            >
              {/* Rarity badge */}
              <span
                className="absolute left-3 top-3 rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider"
                style={{ background: rm.color, color: "#1a1020" }}
              >
                {rm.label}
              </span>

              <div className="mt-3 flex justify-center">
                <CharacterAvatar ch={ch} pose={selected ? "victory" : "idle"} />
              </div>
              <h3
                className="mt-1 font-display text-xl"
                style={{ color: ch.colors.secondary }}
              >
                {ch.name}
              </h3>
              <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: rm.color }}>
                {ch.tagline}
              </p>
              <p className="mt-1 line-clamp-2 text-[11px] italic text-white/55">{ch.bio}</p>
              <p className="mt-1.5 text-xs font-bold text-gold-300">✨ {ch.ability}</p>
              <p className="text-[11px] text-white/70">{ch.abilityDesc}</p>
              <p className="mt-1 text-[11px] text-white/60">📖 {ch.favoriteScripture}</p>
              <p className="mt-1 text-[11px] italic text-sky-200/80">"{ch.voiceLine}"</p>
              <div
                className={`mt-3 rounded-xl py-1.5 text-sm font-extrabold ${
                  selected ? "bg-gold-400 text-night" : "bg-white/10 text-white/80"
                }`}
              >
                {selected ? "✓ SELECTED" : "SELECT"}
              </div>
            </motion.div>
          );
        })}
      </div>

      <Button onClick={onPlay} shine className="mx-auto w-full max-w-xs py-4 text-xl">
        ▶ RUN IN THE LIGHT
      </Button>
    </div>
  );
}
