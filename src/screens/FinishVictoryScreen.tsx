import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SaveData } from "../types";
import {
  getFinishTier,
  getFinishTierNumber,
  pickFinishQuestion,
  shuffleOptions,
  finishRewards,
  FINISH_BADGES,
  type FinishQuestion,
} from "../data/finishLine";
import { sound } from "../audio/SoundEngine";
import { getCharacter } from "../data/characters";

type Phase =
  | "encounter"   // Accuser faces player — show question
  | "wrong"       // Wrong answer — gentle correction
  | "retry"       // Retry after wrong
  | "victory"     // Correct — dopamine explosion
  | "teaching"    // Second wrong — teach the verse
  | "done";       // Complete, waiting to dismiss

interface Props {
  save: SaveData;
  characterEmoji: string;
  onComplete: (correct: boolean, ref: string, rewards: ReturnType<typeof finishRewards>) => void;
}

const ACCUSER_LINES = [
  "You can't remember the Word!",
  "Give up — darkness wins today!",
  "Your faith is too small!",
  "No one will save you now!",
];

const VICTORY_TEXTS = [
  "THE WORD WINS",
  "JESUS IS LORD",
  "TRUTH HAS PREVAILED",
  "THE ACCUSER IS DEFEATED",
  "SCRIPTURE VICTORY",
];

function GoldParticles({ count = 18 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 4 + Math.random() * 8,
    delay: Math.random() * 0.8,
    dur: 0.8 + Math.random() * 1.2,
  }));
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-yellow-300"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          initial={{ opacity: 0, scale: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0], y: -60 - Math.random() * 80 }}
          transition={{ delay: p.delay, duration: p.dur, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

function LightRays() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
        <div
          key={deg}
          className="absolute left-1/2 top-1/3"
          style={{
            width: 2,
            height: "60vh",
            transformOrigin: "top center",
            transform: `rotate(${deg}deg)`,
            background: "linear-gradient(to bottom, rgba(255,215,0,0.25), transparent)",
          }}
        />
      ))}
    </div>
  );
}

export function FinishVictoryScreen({ save, characterEmoji, onComplete }: Props) {
  const hero = getCharacter(save.selectedCharacter);
  const victories = save.finishVictories ?? 0;
  const tier = getFinishTier(victories);
  const tierNum = getFinishTierNumber(victories);
  const newTier = tierNum > (save.finishScriptureTier ?? 1);

  const [question] = useState<FinishQuestion>(() => pickFinishQuestion(tier, save));
  const [options] = useState<string[]>(() => shuffleOptions(question));
  const [phase, setPhase] = useState<Phase>("encounter");
  const [selected, setSelected] = useState<string | null>(null);
  const [accuserLine] = useState(() => ACCUSER_LINES[Math.floor(Math.random() * ACCUSER_LINES.length)]);
  const [victoryText] = useState(() => VICTORY_TEXTS[Math.floor(Math.random() * VICTORY_TEXTS.length)]);
  const [wrongCount, setWrongCount] = useState(0);
  const doneRef = useRef(false);

  // Play approach fanfare when screen mounts
  useEffect(() => {
    sound.stopMusic();
    sound.play("finishLineGate");
    const t = setTimeout(() => sound.play("spiritOfTheLord"), 1200);
    return () => clearTimeout(t);
  }, []);

  const handleAnswer = (choice: string) => {
    if (phase !== "encounter" && phase !== "retry") return;
    setSelected(choice);
    const correct = choice === question.answer;

    if (correct) {
      // Victory sequence
      sound.play("accuserFall");
      setTimeout(() => {
        sound.play("chainsBreak");
        setTimeout(() => {
          sound.play("victoryFanfare");
          sound.play("heavenlyCheer");
        }, 300);
      }, 400);
      setPhase("victory");
      const rewards = finishRewards(tierNum, true);
      setTimeout(() => {
        if (!doneRef.current) {
          doneRef.current = true;
          onComplete(true, question.ref, rewards);
        }
      }, 4200);
    } else {
      setWrongCount((n) => n + 1);
      if (wrongCount === 0) {
        // First wrong — gentle correction with retry
        sound.play("collision");
        setPhase("wrong");
        setTimeout(() => setPhase("retry"), 2800);
      } else {
        // Second wrong — teach the verse then finish
        sound.play("collision");
        setPhase("teaching");
        const rewards = finishRewards(tierNum, false);
        setTimeout(() => {
          if (!doneRef.current) {
            doneRef.current = true;
            onComplete(false, question.ref, rewards);
          }
        }, 5000);
      }
    }
  };

  // New tier badge if player just crossed a threshold
  const newBadge = FINISH_BADGES.find((b) => b.victories === victories + 1);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between overflow-hidden"
      style={{ background: "linear-gradient(180deg, #0a0520 0%, #1a0a3a 40%, #0d1230 100%)" }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Light rays — always visible */}
      <LightRays />

      {/* Victory particles */}
      {phase === "victory" && <GoldParticles count={30} />}

      {/* Top — Finish Line Banner */}
      <div className="relative z-10 w-full px-4 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <motion.div
          className="text-center"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-yellow-400/70">
            THE FINISH LINE
          </p>
          <h1 className="font-display text-2xl font-black text-yellow-300 drop-shadow-lg">
            FACE THE ACCUSER
          </h1>
          <p className="text-xs text-white/50">
            Tier {tierNum} • {tier.name}
          </p>
        </motion.div>
      </div>

      {/* Middle — Scene */}
      <div className="relative z-10 flex w-full flex-1 flex-col items-center justify-center gap-4 px-4">

        {/* Characters row */}
        <motion.div
          className="flex w-full max-w-sm items-end justify-between"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {/* Player */}
          <div className="flex flex-col items-center gap-1">
            <motion.div
              className="text-5xl"
              animate={phase === "victory" ? { scale: [1, 1.3, 1.1], rotate: [0, -10, 10, 0] } : {}}
              transition={{ duration: 0.6 }}
            >
              {characterEmoji}
            </motion.div>
            <div
              className="rounded-full px-2 py-0.5 text-[9px] font-extrabold text-white"
              style={{ background: "rgba(99,102,241,0.5)" }}
            >
              YOU
            </div>
          </div>

          {/* Gate / cross in center */}
          <motion.div
            className="flex flex-col items-center"
            animate={phase === "victory" ? { scale: [1, 1.3, 1.6], opacity: [1, 1, 0] } : {}}
            transition={{ delay: 1, duration: 1.5 }}
          >
            <div className="relative flex h-16 w-12 items-center justify-center">
              {/* Cross */}
              <div className="absolute h-full w-1.5 rounded-full bg-yellow-300/90" />
              <div className="absolute top-4 h-1.5 w-full rounded-full bg-yellow-300/90" />
              {/* Glow */}
              <div
                className="absolute inset-0 rounded-full blur-md"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,0.5), transparent 70%)" }}
              />
            </div>
            <p className="text-[9px] font-bold text-yellow-300/80">FINISH GATE</p>
          </motion.div>

          {/* Accuser / Satan */}
          <div className="flex flex-col items-center gap-1">
            <motion.div
              className="text-5xl"
              animate={phase === "victory"
                ? { y: [0, -10, 40], opacity: [1, 1, 0], rotate: [0, 15, -30] }
                : phase === "encounter" || phase === "retry"
                ? { x: [0, -3, 3, 0] }
                : {}}
              transition={phase === "victory"
                ? { delay: 0.3, duration: 1.2 }
                : { duration: 2, repeat: Infinity }}
            >
              😈
            </motion.div>
            <AnimatePresence>
              {(phase === "encounter" || phase === "retry") && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-[120px] rounded-xl bg-red-900/60 px-2 py-1 text-center text-[9px] font-bold text-red-200 shadow"
                >
                  "{accuserLine}"
                </motion.div>
              )}
            </AnimatePresence>
            <div
              className="rounded-full px-2 py-0.5 text-[9px] font-extrabold text-white"
              style={{ background: "rgba(239,68,68,0.5)" }}
            >
              ACCUSER
            </div>
          </div>
        </motion.div>

        {/* Question / State card */}
        <AnimatePresence mode="wait">
          {(phase === "encounter" || phase === "retry") && (
            <motion.div
              key="question"
              className="w-full max-w-sm rounded-3xl border border-yellow-400/20 p-5 shadow-2xl"
              style={{ background: "rgba(15,8,40,0.92)", backdropFilter: "blur(12px)" }}
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -12, opacity: 0 }}
              transition={{ delay: phase === "encounter" ? 0.7 : 0.1 }}
            >
              <p className="mb-1 text-center text-[9px] font-extrabold uppercase tracking-[0.2em] text-yellow-400/70">
                Answer with the Word
              </p>
              <p className="mb-1 text-center text-[10px] font-bold text-white/50">
                {question.ref}
              </p>
              <p className="mb-4 text-center text-base font-bold leading-snug text-white">
                {question.prompt}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {options.map((opt) => {
                  const isSelected = selected === opt;
                  const isWrong = phase === "retry" && wrongCount > 0 && isSelected;
                  return (
                    <motion.button
                      key={opt}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAnswer(opt)}
                      className="rounded-2xl border py-3 text-sm font-extrabold transition-all"
                      style={{
                        borderColor: isWrong ? "rgba(239,68,68,0.6)" : "rgba(255,215,0,0.25)",
                        background: isWrong
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(255,215,0,0.08)",
                        color: isWrong ? "#fca5a5" : "#fde68a",
                        minHeight: 52,
                      }}
                    >
                      {opt}
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {phase === "wrong" && (
            <motion.div
              key="wrong"
              className="w-full max-w-sm rounded-3xl border border-orange-500/30 p-5 text-center"
              style={{ background: "rgba(20,10,40,0.95)" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-2xl">🤔</p>
              <p className="mt-2 text-base font-extrabold text-orange-300">
                Almost! Let's remember the Word together.
              </p>
              <p className="mt-3 text-sm italic leading-relaxed text-white/70">
                "{question.fullVerse}"
              </p>
              <p className="mt-3 text-xs font-bold text-white/40">
                — {question.ref}
              </p>
            </motion.div>
          )}

          {phase === "teaching" && (
            <motion.div
              key="teaching"
              className="w-full max-w-sm rounded-3xl border border-blue-500/30 p-5 text-center"
              style={{ background: "rgba(20,10,40,0.95)" }}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="text-2xl">📖</p>
              <p className="mt-2 text-sm font-extrabold text-blue-300">
                The correct answer is: <span className="text-yellow-300">"{question.answer}"</span>
              </p>
              <p className="mt-3 text-sm italic leading-relaxed text-white/70">
                "{question.fullVerse}"
              </p>
              <p className="mt-3 text-xs font-bold text-white/40">— {question.ref}</p>
              <p className="mt-3 text-xs text-white/50">
                Keep running! You'll master it next time. 💪
              </p>
            </motion.div>
          )}

          {phase === "victory" && (
            <motion.div
              key="victory"
              className="w-full max-w-sm text-center"
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 12 }}
            >
              {/* Glowing circle */}
              <motion.div
                className="relative mx-auto mb-4 flex h-28 w-28 items-center justify-center rounded-full"
                style={{
                  background: "radial-gradient(circle, rgba(255,215,0,0.3), rgba(255,165,0,0.1))",
                  border: "2px solid rgba(255,215,0,0.6)",
                  boxShadow: "0 0 40px rgba(255,215,0,0.5), 0 0 80px rgba(255,165,0,0.3)",
                }}
                animate={{ scale: [1, 1.08, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <span className="text-5xl">✨</span>
              </motion.div>

              <motion.p
                className="font-display text-3xl font-black text-yellow-300 drop-shadow-lg"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 0.8, repeat: 2 }}
              >
                {victoryText}
              </motion.p>
              <p className="mt-2 text-sm font-bold text-white/70">
                {question.ref} — spoken with power!
              </p>

              {/* §5 — Hero victory line in their own color identity */}
              <motion.p
                className="mt-2 font-display text-base italic"
                style={{ color: hero.colors.secondary }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
              >
                {hero.name}: "{hero.victoryLine ?? hero.voiceLine}"
              </motion.p>

              {newTier && (
                <motion.div
                  className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-yellow-400/40 bg-yellow-400/10 px-4 py-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <span className="text-base">🏆</span>
                  <span className="text-xs font-extrabold text-yellow-300">
                    New Scripture Tier Unlocked: {tier.name}!
                  </span>
                </motion.div>
              )}

              {newBadge && (
                <motion.div
                  className="mx-auto mt-3 inline-flex items-center gap-2 rounded-full border border-violet-400/40 bg-violet-400/10 px-4 py-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                >
                  <span className="text-base">{newBadge.icon}</span>
                  <span className="text-xs font-extrabold text-violet-300">
                    {newBadge.name} Earned!
                  </span>
                </motion.div>
              )}

              <motion.div
                className="mt-4 grid grid-cols-3 gap-2 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {[
                  { icon: "💰", label: `+${finishRewards(tierNum, true).coins} coins` },
                  { icon: "⭐", label: `+${finishRewards(tierNum, true).xp} XP` },
                  { icon: "📖", label: "Mastery +1" },
                ].map((r) => (
                  <div key={r.label} className="rounded-xl bg-white/5 py-2 text-xs text-white/70">
                    <p className="text-sm">{r.icon}</p>
                    <p className="font-bold">{r.label}</p>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom safe zone */}
      <div className="relative z-10 h-[max(1.5rem,env(safe-area-inset-bottom))]" />
    </motion.div>
  );
}
