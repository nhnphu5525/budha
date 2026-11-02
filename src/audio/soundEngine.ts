// Web Audio API Sound Synthesizer for Buddhist Temple
// Authentic acoustic synthesis of Temple Bell (Chuông gia trì), Wooden Fish (Mõ), and Ambient drone

class SoundEngine {
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private isAmbientPlaying = false;
  private ambientOscillators: OscillatorNode[] = [];

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Tiếng Chuông Bát / Chuông Gia Trì ngân vang
  public playBell(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      // Temple bell harmonics (Chime & deep singing bowl resonances)
      const baseFreq = 196.0; // G3 deep temple bell
      const harmonics = [
        { mult: 1.0, gain: 0.6, decay: 7.0 },
        { mult: 2.02, gain: 0.35, decay: 5.5 },
        { mult: 3.01, gain: 0.25, decay: 4.0 },
        { mult: 4.24, gain: 0.18, decay: 3.0 },
        { mult: 5.61, gain: 0.12, decay: 2.2 },
        { mult: 7.82, gain: 0.08, decay: 1.5 },
      ];

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.7, now);
      masterGain.connect(ctx.destination);

      harmonics.forEach(({ mult, gain: harmonicGainVal, decay }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * mult, now);

        // Exponential decay for authentic reverberation
        gain.gain.setValueAtTime(harmonicGainVal, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + decay);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(now);
        osc.stop(now + decay + 0.1);
      });

      // Add metallic strike transient
      const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate * 0.04, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < noiseBuffer.length; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.008));
      }
      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1400, now);
      noiseFilter.Q.setValueAtTime(3.0, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.3, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(masterGain);

      noiseSource.start(now);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Tiếng Mõ Tụng Kinh (Temple Wooden Fish) "Cốc... Cốc..."
  public playWoodBlock(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Hollow resonant tone
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(780, now);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.08);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, now);
      filter.Q.setValueAtTime(8.0, now);

      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);

      // Thump sub body
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(220, now);
      subOsc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

      subGain.gain.setValueAtTime(0.5, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.08);
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Tiếng chuông nhỏ / khánh đồng
  public playChime(): void {
    try {
      const ctx = this.getContext();
      const now = ctx.currentTime;

      [1046.5, 1567.98, 2093].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now);

        gain.gain.setValueAtTime(0.2 / (idx + 1), now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 2.5);
      });
    } catch (e) {
      console.warn('Audio play failed:', e);
    }
  }

  // Bật/tắt nhạc thiền ambient nền thanh tịnh (432Hz Om drone)
  public toggleAmbient(forceState?: boolean): boolean {
    const shouldPlay = forceState !== undefined ? forceState : !this.isAmbientPlaying;
    const ctx = this.getContext();

    if (shouldPlay && !this.isAmbientPlaying) {
      const now = ctx.currentTime;
      this.ambientGain = ctx.createGain();
      this.ambientGain.gain.setValueAtTime(0.001, now);
      this.ambientGain.gain.linearRampToValueAtTime(0.18, now + 3);
      this.ambientGain.connect(ctx.destination);

      // 108Hz, 216Hz, 324Hz, 432Hz meditative chord
      const freqs = [108, 162, 216, 324, 432];
      this.ambientOscillators = freqs.map((f, i) => {
        const osc = ctx.createOscillator();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(f, now);

        // Lowpass to keep it warm and mellow
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);

        const chordGain = ctx.createGain();
        chordGain.gain.value = 0.25 / (i + 1);

        osc.connect(filter);
        filter.connect(chordGain);
        chordGain.connect(this.ambientGain!);

        osc.start(now);
        return osc;
      });

      this.isAmbientPlaying = true;
    } else if (!shouldPlay && this.isAmbientPlaying) {
      if (this.ambientGain) {
        const now = ctx.currentTime;
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, now);
        this.ambientGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);
        setTimeout(() => {
          this.ambientOscillators.forEach((osc) => {
            try { osc.stop(); osc.disconnect(); } catch {}
          });
          this.ambientOscillators = [];
          this.ambientGain?.disconnect();
          this.ambientGain = null;
        }, 1600);
      }
      this.isAmbientPlaying = false;
    }

    return this.isAmbientPlaying;
  }

  public getIsAmbient(): boolean {
    return this.isAmbientPlaying;
  }
}

export const sound = new SoundEngine();
