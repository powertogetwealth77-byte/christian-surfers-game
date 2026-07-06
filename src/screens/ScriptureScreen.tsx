import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { SaveData, ScriptureCategory } from "../types";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";
import {
  CHALLENGES,
  MAX_MASTERY,
  masteredCount,
  masteryFraction,
  masteryLevel,
  pickChallenge,
  verseText,
  type ScriptureChallenge,
} from "../data/challenges";
import { SCRIPTURES, CATEGORY_ICONS } from "../data/scriptures";

const REWARD_COINS = 25;
const REWARD_XP = 15;
const FRIENDSHIP_XP = 25;

const ALL_CATEGORIES: ScriptureCategory[] = [
  "identity", "courage", "faith", "protection", "joy", "wisdom", "love", "encouragement",
];

const CATEGORY_LABELS: Record<ScriptureCategory, string> = {
  identity: "Identity",
  courage: "Courage",
  faith: "Faith",
  protection: "Protection",
  joy: "Joy",
  wisdom: "Wisdom",
  love: "Love",
  encouragement: "Encouragement",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Five-pip mastery meter (crowned when full). */
function MasteryPips({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: MAX_MASTERY }).map((_, i) => (
        <span key={i} className={i < level ? "opacity-100" : "opacity-25"}>
          {level >= MAX_MASTERY ? "👑" : "⭐"}
        </span>
      ))}
    </span>
  );
}

export function ScriptureScreen({
  save,
  onAnswer,
  onBack,
  onToggleFavorite,
  favoriteScriptures,
}: {
  save: SaveData;
  /** Grant rewards + bump mastery for a correct answer. Returns nothing. */
  onAnswer: (ref: string, coins: number, xp: number, friendshipXp: number) => void;
  onBack: () => void;
  onToggleFavorite: (ref: string) => void;
  favoriteScriptures: string[];
}) {
  const [challenge, setChallenge] = useState<ScriptureChallenge | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [result, setResult] = useState<"correct" | "wrong" | null>(null);
  const [justMastered, setJustMastered] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<ScriptureCategory | "all">("all");

  const options = useMemo(
    () => (challenge ? shuffle(challenge.options) : []),
    [challenge],
  );

  const fraction = masteryFraction(save);
  const mastered = masteredCount(save);

  const start = () => {
    setChallenge(pickChallenge(save));
    setPicked(null);
    setResult(null);
    setJustMastered(false);
  };

  const choose = (opt: string) => {
    if (!challenge || result) return;
    setPicked(opt);
    if (opt === challenge.answer) {
      setResult("correct");
      const isNowMastered = masteryLevel(save, challenge.ref) + 1 >= MAX_MASTERY;
      setJustMastered(isNowMastered);
      if (isNowMastered) {
        sound.playMasteryFanfare();
      } else {
        sound.play("reward");
      }
      onAnswer(challenge.ref, REWARD_COINS, REWARD_XP, FRIENDSHIP_XP);
    } else {
      setResult("wrong");
      sound.play("click");
    }
  };

  // Stats for the header
  const totalHeard = Object.values(save.scriptureHeard ?? {}).reduce((a, b) => a + b, 0);

  // §6 — Parent stats
  const mostHeardEntry = Object.entries(save.scriptureHeard ?? {}).sort(([, a], [, b]) => b - a)[0];
  const mostHeardRef = mostHeardEntry?.[0] ?? null;
  const mostHeardCount = mostHeardEntry?.[1] ?? 0;
  const favoriteVerse = favoriteScriptures[0] ?? mostHeardRef;
  const streakDays = save.scriptureStreakDays ?? 0;

  // Recently heard (last 7 days)
  const sevenDaysAgo = Date.now() - 7 * 86_400_000;
  const recentlyHeard = Object.entries(save.scriptureLastHeard ?? {})
    .filter(([, iso]) => new Date(iso).getTime() > sevenDaysAgo)
    .map(([ref]) => ref);

  // Filtered challenges list
  const filteredChallenges = categoryFilter === "all"
    ? CHALLENGES
    : CHALLENGES.filter((c) => {
        const s = SCRIPTURES.find((x) => x.ref === c.ref);
        return s?.category === categoryFilter;
      });

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#1a2350] to-[#3a2a05] px-4 py-6">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-300">SCRIPTURE MASTERY</h2>
        <span className="rounded-full bg-black/40 px-3 py-1 text-sm font-extrabold text-gold-300">
          💰 {save.totalCoins.toLocaleString()}
        </span>
      </div>

      {/* Mastery overview */}
      <div className="mb-4 rounded-2xl border border-gold-400/30 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <p className="font-extrabold text-white/90">📖 Verses Mastered</p>
          <p className="font-display text-lg text-gold-300">
            {mastered}/{CHALLENGES.length}
          </p>
        </div>
        <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-black/30">
          <div
            className="h-full rounded-full bg-gradient-to-r from-gold-400 to-emerald-300 transition-all"
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs font-bold text-white/55">
          {Math.round(fraction * 100)}% mastery
        </p>
        {/* §6 — Parent stats row */}
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] font-bold text-white/50">
          <span>📖 {mastered} mastered</span>
          <span>·</span>
          <span>👁 {totalHeard} total heard</span>
          <span>·</span>
          <span>⭐ {favoriteScriptures.length} favorites</span>
          {(save.scriptureBadges ?? 0) > 0 && (
            <><span>·</span><span>🏆 {save.scriptureBadges} badge{save.scriptureBadges !== 1 ? "s" : ""}</span></>
          )}
        </div>
        {mostHeardRef && (
          <div className="mt-1 text-[10px] font-bold text-white/40">
            Most heard: "{mostHeardRef}" ({mostHeardCount}×)
          </div>
        )}
        {favoriteVerse && (
          <div className="mt-0.5 text-[10px] font-bold text-white/40">
            Favorite verse: {favoriteVerse}
          </div>
        )}
        {streakDays > 0 && (
          <div className="mt-0.5 text-[10px] font-bold text-gold-400/70">
            🔥 Memory streak: {streakDays} day{streakDays !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Challenge area */}
      <div className="flex-1 overflow-y-auto pb-4">
        {!challenge ? (
          <>
            <div className="mb-4 rounded-2xl bg-gradient-to-b from-gold-300 to-gold-600 p-0.5">
              <button
                onClick={() => {
                  sound.unlock();
                  start();
                }}
                className="w-full rounded-[14px] bg-night/85 py-5 text-center transition-all active:scale-[0.98]"
              >
                <p className="font-display text-2xl text-gold-300">✨ Start Challenge</p>
                <p className="mt-1 text-sm text-white/70">
                  Hide a word, fill the blank — earn 💰 {REWARD_COINS} + ✨ {REWARD_XP} XP
                </p>
              </button>
            </div>

            {/* Recently Heard section */}
            {recentlyHeard.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-extrabold uppercase tracking-wider text-gold-300/70">
                  🕐 Recently Heard (last 7 days)
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {recentlyHeard.map((ref) => {
                    const verse = SCRIPTURES.find((s) => s.ref === ref);
                    return (
                      <span
                        key={ref}
                        className="rounded-full border border-gold-400/30 bg-gold-400/10 px-2 py-0.5 text-[11px] font-bold text-gold-200"
                      >
                        {verse ? `${CATEGORY_ICONS[verse.category] ?? "✨"} ${ref}` : ref}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Category filter tabs */}
            <div className="mb-3 flex gap-1.5 overflow-x-auto pb-1">
              <button
                onClick={() => setCategoryFilter("all")}
                className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition-all active:scale-95 ${
                  categoryFilter === "all"
                    ? "border-gold-400 bg-gold-400/20 text-gold-200"
                    : "border-white/15 bg-white/5 text-white/60"
                }`}
              >
                All
              </button>
              {ALL_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-extrabold transition-all active:scale-95 ${
                    categoryFilter === cat
                      ? "border-gold-400 bg-gold-400/20 text-gold-200"
                      : "border-white/15 bg-white/5 text-white/60"
                  }`}
                >
                  {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Per-verse mastery list */}
            <div className="space-y-2">
              {filteredChallenges.map((c) => {
                const lvl = masteryLevel(save, c.ref);
                const heard = save.scriptureHeard[c.ref] ?? 0;
                const done = lvl >= MAX_MASTERY;
                const isFav = favoriteScriptures.includes(c.ref);
                const verse = SCRIPTURES.find((s) => s.ref === c.ref);
                return (
                  <div
                    key={c.ref}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 backdrop-blur-md transition-all"
                    style={done ? { borderColor: "rgba(251,191,36,0.5)" } : undefined}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {verse && (
                          <span className="text-[11px]">{CATEGORY_ICONS[verse.category]}</span>
                        )}
                        <p className="text-sm font-bold text-white/85">📖 {c.ref}</p>
                        {verse && (
                          <span className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0 text-[9px] font-bold uppercase text-white/40">
                            {verse.category}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/50">
                        Heard {heard}× {done ? "· Mastered 👑" : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <MasteryPips level={lvl} />
                      <button
                        onClick={() => {
                          sound.play("click");
                          onToggleFavorite(c.ref);
                        }}
                        className="ml-1 text-lg transition-transform active:scale-90"
                        aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
                      >
                        {isFav ? "⭐" : "☆"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div>
            <p className="mb-1 text-center text-sm font-bold uppercase tracking-wide text-gold-300/80">
              📖 {challenge.ref}
            </p>
            <div className="rounded-2xl border border-gold-400/30 bg-black/40 p-5 shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="text-center text-lg font-extrabold leading-relaxed text-white">
                {challenge.prompt}
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {options.map((opt) => {
                const isAnswer = opt === challenge.answer;
                const isPicked = opt === picked;
                let cls = "border-white/20 bg-white/10 text-white";
                if (result) {
                  if (isAnswer) cls = "border-emerald-400 bg-emerald-500/25 text-emerald-100";
                  else if (isPicked) cls = "border-rose-400 bg-rose-500/20 text-rose-100";
                  else cls = "border-white/10 bg-white/5 text-white/50";
                }
                return (
                  <button
                    key={opt}
                    disabled={!!result}
                    onClick={() => choose(opt)}
                    className={`min-h-[56px] rounded-2xl border-2 px-3 py-3 text-base font-extrabold transition-all active:scale-95 ${cls}`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            <AnimatePresence>
              {result && (
                <motion.div
                  initial={{ y: 12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="mt-4 rounded-2xl border p-4 text-center"
                  style={{
                    borderColor:
                      result === "correct"
                        ? justMastered
                          ? "rgba(251,191,36,0.9)"
                          : "rgba(52,211,153,0.6)"
                        : "rgba(251,113,133,0.5)",
                    background:
                      result === "correct"
                        ? justMastered
                          ? "linear-gradient(135deg, rgba(120,80,0,0.6) 0%, rgba(80,50,0,0.7) 100%)"
                          : "rgba(16,185,129,0.12)"
                        : "rgba(244,63,94,0.1)",
                    boxShadow:
                      justMastered && result === "correct"
                        ? "0 0 32px 10px rgba(251,191,36,0.35), 0 0 8px 2px rgba(251,191,36,0.6)"
                        : undefined,
                  }}
                >
                  {result === "correct" ? (
                    justMastered ? (
                      <>
                        {/* §7 — Premium mastery celebration */}
                        <p className="font-display text-2xl text-gold-300" style={{ textShadow: "0 0 12px rgba(251,191,36,0.8)" }}>
                          📖 Written Upon Your Heart
                        </p>
                        <p className="mt-1 font-display text-lg text-gold-400">
                          {challenge?.ref}
                        </p>
                        <p className="mt-2 text-sm italic text-white/90 leading-relaxed">
                          "{challenge ? verseText(challenge.ref) : ""}"
                        </p>
                        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                          <span className="rounded-full bg-gold-400/20 px-2.5 py-1 text-xs font-extrabold text-gold-300">
                            💰 +{REWARD_COINS}
                          </span>
                          <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-xs font-extrabold text-emerald-300">
                            ✨ +{REWARD_XP} XP
                          </span>
                          <span className="rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-extrabold text-purple-300">
                            💛 +{FRIENDSHIP_XP} Friendship
                          </span>
                          <span className="rounded-full bg-gold-500/25 px-2.5 py-1 text-xs font-extrabold text-gold-200">
                            🏆 +1 Scripture Badge
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-display text-xl text-emerald-300">✅ Well done!</p>
                        <p className="mt-1 text-sm font-bold text-emerald-200">
                          +💰 {REWARD_COINS} · +✨ {REWARD_XP} XP · +💛 {FRIENDSHIP_XP} Friendship
                        </p>
                      </>
                    )
                  ) : (
                    <p className="font-display text-lg text-rose-200">
                      The word was "{challenge.answer}". Try again!
                    </p>
                  )}
                  <p className="mt-2 text-sm italic text-white/75">
                    "{verseText(challenge.ref)}" — {challenge.ref}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mt-5 flex gap-3">
              <Button variant="secondary" onClick={() => setChallenge(null)} className="flex-1">
                ✓ Done
              </Button>
              <Button onClick={start} shine className="flex-1">
                Next ▶
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
