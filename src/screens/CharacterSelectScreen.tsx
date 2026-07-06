import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { CHARACTERS } from "../data/characters";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import { CharacterAvatar } from "../components/CharacterAvatar";
import { sound } from "../audio/SoundEngine";
import { friendshipLevel, friendshipLevelName, friendshipProgress } from "../data/friendship";

export function CharacterSelectScreen({
  save,
  onSelect,
  onUnlock,
  onBack,
  onPlay,
  onProfile,
}: {
  save: SaveData;
  onSelect: (id: string) => void;
  onUnlock: (id: string, cost: number) => void;
  onBack: () => void;
  onPlay: () => void;
  onProfile: (id: string) => void;
}) {
  const owns = (id: string, unlocked: boolean) =>
    unlocked || save.ownedCharacters.includes(id);

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">CHOOSE A RUNNER</h2>
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-extrabold text-gold-300">
          💰 {save.totalCoins.toLocaleString()}
        </span>
      </div>

      <div className="grid flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pb-4">
        {CHARACTERS.map((ch, i) => {
          const selected = save.selectedCharacter === ch.id;
          const owned = owns(ch.id, ch.unlocked);
          const cost = ch.cost ?? 0;
          const affordable = save.totalCoins >= cost;
          const comingSoon = !!ch.comingSoon;
          const rm = RARITY[ch.rarity];
          return (
            <motion.div
              key={ch.id}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                if (comingSoon) return;
                sound.unlock();
                if (owned) {
                  sound.play("characterSelect");
                  onSelect(ch.id);
                } else if (affordable) {
                  sound.play("reward");
                  onUnlock(ch.id, cost);
                } else {
                  sound.play("click");
                }
              }}
              className="relative cursor-pointer rounded-3xl border-2 p-4 text-center backdrop-blur-md transition-all"
              style={{
                borderColor: selected ? rm.color : `${rm.color}55`,
                background: selected ? `${rm.color}1f` : "rgba(255,255,255,0.05)",
                boxShadow: selected ? `0 0 24px ${rm.glow}` : "0 8px 20px rgba(0,0,0,0.2)",
              }}
            >
              {/* Rarity badge */}
              <span
                className="absolute left-3 top-3 rounded-full px-2 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-sm shadow-black/30"
                style={{ background: rm.color, color: "#1a1020" }}
              >
                {rm.label}
              </span>
              {comingSoon ? (
                <span
                  className="absolute right-3 top-3 rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider"
                  style={{ background: "#7c3aed", color: "#fff" }}
                >
                  GEN 2
                </span>
              ) : !owned ? (
                <span className="absolute right-3 top-3 text-base" aria-hidden>
                  🔒
                </span>
              ) : null}

              {/* §4 — Premium portrait area: soft color glow behind the hero,
                  fixed height to prevent layout shift, art sits above the text. */}
              <div
                className="relative mt-3 flex h-32 items-end justify-center overflow-hidden rounded-2xl"
                style={{ opacity: owned ? 1 : 0.55, filter: owned ? "none" : "grayscale(0.55)" }}
              >
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `radial-gradient(70% 65% at 50% 38%, ${ch.colors.secondary}33, ${ch.colors.primary}1a 55%, transparent 75%)`,
                  }}
                />
                <CharacterAvatar
                  ch={ch}
                  pose={selected ? "victory" : "idle"}
                  className="relative h-32 w-auto max-w-full object-contain drop-shadow-lg"
                />
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
              {/* Theme + generation identity */}
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1">
                <span
                  className="rounded-full px-2 py-0.5 text-[9px] font-bold"
                  style={{ background: `${ch.colors.secondary}22`, color: ch.colors.secondary }}
                >
                  {ch.theme}
                </span>
                <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-white/55">
                  Gen {ch.generation ?? 1}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-[11px] italic text-white/55">
                {ch.kidDescription ?? ch.bio}
              </p>
              <p className="mt-1.5 text-xs font-bold text-gold-300">✨ {ch.ability}</p>
              <p className="text-[11px] text-white/70">{ch.abilityShort ?? ch.abilityDesc}</p>
              <p className="mt-1 text-[11px] text-white/60">📖 {ch.favoriteScripture}</p>
              {/* Signature board + shoe identity */}
              {(ch.boardName || ch.shoeName) && (
                <div className="mt-1.5 flex flex-col gap-0.5 rounded-xl border border-white/8 bg-black/20 px-2 py-1.5 text-[10px] text-white/65">
                  {ch.boardName && (
                    <span className="truncate">🛹 {ch.boardName}</span>
                  )}
                  {ch.shoeName && (
                    <span className="truncate">👟 {ch.shoeName}</span>
                  )}
                </div>
              )}
              <p className="mt-1 text-[11px] italic text-sky-200/80">"{ch.voiceLine}"</p>
              {/* Friendship mini-bar */}
              {(() => {
                const fr = save.friendship[ch.id] ?? { xp: 0, level: 1, runs: 0 };
                const fl = friendshipLevel(fr.xp);
                const fp = friendshipProgress(fr.xp);
                const flName = friendshipLevelName(fl);
                return (
                  <div className="mt-2 px-0.5">
                    <div className="mb-0.5 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-white/50">
                        💛 Lvl {fl} {flName}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-black/30">
                      <div
                        className="h-1.5 rounded-full transition-all"
                        style={{ width: `${Math.round(fp * 100)}%`, background: ch.colors.primary }}
                      />
                    </div>
                  </div>
                );
              })()}

              {comingSoon ? (
                <div className="mt-2">
                  <div className="flex-1 rounded-xl py-1.5 text-sm font-extrabold bg-white/5 text-white/40 cursor-default">
                    ⏳ Coming Soon
                  </div>
                </div>
              ) : owned ? (
                <div className="mt-2 flex gap-1.5">
                  <div
                    className={`flex-1 rounded-xl py-1.5 text-sm font-extrabold ${
                      selected ? "bg-gold-400 text-night" : "bg-white/10 text-white/80"
                    }`}
                  >
                    {selected ? "✓ SELECTED" : "SELECT"}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onProfile(ch.id); }}
                    className="rounded-xl border border-white/10 bg-white/10 px-2 py-1.5 text-xs font-bold text-white/70 transition-all hover:bg-white/20 active:scale-95"
                  >
                    👤 Profile
                  </button>
                </div>
              ) : (
                <div className="mt-2 flex gap-1.5">
                  <div
                    className={`flex-1 rounded-xl py-1.5 text-sm font-extrabold ${
                      affordable ? "bg-gold-400 text-night" : "bg-white/10 text-white/50"
                    }`}
                  >
                    {affordable ? `Unlock · 💰 ${cost.toLocaleString()}` : `🔒 💰 ${cost.toLocaleString()}`}
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onProfile(ch.id); }}
                    className="rounded-xl border border-white/10 bg-white/10 px-2 py-1.5 text-xs font-bold text-white/70 transition-all hover:bg-white/20 active:scale-95"
                  >
                    👤 Profile
                  </button>
                </div>
              )}
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
