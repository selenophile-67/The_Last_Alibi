import { AiMusicScore } from '../types/game';

export type MusicMood =
  | 'silent'
  | 'menu'
  | 'office'
  | 'crime_scene'
  | 'interrogation'
  | 'revelation'
  | 'intuition';

class NoirAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private rainNode: AudioBufferSourceNode | null = null;
  private musicInterval: number | null = null;
  private currentMood: MusicMood = 'silent';
  private activeScore: AiMusicScore | null = null;
  private scoreCache: Map<string, AiMusicScore> = new Map();
  private musicVol = 0.45;
  private sfxVol = 0.65;
  private initialized = false;
  private stepIndex = 0;
  private isComposing = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.musicGain.gain.value = this.musicVol;
      this.sfxGain.gain.value = this.sfxVol;

      this.musicGain.connect(this.masterGain);
      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.initialized) {
      this.initialized = true;
      this.startRainAmbience();
    }
    return this.ctx;
  }

  public unlockAudio() {
    this.ensureContext();
  }

  public setVolumes(music: number, sfx: number) {
    this.musicVol = Math.max(0, Math.min(1, music));
    this.sfxVol = Math.max(0, Math.min(1, sfx));
    if (this.musicGain && this.ctx) {
      this.musicGain.gain.setTargetAtTime(this.musicVol, this.ctx.currentTime, 0.08);
    }
    if (this.sfxGain && this.ctx) {
      this.sfxGain.gain.setTargetAtTime(this.sfxVol, this.ctx.currentTime, 0.08);
    }
  }

  public getActiveScore(): AiMusicScore | null {
    return this.activeScore;
  }

  public async composeAiTrack(params: {
    mood: MusicMood;
    caseTitle: string;
    locationName: string;
    tension: number;
    forceRefresh?: boolean;
  }): Promise<{ score: AiMusicScore | null; error?: string }> {
    const cacheKey = `${params.mood}:${params.caseTitle}`;
    if (!params.forceRefresh && this.scoreCache.has(cacheKey)) {
      const cached = this.scoreCache.get(cacheKey)!;
      this.applyAiScore(cached);
      return { score: cached };
    }

    if (this.isComposing && !params.forceRefresh) {
      return { score: this.activeScore };
    }

    this.isComposing = true;
    try {
      const res = await fetch('/api/music/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: params.mood,
          caseTitle: params.caseTitle,
          locationName: params.locationName,
          tension: params.tension,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.score) {
        return {
          score: this.activeScore,
          error: data?.error ?? 'Unable to reach AI composer.',
        };
      }
      const score = data.score as AiMusicScore;
      this.scoreCache.set(cacheKey, score);
      this.applyAiScore(score);
      return { score };
    } catch {
      return { score: this.activeScore, error: 'Network error contacting AI composer.' };
    } finally {
      this.isComposing = false;
    }
  }

  public applyAiScore(score: AiMusicScore) {
    this.activeScore = score;
    this.restartMusicLoop();
  }

  private startRainAmbience() {
    if (!this.ctx || !this.musicGain || this.rainNode) return;
    try {
      const bufferSize = this.ctx.sampleRate * 3;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 0.85;
      }
      const source = this.ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = 950;
      bandpass.Q.value = 0.7;

      const rainGain = this.ctx.createGain();
      rainGain.gain.value = 0.08;

      source.connect(bandpass);
      bandpass.connect(rainGain);
      rainGain.connect(this.musicGain);
      source.start();
      this.rainNode = source;
    } catch {
      // Ignore audio failures on restricted environments
    }
  }

  public setMood(mood: MusicMood) {
    if (this.currentMood === mood) return;
    this.currentMood = mood;
    this.restartMusicLoop();
  }

  private restartMusicLoop() {
    if (this.musicInterval !== null) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    if (this.currentMood === 'silent') return;

    const bpm = this.activeScore?.bpm
      ? Math.max(52, Math.min(110, this.activeScore.bpm))
      : this.currentMood === 'intuition'
      ? 86
      : this.currentMood === 'revelation'
      ? 84
      : this.currentMood === 'interrogation'
      ? 78
      : 66;

    const stepMs = Math.round((60 / bpm) * 500); // eighth/quarter noir pulse

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || this.ctx.state !== 'running' || this.musicVol <= 0.01) return;
      this.playNoirStep(this.currentMood);
    }, stepMs);
  }

  private playNoirStep(mood: MusicMood) {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const step = this.stepIndex;
    this.stepIndex = (this.stepIndex + 1) % 8;

    const score = this.activeScore;
    const defaultBass =
      mood === 'interrogation' || mood === 'intuition'
        ? [98, 116.54, 130.81, 138.59, 98, 116.54, 146.83, 130.81]
        : [110, 130.81, 146.83, 164.81, 196, 164.81, 146.83, 123.47];
    const defaultChords = [
      [220, 261.63, 329.63],
      [196, 233.08, 293.66],
      [174.61, 220, 261.63],
      [164.81, 207.65, 246.94],
    ];
    const defaultMelody = [329.63, 0, 392, 349.23, 0, 293.66, 329.63, 0];

    const bassFreq =
      score?.bassLine?.length === 8
        ? Math.max(50, Math.min(190, score.bassLine[step]))
        : defaultBass[step];

    // 1. Upright Noir Bass
    const bassOsc = this.ctx.createOscillator();
    const bassFilter = this.ctx.createBiquadFilter();
    const bassEnv = this.ctx.createGain();
    bassOsc.type = mood === 'intuition' ? 'triangle' : 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, now);
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = mood === 'intuition' ? 460 : 320;
    bassEnv.gain.setValueAtTime(0.001, now);
    bassEnv.gain.linearRampToValueAtTime(mood === 'intuition' ? 0.08 : 0.06, now + 0.04);
    bassEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
    bassOsc.connect(bassFilter);
    bassFilter.connect(bassEnv);
    bassEnv.connect(this.musicGain);
    bassOsc.start(now);
    bassOsc.stop(now + 0.6);

    // 2. Chord Pad on even beats
    if (step % 2 === 0) {
      const chordIdx = Math.floor(step / 2) % 4;
      const aiChord = score?.chords?.[chordIdx];
      const chord =
        aiChord && aiChord.length >= 2
          ? aiChord
          : defaultChords[chordIdx];

      chord.slice(0, 3).forEach((freq) => {
        if (!this.ctx || !this.musicGain || freq < 100 || freq > 600) return;
        const padOsc = this.ctx.createOscillator();
        const padFilter = this.ctx.createBiquadFilter();
        const padEnv = this.ctx.createGain();
        padOsc.type =
          score?.instrumentStyle === 'cello_pulse'
            ? 'sawtooth'
            : score?.instrumentStyle === 'muted_brass'
            ? 'triangle'
            : 'sine';
        padOsc.frequency.setValueAtTime(freq, now);
        padFilter.type = 'lowpass';
        padFilter.frequency.value = 620;
        padEnv.gain.setValueAtTime(0.001, now);
        padEnv.gain.linearRampToValueAtTime(0.022, now + 0.14);
        padEnv.gain.exponentialRampToValueAtTime(0.001, now + 1.25);
        padOsc.connect(padFilter);
        padFilter.connect(padEnv);
        padEnv.connect(this.musicGain);
        padOsc.start(now);
        padOsc.stop(now + 1.3);
      });
    }

    // 3. Sparse Haunting Noir Lead Melody
    const leadFreq =
      score?.melody?.length === 8 ? score.melody[step] : defaultMelody[step];
    if (leadFreq && leadFreq > 180 && leadFreq < 900) {
      const leadOsc = this.ctx.createOscillator();
      const leadFilter = this.ctx.createBiquadFilter();
      const leadEnv = this.ctx.createGain();
      leadOsc.type =
        score?.instrumentStyle === 'vibraphone_mist'
          ? 'sine'
          : score?.instrumentStyle === 'muted_brass'
          ? 'sawtooth'
          : 'triangle';
      leadOsc.frequency.setValueAtTime(leadFreq, now);
      leadFilter.type = 'bandpass';
      leadFilter.frequency.value = 900;
      leadFilter.Q.value = 1.1;
      leadEnv.gain.setValueAtTime(0.001, now);
      leadEnv.gain.linearRampToValueAtTime(0.035, now + 0.05);
      leadEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.78);
      leadOsc.connect(leadFilter);
      leadFilter.connect(leadEnv);
      leadEnv.connect(this.musicGain);
      leadOsc.start(now);
      leadOsc.stop(now + 0.85);
    }

    // 4. Psychological heartbeat during Intuition mode
    if (mood === 'intuition' && (step === 0 || step === 1 || step === 4 || step === 5)) {
      const hb = this.ctx.createOscillator();
      const hbEnv = this.ctx.createGain();
      hb.type = 'sine';
      hb.frequency.setValueAtTime(step % 2 === 0 ? 64 : 52, now);
      hb.frequency.exponentialRampToValueAtTime(36, now + 0.15);
      hbEnv.gain.setValueAtTime(0.001, now);
      hbEnv.gain.linearRampToValueAtTime(0.07, now + 0.02);
      hbEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      hb.connect(hbEnv);
      hbEnv.connect(this.musicGain);
      hb.start(now);
      hb.stop(now + 0.24);
    }

    if (step === 0 && Math.random() < 0.2 && mood !== 'interrogation') {
      this.playDistantThunder();
    }
  }

  private playDistantThunder() {
    if (!this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(48, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 1.8);

    const lp = this.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 95;

    env.gain.setValueAtTime(0.001, now);
    env.gain.linearRampToValueAtTime(0.038, now + 0.25);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 2.0);

    osc.connect(lp);
    lp.connect(env);
    env.connect(this.musicGain);
    osc.start(now);
    osc.stop(now + 2.1);
  }

  public playSfx(
    type:
      | 'click'
      | 'discover'
      | 'shutter'
      | 'contradiction'
      | 'phone'
      | 'unlock'
      | 'footstep'
      | 'siren'
      | 'reveal'
      | 'intuition'
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.sfxGain || this.sfxVol <= 0.01) return;
    const now = ctx.currentTime;

    if (type === 'intuition') {
      // Psychological shimmer + low resonance swell
      [293.66, 440, 587.33].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq * 0.96, now + idx * 0.06);
        osc.frequency.exponentialRampToValueAtTime(freq, now + idx * 0.06 + 0.5);
        gain.gain.setValueAtTime(0.001, now + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.11, now + idx * 0.06 + 0.12);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.06);
        osc.stop(now + 0.95);
      });
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'discover') {
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.14, now + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.45);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.5);
      });
    } else if (type === 'shutter') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === 'contradiction') {
      [146.83, 207.65, 293.66].forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1100;
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
        osc.connect(lp);
        lp.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now);
        osc.stop(now + 0.8);
      });
    } else if (type === 'phone') {
      [0, 0.22].forEach((offset) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now + offset);
        osc.frequency.setValueAtTime(480, now + offset + 0.08);
        gain.gain.setValueAtTime(0.14, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.18);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + offset);
        osc.stop(now + offset + 0.2);
      });
    } else if (type === 'unlock') {
      [392, 523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.14, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.35);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } else if (type === 'footstep') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(110, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.09);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 0.11);
    } else if (type === 'siren') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.linearRampToValueAtTime(740, now + 0.6);
      osc.frequency.linearRampToValueAtTime(520, now + 1.2);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.3);
      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(now);
      osc.stop(now + 1.35);
    } else if (type === 'reveal') {
      [220, 261.63, 329.63, 440].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.14, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(now + i * 0.09);
        osc.stop(now + 1.3);
      });
    }
  }
}

export const noirAudio = new NoirAudioEngine();
