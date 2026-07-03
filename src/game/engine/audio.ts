// Tiny original chiptune engine built on WebAudio. Two melodic voices
// (square lead + triangle bass) plus a noise channel for percussive SFX.
// All tunes are original note data; nothing is sampled or imported.

type Wave = 'square' | 'triangle' | 'sawtooth';

interface Note {
  // Semitone number (A4 = 0) or null for a rest.
  n: number | null;
  d: number; // duration in sixteenth-steps
}

interface Track {
  bpm: number;
  lead: Note[];
  bass: Note[];
  leadWave: Wave;
  bassWave: Wave;
}

const N = (n: number | null, d = 2): Note => ({ n, d });

// Semitone → frequency (equal temperament, A4 = 440Hz).
function freq(semi: number): number {
  return 440 * Math.pow(2, semi / 12);
}

// --- Original tunes (semitone offsets from A4) ---

const TITLE: Track = {
  bpm: 120,
  leadWave: 'square',
  bassWave: 'triangle',
  lead: [
    N(7, 4), N(11, 4), N(14, 4), N(11, 2), N(7, 2),
    N(9, 4), N(12, 4), N(16, 4), N(12, 4),
    N(7, 4), N(11, 4), N(14, 4), N(11, 2), N(14, 2),
    N(19, 6), N(16, 2), N(14, 8),
  ],
  bass: [
    N(-5, 8), N(-1, 8), N(-3, 8), N(-5, 8),
    N(-5, 8), N(-1, 8), N(0, 8), N(-5, 8),
  ],
};

const OVERWORLD: Track = {
  bpm: 132,
  leadWave: 'square',
  bassWave: 'triangle',
  lead: [
    N(0, 2), N(4, 2), N(7, 2), N(4, 2), N(5, 2), N(9, 2), N(5, 2), N(2, 2),
    N(-1, 2), N(2, 2), N(7, 2), N(2, 2), N(0, 4), N(null, 4),
    N(7, 2), N(9, 2), N(11, 2), N(9, 2), N(7, 2), N(4, 2), N(0, 4),
    N(2, 2), N(4, 2), N(5, 2), N(7, 2), N(4, 4), N(null, 4),
  ],
  bass: [
    N(-12, 4), N(-5, 4), N(-12, 4), N(-5, 4),
    N(-10, 4), N(-3, 4), N(-14, 4), N(-7, 4),
    N(-12, 4), N(-5, 4), N(-12, 4), N(-5, 4),
    N(-10, 4), N(-7, 4), N(-12, 4), N(-12, 4),
  ],
};

const BATTLE: Track = {
  bpm: 160,
  leadWave: 'square',
  bassWave: 'sawtooth',
  lead: [
    N(0, 1), N(0, 1), N(3, 2), N(0, 1), N(0, 1), N(-2, 2),
    N(3, 2), N(5, 2), N(7, 4),
    N(7, 1), N(7, 1), N(10, 2), N(7, 1), N(7, 1), N(5, 2),
    N(3, 2), N(0, 2), N(-2, 4),
  ],
  bass: [
    N(-12, 2), N(-12, 2), N(-9, 2), N(-12, 2),
    N(-12, 2), N(-12, 2), N(-7, 2), N(-5, 2),
    N(-12, 2), N(-12, 2), N(-9, 2), N(-12, 2),
    N(-14, 2), N(-14, 2), N(-7, 2), N(-7, 2),
  ],
};

const VICTORY: Track = {
  bpm: 140,
  leadWave: 'square',
  bassWave: 'triangle',
  lead: [
    N(7, 1), N(7, 1), N(7, 1), N(7, 3), N(3, 3), N(5, 3),
    N(7, 2), N(5, 1), N(7, 6),
  ],
  bass: [
    N(-5, 4), N(-5, 4), N(-8, 4), N(-6, 4), N(-5, 8),
  ],
};

const TRACKS: Record<string, Track> = {
  title: TITLE,
  overworld: OVERWORLD,
  battle: BATTLE,
  victory: VICTORY,
};

export type TrackName = keyof typeof TRACKS | 'none';

export class ChiptuneAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private current: TrackName = 'none';
  private timer: number | null = null;
  private step = 0;
  private muted = false;

  // Must be called from a user gesture to satisfy autoplay policies.
  resume(): void {
    if (!this.ctx) {
      const Ctor =
        (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext })
          .AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.28;
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.6;
      this.musicGain.connect(this.master);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.28;
  }

  toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  playTrack(name: TrackName): void {
    // Not armed yet (no user gesture): don't latch, so the caller retries later.
    if (!this.ctx && name !== 'none') return;
    if (name === this.current && (name === 'none' || this.timer !== null)) return;
    this.current = name;
    this.step = 0;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (name === 'none' || !this.ctx) return;
    const track = TRACKS[name];
    const stepMs = (60_000 / track.bpm) / 4; // sixteenth-note step
    // Precompute step-indexed schedules for both voices.
    const leadPlan = this.expand(track.lead);
    const bassPlan = this.expand(track.bass);
    const total = Math.max(leadPlan.length, bassPlan.length);
    this.timer = window.setInterval(() => {
      if (!this.ctx || this.muted) {
        this.step = (this.step + 1) % total;
        return;
      }
      const s = this.step % total;
      const lead = leadPlan[s % leadPlan.length];
      const bass = bassPlan[s % bassPlan.length];
      if (lead && lead.start) this.blip(lead.n, track.leadWave, lead.len * stepMs, 0.5);
      if (bass && bass.start) this.blip(bass.n, track.bassWave, bass.len * stepMs, 0.35);
      this.step = (this.step + 1) % total;
    }, stepMs);
  }

  // Expand a note list into per-step slots marking note onsets and lengths.
  private expand(notes: Note[]): { n: number | null; start: boolean; len: number }[] {
    const plan: { n: number | null; start: boolean; len: number }[] = [];
    for (const note of notes) {
      for (let i = 0; i < note.d; i++) {
        plan.push({ n: note.n, start: i === 0, len: note.d });
      }
    }
    return plan;
  }

  private blip(semi: number | null, wave: Wave, ms: number, vol: number): void {
    if (semi === null || !this.ctx || !this.musicGain) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = freq(semi);
    const now = this.ctx.currentTime;
    const dur = Math.min(ms / 1000, 0.9);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(vol, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.9);
    osc.connect(g);
    g.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + dur);
  }

  // One-shot sound effects.
  sfx(name: string): void {
    if (!this.ctx || !this.master || this.muted) return;
    const now = this.ctx.currentTime;
    switch (name) {
      case 'cursor':
        this.tone('square', 880, 0.05, 0.2, now);
        break;
      case 'confirm':
        this.tone('square', 660, 0.06, 0.25, now);
        this.tone('square', 990, 0.08, 0.25, now + 0.06);
        break;
      case 'cancel':
        this.tone('square', 440, 0.08, 0.2, now);
        break;
      case 'hit':
        this.noise(0.12, 0.35, now);
        break;
      case 'super':
        this.noise(0.18, 0.45, now);
        this.tone('sawtooth', 220, 0.18, 0.2, now);
        break;
      case 'faint':
        this.slide('square', 440, 110, 0.4, 0.3, now);
        break;
      case 'heal':
        this.tone('triangle', 660, 0.1, 0.3, now);
        this.tone('triangle', 880, 0.1, 0.3, now + 0.1);
        this.tone('triangle', 1100, 0.14, 0.3, now + 0.2);
        break;
      case 'ball':
        this.slide('square', 300, 700, 0.18, 0.25, now);
        break;
      case 'levelup':
        this.tone('square', 523, 0.08, 0.3, now);
        this.tone('square', 659, 0.08, 0.3, now + 0.08);
        this.tone('square', 784, 0.08, 0.3, now + 0.16);
        this.tone('square', 1047, 0.16, 0.3, now + 0.24);
        break;
      default:
        break;
    }
  }

  private tone(wave: Wave, hz: number, dur: number, vol: number, at: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.value = hz;
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(vol, at + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private slide(wave: Wave, from: number, to: number, dur: number, vol: number, at: number): void {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = wave;
    osc.frequency.setValueAtTime(from, at);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), at + dur);
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    osc.connect(g);
    g.connect(this.master);
    osc.start(at);
    osc.stop(at + dur + 0.02);
  }

  private noise(dur: number, vol: number, at: number): void {
    if (!this.ctx || !this.master) return;
    const frames = Math.floor(this.ctx.sampleRate * dur);
    const buffer = this.ctx.createBuffer(1, frames, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const g = this.ctx.createGain();
    g.gain.value = vol;
    src.connect(g);
    g.connect(this.master);
    src.start(at);
  }
}
