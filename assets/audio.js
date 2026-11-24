// Procedural Web Audio API sound engine for UZ GAMES 3D

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.volume = 0.65;
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.driftGain = null;
    this.driftSource = null;
  }

  ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  setConfig({ muted, volume }) {
    if (typeof muted === 'boolean') this.muted = muted;
    if (typeof volume === 'number') this.volume = Math.max(0, Math.min(1, volume));
    if (this.engineGain && this.ctx) {
      this.engineGain.gain.setTargetAtTime(
        this.muted ? 0 : 0.08 * this.volume,
        this.ctx.currentTime,
        0.05
      );
    }
    if (this.muted && this.driftGain && this.ctx) {
      this.driftGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.04);
    }
  }

  playTone(freq, duration = 0.12, type = 'sine', gainLevel = 0.16, delay = 0) {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const now = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const level = Math.max(0.001, gainLevel * this.volume);
    gain.gain.setValueAtTime(level, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + duration + 0.02);
  }

  playClick() {
    this.playTone(540, 0.06, 'triangle', 0.12);
  }

  playSuccess() {
    this.playTone(523.25, 0.11, 'sine', 0.16, 0);
    this.playTone(659.25, 0.11, 'sine', 0.16, 0.08);
    this.playTone(783.99, 0.22, 'triangle', 0.18, 0.16);
  }

  playCoin() {
    this.playTone(880, 0.08, 'sine', 0.14, 0);
    this.playTone(1318.5, 0.14, 'sine', 0.14, 0.06);
  }

  playCountdown(go = false) {
    if (go) {
      this.playTone(880, 0.28, 'triangle', 0.24);
    } else {
      this.playTone(440, 0.14, 'sine', 0.18);
    }
  }

  playCollision() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(42, now + 0.18);
    gain.gain.setValueAtTime(0.24 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  playLaser() {
    if (this.muted || this.volume <= 0) return;
    const ctx = this.ensureContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(760, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.12);
    gain.gain.setValueAtTime(0.12 * this.volume, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.14);
  }

  startEngine() {
    this.stopEngine();
    const ctx = this.ensureContext();
    if (!ctx) return;

    this.engineOsc = ctx.createOscillator();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 65;

    this.engineFilter = ctx.createBiquadFilter();
    this.engineFilter.type = 'lowpass';
    this.engineFilter.frequency.value = 340;

    this.engineGain = ctx.createGain();
    this.engineGain.gain.value = this.muted ? 0 : 0.06 * this.volume;

    this.engineOsc.connect(this.engineFilter);
    this.engineFilter.connect(this.engineGain);
    this.engineGain.connect(ctx.destination);
    this.engineOsc.start();

    // Noise buffer for tire drift screech
    const bufferSize = ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    this.driftSource = ctx.createBufferSource();
    this.driftSource.buffer = noiseBuffer;
    this.driftSource.loop = true;

    const bandpass = ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.value = 1350;
    bandpass.Q.value = 3.5;

    this.driftGain = ctx.createGain();
    this.driftGain.gain.value = 0;

    this.driftSource.connect(bandpass);
    bandpass.connect(this.driftGain);
    this.driftGain.connect(ctx.destination);
    this.driftSource.start();
  }

  updateEngine(speedRatio, drifting = false) {
    if (!this.ctx || !this.engineOsc || !this.engineGain) return;
    const now = this.ctx.currentTime;
    const freq = 58 + Math.min(1.4, Math.abs(speedRatio)) * 145;
    this.engineOsc.frequency.setTargetAtTime(freq, now, 0.05);
    this.engineFilter.frequency.setTargetAtTime(280 + Math.abs(speedRatio) * 900, now, 0.06);
    this.engineGain.gain.setTargetAtTime(
      this.muted ? 0 : (0.045 + Math.abs(speedRatio) * 0.055) * this.volume,
      now,
      0.06
    );
    if (this.driftGain) {
      this.driftGain.gain.setTargetAtTime(
        !this.muted && drifting ? 0.065 * this.volume : 0,
        now,
        0.04
      );
    }
  }

  stopEngine() {
    try {
      if (this.engineOsc) {
        this.engineOsc.stop();
        this.engineOsc.disconnect();
      }
      if (this.driftSource) {
        this.driftSource.stop();
        this.driftSource.disconnect();
      }
    } catch {
      // Ignore already stopped oscillators
    }
    this.engineOsc = null;
    this.engineGain = null;
    this.engineFilter = null;
    this.driftSource = null;
    this.driftGain = null;
  }
}

export const soundEngine = new SoundEngine();
