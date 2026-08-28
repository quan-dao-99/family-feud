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
}

export const soundManager = new SoundManager();
