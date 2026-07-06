import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SaveData } from "../types";
import {
  type FamilyData,
  type FamilyProfile,
  PROFILE_AVATARS,
  childProfiles,
  activeProfile,
} from "../data/family";
import { planFeatures } from "../data/plan";
import {
  totalScripturesHeard,
  totalScripturesMastered,
  mostHeardVerse,
  favoriteVerse,
  memoryAccuracy,
  mostUsedCharacter,
  totalFriendshipLevels,
  formatPlayTime,
  kingdomGrowthScore,
  growthTier,
} from "../data/growth";
import { generateWeeklyReport } from "../data/report";
import { getCharacter } from "../data/characters";
import { getBoard } from "../data/boards";
import { getShoe } from "../data/shoes";
import { CharacterAvatar } from "../components/CharacterAvatar";
// ── Mini helpers ─────────────────────────────────────────────────────────────

function GlassCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md ${className}`}
    >
      {children}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">
      {children}
    </p>
  );
}

/** Large metric card with optional progress bar. */
function MetricCard({
  icon,
  label,
  value,
  sub,
  progress,
  accent = "#fbbf24",
}: {
  icon: string;
  label: string;
  value: string;
  sub?: string;
  progress?: number; // 0..1
  accent?: string;
}) {
  return (
    <GlassCard className="flex flex-col px-3.5 py-3">
      <span className="mb-1 text-xl leading-none">{icon}</span>
      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
        {label}
      </p>
      <p className="mt-0.5 truncate text-xl font-extrabold leading-tight text-white">
        {value}
      </p>
      {sub && (
        <p className="mt-0.5 truncate text-[10px] text-white/40">{sub}</p>
      )}
      {progress !== undefined && (
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/30">
          <motion.div
            className="h-full rounded-full"
            style={{ background: accent }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(1, progress) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      )}
    </GlassCard>
  );
}

/** Circular progress ring (SVG). */
function RingScore({ score }: { score: number }) {
  const max = 2000;
  const pct = Math.min(1, score / max);
  const R = 52;
  const circ = 2 * Math.PI * R;
  const dash = pct * circ;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={120} height={120} className="-rotate-90">
        <circle
          cx={60}
          cy={60}
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={10}
        />
        <motion.circle
          cx={60}
          cy={60}
          r={R}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#f59e0b" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute flex flex-col items-center">
        <p className="font-display text-2xl leading-none text-gold-300">
          {score.toLocaleString()}
        </p>
        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/60">
          growth score
        </p>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ParentDashboardScreen({
  save,
  family,
  onSwitchProfile,
  onAddChild,
  onRemoveChild,
  onBack,
}: {
  save: SaveData;
  family: FamilyData;
  onSwitchProfile: (id: string) => void;
  onAddChild: (name: string, avatar: string) => void;
  onRemoveChild: (id: string) => void;
  onBack: () => void;
}) {
  const features = planFeatures();
  const active = activeProfile(family);
  const kids = childProfiles(family);
  const canAddChild = kids.length < features.maxChildren;

  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAvatar, setNewAvatar] = useState(PROFILE_AVATARS[0]);
  const [activeTab, setActiveTab] = useState<"overview" | "report" | "plan">(
    "overview",
  );

  const heard = totalScripturesHeard(save);
  const mastered = totalScripturesMastered(save);
  const accuracy = Math.round(memoryAccuracy(save) * 100);
  const topVerse = mostHeardVerse(save);
  const favorite = favoriteVerse(save);
  const topChar = mostUsedCharacter(save);
  const currentHero = getCharacter(save.selectedCharacter);
  const favHero = topChar ? getCharacter(topChar.id) : null;
  const equippedBoard = getBoard(save.equippedBoard);
  const equippedShoe = getShoe(save.equippedShoe);
  const score = kingdomGrowthScore(save);
  const tier = growthTier(score);
  const report = generateWeeklyReport(save, active.name);

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-[#0d1230] via-[#12184a] to-[#1e1040] text-white">
      {/* Heaven-light header glow */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 h-56"
        style={{
          background:
            "radial-gradient(65% 60% at 50% 0%, rgba(251,191,36,0.14), transparent 70%)",
        }}
      />

      {/* Header */}
      <div className="relative flex items-center justify-between px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8 text-white/70 active:scale-95"
        >
          ←
        </button>
        <div className="text-center">
          <h2 className="font-display text-2xl leading-none text-gold-300 text-glow-gold">
            PARENT HUB
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/45">
            Scripture Growth Center
          </p>
        </div>
        <div className="h-10 w-10" />
      </div>

      {/* Family profile switcher */}
      <div className="px-4 pb-3">
        <GlassCard className="p-3">
          <SectionLabel>Family</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {family.profiles.map((p) => (
              <ProfileChip
                key={p.id}
                profile={p}
                active={p.id === active.id}
                onSelect={() => onSwitchProfile(p.id)}
                onRemove={
                  p.role === "child" ? () => onRemoveChild(p.id) : undefined
                }
              />
            ))}
            {canAddChild && !adding && (
              <button
                onClick={() => setAdding(true)}
                className="flex h-[38px] items-center gap-1.5 rounded-xl border border-dashed border-white/20 px-3 text-xs font-bold text-white/55 active:scale-95"
              >
                ＋ Add child
              </button>
            )}
          </div>

          <AnimatePresence>
            {adding && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden space-y-2"
              >
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Child's name"
                  maxLength={16}
                  className="w-full rounded-xl border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-gold-400/50"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PROFILE_AVATARS.map((a) => (
                    <button
                      key={a}
                      onClick={() => setNewAvatar(a)}
                      className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg transition-all ${
                        newAvatar === a
                          ? "bg-gold-400/25 ring-2 ring-gold-300"
                          : "bg-white/5"
                      }`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      onAddChild(newName, newAvatar);
                      setNewName("");
                      setNewAvatar(PROFILE_AVATARS[0]);
                      setAdding(false);
                    }}
                    className="flex-1 rounded-xl bg-gradient-to-b from-gold-300 to-gold-600 py-2 text-sm font-extrabold text-night active:scale-95"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setAdding(false)}
                    className="rounded-xl border border-white/15 px-4 py-2 text-sm font-bold text-white/55 active:scale-95"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-2 text-[10px] text-white/35">
            Viewing{" "}
            <span className="font-bold text-white/60">{active.name}</span>'s
            progress. Switching never loses data.
          </p>
        </GlassCard>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1.5 px-4 pb-3">
        {(["overview", "report", "plan"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-xl py-2 text-xs font-extrabold uppercase tracking-wide transition-all ${
              activeTab === tab
                ? "bg-gradient-to-b from-gold-300 to-gold-600 text-night shadow-lg shadow-gold-500/20"
                : "bg-white/6 text-white/55 border border-white/10"
            }`}
          >
            {tab === "overview" ? "📊 Stats" : tab === "report" ? "📅 Report" : "⭐ Plan"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="space-y-4"
            >
              {/* Kingdom Growth Score */}
              <GlassCard className="relative overflow-hidden p-5">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(70% 80% at 50% 0%, rgba(251,191,36,0.12), transparent 65%)",
                  }}
                />
                <div className="relative flex items-center gap-4">
                  <RingScore score={score} />
                  <div className="flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-gold-300/70">
                      Kingdom Growth Score
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-white">
                      {tier}
                    </p>
                    <p className="mt-1.5 text-xs text-white/50">
                      {heard} scriptures heard · {mastered} mastered
                    </p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-white/55">
                      <span>
                        🔥{" "}
                        <span className="font-bold text-white/80">
                          {save.scriptureStreakDays ?? 0}d
                        </span>{" "}
                        streak
                      </span>
                      <span className="text-white/25">·</span>
                      <span>
                        🎯{" "}
                        <span className="font-bold text-white/80">
                          {accuracy}%
                        </span>{" "}
                        accuracy
                      </span>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Scripture stats */}
              <div>
                <SectionLabel>Scripture Journey</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricCard
                    icon="📖"
                    label="Scriptures Heard"
                    value={heard.toLocaleString()}
                  />
                  <MetricCard
                    icon="👑"
                    label="Fully Mastered"
                    value={mastered.toLocaleString()}
                    progress={mastered / 35}
                    accent="#fbbf24"
                  />
                  <MetricCard
                    icon="🔥"
                    label="Memory Streak"
                    value={`${save.scriptureStreakDays ?? 0} days`}
                    sub={`Best: ${save.scriptureStreakBest ?? 0}d`}
                  />
                  <MetricCard
                    icon="🎯"
                    label="Accuracy"
                    value={`${accuracy}%`}
                    progress={accuracy / 100}
                    accent="#34d399"
                  />
                  <MetricCard
                    icon="⭐"
                    label="Favorite Verse"
                    value={favorite ?? "—"}
                  />
                  <MetricCard
                    icon="🔁"
                    label="Most Heard"
                    value={topVerse?.ref ?? "—"}
                    sub={topVerse ? `${topVerse.count}×` : undefined}
                  />
                </div>
              </div>

              {/* Game stats */}
              <div>
                <SectionLabel>Game Activity</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricCard
                    icon="🏃"
                    label="Fav. Character"
                    value={topChar?.name ?? "—"}
                    sub={topChar ? `${topChar.runs} runs` : undefined}
                  />
                  <MetricCard
                    icon="💛"
                    label="Friendship Lvls"
                    value={totalFriendshipLevels(save).toLocaleString()}
                  />
                  <MetricCard
                    icon="⏱"
                    label="Play Time"
                    value={formatPlayTime(save.lifetime.playSeconds ?? 0)}
                  />
                  <MetricCard
                    icon="🏁"
                    label="Total Runs"
                    value={(save.lifetime.runs ?? 0).toLocaleString()}
                  />
                </div>
              </div>

              {/* Hero Identity (Phase 16.3 §6) */}
              <div>
                <SectionLabel>Hero Identity</SectionLabel>
                <GlassCard className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="relative flex h-14 w-14 flex-none items-end justify-center overflow-hidden rounded-2xl"
                      style={{
                        background: `radial-gradient(70% 70% at 50% 35%, ${currentHero.colors.secondary}33, transparent 75%)`,
                        border: `1px solid ${currentHero.colors.secondary}44`,
                      }}
                    >
                      <CharacterAvatar
                        ch={currentHero}
                        animate={false}
                        className="h-14 w-auto object-contain"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                        Current Hero
                      </p>
                      <p
                        className="truncate text-lg font-extrabold"
                        style={{ color: currentHero.colors.secondary }}
                      >
                        {currentHero.name}
                      </p>
                      <p className="truncate text-[11px] text-white/50">
                        {currentHero.theme}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="rounded-xl bg-white/5 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-white/40">
                        Ability
                      </p>
                      <p className="truncate font-bold text-white/80">
                        ✨ {currentHero.ability}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-white/40">
                        Most-Used Hero
                      </p>
                      <p className="truncate font-bold text-white/80">
                        🏃 {favHero?.name ?? "—"}
                        {topChar ? (
                          <span className="text-white/40"> · {topChar.runs} runs</span>
                        ) : null}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-white/40">
                        Board
                      </p>
                      <p className="truncate font-bold text-white/80">
                        🛹 {currentHero.boardName ?? equippedBoard.name}
                      </p>
                    </div>
                    <div className="rounded-xl bg-white/5 px-2.5 py-2">
                      <p className="text-[9px] uppercase tracking-wide text-white/40">
                        Shoes
                      </p>
                      <p className="truncate font-bold text-white/80">
                        👟 {currentHero.shoeName ?? equippedShoe.name}
                      </p>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Finish Line victories (Phase 16) */}
              <div>
                <SectionLabel>⚔️ Finish Line — Defeated the Accuser</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricCard
                    icon="✝️"
                    label="Victories"
                    value={(save.finishVictories ?? 0).toLocaleString()}
                    sub="Word defeats Accuser"
                    accent="#fbbf24"
                  />
                  <MetricCard
                    icon="📖"
                    label="Scripture Tier"
                    value={`Tier ${save.finishScriptureTier ?? 1}`}
                    sub={["Starter","Courage","Faith","Protection","Identity"][(save.finishScriptureTier ?? 1) - 1]}
                    accent="#a78bfa"
                  />
                  <MetricCard
                    icon="🎯"
                    label="Accuracy"
                    value={(() => {
                      // Codex review fix (PR #3, P2) — finishVictories only
                      // counts correct answers, so it understated total
                      // attempts and could show a misleading 100% even after
                      // failures. finishAttempts counts every answer; saves
                      // from before this field existed fall back to
                      // finishVictories (the best available approximation).
                      const attempts = save.finishAttempts || save.finishVictories || 0;
                      return attempts > 0
                        ? `${Math.round(((save.finishCorrectAnswers ?? 0) / attempts) * 100)}%`
                        : "—";
                    })()}
                    accent="#34d399"
                  />
                  <MetricCard
                    icon="🔥"
                    label="Best Streak"
                    value={`${save.finishLongestStreak ?? 0} wins`}
                    sub={`Current: ${save.finishVictoryStreak ?? 0}`}
                    accent="#fb923c"
                  />
                </div>
              </div>

              <p className="text-center text-[10px] leading-relaxed text-white/25">
                All data stays on this device. Christian Surfers is free —
                these tools help you walk alongside your child's scripture
                journey.
              </p>
            </motion.div>
          )}

          {activeTab === "report" && features.weeklyReports && (
            <motion.div
              key="report"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              <GlassCard className="p-4">
                <p className="mb-3 flex items-center gap-2 text-sm font-extrabold text-white">
                  📅 Weekly Scripture Report
                </p>
                <div className="space-y-2.5">
                  {report.lines.map((line, i) => (
                    <motion.div
                      key={i}
                      initial={{ x: -8, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: i * 0.07 }}
                      className="flex items-start gap-2.5 rounded-xl border border-white/8 bg-white/4 px-3 py-2.5"
                    >
                      <span className="mt-0.5 text-sm text-gold-300">✦</span>
                      <p className="text-[13px] leading-snug text-white/75">
                        {line}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </GlassCard>

              {/* Finish Line Victories */}
              {(save.finishVictories ?? 0) > 0 && (
                <GlassCard className="p-4">
                  <p className="mb-2 text-sm font-extrabold text-yellow-300">
                    ⚔️ Defeated the Accuser with Scripture
                  </p>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-xl bg-white/5 p-2">
                      <p className="text-lg font-extrabold text-white">{save.finishVictories ?? 0}</p>
                      <p className="text-[9px] text-white/45">Victories</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-2">
                      <p className="text-lg font-extrabold text-white">Tier {save.finishScriptureTier ?? 1}</p>
                      <p className="text-[9px] text-white/45">Scripture Tier</p>
                    </div>
                    <div className="rounded-xl bg-white/5 p-2">
                      <p className="text-lg font-extrabold text-white">{save.finishVictoryStreak ?? 0}🔥</p>
                      <p className="text-[9px] text-white/45">Streak</p>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-white/45 text-center">
                    "{["Starter","Courage","Faith","Protection","Identity"][(save.finishScriptureTier ?? 1) - 1]} Scriptures" unlocked
                  </p>
                </GlassCard>
              )}

              {/* Streak calendar hint */}
              <GlassCard className="p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/45">
                  Memory Streak
                </p>
                <div className="flex items-center gap-3">
                  <div className="text-4xl">
                    {(save.scriptureStreakDays ?? 0) >= 7
                      ? "🔥"
                      : (save.scriptureStreakDays ?? 0) >= 3
                      ? "✨"
                      : "🌱"}
                  </div>
                  <div>
                    <p className="text-2xl font-extrabold text-white">
                      {save.scriptureStreakDays ?? 0}{" "}
                      <span className="text-sm font-bold text-white/50">
                        days
                      </span>
                    </p>
                    <p className="text-xs text-white/45">
                      Best ever: {save.scriptureStreakBest ?? 0} days
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/40">
                  Play once a day to keep the streak alive. Every scripture
                  heard during a run counts.
                </p>
              </GlassCard>
            </motion.div>
          )}

          {activeTab === "plan" && (
            <motion.div
              key="plan"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18 }}
              className="space-y-3"
            >
              {/* Current plan banner */}
              <GlassCard className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-white/45">
                      Current Plan
                    </p>
                    <p className="mt-0.5 text-lg font-extrabold text-gold-300">
                      Free Forever 🌟
                    </p>
                  </div>
                  <div className="rounded-xl border border-gold-300/30 bg-gold-400/10 px-3 py-1.5 text-xs font-extrabold text-gold-300">
                    ACTIVE
                  </div>
                </div>
                <p className="mt-2 text-xs text-white/50">
                  You have full access to the Parent Hub, all scripture tools,
                  and up to 5 child profiles — completely free.
                </p>
              </GlassCard>

              {/* Upgrade preview */}
              <div className="relative overflow-hidden rounded-2xl border border-violet-400/30 bg-gradient-to-br from-[#2a1a5a]/60 to-[#1a1040]/60 p-4">
                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(60% 70% at 50% 0%, rgba(139,92,246,0.18), transparent 70%)",
                  }}
                />
                <div className="relative">
                  <div className="mb-1 inline-block rounded-full bg-violet-500/20 px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-widest text-violet-300">
                    Coming Soon
                  </div>
                  <p className="text-base font-extrabold text-white">
                    Family Plan
                  </p>
                  <p className="mt-1 text-xs text-white/55">
                    Advanced family tools to deepen every child's scripture
                    walk.
                  </p>

                  {/* Feature list */}
                  <ul className="mt-3 space-y-1.5">
                    {[
                      "📊 Advanced growth analytics",
                      "📅 Weekly email reports",
                      "🌍 Cloud sync across devices",
                      "🎯 Personalized verse plans",
                      "👨‍👩‍👧 Unlimited child profiles",
                    ].map((f) => (
                      <li
                        key={f}
                        className="flex items-center gap-2 text-xs text-white/65"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Payment method previews */}
                  <div className="mt-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wide text-white/35">
                      Future payment methods
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { icon: "💳", label: "Credit / Debit" },
                        { icon: "🍎", label: "Apple Pay" },
                        { icon: "🅿️", label: "PayPal" },
                        { icon: "💚", label: "Cash App Card" },
                      ].map((pm) => (
                        <div
                          key={pm.label}
                          className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[11px] text-white/50"
                        >
                          <span>{pm.icon}</span>
                          <span className="font-bold">{pm.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled
                    className="mt-4 w-full cursor-not-allowed rounded-xl border border-violet-400/30 bg-violet-500/10 py-3 text-sm font-extrabold text-violet-300/60"
                  >
                    Upgrade Preview — Available Soon
                  </button>
                </div>
              </div>

              <p className="text-center text-[10px] leading-relaxed text-white/25">
                No payment info is collected today. Your child's scripture
                growth is the priority — always.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ProfileChip({
  profile,
  active,
  onSelect,
  onRemove,
}: {
  profile: FamilyProfile;
  active: boolean;
  onSelect: () => void;
  onRemove?: () => void;
}) {
  return (
    <div
      className={`flex h-[38px] items-center gap-2 rounded-xl border px-3 transition-all ${
        active
          ? "border-gold-300/60 bg-gold-400/15 shadow-sm shadow-gold-400/10"
          : "border-white/10 bg-white/5"
      }`}
    >
      <button
        onClick={onSelect}
        className="flex items-center gap-1.5 active:scale-95"
      >
        <span className="text-base leading-none">{profile.avatar}</span>
        <span className="text-xs font-bold text-white">{profile.name}</span>
        {profile.role === "parent" && (
          <span className="text-[9px] font-bold uppercase text-gold-300/60">
            you
          </span>
        )}
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          className="text-xs text-white/35 active:text-rose-300"
          aria-label="Remove child"
        >
          ✕
        </button>
      )}
    </div>
  );
}
