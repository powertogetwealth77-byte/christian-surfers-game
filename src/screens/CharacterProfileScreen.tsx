import { motion } from "framer-motion";
import type { SaveData } from "../types";
import { getCharacter } from "../data/characters";
import { RARITY } from "../data/rarity";
import { Button } from "../components/Button";
import {
  CHARACTER_ACHIEVEMENTS,
  friendshipLevel,
  friendshipLevelName,
  friendshipProgress,
  friendshipXpForLevel,
} from "../data/friendship";

interface Props {
  save: SaveData;
  characterId: string;
  onBack: () => void;
  onUnlock: (id: string, cost: number) => void;
  onSelect: (id: string) => void;
}

export function CharacterProfileScreen({
  save,
  characterId,
  onBack,
  onUnlock,
  onSelect,
}: Props) {
  const ch = getCharacter(characterId);
  const rm = RARITY[ch.rarity];

  const owned =
    ch.unlocked || save.ownedCharacters.includes(ch.id);
  const selected = save.selectedCharacter === ch.id;
  const cost = ch.cost ?? 0;
  const affordable = save.totalCoins >= cost;

  const friendship = save.friendship[ch.id] ?? { xp: 0, level: 1, runs: 0 };
  const lvl = friendshipLevel(friendship.xp);
  const levelName = friendshipLevelName(lvl);
  const progress = friendshipProgress(friendship.xp);
  const currentXp = friendship.xp;
  const nextLevelXp = friendshipXpForLevel(lvl + 1);
  const xpToNext = lvl >= 50 ? 0 : nextLevelXp - currentXp;

  const achievements = CHARACTER_ACHIEVEMENTS.filter(
    (a) => a.characterId === ch.id
  );

  return (
    <div
      className="safe-top safe-bottom flex h-full flex-col overflow-hidden"
      style={{
        background: `linear-gradient(180deg, ${ch.colors.primary}33 0%, #0d0d1a 40%, #0d0d1a 100%)`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2
          className="font-display text-xl"
          style={{ color: ch.colors.secondary }}
        >
          {ch.name.toUpperCase()}
        </h2>
        <span className="w-16" />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {/* Hero section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-4 rounded-3xl border-2 p-6 text-center backdrop-blur-md"
          style={{
            borderColor: rm.color,
            background: `${rm.color}15`,
            boxShadow: `0 0 30px ${rm.glow}`,
          }}
        >
          <div className="mb-2 text-6xl">{ch.id === "zion" ? "🏄" : ch.id === "grace" ? "🤍" : ch.id === "judah" ? "🦁" : ch.id === "kai" ? "🌊" : ch.id === "mercy" ? "🌸" : ch.id === "caleb" ? "💪" : ch.id === "selah" ? "🌙" : "☀️"}</div>
          <span
            className="mb-2 inline-block rounded-full px-3 py-0.5 text-xs font-black uppercase tracking-wider shadow-sm shadow-black/30"
            style={{ background: rm.color, color: "#1a1020" }}
          >
            {rm.label}
          </span>
          <h3
            className="font-display text-3xl"
            style={{ color: ch.colors.secondary }}
          >
            {ch.name}
          </h3>
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">
            {ch.tagline}
          </p>
        </motion.div>

        {/* Color accent strip */}
        <div
          className="mb-4 h-1 rounded-full"
          style={{ background: ch.colors.primary }}
        />

        {/* Stats row */}
        <div className="mb-4 grid grid-cols-3 gap-3">
          {[
            { label: "Best Score", value: save.bestScore.toLocaleString() },
            { label: "Friend Lvl", value: `${lvl}` },
            { label: "Runs", value: (friendship.runs).toString() },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-3 text-center shadow-lg shadow-black/20 backdrop-blur-md"
            >
              <p
                className="font-display text-2xl"
                style={{ color: ch.colors.secondary }}
              >
                {s.value}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-white/50">
                {s.label}
              </p>
            </div>
          ))}
        </div>

        {/* Friendship bar */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-bold text-white/90">
              Lvl {lvl} · <span style={{ color: rm.color }}>{levelName}</span>
            </span>
            {lvl < 50 && (
              <span className="text-xs text-white/50">{xpToNext} XP to next</span>
            )}
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-black/30">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="h-3 rounded-full"
              style={{ background: ch.colors.primary }}
            />
          </div>
        </div>

        {/* Bio */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-white/40">
            Story
          </h4>
          <p className="text-sm leading-relaxed text-white/80">{ch.bio}</p>
        </div>

        {/* Favorite Scripture */}
        <div
          className="mb-4 rounded-2xl border p-4"
          style={{ borderColor: "#f5b82e55", background: "#f5b82e0d" }}
        >
          <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-gold-400">
            📖 Favorite Scripture
          </h4>
          <p className="text-sm font-bold text-gold-300">{ch.favoriteScripture}</p>
        </div>

        {/* Voice Line */}
        <div
          className="mb-4 rounded-2xl border p-4"
          style={{ borderColor: "#f5b82e44", background: "#f5b82e08" }}
        >
          <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-gold-400">
            💬 Voice Line
          </h4>
          <p className="text-sm italic text-gold-200">"{ch.voiceLine}"</p>
        </div>

        {/* Signature Power */}
        <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
          <h4 className="mb-1 text-xs font-black uppercase tracking-wider text-white/40">
            ⚡ Signature Power
          </h4>
          <p className="text-sm font-bold" style={{ color: ch.colors.accent }}>
            {ch.signaturePower}
          </p>
        </div>

        {/* Character Achievements */}
        <div className="mb-6">
          <h4 className="mb-3 text-xs font-black uppercase tracking-wider text-white/40">
            🏆 Character Achievements
          </h4>
          <div className="flex flex-col gap-3">
            {achievements.map((ach) => {
              const unlocked = ach.requirement(save, characterId);
              return (
                <div
                  key={ach.id}
                  className="flex items-center gap-3 rounded-2xl p-3 backdrop-blur-md transition-all"
                  style={{
                    background: unlocked ? `${rm.color}22` : "rgba(255,255,255,0.04)",
                    borderWidth: 1,
                    borderStyle: "solid",
                    borderColor: unlocked ? rm.color : "rgba(255,255,255,0.08)",
                  }}
                >
                  <span className="text-2xl">{unlocked ? ach.icon : "🔒"}</span>
                  <div className="flex-1">
                    <p
                      className="text-sm font-bold"
                      style={{ color: unlocked ? rm.color : "rgba(255,255,255,0.4)" }}
                    >
                      {ach.title}
                    </p>
                    <p className="text-[11px] text-white/50">{ach.desc}</p>
                  </div>
                  {unlocked && (
                    <span className="text-xs font-bold" style={{ color: rm.color }}>
                      ✓
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Action button */}
        {owned ? (
          <button
            onClick={() => {
              if (!selected) onSelect(ch.id);
            }}
            className="w-full rounded-2xl py-4 text-lg font-extrabold shadow-lg shadow-black/20 transition-all active:scale-95"
            style={{
              background: selected ? "#f5b82e" : ch.colors.primary,
              color: selected ? "#1a1020" : "#fff",
            }}
          >
            {selected ? "✓ RUNNING" : "SELECT"}
          </button>
        ) : (
          <button
            onClick={() => {
              if (affordable) onUnlock(ch.id, cost);
            }}
            className="w-full rounded-2xl py-4 text-lg font-extrabold shadow-lg shadow-black/20 transition-all active:scale-95"
            style={{
              background: affordable ? "#f5b82e" : "rgba(255,255,255,0.1)",
              color: affordable ? "#1a1020" : "rgba(255,255,255,0.4)",
            }}
          >
            {affordable
              ? `Unlock · 💰 ${cost.toLocaleString()}`
              : `🔒 💰 ${cost.toLocaleString()}`}
          </button>
        )}
      </div>
    </div>
  );
}
