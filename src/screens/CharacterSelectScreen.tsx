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
  const selected = CHARACTERS.find((ch) => ch.id === save.selectedCharacter) ?? CHARACTERS[0];
  const selectedRarity = RARITY[selected.rarity];

  return (
    <div className="safe-top safe-bottom relative flex h-full flex-col overflow-hidden bg-[radial-gradient(circle_at_50%_12%,rgba(255,211,92,0.34),transparent_24%),linear-gradient(145deg,#051228_0%,#122f73_42%,#2a1465_100%)] px-4 py-4 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-55 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:26px_26px]" />
      <div className="pointer-events-none absolute -left-24 top-16 h-64 w-64 rounded-full bg-sky-400/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-20 h-72 w-72 rounded-full bg-gold-400/20 blur-3xl" />

      <div className="relative z-10 mb-2 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-[0.42em] text-gold-300/80">
            Select your runner
          </p>
          <h2 className="font-display text-2xl text-gold-300 drop-shadow-[0_0_18px_rgba(255,211,92,0.55)]">
            CHOOSE YOUR HERO
          </h2>
        </div>
        <div className="w-16" />
      </div>

      <motion.div
        data-testid="hero-stage-card"
        key={selected.id}
        initial={{ y: 18, opacity: 0, scale: 0.96 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 180, damping: 19 }}
        className="relative z-10 mx-auto flex min-h-0 w-full max-w-sm flex-1 flex-col overflow-hidden rounded-[2rem] border-2 border-white/22 bg-white/14 p-4 text-center shadow-[0_28px_80px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-xl"
        style={{
          borderColor: `${selectedRarity.color}cc`,
          boxShadow: `0 26px 75px rgba(0,0,0,0.42), 0 0 56px ${selectedRarity.glow}`,
        }}
      >
        <div
          className="absolute inset-x-8 top-4 h-44 rounded-full blur-2xl"
          style={{ background: `${selectedRarity.color}44` }}
        />
        <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-b from-white/16 via-transparent to-black/20" />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
          <motion.span
            className="mb-1 rounded-full px-4 py-1 text-[11px] font-black uppercase tracking-[0.22em] text-night shadow-lg"
            style={{ background: selectedRarity.color }}
            animate={{
              boxShadow: [
                `0 0 12px ${selectedRarity.glow}`,
                `0 0 24px ${selectedRarity.glow}`,
                `0 0 12px ${selectedRarity.glow}`,
              ],
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          >
            {selectedRarity.label}
          </motion.span>

          <div className="relative mt-1 flex h-48 w-full items-center justify-center sm:h-60">
            <div
              className="absolute bottom-2 h-24 w-56 rounded-full blur-2xl"
              style={{ background: `${selected.colors.secondary}40` }}
            />
            <div className="absolute bottom-3 h-7 w-44 rounded-full bg-black/35 blur-md" />
            <CharacterAvatar
              ch={selected}
              pose="victory"
              className="relative z-10 h-52 w-auto drop-shadow-[0_24px_28px_rgba(0,0,0,0.48)] sm:h-60"
            />
          </div>

          <h3 className="font-display text-4xl leading-none text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]">
            {selected.name}
          </h3>
          <p className="mt-1 text-sm font-black uppercase tracking-[0.22em]" style={{ color: selected.colors.secondary }}>
            {selected.tagline}
          </p>
          <p className="mt-2 max-w-[19rem] text-[15px] font-bold leading-snug text-white/88">
            {selected.bio}
          </p>

          <div className="mt-3 grid w-full gap-2.5 text-left">
            <InfoPill icon="✨" title={selected.ability} body={selected.abilityDesc} />
            <InfoPill icon="📖" title={selected.favoriteScripture} body={selected.voiceLine} />
            <InfoPill icon="🛹" title="Equipped Board" body={selected.clothingText} />
          </div>
        </div>
      </motion.div>

      <div className="relative z-10 mx-auto mt-3 flex w-full max-w-md gap-2.5 overflow-x-auto px-1 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1 [-webkit-overflow-scrolling:touch]">
        {CHARACTERS.map((ch) => {
          const active = ch.id === selected.id;
          const rarity = RARITY[ch.rarity];
          return (
            <motion.button
              key={ch.id}
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => {
                sound.unlock();
                sound.play("characterSelect");
                onSelect(ch.id);
              }}
              className="relative min-w-[5.15rem] rounded-2xl border p-2 text-center backdrop-blur-md transition"
              style={{
                borderColor: active ? rarity.color : "rgba(255,255,255,0.16)",
                borderWidth: active ? 2 : 1,
                background: active
                  ? `linear-gradient(180deg, ${rarity.color}34, rgba(255,255,255,0.10))`
                  : "rgba(255,255,255,0.08)",
                boxShadow: active ? `0 0 0 2px rgba(255,255,255,0.12), 0 0 28px ${rarity.glow}` : "none",
              }}
            >
              {active && (
                <motion.span
                  className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-gold-400 text-sm font-black text-night shadow-[0_0_18px_rgba(255,211,92,0.85)]"
                  animate={{ scale: [1, 1.12, 1] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                >
                  ✓
                </motion.span>
              )}
              <CharacterAvatar ch={ch} animate={false} className="mx-auto h-16 w-auto drop-shadow-lg" />
              <p className="mt-1 truncate text-xs font-black text-white">{ch.name}</p>
            </motion.button>
          );
        })}
      </div>

      <Button onClick={onPlay} shine className="relative z-10 mx-auto w-full max-w-xs py-4 text-lg shadow-[0_14px_34px_rgba(245,184,46,0.34)]">
        ▶ RUN IN THE LIGHT
      </Button>
    </div>
  );
}

function InfoPill({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-white/16 bg-white/16 px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/16 text-base">{icon}</span>
        <div className="min-w-0">
          <p className="text-[13px] font-black uppercase leading-tight tracking-[0.12em] text-white">{title}</p>
          <p className="mt-0.5 text-[13px] font-semibold leading-snug text-white/78">{body}</p>
        </div>
      </div>
    </div>
  );
}
