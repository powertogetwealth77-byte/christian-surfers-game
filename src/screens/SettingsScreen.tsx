import type { SaveData } from "../types";
import { Button } from "../components/Button";
import { sound } from "../audio/SoundEngine";

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
    <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/5 p-4">
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
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${
          value ? "bg-gold-500" : "bg-white/15"
        }`}
      >
        <span
          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
            value ? "left-7" : "left-1"
          }`}
        />
      </button>
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
          desc="Hear scriptures spoken aloud during gameplay"
          value={s.voiceScriptures}
          onChange={(voiceScriptures) => set({ voiceScriptures })}
        />

        <Button variant="secondary" onClick={onInstall} className="w-full py-4">
          📲 Add to Home Screen
        </Button>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
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
