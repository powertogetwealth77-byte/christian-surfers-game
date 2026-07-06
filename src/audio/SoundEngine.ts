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
  | "achievement"
  | "spiritOfTheLord"
  | "shoeEquip"
  | "coinStreak"
  | "finishLineApproach"
  | "finishLineGate"
  | "victoryFanfare"
  | "accuserFall"
  | "chainsBreak"
  | "heavenlyCheer";

export type VoiceStatus = "ready" | "needs-tap" | "loading" | "muted" | "not-supported";

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private musicTension = 0; // 0=calm, 1=urgent (updated from GameScreen)
  private finishApproach = 0; // 0=none, 1=final 60s, 2=final 15s (Phase 16.1)
  private lastScriptureSpoken = 0; // timestamp of last spoken scripture
  private coinStep = 0; // rising pitch index for coin streaks
  private lastCoinAt = 0; // timestamp of last coin (for streak window)
  private lastHeartbeat = 0; // throttle the Accuser heartbeat
  private cachedVoice: SpeechSynthesisVoice | null = null;
  private voiceGender: "male" | "female" | "auto" = "auto";
  private speechUnlocked = false;
  private visibilityHandler: (() => void) | null = null;
  private ambientNodes: { stop: () => void } | null = null;
  private ambientVenue: string | null = null;
  private ambientNoiseBuffer: AudioBuffer | null = null;
  muted = false;
  musicEnabled = true;
  voiceEnabled = false;
  voiceVolume = 0.8;

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
    const ctx = this.ensure();
    // On iOS/Android the AudioContext starts suspended; resume it inside a gesture.
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
    // Warm up speechSynthesis voices cache — mobile browsers load voices lazily.
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) {
        // voices not ready yet; listen for the event and cache when ready
        const onVoicesChanged = () => {
          this.cachedVoice = null; // force re-select with the now-loaded list
          window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
        };
        window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
      } else {
        // Pre-select best voice now so first scripture fires instantly
        if (!this.cachedVoice) this.cachedVoice = this.selectBestVoice(this.voiceGender);
      }

      // iOS/Safari stalls speechSynthesis after a page visibility change.
      // Cancel + re-queue or resume when the app comes back to foreground.
      if (!this.visibilityHandler) {
        this.visibilityHandler = () => {
          if (document.visibilityState === "visible") {
            // Resume AudioContext if iOS suspended it while backgrounded.
            if (this.ctx && this.ctx.state === "suspended") {
              void this.ctx.resume();
            }
            // Kick the speechSynthesis queue out of stall state.
            // iOS Safari freezes the synth after backgrounding; cancel + re-queue
            // is the only reliable recovery — we don't re-queue here (no pending
            // verse reference available), but clearing the queue unstalls it for
            // the next verse that fires naturally.
            try { window.speechSynthesis.cancel(); } catch { /* noop */ }
            // Invalidate voice cache — device may have changed audio route
            this.cachedVoice = null;
          }
        };
        document.addEventListener("visibilitychange", this.visibilityHandler);
      }
    }
    this.speechUnlocked = true;
  }

  getSpeechUnlocked(): boolean {
    return this.speechUnlocked;
  }

  /** Add natural pauses for kid-friendly delivery pacing (§3). */
  private addNaturalPauses(text: string): string {
    return text
      .replace(/,/g, ", ")
      .replace(/;/g, "; ")
      .replace(/:/g, ": ")
      .replace(/\. /g, "... ");
  }

  /**
   * Try to speak a scripture verse; marks speechUnlocked on successful start.
   * If the utterance doesn't start within 1.5s, a possible-silenced flag is set.
   * Returns true if speech synthesis is available (even if possibly silenced).
   */
  trySpeakScripture(
    ref: string,
    text: string,
    mode: "full" | "memory" | "repeat" | "encouragement" = "full",
    onSpeechStart?: () => void,
    onSpeechEnd?: () => void,
  ): boolean {
    if (!this.voiceEnabled || this.muted) return false;
    if (typeof window === "undefined" || !window.speechSynthesis) return false;

    const now = Date.now();
    if (now - this.lastScriptureSpoken < 5000) return true;
    this.lastScriptureSpoken = now;

    window.speechSynthesis.cancel();

    const paced = this.addNaturalPauses(text);
    const intro =
      mode === "repeat"
        ? "Repeat after me."
        : mode === "encouragement"
          ? "Be encouraged."
          : mode === "memory"
            ? "Remember this verse."
            : null;

    const speakMain = () => {
      const mainText = `${paced} ${ref}.`;
      const utt = new SpeechSynthesisUtterance(mainText);
      utt.rate = 0.82;
      utt.pitch = 1.0;
      utt.volume = this.voiceVolume;
      try {
        if (!this.cachedVoice) this.cachedVoice = this.selectBestVoice(this.voiceGender);
        if (this.cachedVoice) utt.voice = this.cachedVoice;
      } catch { /* ignore */ }
      // If utterance doesn't start in 1.5s, it may be silenced (browser policy).
      const silenceCheck = setTimeout(() => {
        // speechUnlocked stays false — GameScreen can show the tap-to-enable banner.
      }, 1500);
      utt.onstart = () => {
        clearTimeout(silenceCheck);
        this.speechUnlocked = true;
        onSpeechStart?.();
      };
      utt.onend = () => { onSpeechEnd?.(); };
      try { window.speechSynthesis.speak(utt); } catch { /* ignore */ }
    };

    this.duckMusic(Math.max(4, Math.min(9, text.length * 0.08)));

    if (intro) {
      const introUtt = new SpeechSynthesisUtterance(intro);
      introUtt.rate = 0.82;
      introUtt.pitch = 1.0;
      introUtt.volume = this.voiceVolume;
      try {
        if (!this.cachedVoice) this.cachedVoice = this.selectBestVoice(this.voiceGender);
        if (this.cachedVoice) introUtt.voice = this.cachedVoice;
      } catch { /* ignore */ }
      introUtt.onend = speakMain;
      introUtt.onstart = () => { this.speechUnlocked = true; };
      try { window.speechSynthesis.speak(introUtt); } catch { /* ignore */ }
    } else {
      speakMain();
    }

    return true;
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.5;
    // Stop the ambient bed on mute, but remember the venue for a later restart.
    if (muted) {
      if (this.ambientNodes) {
        try { this.ambientNodes.stop(); } catch { /* noop */ }
        this.ambientNodes = null;
      }
    } else if (this.ambientVenue && !this.ambientNodes) {
      // Unmuted again with a remembered venue and no live bed — gently restart it.
      this.startVenueAmbient(this.ambientVenue);
    }
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    if (!enabled) this.stopMusic();
  }

  setTension(t: number) {
    this.musicTension = Math.max(0, Math.min(1, t));
  }

  /**
   * Phase 16.1 — finish-line adrenaline. Layers holy tension onto the worship
   * music as the race nears its end. 0 = normal, 1 = final 60s (rising pulse +
   * warm cinematic heartbeat), 2 = final 15s (victory swell + golden shimmer).
   * Everything routes through musicGain, so scripture voice still ducks it and
   * the mute / music toggles stay in full control.
   */
  setFinishApproach(level: number) {
    this.finishApproach = Math.max(0, Math.min(2, Math.round(level)));
  }

  setVoiceEnabled(enabled: boolean) {
    this.voiceEnabled = enabled;
  }

  setVoiceVolume(v: number) {
    this.voiceVolume = Math.max(0, Math.min(1, v));
  }

  setVoiceGender(gender: "male" | "female" | "auto") {
    this.voiceGender = gender;
    this.cachedVoice = null; // invalidate cache so next speak re-selects
  }

  /**
   * Score and select the best available TTS voice for the given gender preference.
   * Higher score = more natural/preferred.
   */
  selectBestVoice(gender: "male" | "female" | "auto"): SpeechSynthesisVoice | null {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    // Mobile browsers may not have loaded voices yet — fall back gracefully.
    // The voiceschanged listener in unlock() will invalidate cachedVoice when ready.
    if (!voices.length) return null;

    const maleNames = /daniel|david|alex|thomas|james|george|oliver|fred|ralph|bruce|junior|male/i;
    const femaleNames = /samantha|karen|victoria|ava|siri|allison|susan|zoe|moana|tessa|nicky|female|fiona/i;

    const scored = voices.map((v) => {
      let score = 0;
      const name = v.name.toLowerCase();
      const lang = v.lang.toLowerCase();

      // Naturalness bonus
      if (/natural|neural|enhanced|premium/.test(name)) score += 20;
      // Penalize compact/low-quality voices
      if (/compact/.test(name)) score -= 15;

      // English locale preference
      if (lang.startsWith("en-us")) score += 10;
      else if (lang.startsWith("en-gb")) score += 7;
      else if (lang.startsWith("en")) score += 4;
      else score -= 5; // non-English

      // Gender matching
      if (gender === "male") {
        if (maleNames.test(v.name)) score += 25;
        if (femaleNames.test(v.name)) score -= 20;
      } else if (gender === "female") {
        if (femaleNames.test(v.name)) score += 25;
        if (maleNames.test(v.name)) score -= 20;
      }

      // Well-known good voices
      if (/google us english/i.test(v.name)) score += 12;
      if (/google uk english/i.test(v.name)) score += 8;

      return { voice: v, score };
    });

    scored.sort((a, b) => b.score - a.score);
    return scored[0]?.voice ?? null;
  }

  /** Speak a short preview phrase so the user can hear the selected voice. */
  previewVoice() {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const best = this.selectBestVoice(this.voiceGender);
    const utt = new SpeechSynthesisUtterance("The joy of the LORD is your strength.");
    utt.rate = 0.9;
    utt.pitch = 1.02;
    utt.volume = this.voiceVolume;
    if (best) utt.voice = best;
    try {
      window.speechSynthesis.speak(utt);
    } catch {
      // silently fail
    }
  }

  /** Current voice readiness, for the Settings status indicator. */
  getVoiceStatus(): VoiceStatus {
    if (typeof window === "undefined" || !window.speechSynthesis) return "not-supported";
    if (this.muted || !this.voiceEnabled) return "muted";
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return "loading";
    if (!this.speechUnlocked) return "needs-tap";
    return "ready";
  }

  /** Force speech unlock + preview — works as a real "enable" tap on mobile. */
  testVoice() {
    this.unlock();
    this.previewVoice();
  }

  /** Gently duck the worship pad for ~`seconds` while a scripture is spoken. */
  private duckMusic(seconds: number) {
    const ctx = this.ensure();
    if (!ctx || !this.musicGain) return;
    const g = this.musicGain.gain;
    const now = ctx.currentTime;
    g.cancelScheduledValues(now);
    g.setValueAtTime(g.value, now);
    g.linearRampToValueAtTime(0.05, now + 0.4);
    g.setValueAtTime(0.05, now + seconds);
    g.linearRampToValueAtTime(0.16, now + seconds + 0.8);
  }

  /**
   * Speak a COMPLETE scripture verse (Section 3A). The full KJV text is always
   * spoken — never shortened or mixed. `mode` only changes the warm framing
   * around the verse; one verse plays at a time (prior speech is cancelled).
   */
  speakScripture(ref: string, text: string, mode: "full" | "memory" | "repeat" | "encouragement" = "full") {
    if (!this.voiceEnabled || this.muted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const now = Date.now();
    // Throttle to once every 5 seconds minimum
    if (now - this.lastScriptureSpoken < 5000) return;
    this.lastScriptureSpoken = now;

    // Cancel any ongoing speech — never overlap or interrupt one verse with another.
    window.speechSynthesis.cancel();

    // The full verse is always spoken; framing differs by mode only.
    const spoken =
      mode === "repeat"
        ? `Repeat after me. ${text}`
        : mode === "encouragement"
          ? `Be encouraged. ${text} ${ref}.`
          : mode === "memory"
            ? `Remember this verse. ${text} ${ref}.`
            : `${text} ${ref}.`;

    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.rate = 0.82;
    utterance.pitch = 1.0;
    utterance.volume = this.voiceVolume;

    // Select and cache the best available voice for the current gender preference.
    try {
      if (!this.cachedVoice) {
        this.cachedVoice = this.selectBestVoice(this.voiceGender);
      }
      if (this.cachedVoice) utterance.voice = this.cachedVoice;
    } catch {
      // getVoices may be empty on first call — fall back to default voice.
    }

    // Gently lower the worship pad so the Word is clear above the music.
    this.duckMusic(Math.max(4, Math.min(9, text.length * 0.08)));

    utterance.onstart = () => { this.speechUnlocked = true; };
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

  /** Gentle "heavenly shimmer" — two sine waves with a reverb-like shimmer effect. */
  playScriptureChime() {
    const ctx = this.ensure();
    if (!ctx || !this.master || this.muted) return;
    const dur = 0.8;
    // Primary shimmer tones
    this.tone(880, { type: "sine", dur, vol: 0.12 });
    this.tone(1108, { type: "sine", dur, vol: 0.1, delay: 0.02 });
    // Delayed echoes for reverb-like quality
    this.tone(880, { type: "sine", dur: 0.5, vol: 0.07, delay: 0.15 });
    this.tone(1108, { type: "sine", dur: 0.45, vol: 0.06, delay: 0.18 });
    this.tone(1320, { type: "sine", dur: 0.4, vol: 0.05, delay: 0.3 });
  }

  /** Triumphant C-major chord fanfare for scripture mastery. */
  playMasteryFanfare() {
    if (this.muted) return;
    // C major triad: C5 (523 Hz), E5 (659 Hz), G5 (784 Hz)
    this.tone(523, { type: "triangle", dur: 1.2, vol: 0.22 });
    this.tone(659, { type: "triangle", dur: 1.2, vol: 0.2, delay: 0.06 });
    this.tone(784, { type: "triangle", dur: 1.2, vol: 0.2, delay: 0.12 });
    // Choir-like upper harmony
    this.tone(1046, { type: "sine", dur: 1.0, vol: 0.14, delay: 0.18 });
    this.tone(1318, { type: "sine", dur: 0.8, vol: 0.1, delay: 0.28 });
    // Bass warmth
    this.tone(261, { type: "sine", dur: 1.2, vol: 0.18, delay: 0.04 });
  }

  /** Single soft bell tone when scripture card appears. */
  playScriptureCardAppear() {
    if (this.muted) return;
    this.tone(660, { type: "sine", dur: 0.4, vol: 0.18 });
    this.tone(990, { type: "sine", dur: 0.25, vol: 0.08, delay: 0.06 });
  }

  /** Majestic ascending chord for Spirit of the Lord activation. */
  playSpiritOfTheLord() {
    this.play("spiritOfTheLord");
  }

  /** Warm rising two-note chime for friendship level-ups. */
  playFriendshipLevelUp() {
    if (this.muted) return;
    // Two warm ascending notes (G4 -> C5) with a soft shimmer on top.
    this.tone(392, { type: "triangle", dur: 0.35, vol: 0.22 });
    this.tone(523, { type: "triangle", dur: 0.5, vol: 0.22, delay: 0.16 });
    this.tone(1046, { type: "sine", dur: 0.4, vol: 0.1, delay: 0.22 });
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
      case "spiritOfTheLord":
        // Majestic ascending horn + choir shimmer — weighty but not chaotic.
        this.tone(261, { type: "triangle", dur: 0.5, vol: 0.2 });
        this.tone(329, { type: "triangle", dur: 0.5, vol: 0.2, delay: 0.1 });
        this.tone(392, { type: "triangle", dur: 0.6, vol: 0.22, delay: 0.2 });
        this.tone(523, { type: "triangle", dur: 0.8, vol: 0.24, delay: 0.32 });
        this.tone(784, { type: "sine", dur: 1.0, vol: 0.18, delay: 0.5 });
        this.tone(1046, { type: "sine", dur: 0.8, vol: 0.14, delay: 0.65 });
        this.tone(1568, { type: "sine", dur: 0.5, vol: 0.1, delay: 0.82 });
        break;
      case "shoeEquip":
        // Satisfying swoosh + sparkle — lighter than achievement.
        this.noise({ dur: 0.08, vol: 0.15 });
        this.tone(880, { type: "sine", dur: 0.12, vol: 0.22, slideTo: 1320 });
        this.tone(1760, { type: "sine", dur: 0.18, vol: 0.15, delay: 0.1 });
        break;
      case "coinStreak":
        // Rising excited arpeggio — more energetic than a regular coin.
        this.tone(1318, { type: "triangle", dur: 0.07, vol: 0.22 });
        this.tone(1568, { type: "triangle", dur: 0.07, vol: 0.22, delay: 0.05 });
        this.tone(1760, { type: "triangle", dur: 0.08, vol: 0.24, delay: 0.1 });
        this.tone(2093, { type: "sine", dur: 0.18, vol: 0.2, delay: 0.15 });
        break;
      case "finishLineApproach":
        // Exciting ascending horn — "you're almost there!"
        this.tone(392, { type: "triangle", dur: 0.18, vol: 0.22 });
        this.tone(523, { type: "triangle", dur: 0.18, vol: 0.22, delay: 0.15 });
        this.tone(659, { type: "triangle", dur: 0.22, vol: 0.24, delay: 0.3 });
        this.tone(784, { type: "sine", dur: 0.55, vol: 0.26, delay: 0.48 });
        break;
      case "finishLineGate":
        // Heavenly gate opening — shimmering, ethereal, awe-inspiring.
        this.tone(523, { type: "sine", dur: 0.4, vol: 0.2 });
        this.tone(659, { type: "sine", dur: 0.4, vol: 0.2, delay: 0.1 });
        this.tone(784, { type: "sine", dur: 0.5, vol: 0.22, delay: 0.22 });
        this.tone(1046, { type: "sine", dur: 0.7, vol: 0.2, delay: 0.38 });
        this.tone(1318, { type: "sine", dur: 0.8, vol: 0.18, delay: 0.56 });
        this.tone(1568, { type: "sine", dur: 0.7, vol: 0.14, delay: 0.72 });
        this.tone(2093, { type: "sine", dur: 0.5, vol: 0.1, delay: 0.88 });
        break;
      case "victoryFanfare":
        // Glorious triumph — 8-note ascending fanfare, choir-like.
        this.tone(261, { type: "triangle", dur: 0.22, vol: 0.24 });
        this.tone(329, { type: "triangle", dur: 0.22, vol: 0.24, delay: 0.16 });
        this.tone(392, { type: "triangle", dur: 0.22, vol: 0.26, delay: 0.32 });
        this.tone(523, { type: "triangle", dur: 0.28, vol: 0.28, delay: 0.48 });
        this.tone(659, { type: "sawtooth", dur: 0.28, vol: 0.26, delay: 0.66 });
        this.tone(784, { type: "sawtooth", dur: 0.32, vol: 0.28, delay: 0.84 });
        this.tone(1046, { type: "sine", dur: 0.55, vol: 0.28, delay: 1.04 });
        this.tone(1318, { type: "sine", dur: 0.9, vol: 0.26, delay: 1.3 });
        // Harmonic shimmer underneath
        this.tone(130, { type: "triangle", dur: 1.8, vol: 0.16, delay: 0.5 });
        this.tone(196, { type: "triangle", dur: 1.5, vol: 0.14, delay: 0.7 });
        break;
      case "accuserFall":
        // Satan falling backward — descending dissonant crash + impact.
        this.tone(220, { type: "sawtooth", dur: 0.08, vol: 0.28, slideTo: 55 });
        this.noise({ dur: 0.18, vol: 0.3 });
        this.tone(110, { type: "square", dur: 0.3, vol: 0.22, delay: 0.08 });
        break;
      case "chainsBreak":
        // Metal chains shattering — short metallic noise burst + high ping.
        this.noise({ dur: 0.12, vol: 0.28 });
        this.tone(2093, { type: "sine", dur: 0.06, vol: 0.2, delay: 0.04 });
        this.noise({ dur: 0.08, vol: 0.22, delay: 0.15 });
        this.tone(1760, { type: "sine", dur: 0.06, vol: 0.18, delay: 0.18 });
        break;
      case "heavenlyCheer":
        // Warm crowd cheer shimmer — children celebrating victory.
        this.noise({ dur: 0.6, vol: 0.12 });
        this.tone(784, { type: "sine", dur: 0.5, vol: 0.18, delay: 0.05 });
        this.tone(1046, { type: "sine", dur: 0.5, vol: 0.16, delay: 0.18 });
        this.tone(1318, { type: "sine", dur: 0.45, vol: 0.14, delay: 0.32 });
        this.tone(1568, { type: "sine", dur: 0.4, vol: 0.12, delay: 0.44 });
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
      // Finish-line approach also reads as "urgent" so the bed stays warm and
      // makes room for the rising pulse — but it's holy adrenaline, not danger.
      const approaching = this.finishApproach > 0;
      const urgent = this.musicTension > 0.6 || approaching;
      // During the finish run-up we keep the brighter major progression — the
      // feeling is victory pressure, never the minor "danger" colour.
      const chords = urgent && !approaching ? tenseChords : calmChords;
      const chord = chords[this.musicStep % chords.length];
      this.musicStep++;

      // Gain targets: pads quieter when tense so percussion-style pulse pops.
      const padVol = urgent ? 0.3 : 0.5;
      const harmVol = urgent ? 0.06 : 0.12;

      for (const f of chord) {
        this.tone(f, { type: "sine", dur: 1.9, vol: padVol, out: this.musicGain! });
        this.tone(f * 2, { type: "triangle", dur: 1.9, vol: harmVol, out: this.musicGain! });
      }

      // Danger: add a low doom pulse on the bass note (Accuser closing in).
      if (urgent && !approaching) {
        this.tone(chord[0] / 2, {
          type: "sawtooth", dur: 0.4, vol: 0.28, out: this.musicGain!,
        });
        this.tone(chord[0] / 2, {
          type: "sawtooth", dur: 0.3, vol: 0.2, delay: 0.5, out: this.musicGain!,
        });
      }

      // ── Phase 16.1 — holy adrenaline as the finish line nears ──────────────
      if (approaching) {
        // Warm cinematic heartbeat on the bass — two soft pulses per bar.
        this.tone(chord[0] / 2, {
          type: "sine", dur: 0.22, vol: 0.22, out: this.musicGain!,
        });
        this.tone(chord[0] / 2, {
          type: "sine", dur: 0.18, vol: 0.16, delay: 0.42, out: this.musicGain!,
        });
        // Rising pulse — a gentle ascending fifth that lifts the energy.
        this.tone(chord[1], {
          type: "triangle", dur: 0.5, vol: 0.12, out: this.musicGain!,
        });

        if (this.finishApproach >= 2) {
          // Final 15s: trumpet-like victory swell + golden shimmer on top.
          this.tone(chord[0] * 2, {
            type: "sawtooth", dur: 0.6, vol: 0.14, out: this.musicGain!,
          });
          this.tone(chord[2] * 2, {
            type: "sine", dur: 0.7, vol: 0.1, delay: 0.2, out: this.musicGain!,
          });
          // Golden shimmer — high, soft, awe-inspiring.
          this.tone(chord[0] * 4, {
            type: "sine", dur: 0.4, vol: 0.05, delay: 0.3, out: this.musicGain!,
          });
        }
      }
    };

    playBar();
    // Bars are shorter when tense — faster tempo. The finish run-up tightens
    // further, and the final 15s pushes hardest for victory pressure.
    const barMs = () =>
      this.finishApproach >= 2
        ? 1000
        : this.finishApproach === 1
          ? 1200
          : this.musicTension > 0.6
            ? 1400
            : 2000;
    const schedule = () => {
      if (this.musicTimer === null) return;
      playBar();
      this.musicTimer = window.setTimeout(schedule, barMs()) as unknown as number;
    };
    this.musicTimer = window.setTimeout(schedule, barMs()) as unknown as number;
  }

  /** Lazily build (once) a 2s mono white-noise buffer for looping ambient beds. */
  private getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (this.ambientNoiseBuffer) return this.ambientNoiseBuffer;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.ambientNoiseBuffer = buf;
    return buf;
  }

  /**
   * Start a subtle, procedural per-venue ambient bed UNDER the worship music and
   * scripture voice. One looping filtered-noise source + a slow LFO swell + at
   * most one slow interval for an occasional soft tone. Gains are tiny (~0.03).
   */
  startVenueAmbient(venueId: string) {
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    this.stopVenueAmbient();
    this.ambientVenue = venueId;
    if (this.muted) return; // remembered above; a later restart will honor it

    const now = ctx.currentTime;

    // Per-venue character tuning.
    let filterType: BiquadFilterType = "lowpass";
    let baseFreq = 500;
    let q = 0.7;
    let bedGain = 0.03;
    let lfoRate = 0.07; // slow swell, Hz
    let lfoDepth = 200; // filter freq sweep amount
    switch (venueId) {
      case "boardwalk": // soft ocean wash + warm breeze
        filterType = "lowpass"; baseFreq = 480; q = 0.6; bedGain = 0.035; lfoRate = 0.06; lfoDepth = 220;
        break;
      case "river": // gentle water flow, brighter/lighter than ocean
        filterType = "bandpass"; baseFreq = 1100; q = 1.2; bedGain = 0.028; lfoRate = 0.13; lfoDepth = 400;
        break;
      case "mountain": // airy, breathy wind
        filterType = "lowpass"; baseFreq = 700; q = 0.5; bedGain = 0.03; lfoRate = 0.05; lfoDepth = 300;
        break;
      case "city": // soft high shimmer pad (very gentle)
        filterType = "bandpass"; baseFreq = 1600; q = 0.9; bedGain = 0.022; lfoRate = 0.09; lfoDepth = 300;
        break;
      default:
        filterType = "lowpass"; baseFreq = 600; q = 0.6; bedGain = 0.03; lfoRate = 0.07; lfoDepth = 250;
        break;
    }

    // Looping filtered-noise bed.
    const src = ctx.createBufferSource();
    src.buffer = this.getNoiseBuffer(ctx);
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = baseFreq;
    filter.Q.value = q;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    // Gentle fade-in so it never "pops" in.
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(bedGain, now + 2.5);

    // Slow LFO swells the filter cutoff for a breathing/wash motion.
    const lfo = ctx.createOscillator();
    lfo.type = "sine";
    lfo.frequency.value = lfoRate;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = lfoDepth;
    lfo.connect(lfoGain).connect(filter.frequency);

    src.connect(filter).connect(gain).connect(this.master);
    src.start(now);
    lfo.start(now);

    // Optional rare, soft accent tone per venue via a slow interval.
    let accentTimer: number | null = null;
    const scheduleAccent = (everyMs: number, fire: () => void) => {
      accentTimer = window.setInterval(() => {
        if (this.muted) return;
        // Only ~50% of the time so accents feel occasional, not metronomic.
        if (Math.random() < 0.5) fire();
      }, everyMs) as unknown as number;
    };

    if (venueId === "city") {
      // Distant soft bell — rare.
      scheduleAccent(22000, () => {
        this.tone(1318.51, { type: "sine", dur: 1.6, vol: 0.018, out: this.master! });
        this.tone(1975.5, { type: "sine", dur: 1.2, vol: 0.01, delay: 0.04, out: this.master! });
      });
    } else if (venueId === "river") {
      // Soft high chime.
      scheduleAccent(18000, () => {
        this.tone(1567.98, { type: "sine", dur: 1.0, vol: 0.016, out: this.master! });
        this.tone(2349.32, { type: "sine", dur: 0.8, vol: 0.009, delay: 0.05, out: this.master! });
      });
    } else if (venueId === "mountain") {
      // Very occasional soft high tone (eagle/choir hint).
      scheduleAccent(28000, () => {
        this.tone(1046.5, { type: "sine", dur: 2.0, vol: 0.016, out: this.master! });
        this.tone(1567.98, { type: "sine", dur: 1.6, vol: 0.008, delay: 0.08, out: this.master! });
      });
    }

    this.ambientNodes = {
      stop: () => {
        const t = ctx.currentTime;
        try {
          gain.gain.cancelScheduledValues(t);
          gain.gain.setValueAtTime(gain.gain.value, t);
          gain.gain.linearRampToValueAtTime(0, t + 0.4);
        } catch { /* noop */ }
        try { src.stop(t + 0.5); } catch { /* noop */ }
        try { lfo.stop(t + 0.5); } catch { /* noop */ }
        try { src.disconnect(); } catch { /* noop */ }
        try { lfo.disconnect(); } catch { /* noop */ }
        try { lfoGain.disconnect(); } catch { /* noop */ }
        try { filter.disconnect(); } catch { /* noop */ }
        try { gain.disconnect(); } catch { /* noop */ }
        if (accentTimer !== null) { clearInterval(accentTimer); accentTimer = null; }
      },
    };
  }

  /** Stop and tear down the venue ambient bed, clearing any accent interval. */
  stopVenueAmbient() {
    if (this.ambientNodes) {
      try { this.ambientNodes.stop(); } catch { /* noop */ }
      this.ambientNodes = null;
    }
    this.ambientVenue = null;
  }

  stopMusic() {
    if (this.musicTimer !== null) {
      clearTimeout(this.musicTimer);
      clearInterval(this.musicTimer); // safety for both timer styles
      this.musicTimer = null;
    }
    // Clear finish-line adrenaline so a fresh run (or a pause) starts calm.
    this.finishApproach = 0;
  }
}

export const sound = new SoundEngine();
