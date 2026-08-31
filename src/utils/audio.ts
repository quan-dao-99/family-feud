// Web Audio API Sound Synthesizer - 100% standalone, no external mp3 assets needed

class SoundManager {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private getContext(): AudioContext | null {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Tiếng chuông đúng (Ding!) khi lật thẻ
  public playDing(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // Chime harmonics (E6 + B6 + E7)
      const freqs = [1318.51, 1975.53, 2637.02];
      freqs.forEach((freq, index) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const volume = (0.25 / (index + 1));
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.95);
      });
    } catch {
      // Ignore audio error if user hasn't interacted yet
    }
  }

  // Tiếng còi buzzer khi sai (Dấu X)
  public playStrike(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';

      // Harsh dissonant low tone
      osc1.frequency.setValueAtTime(130, now);
      osc1.frequency.linearRampToValueAtTime(95, now + 0.55);

      osc2.frequency.setValueAtTime(138, now);
      osc2.frequency.linearRampToValueAtTime(102, now + 0.55);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.linearRampToValueAtTime(0.35, now + 0.45);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.65);
      osc2.stop(now + 0.65);
    } catch {
      // Ignore
    }
  }

  // Tiếng 3X (Triple Strike)
  public playTripleStrike(): void {
    if (!this.enabled) return;
    this.playStrike();
    setTimeout(() => this.playStrike(), 150);
  }

  // Tiếng bấm chuông giành quyền (Buzzer)
  public playBuzzer(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now); // A5
      osc.frequency.setValueAtTime(1760, now + 0.08); // A6

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // Ignore
    }
  }

  // Tiếng tích tắc đồng hồ (Vòng đặc biệt)
  public playTick(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.04);

      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Ignore
    }
  }

  // Tiếng hết giờ (Vòng đặc biệt)
  public playTimeUp(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const freqs = [350, 440, 350, 440];
      
      freqs.forEach((freq, idx) => {
        const start = now + idx * 0.15;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.13);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.14);
      });
    } catch {
      // Ignore
    }
  }

  // Nhạc kèn ăn mừng chiến thắng vòng đấu / chung cuộc
  public playFanfare(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      // C major chord arpeggio: C5, E5, G5, C6 triumph
      const notes = [
        { freq: 523.25, time: 0.0, dur: 0.12 },
        { freq: 659.25, time: 0.12, dur: 0.12 },
        { freq: 783.99, time: 0.24, dur: 0.15 },
        { freq: 1046.50, time: 0.40, dur: 0.7 },
      ];

      notes.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        const startTime = now + note.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.3, startTime + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.dur);
      });
    } catch {
      // Ignore
    }
  }

  // Nhạc mở đầu vòng đấu sôi động (Round Start Theme Song / Jingle)
  public playRoundStart(): void {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Upbeat Brass and Synth Melodic Progression for Gameshow Round Start
      // Sequence of punchy brass stabs & energetic melodic motif:
      // Motif: F4 -> A4 -> C5 -> F5 -> G5 -> C6 with energetic rhythm & bass support
      const melody = [
        // Measure 1: Opening energetic stabs
        { freq: 349.23, time: 0.00, dur: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.25 }, // F4
        { freq: 440.00, time: 0.15, dur: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.25 }, // A4
        { freq: 523.25, time: 0.30, dur: 0.20, type: 'sawtooth' as OscillatorType, vol: 0.28 }, // C5
        { freq: 523.25, time: 0.52, dur: 0.12, type: 'sawtooth' as OscillatorType, vol: 0.25 }, // C5
        { freq: 587.33, time: 0.66, dur: 0.12, type: 'sawtooth' as OscillatorType, vol: 0.25 }, // D5
        { freq: 659.25, time: 0.80, dur: 0.24, type: 'sawtooth' as OscillatorType, vol: 0.30 }, // E5

        // Measure 2: Climax & Flourish
        { freq: 698.46, time: 1.08, dur: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.28 }, // F5
        { freq: 783.99, time: 1.24, dur: 0.14, type: 'sawtooth' as OscillatorType, vol: 0.30 }, // G5
        { freq: 880.00, time: 1.40, dur: 0.16, type: 'sawtooth' as OscillatorType, vol: 0.32 }, // A5
        { freq: 1046.50, time: 1.58, dur: 0.60, type: 'triangle' as OscillatorType, vol: 0.35 }, // C6 (Grand finish)
      ];

      // Harmony layer for rich gameshow brass sound (major chords)
      const harmony = [
        { freq: 261.63, time: 0.00, dur: 0.14 }, // C4
        { freq: 329.63, time: 0.15, dur: 0.14 }, // E4
        { freq: 392.00, time: 0.30, dur: 0.20 }, // G4
        { freq: 392.00, time: 0.52, dur: 0.12 }, // G4
        { freq: 440.00, time: 0.66, dur: 0.12 }, // A4
        { freq: 493.88, time: 0.80, dur: 0.24 }, // B4
        { freq: 523.25, time: 1.08, dur: 0.14 }, // C5
        { freq: 587.33, time: 1.24, dur: 0.14 }, // D5
        { freq: 659.25, time: 1.40, dur: 0.16 }, // E5
        { freq: 783.99, time: 1.58, dur: 0.60 }, // G5
      ];

      // Punchy Funk Bassline (synth bass)
      const bassline = [
        { freq: 87.31, time: 0.00, dur: 0.18 },  // F2
        { freq: 110.00, time: 0.28, dur: 0.18 }, // A2
        { freq: 130.81, time: 0.52, dur: 0.22 }, // C3
        { freq: 146.83, time: 0.80, dur: 0.22 }, // D3
        { freq: 164.81, time: 1.08, dur: 0.22 }, // E3
        { freq: 174.61, time: 1.35, dur: 0.20 }, // F3
        { freq: 130.81, time: 1.58, dur: 0.65 }, // C3 (root finish)
      ];

      // Play Melody
      melody.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = note.type;
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        const startTime = now + note.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(note.vol, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.dur + 0.05);
      });

      // Play Harmony
      harmony.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        const startTime = now + note.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.18, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.dur + 0.05);
      });

      // Play Bassline
      bassline.forEach((note) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(note.freq, now + note.time);

        const startTime = now + note.time;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.22, startTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + note.dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + note.dur + 0.05);
      });

      // Sparkling chime finish
      const sparkleTimes = [1.60, 1.70, 1.80, 1.90, 2.00];
      const sparkleFreqs = [1567.98, 1760.00, 2093.00, 2637.02, 3135.96];
      sparkleTimes.forEach((t, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(sparkleFreqs[idx], now + t);
        const startTime = now + t;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.12, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.4);
      });

    } catch {
      // Ignore audio error if not user interacted yet
    }
  }
}

export const soundManager = new SoundManager();
