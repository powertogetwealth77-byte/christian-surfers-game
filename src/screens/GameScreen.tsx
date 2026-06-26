import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type { RunStats, SaveData } from "../types";
import { GameEngine } from "../game/engine";
import { Renderer } from "../game/render";
import { getCharacter } from "../data/characters";
import { getBoard } from "../data/boards";
import { getVenue } from "../data/kingdomScenes";
import { missionProgress } from "../data/missions";
import { POWER_UPS } from "../data/powerups";
import { sound } from "../audio/SoundEngine";
import { useSwipe } from "../hooks/useSwipe";
import { SATAN_WARN_AT } from "../game/constants";

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

let popupId = 1;

export function GameScreen({
  save,
  onToggleMute,
  onRunEnd,
  onQuit,
}: {
  save: SaveData;
  onToggleMute: () => void;
  onRunEnd: (stats: RunStats) => void;
  onQuit: () => void;
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

  const pushPopup = useCallback((p: Omit<Popup, "id">) => {
    const id = popupId++;
    setPopups((list) => [...list.slice(-2), { ...p, id }]);
    setTimeout(() => {
      setPopups((list) => list.filter((x) => x.id !== id));
    }, 2400);
  }, []);

  const togglePause = useCallback(() => {
    if (endedRef.current) return;
    setPaused((p) => {
      pausedRef.current = !p;
      if (!p) sound.stopMusic();
      else sound.startMusic();
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
      else if (action === "boost") e.useRevival();
    },
    [],
  );

  useSwipe(wrapRef, (dir) => act(dir));

  useEffect(() => {
    const engine = new GameEngine(character, save);
    engineRef.current = engine;
    endedRef.current = false;
    pausedRef.current = false;
    const renderer = rendererRef.current;
    renderer.setBoard(getBoard(save.equippedBoard));
    renderer.setVenue(getVenue(save.selectedVenue));

    sound.unlock();
    sound.play("startRun");
    sound.startMusic();

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

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const time = now / 1000;
      const W = canvas.clientWidth;
      const H = canvas.clientHeight;

      if (!pausedRef.current && !endedRef.current) {
        engine.update(dt);

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
              sound.playCoin();
              renderer.sprayCoins(engine, W, H, 6);
              break;
            case "collect":
              sound.play(e.kind === "crown" ? "crown" : e.kind === "key" ? "key" : "gem");
              renderer.ringBurst(engine, W, H, "#a5f3fc", 12);
              break;
            case "scripture":
              sound.play("scroll");
              renderer.ringBurst(engine, W, H, "#ffffff", 20);
              renderer.triggerScreenFlash("#ffffff", 0.3);
              if (save.settings.voiceScriptures) {
                sound.speakScripture(e.ref, e.text);
              }
              pushPopup({ kind: "scripture", title: e.ref, body: e.text });
              break;
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
              renderer.triggerScreenFlash(def.color, isPremium ? 0.6 : 0.4);
              renderer.punch(isPremium ? 1 : 0.6); // cinematic activation pop
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
              renderer.floatText(
                engine, W, H,
                hasStreak ? `PERFECT ×${e.streak}!` : "PERFECT!",
                "#7dd3fc",
                hasStreak ? 28 : 24,
              );
              renderer.triggerScreenFlash("#7dd3fc", hasStreak ? 0.5 : 0.3);
              renderer.ringBurst(engine, W, H, "#7dd3fc", hasStreak ? 18 : 12);
              if (hasStreak && save.settings.screenShake) renderer.addShake(3);
              break;
            }
            case "combo": {
              sound.playComboMelody(e.count);
              const isMilestone = e.count % 20 === 0 || e.count % 15 === 0 || e.count % 10 === 0 || e.count % 5 === 0;
              const fontSize = isMilestone ? 32 : 26;
              const flashIntensity = isMilestone ? 0.7 : 0.5;
              const particleCount = isMilestone ? 28 : 14;

              renderer.floatText(engine, W, H, `${e.count} COMBO!`, "#ffd35c", fontSize);
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
              renderer.floatText(engine, W, H, `FAITH STREAK ×${e.count}`, "#c4b5fd", isMilestone ? 28 : 24);
              if (isMilestone) {
                renderer.ringBurst(engine, W, H, "#c4b5fd", 16);
                renderer.triggerScreenFlash("#c4b5fd", 0.3);
              }
              break;
            }
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
            case "stumble":
              sound.play("shieldBreak");
              renderer.triggerScreenFlash("#f5d76e", 0.28);
              renderer.ringBurst(engine, W, H, "#f5d76e", 10);
              pushPopup({
                kind: "power",
                title: "👑 ROYAL FAVOR",
                body: "Esther preserved your streak and kept you running.",
              });
              break;
            case "satanWarning":
              break;
          }
        }

        // Brief catch animation, then hand off to game over.
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

      {/* HUD */}
      {hud && (
        <>
          {/* Top bar */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 flex items-start justify-between px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div className="rounded-2xl bg-black/45 px-4 py-2 backdrop-blur-sm">
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
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/45 text-2xl backdrop-blur-sm active:scale-95"
              >
                {save.settings.muted ? "🔇" : "🔊"}
              </button>
              <button
                onClick={togglePause}
                aria-label="Pause"
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/45 text-2xl font-bold backdrop-blur-sm active:scale-95"
              >
                ⏸
              </button>
            </div>
          </div>

          {/* Mission tracker */}
          {hud.missionText && (
            <div className="pointer-events-none absolute left-1/2 top-[calc(max(0.75rem,env(safe-area-inset-top))+3.75rem)] w-64 -translate-x-1/2 rounded-xl bg-black/40 px-3 py-1.5 text-center backdrop-blur-sm">
              <p className="truncate text-xs font-bold text-white/85">
                ⭐ {hud.missionText}
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/15">
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
                <span className="rounded-full bg-gold-400/25 px-3 py-1 text-xs font-bold text-gold-300">
                  {hud.shieldCharges >= 2 ? "⚔️ Armor of God ×2" : "🛡 Shield of Faith"}
                </span>
              )}
              {timers.map((t) => (
                <span
                  key={t.label}
                  className="rounded-full bg-black/45 px-3 py-1 text-xs font-bold backdrop-blur-sm"
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

      {/* Popups: scripture / mission / power */}
      <div className="pointer-events-none absolute left-1/2 top-1/4 z-10 w-full max-w-sm -translate-x-1/2 space-y-2 px-6">
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ y: -16, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className={`rounded-2xl border px-4 py-3 text-center backdrop-blur-md ${
                p.kind === "scripture"
                  ? "border-gold-400/60 bg-gradient-to-b from-black/70 to-[#3a2a05]/80"
                  : p.kind === "mission"
                    ? "border-emerald-400/60 bg-black/70"
                    : "border-rose-400/60 bg-black/70"
              }`}
            >
              <p
                className={`font-display text-base ${
                  p.kind === "scripture"
                    ? "text-gold-300"
                    : p.kind === "mission"
                      ? "text-emerald-300"
                      : "text-rose-300"
                }`}
              >
                {p.title}
              </p>
              <p className="mt-0.5 text-sm font-bold text-white/90">{p.body}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

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
