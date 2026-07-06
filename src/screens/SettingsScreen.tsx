import { useEffect, useState } from "react";
import type { SaveData } from "../types";
import { Button } from "../components/Button";
import { sound, type VoiceStatus } from "../audio/SoundEngine";

const VOICE_STATUS_META: Record<VoiceStatus, { dot: string; label: string }> = {
  ready: { dot: "#22c55e", label: "🎙️ Voice Ready" },
  "needs-tap": { dot: "#eab308", label: "👆 Tap Test to Enable" },
  loading: { dot: "#3b82f6", label: "⏳ Loading Voices…" },
  muted: { dot: "#9ca3af", label: "🔇 Voice Off" },
  "not-supported": { dot: "#ef4444", label: "⚠️ Not Supported on This Browser" },
};

function VoiceStatusIndicator() {
  const [status, setStatus] = useState<VoiceStatus>(() => sound.getVoiceStatus());
  useEffect(() => {
    const id = setInterval(() => setStatus(sound.getVoiceStatus()), 1000);
    return () => clearInterval(id);
  }, []);
  const meta = VOICE_STATUS_META[status];
  return (
    <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 backdrop-blur-md">
      <span
        className="h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ background: meta.dot, boxShadow: `0 0 6px ${meta.dot}` }}
      />
      <span className="text-xs font-extrabold text-white/85">{meta.label}</span>
    </div>
  );
}

type Settings = SaveData["settings"];

function Toggle({
  label,
  desc,
  value,
  onChange,
}: {
  label: string;
  desc: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
      <div>
        <p className="font-extrabold">{label}</p>
        <p className="text-sm text-white/60">{desc}</p>
      </div>
      <button
        onClick={() => {
          sound.unlock();
          sound.play("click");
          onChange(!value);
        }}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-all active:scale-95 ${
          value ? "bg-gold-500 shadow-md shadow-gold-500/30" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all ${
            value ? "left-7" : "left-1"
          }`}
        />
      </button>
    </div>
  );
}

function Slider({
  label,
  desc,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  desc: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
      <div className="flex items-center justify-between">
        <p className="font-extrabold">{label}</p>
        <span className="rounded-full bg-black/40 px-2.5 py-0.5 text-sm font-bold text-gold-300">
          {format(value)}
        </span>
      </div>
      <p className="text-sm text-white/60">{desc}</p>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-black/30 accent-gold-500"
      />
    </div>
  );
}

export function SettingsScreen({
  save,
  onChange,
  onInstall,
  onBack,
}: {
  save: SaveData;
  onChange: (s: Settings) => void;
  onInstall: () => void;
  onBack: () => void;
}) {
  const s = save.settings;
  const set = (patch: Partial<Settings>) => onChange({ ...s, ...patch });

  return (
    <div className="safe-top safe-bottom flex h-full flex-col bg-gradient-to-b from-night via-[#16204a] to-[#321a4a] px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <h2 className="font-display text-2xl text-gold-400">SETTINGS</h2>
        <div className="w-16" />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        <Toggle
          label="🔇 Mute All Sound"
          desc="Silences every sound effect and music"
          value={s.muted}
          onChange={(muted) => set({ muted })}
        />
        <Toggle
          label="🎵 Music"
          desc="Gentle worship pad while you run"
          value={s.music}
          onChange={(music) => set({ music })}
        />
        <Toggle
          label="📳 Haptics"
          desc="Vibration on collisions (supported phones)"
          value={s.haptics}
          onChange={(haptics) => set({ haptics })}
        />
        <Toggle
          label="💥 Screen Shake"
          desc="Camera shake on impacts and near-catches"
          value={s.screenShake}
          onChange={(screenShake) => set({ screenShake })}
        />
        <Toggle
          label="🗣️ Voice Scriptures"
          desc="Hear the Word spoken in warm heavenly encouragement"
          value={s.voiceScriptures}
          onChange={(voiceScriptures) => set({ voiceScriptures })}
        />
        {s.voiceScriptures && (
          <>
            <Slider
              label="🔊 Voice Volume"
              desc="Loudness of the spoken scripture"
              value={s.voiceVolume}
              min={0.1}
              max={1}
              step={0.1}
              format={(v) => `${Math.round(v * 100)}%`}
              onChange={(voiceVolume) => set({ voiceVolume })}
            />
            <Slider
              label="⏱️ Scripture Interval"
              desc="Time between spoken scriptures during a run"
              value={s.scriptureIntervalMin}
              min={1}
              max={10}
              step={1}
              format={(v) => `${v} min`}
              onChange={(scriptureIntervalMin) => set({ scriptureIntervalMin })}
            />
            {/* Voice Gender selector */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="font-extrabold">🎙️ Voice Gender</p>
              <p className="mb-3 text-sm text-white/60">
                Choose the voice character for spoken scriptures
              </p>
              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "auto", label: "Auto Best" },
                    { id: "male", label: "Male" },
                    { id: "female", label: "Female" },
                  ] as const
                ).map((g) => (
                  <button
                    key={g.id}
                    onClick={() => {
                      sound.play("click");
                      sound.setVoiceGender(g.id);
                      set({ voiceGender: g.id });
                    }}
                    className={`rounded-xl border-2 px-2 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                      s.voiceGender === g.id
                        ? "border-gold-400 bg-gold-400/20 text-gold-200"
                        : "border-white/15 bg-white/5 text-white/70"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
              <VoiceStatusIndicator />
              <button
                onClick={() => {
                  sound.testVoice();
                }}
                className="mt-3 w-full rounded-xl border border-gold-400/40 bg-gold-400/10 py-2.5 text-sm font-extrabold text-gold-300 shadow-lg shadow-gold-400/10 transition-all active:scale-95"
              >
                ▶ Test Voice
              </button>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-lg shadow-black/20 backdrop-blur-md">
              <p className="font-extrabold">📖 Scripture Mode</p>
              <p className="mb-3 text-sm text-white/60">
                Full Scripture speaks every complete verse — the default for memorization
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { id: "full", label: "Full Scripture" },
                    { id: "memory", label: "Memory" },
                    { id: "repeat", label: "Repeat After Me" },
                    { id: "encouragement", label: "Encouragement" },
                  ] as const
                ).map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      sound.play("click");
                      set({ scriptureMode: m.id });
                    }}
                    className={`rounded-xl border-2 px-2 py-2 text-xs font-extrabold transition-all active:scale-95 ${
                      s.scriptureMode === m.id
                        ? "border-gold-400 bg-gold-400/20 text-gold-200"
                        : "border-white/15 bg-white/5 text-white/70"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        <Button variant="secondary" onClick={onInstall} className="w-full py-4">
          📲 Add to Home Screen
        </Button>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center shadow-lg shadow-black/20 backdrop-blur-md">
          <p className="font-display text-lg text-gold-400">CHRISTIAN SURFERS</p>
          <p className="text-sm text-white/60">Run in the Light · Demo v0.1</p>
          <p className="mt-2 text-xs italic text-white/45">
            "The LORD is my light and my salvation" — Psalm 27:1
          </p>
        </div>
      </div>
    </div>
  );
}
