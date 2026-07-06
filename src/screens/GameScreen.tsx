import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RunStats, SaveData } from "../types";
import { GameEngine } from "../game/engine";
import { Renderer } from "../game/render";
import { getCharacter } from "../data/characters";
import { getBoard } from "../data/boards";
import { getVenue } from "../data/venues";
import { getShoe } from "../data/shoes";
import { missionProgress } from "../data/missions";
import { POWER_UPS } from "../data/powerups";
import { SCRIPTURES, pickNextScripture, CATEGORY_ICONS, POWER_VERSES } from "../data/scriptures";
import { CHALLENGES } from "../data/challenges";
import { sound } from "../audio/SoundEngine";
import { useSwipe } from "../hooks/useSwipe";
import { SATAN_WARN_AT } from "../game/constants";
import { FinishVictoryScreen } from "./FinishVictoryScreen";
import type { finishRewards } from "../data/finishLine";

interface HudState {
  score: number;
  distance: number;
  coins: number;
  satan: number;
  shieldCharges: number;
  boost: number;
  magnet: number;
  revival: number;
  wings: number;
  sprint: number;
  surge: number;
  invincible: number;
  combo: number;
  mult: number;
  charges: number;
  missionText: string | null;
  missionPct: number;
}

interface Popup {
  id: number;
  kind: "scripture" | "mission" | "power";
  title: string;
  body: string;
}

/** Compact, non-blocking gameplay toast (combos, dodges, faith bonuses). */
interface Toast {
  id: number;
  label: string;
  color: string;
}

let popupId = 1;
let toastId = 1;

// §5 — Scripture moment types
type ScriptureMoment = "standard" | "kingdom" | "victory" | "verse-of-the-day";

function getScriptureMoment(_ref: string, score: number, isPowerVerse: boolean): ScriptureMoment {
  if (isPowerVerse && Math.random() < 0.4) return "kingdom";
  if (score > 2000 && Math.random() < 0.3) return "victory";
  if (Math.random() < 0.15) return "verse-of-the-day";
  return "standard";
}

// §2 — Quick challenge state type
interface QuickChallengeState {
  ref: string;
  prompt: string;
  answer: string;
  wrongOption: string;
  options: [string, string];
}

// Faith-victory labels shown when the player dodges one of the Accuser's attacks.
const DODGE_WINS = ["Truth Wins", "Lie Broken", "Fear Defeated", "Faith Rises", "Doubt Cast Down"];
let dodgeWinIdx = 0;

export function GameScreen({
  save,
  onToggleMute,
  onRunEnd,
  onQuit,
  onQuickAnswer,
  onFinishVictory,
}: {
  save: SaveData;
  onToggleMute: () => void;
  onRunEnd: (stats: RunStats) => void;
  onQuit: () => void;
  onQuickAnswer?: (ref: string, coins: number, masteryXp: number, friendshipXp: number) => void;
  onFinishVictory?: (correct: boolean, ref: string, rewards: ReturnType<typeof finishRewards>, stats: RunStats) => void;
}) {
  const character = getCharacter(save.selectedCharacter);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef(new Renderer());
  const pausedRef = useRef(false);
  const endedRef = useRef(false);
  const lastWarnRef = useRef(0);

  const [paused, setPaused] = useState(false);
  const [hud, setHud] = useState<HudState | null>(null);
  const [popups, setPopups] = useState<Popup[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  // §1 — tap-to-enable banner
  const [showSpeechBanner, setShowSpeechBanner] = useState(false);
  const pendingScriptureRef = useRef<{ ref: string; text: string; mode: "full" | "memory" | "repeat" | "encouragement" } | null>(null);
  // §2 — quick challenge card
  const [quickChallenge, setQuickChallenge] = useState<QuickChallengeState | null>(null);
  const [quickChallengeShake, setQuickChallengeShake] = useState(false);
  const quickChallengeDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // §3 — Spirit of the Lord activation state
  const [spiritActive, setSpiritActive] = useState(false);
  const [spiritProtected, setSpiritProtected] = useState(false);
  const spiritTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSpiritComboRef = useRef(0);

  // Phase 16 — Finish Line state
  const [finishApproach, setFinishApproach] = useState(false);
  const [finishGate, setFinishGate] = useState(false);
  const [finishEncounter, setFinishEncounter] = useState(false);
  const finishStatsRef = useRef<RunStats | null>(null);
  // Phase 16.1 — current holy-adrenaline level (survives pause/resume).
  const finishApproachLevelRef = useRef(0);

  // Phase 16.3 §4 — brief hero intro banner at the start of a run.
  const [showIntro, setShowIntro] = useState(true);
  useEffect(() => {
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // Reduced-motion players get a shorter, calmer reveal.
    const t = setTimeout(() => setShowIntro(false), reduced ? 1600 : 2600);
    return () => clearTimeout(t);
  }, []);

  const pushPopup = useCallback((p: Omit<Popup, "id">) => {
    const id = popupId++;
    // Max 2 visible cards at a time; oldest is dropped when a third arrives.
    setPopups((list) => [...list.slice(-1), { ...p, id }]);
    setTimeout(() => {
      setPopups((list) => list.filter((x) => x.id !== id));
    }, 2200);
  }, []);

  // Compact side toast — quick, never blocks the forward path.
  const pushToast = useCallback((label: string, color: string) => {
    const id = toastId++;
    setToasts((list) => [...list.slice(-2), { id, label, color }]);
    setTimeout(() => {
      setToasts((list) => list.filter((x) => x.id !== id));
    }, 1400);
  }, []);

  const togglePause = useCallback(() => {
    if (endedRef.current) return;
    setPaused((p) => {
      pausedRef.current = !p;
      if (!p) { sound.stopMusic(); sound.stopVenueAmbient(); }
      else {
        sound.startMusic();
        sound.startVenueAmbient(save.selectedVenue);
        // Restore finish-line adrenaline if we paused mid run-up.
        if (finishApproachLevelRef.current > 0) {
          sound.setFinishApproach(finishApproachLevelRef.current);
        }
      }
      return !p;
    });
  }, []);

  // Input handlers shared by keyboard and swipe.
  const act = useCallback(
    (action: "left" | "right" | "up" | "down" | "boost") => {
      const e = engineRef.current;
      if (!e || pausedRef.current || endedRef.current) return;
      if (action === "left") e.moveLeft();
      else if (action === "right") e.moveRight();
      else if (action === "up") e.jump();
      else if (action === "down") e.slide();
      else if (action === "boost") {
        // Only celebrate when the boost actually fires (charge available).
        const fired = e.revivalCharges > 0 && e.revivalTimer <= 0 && e.alive;
        e.useRevival();
        if (fired) pushToast("🔥 Accuser Pushed Back", "#fb7185");
      }
    },
    [pushToast],
  );

  useSwipe(wrapRef, (dir) => act(dir));

  useEffect(() => {
    const engine = new GameEngine(character, save);
    engineRef.current = engine;
    // QA hook — only under ?breakthroughTest (same gate as the engine's dev
    // threshold): exposes the engine so automated playtests can collect real
    // coins through the real pipeline instead of relying on blind input.
    if (window.location.search.includes("breakthroughTest")) {
      (window as unknown as { __csEngine?: GameEngine }).__csEngine = engine;
    }
    endedRef.current = false;
    pausedRef.current = false;
    const renderer = rendererRef.current;
    renderer.setBoard(getBoard(save.equippedBoard));
    renderer.setVenue(getVenue(save.selectedVenue));

    sound.unlock();
    sound.play("startRun");
    sound.startMusic();
    sound.startVenueAmbient(save.selectedVenue);

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);
    window.visualViewport?.addEventListener("resize", resize);

    // Belt-and-suspenders for iOS: swallow any scroll gesture mid-run.
    const wrap = wrapRef.current!;
    const blockScroll = (ev: TouchEvent) => ev.preventDefault();
    wrap.addEventListener("touchmove", blockScroll, { passive: false });

    const onKey = (ev: KeyboardEvent) => {
      switch (ev.code) {
        case "ArrowLeft":
        case "KeyA":
          act("left");
          break;
        case "ArrowRight":
        case "KeyD":
          act("right");
          break;
        case "ArrowUp":
        case "KeyW":
        case "Space":
          ev.preventDefault();
          act("up");
          break;
        case "ArrowDown":
        case "KeyS":
          act("down");
          break;
        case "KeyE":
          act("boost");
          break;
        case "KeyP":
        case "Escape":
          togglePause();
          break;
      }
    };
    window.addEventListener("keydown", onKey);

    let raf = 0;
    let last = performance.now();
    let hudAccum = 0;
    let caughtAt = 0;
    let wasAirborne = false;

    let bestAnnounced = false; // one-time "new best distance" celebration

    // --- Heavenly Scripture Voice: speak a verse every N minutes of active play ---
    const intervalSec = Math.max(0.5, save.settings.scriptureIntervalMin || 3) * 60;
    let scriptureClock = 0; // active-gameplay seconds since last heavenly verse
    let lastVerseRef: string | undefined = undefined;
    let pendingQuickChallengeTimer: ReturnType<typeof setTimeout> | null = null;
    const triggerQuickChallenge = (ref: string) => {
      const challenge = CHALLENGES.find((c) => c.ref === ref);
      if (!challenge) return;
      const wrongOptions = challenge.options.filter((o) => o !== challenge.answer);
      if (!wrongOptions.length) return;
      const wrongOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
      const opts: [string, string] = Math.random() < 0.5
        ? [challenge.answer, wrongOption]
        : [wrongOption, challenge.answer];
      setQuickChallenge({
        ref,
        prompt: challenge.prompt,
        answer: challenge.answer,
        wrongOption,
        options: opts,
      });
      if (quickChallengeDismissRef.current) clearTimeout(quickChallengeDismissRef.current);
      quickChallengeDismissRef.current = setTimeout(() => {
        setQuickChallenge(null);
      }, 8000);
    };
    const speakHeavenlyScripture = () => {
      // Use spaced repetition to pick the next verse.
      const ref = pickNextScripture(save, lastVerseRef);
      lastVerseRef = ref;
      const verse = SCRIPTURES.find((s) => s.ref === ref) ?? SCRIPTURES[0];
      const isPowerVerse = POWER_VERSES.has(verse.ref);
      const moment = getScriptureMoment(verse.ref, engine.stats.score, isPowerVerse);
      // Speak the COMPLETE verse, one at a time, in the chosen mode (default full).
      if (save.settings.voiceScriptures) {
        const didSpeak = sound.trySpeakScripture(verse.ref, verse.text, save.settings.scriptureMode);
        if (didSpeak && !sound.getSpeechUnlocked()) {
          // Utterance may be silenced — show tap-to-enable banner after 1.5s
          setTimeout(() => {
            if (!sound.getSpeechUnlocked()) {
              pendingScriptureRef.current = { ref: verse.ref, text: verse.text, mode: save.settings.scriptureMode };
              setShowSpeechBanner(true);
            }
          }, 1500);
        }
        // Schedule quick challenge after estimated speaking duration + 5s
        const estimatedDuration = (verse.text.split(" ").length / 2.5) * 1000;
        if (pendingQuickChallengeTimer) clearTimeout(pendingQuickChallengeTimer);
        pendingQuickChallengeTimer = setTimeout(() => {
          triggerQuickChallenge(verse.ref);
        }, estimatedDuration + 5000);
      }
      engine.stats.scripturesHeard[verse.ref] =
        (engine.stats.scripturesHeard[verse.ref] ?? 0) + 1;
      // Track for spaced repetition
      engine.stats.scriptureLastHeardUpdates[verse.ref] = new Date().toISOString();
      // Soft heaven-light glow + non-blocking full-verse card (lower-left zone).
      renderer.triggerScreenFlash("#fff4cc", 0.35);
      sound.playScriptureCardAppear();
      sound.playScriptureChime();
      const icon = CATEGORY_ICONS[verse.category] ?? "✨";
      let badge = "";
      if (moment === "kingdom") badge = " 👑 KINGDOM VERSE";
      else if (moment === "victory") badge = " ⚔️ VICTORY VERSE";
      else if (moment === "verse-of-the-day") badge = " ☀️ VERSE OF THE DAY";
      pushPopup({ kind: "scripture", title: `${icon} ${verse.ref}${badge}`, body: verse.text });
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      if (!pausedRef.current && !endedRef.current) {
        engine.update(dt);

        // One-time "new best distance" cheer once a real record exists.
        if (
          !bestAnnounced &&
          save.bestDistance > 0 &&
          engine.stats.distance > save.bestDistance &&
          engine.alive
        ) {
          bestAnnounced = true;
          pushToast("🏆 New Best Distance!", "#fcd34d");
          renderer.triggerScreenFlash("#fcd34d", 0.3);
        }

        // Heavenly Scripture Voice cadence (only while alive and running).
        if (engine.alive) {
          scriptureClock += dt;
          if (scriptureClock >= intervalSec) {
            scriptureClock = 0;
            speakHeavenlyScripture();
          }
        }

        // Landing impact: small punch + dust the moment the hero touches down.
        const airborne = engine.y > 0.2;
        if (wasAirborne && !airborne && engine.alive) {
          renderer.punch(0.5);
          renderer.burstAtPlayer(engine, W, H, "#fff4d2", 8);
          if (save.settings.screenShake) renderer.addShake(3);
        }
        wasAirborne = airborne;

        // Heartbeat warning while the Accuser is close.
        if (
          engine.alive &&
          engine.satan >= SATAN_WARN_AT &&
          time - lastWarnRef.current > 0.85
        ) {
          lastWarnRef.current = time;
          sound.play("satanWarning");
          if (save.settings.screenShake) renderer.addShake(3);
        }

        for (const e of engine.drainEvents()) {
          switch (e.type) {
            case "coin":
              if (hud && hud.combo > 0 && hud.combo % 5 === 0) {
                sound.play("coinStreak");
              } else {
                sound.playCoin();
              }
              renderer.sprayCoins(engine, W, H, 6);
              break;
            case "collect":
              sound.play(e.kind === "crown" ? "crown" : e.kind === "key" ? "key" : "gem");
              renderer.ringBurst(engine, W, H, "#a5f3fc", 12);
              break;
            case "scripture": {
              sound.play("scroll");
              sound.playScriptureCardAppear();
              sound.playScriptureChime();
              renderer.ringBurst(engine, W, H, "#ffffff", 20);
              renderer.triggerScreenFlash("#ffffff", 0.3);
              if (save.settings.voiceScriptures) {
                sound.speakScripture(e.ref, e.text, save.settings.scriptureMode);
              }
              engine.stats.scripturesHeard[e.ref] =
                (engine.stats.scripturesHeard[e.ref] ?? 0) + 1;
              engine.stats.scriptureLastHeardUpdates[e.ref] = new Date().toISOString();
              const scVerse = SCRIPTURES.find((s) => s.ref === e.ref);
              const scIcon = scVerse ? (CATEGORY_ICONS[scVerse.category] ?? "✨") : "✨";
              pushPopup({ kind: "scripture", title: `${scIcon} ${e.ref}`, body: e.text });
              break;
            }
            case "breakthrough": {
              // 200-coin BREAKTHROUGH — the run's biggest earned moment.
              // Layered fanfare + the Accuser audibly falling back, golden
              // flash/burst/shake, board blaze (renderer reads
              // engine.breakthroughTimer), and a spoken breakthrough verse.
              sound.play("victoryFanfare");
              sound.play("accuserFall");
              sound.play("chainsBreak");
              renderer.triggerScreenFlash("#ffe9a8", 0.55);
              renderer.ringBurst(engine, W, H, "#ffd54a", 40);
              renderer.punch(0.6);
              if (save.settings.screenShake) renderer.addShake(6);
              if (save.settings.haptics) navigator.vibrate?.([60, 40, 120]);
              const btRef = "Psalm 27:1";
              const btText = "The Lord is my light and my salvation; whom shall I fear?";
              if (save.settings.voiceScriptures) {
                sound.speakScripture(btRef, btText, save.settings.scriptureMode);
              }
              pushPopup({ kind: "scripture", title: `⚡ BREAKTHROUGH — ${btRef}`, body: btText });
              pushToast("⚡ 200 COINS — BREAKTHROUGH!", "#ffd54a");
              break;
            }
            case "jump":
              sound.play("jump");
              break;
            case "slide":
              sound.play("slide");
              break;
            case "laneSwitch":
              sound.play("laneSwitch");
              break;
            case "shieldBreak":
              sound.play("shieldBreak");
              if (save.settings.screenShake) renderer.addShake(10);
              if (save.settings.haptics) navigator.vibrate?.(80);
              renderer.burstAtPlayer(engine, W, H, "#f5b82e", 18);
              break;
            case "powerUp": {
              const sfx =
                e.kind === "holySprint"
                  ? "sprint"
                  : e.kind === "angelDash"
                    ? "dash"
                    : e.kind === "livingWater"
                      ? "wave"
                      : e.kind === "armorGod"
                        ? "armor"
                        : e.kind === "kingdomSurge"
                          ? "surge"
                          : "powerUp";
              sound.play(sfx);
              if (e.kind === "livingWater") renderer.triggerWaveFlash();
              const def = POWER_UPS[e.kind];
              const isPremium = sfx !== "powerUp";
              renderer.burstAtPlayer(engine, W, H, def.color, isPremium ? 26 : 16);
              // Premium power-ups get an extra radial ring so each blessing reads distinctly.
              if (isPremium) renderer.ringBurst(engine, W, H, def.color, 16);
              renderer.triggerScreenFlash(def.color, isPremium ? 0.6 : 0.4);
              renderer.punch(isPremium ? 1 : 0.6); // cinematic activation pop
              if (save.settings.haptics) navigator.vibrate?.(isPremium ? 60 : 40);
              pushPopup({
                kind: "power",
                title: `${def.icon} ${def.name.toUpperCase()}`,
                body: def.desc,
              });
              break;
            }
            case "perfectDodge": {
              sound.play("perfectDodge");
              const hasStreak = e.streak > 1;
              // Rotate faith-victory labels — Satan's attack defeated.
              const win = DODGE_WINS[dodgeWinIdx++ % DODGE_WINS.length];
              // Compact side toast keeps the forward path clear.
              pushToast(
                hasStreak ? `✨ ${win} ×${e.streak}` : `✨ ${win}`,
                "#7dd3fc",
              );
              renderer.triggerScreenFlash("#7dd3fc", hasStreak ? 0.4 : 0.25);
              renderer.ringBurst(engine, W, H, "#7dd3fc", hasStreak ? 18 : 12);
              if (save.settings.haptics) navigator.vibrate?.(hasStreak ? 30 : 15);
              if (hasStreak && save.settings.screenShake) renderer.addShake(3);
              break;
            }
            case "combo": {
              sound.playComboMelody(e.count);
              // Spirit of the Lord activates at combo milestones (10, 25, 50 …).
              const spiritMilestone = e.count >= 10 && (e.count === 10 || e.count === 25 || e.count === 50 || e.count % 50 === 0);
              if (spiritMilestone && e.count > lastSpiritComboRef.current) {
                lastSpiritComboRef.current = e.count;
                sound.playSpiritOfTheLord();
                // Equipped shoe grants real Spirit of the Lord protection.
                // shieldDuration is a multiplier (1.2 = +20%) → seconds.
                const shoe = getShoe(save.equippedShoe ?? "gospelSprint");
                const protectSecs = ((shoe.gameplayMods?.shieldDuration ?? 1.0) - 1.0) * 10;
                if (protectSecs > 0) {
                  engine.activateSpiritProtection(protectSecs);
                  pushToast("🔥 Spirit Protection", "#ffd54a");
                }
                setSpiritProtected(protectSecs > 0);
                setSpiritActive(true);
                if (spiritTimerRef.current) clearTimeout(spiritTimerRef.current);
                // Keep the overlay up for the protection window (min 4s for feel).
                const overlayMs = Math.max(4000, protectSecs * 1000);
                spiritTimerRef.current = setTimeout(() => setSpiritActive(false), overlayMs);
                renderer.triggerScreenFlash("#fffacd", 0.5);
                renderer.ringBurst(engine, W, H, "#ffd54a", 32);
              }
              const isMilestone = e.count % 20 === 0 || e.count % 15 === 0 || e.count % 10 === 0 || e.count % 5 === 0;
              const flashIntensity = isMilestone ? 0.6 : 0.4;
              const particleCount = isMilestone ? 28 : 14;

              // Short icon-led toast — no large center text over the lane.
              pushToast(`🔥 ${e.count} Combo`, "#ffd35c");
              renderer.burstAtPlayer(engine, W, H, "#ffd35c", particleCount);
              renderer.triggerScreenFlash("#ffd35c", flashIntensity);

              if (isMilestone) {
                renderer.addShake(6);
                if (save.settings.haptics) navigator.vibrate?.(100);
              }
              break;
            }
            case "faithStreak": {
              const isMilestone = e.count >= 3;
              pushToast(`🙌 Faith Streak ×${e.count}`, "#c4b5fd");
              if (isMilestone) {
                renderer.ringBurst(engine, W, H, "#c4b5fd", 16);
                renderer.triggerScreenFlash("#c4b5fd", 0.3);
              }
              break;
            }
            case "shoeBonus":
              // Compact, non-spammy shoe coin-streak reward.
              pushToast(`👟 Shoe Bonus +${e.coins}`, "#fcd34d");
              break;
            case "missionComplete":
              sound.play("missionComplete");
              pushPopup({ kind: "mission", title: "⭐ MISSION COMPLETE", body: e.title });
              break;
            case "caught":
              sound.play("collision");
              sound.play("gameOver");
              sound.stopMusic();
              if (save.settings.screenShake) renderer.addShake(16);
              if (save.settings.haptics) navigator.vibrate?.([120, 60, 200]);
              caughtAt = time;
              break;
            case "finishLineApproach":
              sound.play("finishLineApproach");
              // Holy adrenaline level 1 — rising pulse + warm heartbeat.
              finishApproachLevelRef.current = 1;
              sound.setFinishApproach(1);
              setFinishApproach(true);
              pushToast("🏁 Finish Line Ahead!", "#fcd34d");
              renderer.triggerScreenFlash("#ffd700", 0.3);
              break;
            case "finishLineGate":
              sound.play("finishLineGate");
              // Holy adrenaline level 2 — victory swell + golden shimmer.
              finishApproachLevelRef.current = 2;
              sound.setFinishApproach(2);
              setFinishGate(true);
              pushToast("✨ Heavenly Gate Opens!", "#fde68a");
              renderer.triggerScreenFlash("#ffd700", 0.5);
              break;
            case "finishLine":
              // Freeze engine, save stats, show encounter overlay
              endedRef.current = true;
              finishStatsRef.current = { ...engine.stats };
              setFinishEncounter(true);
              break;
            case "stumble":
            case "satanWarning":
              break;
          }
        }

        // Brief catch animation, then hand off to game over.
        // Skip if finish line was reached (encounter handles the run end).
        if (!engine.alive && !endedRef.current) {
          if (caughtAt === 0) caughtAt = time;
          if (time - caughtAt > 1.3) {
            endedRef.current = true;
            onRunEnd(engine.stats);
          }
        }

        // Feed Satan proximity to music engine for tension-aware soundtrack.
        sound.setTension(engine.satan);
        // Heartbeat rises as the Accuser closes in — pure dread/relief feedback.
        if (engine.alive && engine.satan > 0.62) {
          sound.heartbeat(Math.min(1, (engine.satan - 0.62) / 0.38));
        }

        // Throttle HUD updates to ~8 Hz.
        hudAccum += dt;
        if (hudAccum > 0.12) {
          hudAccum = 0;
          const mission = engine.currentMission();
          setHud({
            score: Math.floor(engine.stats.score),
            distance: Math.floor(engine.stats.distance),
            coins: engine.stats.coins,
            satan: engine.satan,
            shieldCharges: engine.shieldCharges,
            boost: engine.boostTimer,
            magnet: engine.magnetTimer,
            revival: engine.revivalTimer,
            wings: engine.wingsTimer,
            sprint: engine.sprintTimer,
            surge: engine.surgeTimer,
            invincible: engine.invincibleTimer,
            combo: engine.combo,
            mult: engine.scoreMult,
            charges: engine.revivalCharges,
            missionText: mission ? mission.title : null,
            missionPct: mission
              ? Math.min(1, missionProgress(mission, engine.stats) / mission.target)
              : 0,
          });
        }
      }

      renderer.draw(ctx, engine, character, W, H, dt, time);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.visualViewport?.removeEventListener("resize", resize);
      wrap.removeEventListener("touchmove", blockScroll);
      window.removeEventListener("keydown", onKey);
      sound.stopMusic();
      sound.stopVenueAmbient();
      // Cancel any pending speech and quick challenge timers on unmount
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (pendingQuickChallengeTimer) clearTimeout(pendingQuickChallengeTimer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const timers: { label: string; value: number; color: string }[] = hud
    ? [
        { label: "👑 SURGE 3×", value: hud.surge, color: "#34d399" },
        { label: "⚡ Sprint", value: hud.sprint, color: "#fbbf24" },
        { label: "💨 Untouchable", value: hud.invincible, color: "#60a5fa" },
        { label: "📖 2× Score", value: hud.boost, color: "#a78bfa" },
        { label: "👑 Magnet", value: hud.magnet, color: "#38bdf8" },
        { label: "🔥 Revival", value: hud.revival, color: "#fb7185" },
        { label: "🕊 Wings", value: hud.wings, color: "#f9fafb" },
      ].filter((t) => t.value > 0)
    : [];

  return (
    <div ref={wrapRef} className="relative h-full w-full touch-none">
      <canvas ref={canvasRef} className="h-full w-full" />

      {/* §4 — Hero intro banner: polished, non-blocking, auto-dismisses. */}
      <AnimatePresence>
        {showIntro && (
          <motion.div
            key="hero-intro"
            className="pointer-events-none absolute left-1/2 top-[calc(max(0.75rem,env(safe-area-inset-top))+5.5rem)] z-20 -translate-x-1/2"
            initial={{ opacity: 0, y: -12, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <div
              className="flex items-center gap-2.5 rounded-2xl border px-4 py-2.5 shadow-xl backdrop-blur-md"
              style={{
                borderColor: `${character.colors.secondary}55`,
                background: `linear-gradient(135deg, ${character.colors.primary}cc, rgba(10,6,26,0.75))`,
                boxShadow: `0 8px 28px ${character.colors.secondary}33`,
              }}
            >
              <span className="text-2xl leading-none">✨</span>
              <div className="text-left">
                <p
                  className="font-display text-lg leading-none"
                  style={{ color: character.colors.secondary }}
                >
                  {character.name}
                </p>
                <p className="text-[11px] font-bold uppercase tracking-wide text-white/70">
                  {character.ability}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HUD */}
      {hud && (
        <>
          {/* Top bar */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="rounded-2xl border border-white/10 bg-black/45 px-4 py-2 shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="font-display text-2xl leading-none text-gold-300">
                {hud.score.toLocaleString()}
                {hud.mult > 1.01 && (
                  <span className="ml-1.5 align-middle text-sm font-extrabold text-emerald-300">
                    ×{hud.mult.toFixed(1)}
                  </span>
                )}
              </p>
              <p className="text-sm font-bold text-white/75">
                {hud.distance.toLocaleString()} m · 💰 {hud.coins}
                {hud.combo >= 3 && (
                  <span className="ml-1.5 font-extrabold text-gold-300">
                    🔗 {hud.combo}
                  </span>
                )}
              </p>
            </div>
            <div className="pointer-events-auto flex gap-2">
              <button
                onClick={() => {
                  sound.play("click");
                  onToggleMute();
                }}
                aria-label={save.settings.muted ? "Unmute" : "Mute"}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-2xl shadow-lg shadow-black/20 backdrop-blur-md transition-all active:scale-95"
              >
                {save.settings.muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={togglePause}
                aria-label="Pause"
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-black/45 text-2xl font-bold shadow-lg shadow-black/20 backdrop-blur-md transition-all active:scale-95"
              >
                ⏸
              </button>
            </div>
          </div>

          {/* Mission tracker */}
          {hud.missionText && (
            <div className="pointer-events-none absolute left-1/2 top-[calc(max(0.75rem,env(safe-area-inset-top))+3.75rem)] w-64 -translate-x-1/2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-center shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="truncate text-xs font-bold text-white/85">
                ⭐ {hud.missionText}
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/40">
                <div
                  className="h-full rounded-full bg-gold-400 transition-all"
                  style={{ width: `${hud.missionPct * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Satan distance meter */}
          <div className="pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] top-1/2 flex -translate-y-1/2 flex-col items-center gap-1">
            <span
              className="text-lg transition-transform duration-200"
              style={{
                transform: hud.satan > SATAN_WARN_AT ? `scale(${1 + Math.sin(Date.now() / 200) * 0.15})` : "scale(1)",
              }}
            >
              😈
            </span>
            <div
              className="h-36 w-3 overflow-hidden rounded-full backdrop-blur-sm"
              style={{
                background: hud.satan > SATAN_WARN_AT ? "rgba(80,0,0,0.6)" : "rgba(0,0,0,0.45)",
                boxShadow: hud.satan > SATAN_WARN_AT ? "0 0 12px rgba(255,0,0,0.4)" : "none",
              }}
            >
              <div
                className="w-full rounded-full transition-all duration-300"
                style={{
                  height: `${hud.satan * 100}%`,
                  marginTop: `${(1 - hud.satan) * 100}%`,
                  background:
                    hud.satan > SATAN_WARN_AT
                      ? "linear-gradient(to bottom, #ff2020, #7a1020)"
                      : "linear-gradient(to bottom, #c084fc, #581c87)",
                }}
              />
            </div>
            <span className="text-lg">🏃</span>
          </div>

          {/* Active power-up timers */}
          {(timers.length > 0 || hud.shieldCharges > 0) && (
            <div className="pointer-events-none absolute right-[max(0.75rem,env(safe-area-inset-right))] top-1/2 flex -translate-y-1/2 flex-col items-end gap-1.5">
              {hud.shieldCharges > 0 && (
                <span className="rounded-full border border-gold-400/20 bg-gold-400/25 px-3 py-1 text-xs font-bold text-gold-300 shadow-lg shadow-black/20 backdrop-blur-md">
                  {hud.shieldCharges >= 2 ? "⚔️ Armor of God ×2" : "🛡 Shield of Faith"}
                </span>
              )}
              {timers.map((t) => (
                <span
                  key={t.label}
                  className="rounded-full border border-white/10 bg-black/45 px-3 py-1 text-xs font-bold shadow-lg shadow-black/20 backdrop-blur-md"
                  style={{ color: t.color }}
                >
                  {t.label} {t.value.toFixed(0)}s
                </span>
              ))}
            </div>
          )}

          {/* Boost button */}
          <button
            onClick={() => act("boost")}
            disabled={hud.charges <= 0 || hud.revival > 0}
            aria-label="Activate Revival Fire boost"
            className={`absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-[max(1.25rem,env(safe-area-inset-right))] flex h-[72px] w-[72px] items-center justify-center rounded-full border-2 text-3xl shadow-lg transition-all active:scale-90 ${
              hud.charges > 0 && hud.revival <= 0
                ? "border-rose-400 bg-rose-500/30 shadow-rose-500/40 backdrop-blur-sm"
                : "border-white/15 bg-black/30 opacity-50"
            }`}
          >
            🔥
            {hud.charges > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold">
                {hud.charges}
              </span>
            )}
          </button>
        </>
      )}

      {/* Compact gameplay toasts — upper-left under HUD, never over the lane. */}
      <div className="pointer-events-none absolute left-[max(0.75rem,env(safe-area-inset-left))] top-[calc(max(0.75rem,env(safe-area-inset-top))+4.25rem)] z-10 flex flex-col items-start gap-1">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -12, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="rounded-full border border-white/15 bg-black/55 px-3 py-1 text-xs font-extrabold backdrop-blur-sm"
              style={{ color: t.color }}
            >
              {t.label}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Scripture / mission / power cards — lower-left safe zone, above
          bottom controls and clear of the boost button (bottom-right) and
          the forward path. Compact so obstacles stay visible. */}
      <style>{`
        @keyframes scripture-glow-pulse {
          0%, 100% { box-shadow: 0 0 8px 2px rgba(251,191,36,0.35), 0 0 16px 4px rgba(251,191,36,0.15); }
          50% { box-shadow: 0 0 16px 5px rgba(251,191,36,0.6), 0 0 28px 8px rgba(251,191,36,0.25); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
      <div className="pointer-events-none absolute bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+5.5rem)] left-[max(0.75rem,env(safe-area-inset-left))] z-10 w-[min(72vw,16rem)] space-y-1.5">
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ x: -20, opacity: 0, scale: 0.9 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -12, opacity: 0 }}
              transition={{ duration: 0.25, type: "spring", stiffness: 260, damping: 20 }}
              className={`max-h-[22vh] overflow-hidden rounded-xl border px-3 py-2 backdrop-blur-md ${
                p.kind === "scripture"
                  ? "border-gold-400/70 bg-gradient-to-b from-black/80 to-[#3a2a05]/90"
                  : p.kind === "mission"
                    ? "border-emerald-400/60 bg-black/75"
                    : "border-rose-400/60 bg-black/75"
              }`}
              style={
                p.kind === "scripture"
                  ? { animation: "scripture-glow-pulse 2s ease-in-out infinite" }
                  : undefined
              }
            >
              {p.kind === "scripture" ? (
                <>
                  <p className="font-display text-xs text-gold-300 sm:text-sm">{p.title}</p>
                  <p className="my-1 text-center text-[10px] font-bold tracking-widest text-gold-400/60">✦ ✦ ✦</p>
                  <p className="text-[11px] font-bold leading-snug text-white/95 line-clamp-3 sm:text-xs">{p.body}</p>
                </>
              ) : (
                <>
                  <p
                    className={`font-display text-sm ${
                      p.kind === "mission" ? "text-emerald-300" : "text-rose-300"
                    }`}
                  >
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-xs font-bold leading-snug text-white/90">{p.body}</p>
                </>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* §1 — Tap-to-enable speech banner */}
      {showSpeechBanner && (
        <button
          onClick={() => {
            sound.unlock();
            setShowSpeechBanner(false);
            if (pendingScriptureRef.current) {
              const { ref, text, mode } = pendingScriptureRef.current;
              sound.trySpeakScripture(ref, text, mode);
              pendingScriptureRef.current = null;
            }
          }}
          className="pointer-events-auto absolute bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-0 right-0 mx-auto z-30 w-[min(90vw,22rem)] rounded-2xl border border-gold-400/60 px-4 py-3 text-center font-extrabold text-gold-200 backdrop-blur-md"
          style={{
            background: "rgba(30,20,0,0.92)",
            animation: "scripture-glow-pulse 1.5s ease-in-out infinite",
          }}
        >
          🔊 Tap anywhere to enable Scripture Voice
        </button>
      )}

      {/* §2 — Quick challenge card */}
      <AnimatePresence>
        {quickChallenge && (
          <motion.div
            initial={{ x: -20, opacity: 0, scale: 0.92 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ duration: 0.22, type: "spring", stiffness: 260, damping: 22 }}
            className="pointer-events-auto absolute bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+5.5rem)] left-[max(0.75rem,env(safe-area-inset-left))] z-20 w-[min(72vw,16rem)] rounded-2xl border border-indigo-400/60 px-3 py-3 backdrop-blur-md"
            style={{
              background: "linear-gradient(135deg, rgba(49,28,100,0.95) 0%, rgba(30,20,70,0.97) 100%)",
              animation: quickChallengeShake ? "shake 0.35s ease" : undefined,
            }}
          >
            <p className="mb-1 text-[10px] font-extrabold uppercase tracking-widest text-indigo-300">
              ✍️ Fill the blank:
            </p>
            <p className="mb-2 text-xs font-bold leading-snug text-white/90 line-clamp-3">
              {quickChallenge.prompt}
            </p>
            <div className="flex gap-2">
              {quickChallenge.options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    if (opt === quickChallenge.answer) {
                      // Correct
                      onQuickAnswer?.(quickChallenge.ref, 10, 5, 10);
                      pushToast("+10 🪙 +5 ✨", "#fcd34d");
                      if (quickChallengeDismissRef.current) clearTimeout(quickChallengeDismissRef.current);
                      setQuickChallenge(null);
                    } else {
                      // Wrong — shake and dismiss
                      setQuickChallengeShake(true);
                      setTimeout(() => setQuickChallengeShake(false), 400);
                      if (quickChallengeDismissRef.current) clearTimeout(quickChallengeDismissRef.current);
                      quickChallengeDismissRef.current = setTimeout(() => setQuickChallenge(null), 1200);
                    }
                  }}
                  className="flex-1 rounded-xl border border-indigo-400/40 bg-indigo-500/20 px-2 py-2 text-xs font-extrabold text-white transition-colors active:bg-indigo-400/30"
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* §3 — Spirit of the Lord activation overlay */}
      <AnimatePresence>
        {spiritActive && (
          <motion.div
            key="spirit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute inset-0 z-10"
            style={{
              background:
                "radial-gradient(ellipse 85% 60% at 50% 50%, rgba(255,250,180,0.22), rgba(255,220,80,0.10) 55%, transparent 75%)",
            }}
          >
            {/* Golden wind streaks */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute top-0 h-full w-[2px] rounded-full"
                style={{
                  left: `${15 + i * 18}%`,
                  background:
                    "linear-gradient(to bottom, transparent, rgba(255,224,120,0.35) 40%, rgba(255,240,160,0.5) 60%, transparent)",
                }}
                animate={{ y: ["-5%", "5%", "-5%"], opacity: [0.4, 0.9, 0.4] }}
                transition={{
                  duration: 1.2 + i * 0.2,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.15,
                }}
              />
            ))}
            {/* Floating "🔥 Spirit of the Lord" label — lower-left safe zone, above popup cards */}
            <motion.div
              initial={{ x: -14, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -10, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="absolute bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+9.5rem)] left-[max(0.75rem,env(safe-area-inset-left))] rounded-2xl border border-gold-300/60 px-3 py-2"
              style={{
                background: "rgba(20,10,0,0.88)",
                boxShadow: "0 0 16px 4px rgba(255,210,60,0.3)",
              }}
            >
              <p className="text-xs font-extrabold text-gold-300">
                🔥 SPIRIT OF THE LORD
              </p>
              <p className="text-[10px] text-gold-200/70">
                {spiritProtected ? "you are protected" : "run in the light"}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 16 — Finish Line approach warnings */}
      <AnimatePresence>
        {finishApproach && !finishGate && !finishEncounter && (
          <motion.div
            key="finish-approach"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10"
            style={{ top: "calc(max(0.75rem,env(safe-area-inset-top)) + 5rem)" }}
          >
            <div
              className="rounded-full border border-yellow-400/50 px-4 py-1.5 text-center"
              style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
            >
              <motion.p
                className="text-xs font-extrabold text-yellow-300"
                animate={{ opacity: [1, 0.6, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              >
                🏁 FINISH LINE AHEAD
              </motion.p>
            </div>
          </motion.div>
        )}
        {finishGate && !finishEncounter && (
          <motion.div
            key="finish-gate"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute left-1/2 -translate-x-1/2 z-10 text-center"
            style={{ top: "calc(max(0.75rem,env(safe-area-inset-top)) + 5rem)" }}
          >
            <div
              className="rounded-2xl border border-yellow-300/70 px-5 py-2"
              style={{
                background: "rgba(0,0,0,0.75)",
                backdropFilter: "blur(10px)",
                boxShadow: "0 0 20px rgba(255,215,0,0.4)",
              }}
            >
              <motion.p
                className="text-sm font-extrabold text-yellow-200"
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              >
                ✨ HEAVENLY GATE OPENS ✨
              </motion.p>
              <p className="text-[10px] text-yellow-300/60 mt-0.5">The Word awaits you</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase 16 — Finish Line encounter overlay */}
      <AnimatePresence>
        {finishEncounter && (
          <FinishVictoryScreen
            save={save}
            characterEmoji={character.outfit}
            onComplete={(correct, ref, rewards) => {
              const stats = finishStatsRef.current ?? engineRef.current?.stats ?? {} as RunStats;
              onFinishVictory?.(correct, ref, rewards, stats);
              onRunEnd(stats);
            }}
          />
        )}
      </AnimatePresence>

      {/* Pause overlay */}
      <AnimatePresence>
        {paused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 bg-night/85 backdrop-blur-sm"
          >
            <h2 className="font-display text-4xl text-gold-400 text-glow-gold">
              PAUSED
            </h2>
            <p className="mb-2 text-sm italic text-white/60">
              "Be still, and know that I am God."
            </p>
            <button
              onClick={togglePause}
              className="btn-shine rounded-2xl bg-gradient-to-b from-gold-300 to-gold-600 px-10 py-4 text-xl font-extrabold text-night"
            >
              ▶ RESUME
            </button>
            <button
              onClick={() => {
                sound.stopMusic();
                onQuit();
              }}
              className="rounded-2xl border border-white/25 bg-white/10 px-8 py-3 font-extrabold"
            >
              🏠 Quit Run
            </button>
            <div className="mt-4 text-center text-xs text-white/50">
              <p>← → move · ↑/Space jump · ↓ slide · E boost · P pause</p>
              <p>Mobile: swipe to move, jump, and slide</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
