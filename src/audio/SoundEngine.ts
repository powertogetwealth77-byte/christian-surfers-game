/**
 * Procedural sound engine built on the Web Audio API.
 * No audio files needed — every effect is synthesized.
 */

export type SfxName =
  | "click"
  | "characterSelect"
  | "startRun"
  | "coin"
  | "scroll"
  | "crown"
  | "key"
  | "gem"
  | "jump"
  | "slide"
  | "laneSwitch"
  | "collision"
  | "shieldBreak"
  | "powerUp"
  | "satanWarning"
  | "gameOver"
  | "missionComplete"
  | "reward"
  | "combo"
  | "perfectDodge"
  | "sprint"
  | "dash"
  | "wave"
  | "armor"
  | "surge"
  | "achievement";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicTension = 0; // 0=calm, 1=urgent (updated from GameScreen)
  private lastScriptureSpoken = 0; // timestamp of last spoken scripture
  private coinStep = 0; // rising pitch index for coin streaks
  private lastCoinAt = 0; // timestamp of last coin (for streak window)
  private lastHeartbeat = 0; // throttle the Accuser heartbeat
  muted = false;
  musicEnabled = true;
  voiceEnabled = false;

  // A major pentatonic ladder — coins climbing it sound musical, never random.
  private static readonly PENTA = [
    523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
  ];

  private ensure(): AudioContext | null {
    if (typeof window === "undefined") return null;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.16;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  /** Must be called from a user gesture once to unlock audio on mobile. */
  unlock() {
    this.ensure();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  }

  setTension(t: number) {
    this.musicTension = Math.max(0, Math.min(1, t));
  }

  setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  /** Speak a scripture verse (periodically during gameplay). */
  speakScripture(ref: string, text: string) {
    if (!this.voiceEnabled || this.muted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const now = Date.now();
    // Throttle to once every 5 seconds minimum
    if (now - this.lastScriptureSpoken < 5000) return;
    this.lastScriptureSpoken = now;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(`${ref}. ${text}`);
    utterance.rate = 0.85; // Slower, more reverent pace
    utterance.pitch = 1;
    utterance.volume = 0.7;

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      // Silently fail if speech synthesis is not available or throws
    }
  }

  private tone(
    freq: number,
    opts: {
      type?: OscillatorType;
      dur?: number;
      vol?: number;
      delay?: number;
      slideTo?: number;
      out?: AudioNode;
    } = {},
  ) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const {
      type = "sine",
      dur = 0.15,
      vol = 0.3,
      delay = 0,
      slideTo,
      out = this.master,
    } = opts;
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo !== undefined) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    }
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain).connect(out);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  private noise(opts: { dur?: number; vol?: number; delay?: number } = {}) {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const { dur = 0.2, vol = 0.2, delay = 0 } = opts;
    const t0 = ctx.currentTime + delay;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 1200;
    src.connect(filter).connect(gain).connect(this.master);
    src.start(t0);
  }

  /**
   * Musical coin pickup: consecutive coins climb the pentatonic ladder so a
   * coin run plays a rising melody (Subway Surfers-style satisfaction).
   */
  playCoin() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.lastCoinAt > 650) this.coinStep = 0;
    this.lastCoinAt = now;
    const scale = SoundEngine.PENTA;
    const f = scale[Math.min(this.coinStep, scale.length - 1)];
    this.coinStep++;
    this.tone(f, { type: "triangle", dur: 0.1, vol: 0.22 });
    this.tone(f * 2, { type: "sine", dur: 0.12, vol: 0.1, delay: 0.02 });
  }

  /** Ascending arpeggio whose length grows with the combo — the chain "sings". */
  playComboMelody(count: number) {
    const notes = Math.max(3, Math.min(6, 2 + Math.floor(count / 5)));
    const base = 523.25;
    const steps = [0, 2, 4, 7, 9, 12]; // major-ish climb (semitones)
    for (let i = 0; i < notes; i++) {
      const f = base * Math.pow(2, steps[i] / 12);
      this.tone(f, { type: "triangle", dur: 0.1, vol: 0.2, delay: i * 0.05 });
    }
    // Sparkle cap on the top note.
    this.tone(base * 2.5, { type: "sine", dur: 0.18, vol: 0.14, delay: notes * 0.05 });
  }

  /** Low double-thump heartbeat — pulses faster/louder as the Accuser nears. */
  heartbeat(intensity: number) {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    const interval = 760 - intensity * 360; // 760ms calm → ~400ms when close
    if (now - this.lastHeartbeat < interval) return;
    this.lastHeartbeat = now;
    const v = 0.12 + intensity * 0.22;
    this.tone(70, { type: "sine", dur: 0.16, vol: v, slideTo: 45 });
    this.tone(64, { type: "sine", dur: 0.18, vol: v * 0.85, delay: 0.16, slideTo: 40 });
  }

  /**
   * Unlock fanfare whose grandeur scales with rarity order (0 common → 4
   * kingdom): a rising chord stack capped by a shimmering bell. The brand's
   * "you earned something" signature.
   */
  playUnlock(order: number) {
    const root = 392; // G4
    const major = [0, 4, 7, 12, 16, 19]; // stacked major intervals
    const notes = 3 + Math.min(3, order); // bigger rarities = fuller chord
    for (let i = 0; i < notes; i++) {
      const f = root * Math.pow(2, major[i] / 12);
      this.tone(f, { type: "triangle", dur: 0.5, vol: 0.2, delay: i * 0.07 });
    }
    // Shimmer bell on top, brighter the rarer it is.
    this.tone(root * 4, { type: "sine", dur: 0.6, vol: 0.16 + order * 0.02, delay: notes * 0.07 });
    if (order >= 3) {
      // Legendary/Kingdom: add a low triumphant swell.
      this.tone(root / 2, { type: "sawtooth", dur: 0.8, vol: 0.18, delay: 0.1 });
    }
  }

  play(name: SfxName) {
    switch (name) {
      case "achievement":
        this.tone(659, { type: "triangle", dur: 0.12, vol: 0.26 });
        this.tone(880, { type: "triangle", dur: 0.12, vol: 0.26, delay: 0.1 });
        this.tone(1318, { type: "sine", dur: 0.4, vol: 0.24, delay: 0.2 });
        break;
      case "click":
        this.tone(660, { type: "triangle", dur: 0.06, vol: 0.25 });
        this.tone(990, { type: "sine", dur: 0.08, vol: 0.15, delay: 0.03 });
        break;
      case "characterSelect":
        this.tone(523, { type: "triangle", dur: 0.1, vol: 0.3 });
        this.tone(659, { type: "triangle", dur: 0.1, vol: 0.3, delay: 0.08 });
        this.tone(784, { type: "triangle", dur: 0.18, vol: 0.32, delay: 0.16 });
        break;
      case "startRun":
        this.tone(392, { type: "sawtooth", dur: 0.12, vol: 0.2 });
        this.tone(523, { type: "sawtooth", dur: 0.12, vol: 0.2, delay: 0.1 });
        this.tone(659, { type: "sawtooth", dur: 0.12, vol: 0.2, delay: 0.2 });
        this.tone(784, { type: "square", dur: 0.3, vol: 0.22, delay: 0.3 });
        break;
      case "coin":
        // Satisfying coin ding with resonance
        this.tone(1318, { type: "sine", dur: 0.1, vol: 0.24 });
        this.tone(1760, { type: "triangle", dur: 0.14, vol: 0.2, delay: 0.05 });
        this.tone(2200, { type: "sine", dur: 0.08, vol: 0.12, delay: 0.09 });
        break;
      case "scroll":
        this.tone(880, { type: "triangle", dur: 0.12, vol: 0.28 });
        this.tone(1108, { type: "triangle", dur: 0.14, vol: 0.24, delay: 0.09 });
        this.tone(1318, { type: "sine", dur: 0.3, vol: 0.2, delay: 0.18 });
        break;
      case "crown":
        // Triumphant chord for rare pickup
        this.tone(1046, { type: "triangle", dur: 0.11, vol: 0.28 });
        this.tone(1318, { type: "triangle", dur: 0.12, vol: 0.26, delay: 0.07 });
        this.tone(1568, { type: "sine", dur: 0.28, vol: 0.24, delay: 0.14 });
        this.tone(1046, { type: "sine", dur: 0.2, vol: 0.14, delay: 0.22 });
        break;
      case "key":
        // Metallic key pickup sound
        this.tone(987, { type: "square", dur: 0.08, vol: 0.18 });
        this.tone(1480, { type: "square", dur: 0.12, vol: 0.16, delay: 0.06 });
        this.tone(1974, { type: "triangle", dur: 0.1, vol: 0.1, delay: 0.14 });
        break;
      case "gem":
        // Sparkly gem sound with harmonics
        this.tone(1567, { type: "sine", dur: 0.11, vol: 0.24 });
        this.tone(2093, { type: "sine", dur: 0.18, vol: 0.2, delay: 0.06 });
        this.tone(1046, { type: "triangle", dur: 0.16, vol: 0.14, delay: 0.1 });
        break;
      case "jump":
        this.tone(330, { type: "sine", dur: 0.18, vol: 0.25, slideTo: 660 });
        break;
      case "slide":
        this.noise({ dur: 0.18, vol: 0.14 });
        this.tone(220, { type: "sine", dur: 0.15, vol: 0.15, slideTo: 110 });
        break;
      case "laneSwitch":
        this.tone(440, { type: "triangle", dur: 0.07, vol: 0.18, slideTo: 587 });
        break;
      case "collision":
        this.noise({ dur: 0.3, vol: 0.35 });
        this.tone(150, { type: "sawtooth", dur: 0.3, vol: 0.3, slideTo: 50 });
        break;
      case "shieldBreak":
        this.tone(880, { type: "square", dur: 0.08, vol: 0.25 });
        this.tone(440, { type: "square", dur: 0.15, vol: 0.22, delay: 0.07, slideTo: 220 });
        this.noise({ dur: 0.2, vol: 0.18, delay: 0.05 });
        break;
      case "powerUp":
        this.tone(523, { type: "sawtooth", dur: 0.1, vol: 0.22 });
        this.tone(784, { type: "sawtooth", dur: 0.1, vol: 0.22, delay: 0.08 });
        this.tone(1046, { type: "square", dur: 0.12, vol: 0.2, delay: 0.16 });
        this.tone(1568, { type: "sine", dur: 0.35, vol: 0.22, delay: 0.24 });
        break;
      case "satanWarning":
        this.tone(98, { type: "sawtooth", dur: 0.4, vol: 0.3 });
        this.tone(103, { type: "sawtooth", dur: 0.4, vol: 0.25 });
        break;
      case "gameOver":
        this.tone(440, { type: "sawtooth", dur: 0.3, vol: 0.25, slideTo: 220 });
        this.tone(330, { type: "sawtooth", dur: 0.4, vol: 0.22, delay: 0.25, slideTo: 165 });
        this.tone(220, { type: "sawtooth", dur: 0.8, vol: 0.2, delay: 0.55, slideTo: 110 });
        this.noise({ dur: 0.5, vol: 0.12, delay: 0.1 });
        break;
      case "missionComplete":
        this.tone(659, { type: "triangle", dur: 0.12, vol: 0.28 });
        this.tone(784, { type: "triangle", dur: 0.12, vol: 0.28, delay: 0.1 });
        this.tone(987, { type: "triangle", dur: 0.12, vol: 0.28, delay: 0.2 });
        this.tone(1318, { type: "sine", dur: 0.4, vol: 0.3, delay: 0.3 });
        break;
      case "reward":
        // Triumphant ascending fanfare
        for (let i = 0; i < 5; i++) {
          this.tone(784 + i * 196, {
            type: "triangle",
            dur: 0.14,
            vol: 0.22,
            delay: i * 0.06,
          });
        }
        // Bass support
        this.tone(392, { type: "sine", dur: 0.35, vol: 0.18, delay: 0.05 });
        break;
      case "combo":
        // Snappy, punchy combo hit
        this.tone(660, { type: "triangle", dur: 0.08, vol: 0.26 });
        this.tone(880, { type: "triangle", dur: 0.08, vol: 0.26, delay: 0.06 });
        this.tone(1108, { type: "sine", dur: 0.2, vol: 0.28, delay: 0.12 });
        this.tone(1320, { type: "sine", dur: 0.15, vol: 0.16, delay: 0.16 });
        break;
      case "perfectDodge":
        this.tone(880, { type: "sine", dur: 0.1, vol: 0.24, slideTo: 1760 });
        this.tone(2217, { type: "sine", dur: 0.08, vol: 0.14, delay: 0.07 });
        break;
      case "sprint":
        this.noise({ dur: 0.35, vol: 0.2 });
        this.tone(330, { type: "sawtooth", dur: 0.4, vol: 0.22, slideTo: 990 });
        this.tone(660, { type: "square", dur: 0.2, vol: 0.14, delay: 0.2, slideTo: 1320 });
        break;
      case "dash":
        this.noise({ dur: 0.18, vol: 0.22 });
        this.tone(523, { type: "sine", dur: 0.22, vol: 0.26, slideTo: 1568 });
        break;
      case "wave":
        this.noise({ dur: 0.5, vol: 0.28 });
        this.tone(440, { type: "sine", dur: 0.45, vol: 0.22, slideTo: 110 });
        this.tone(880, { type: "triangle", dur: 0.3, vol: 0.12, delay: 0.1, slideTo: 220 });
        break;
      case "armor":
        this.tone(392, { type: "square", dur: 0.09, vol: 0.22 });
        this.tone(523, { type: "square", dur: 0.09, vol: 0.2, delay: 0.08 });
        this.tone(784, { type: "triangle", dur: 0.25, vol: 0.24, delay: 0.16 });
        break;
      case "surge":
        // Full triumphant fanfare — the biggest pickup in the game.
        this.tone(523, { type: "sawtooth", dur: 0.14, vol: 0.22 });
        this.tone(659, { type: "sawtooth", dur: 0.14, vol: 0.22, delay: 0.1 });
        this.tone(784, { type: "sawtooth", dur: 0.14, vol: 0.22, delay: 0.2 });
        this.tone(1046, { type: "square", dur: 0.4, vol: 0.24, delay: 0.3 });
        this.tone(1318, { type: "sine", dur: 0.5, vol: 0.2, delay: 0.4 });
        this.tone(261, { type: "triangle", dur: 0.7, vol: 0.18, delay: 0.3 });
        break;
    }
  }

  /** Worship-pad ambient loop, tension-aware: calm pads when safe, urgent low pulse when Satan is close. */
  startMusic() {
    if (!this.musicEnabled || this.musicTimer !== null) return;
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;

    // Two chord progressions: peaceful I-V-vi-IV and dark i-VI-III-VII (minor).
    const calmChords = [
      [261.6, 329.6, 392.0],  // C major
      [196.0, 246.9, 392.0],  // G major
      [220.0, 261.6, 329.6],  // A minor
      [174.6, 220.0, 349.2],  // F major
    ];
    const tenseChords = [
      [220.0, 261.6, 329.6],  // A minor
      [130.8, 164.8, 196.0],  // C major (low)
      [164.8, 207.7, 246.9],  // E minor
      [146.8, 184.9, 220.0],  // D minor
    ];

    const playBar = () => {
      if (this.muted || !this.musicEnabled) return;
      const urgent = this.musicTension > 0.6;
      const chords = urgent ? tenseChords : calmChords;
      const chord = chords[this.musicStep % chords.length];
      this.musicStep++;

      // Gain targets: pads quieter when tense so percussion-style pulse pops.
      const padVol = urgent ? 0.3 : 0.5;
      const harmVol = urgent ? 0.06 : 0.12;

      for (const f of chord) {
        this.tone(f, { type: "sine", dur: 1.9, vol: padVol, out: this.musicGain! });
        this.tone(f * 2, { type: "triangle", dur: 1.9, vol: harmVol, out: this.musicGain! });
      }

      // Danger: add a low doom pulse on the bass note.
      if (urgent) {
        this.tone(chord[0] / 2, {
          type: "sawtooth", dur: 0.4, vol: 0.28, out: this.musicGain!,
        });
        this.tone(chord[0] / 2, {
          type: "sawtooth", dur: 0.3, vol: 0.2, delay: 0.5, out: this.musicGain!,
        });
      }
    };

    playBar();
    // Bars are shorter when tense — faster tempo.
    const barMs = () => this.musicTension > 0.6 ? 1400 : 2000;
    const schedule = () => {
      if (this.musicTimer === null) return;
      playBar();
      this.musicTimer = window.setTimeout(schedule, barMs()) as unknown as number;
    };
    this.musicTimer = window.setTimeout(schedule, barMs()) as unknown as number;
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      clearInterval(this.musicTimer); // safety for both timer styles
      this.musicTimer = null;
    }
  }
}

export const sound = new SoundEngine();
