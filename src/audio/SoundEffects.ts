/**
 * Procedural Web Audio synthesizer for Ultimate Parking Simulator 3D.
 * Generates realistic car engine rumble, ignition, brakes, indicators, seatbelt, collisions, and UI sounds
 * with 0 external audio files (no 404 dependencies).
 */

class SoundEffectsSystem {
  private ctx: AudioContext | null = null;
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private isEngineRunning: boolean = false;
  private masterVolume: number = 0.8;
  private engineVolume: number = 0.6;
  private muted: boolean = false;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.8;
      this.sfxGain.connect(this.masterGain);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, engine: number) {
    this.masterVolume = master;
    this.engineVolume = engine;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
    if (this.engineGain) {
      this.engineGain.gain.value = this.muted ? 0 : this.engineVolume * 0.4;
    }
  }

  public toggleMute(isMuted?: boolean) {
    this.muted = isMuted !== undefined ? isMuted : !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.muted ? 0 : this.masterVolume;
    }
  }

  // --- ENGINE SYSTEM ---
  public startEngine() {
    this.initContext();
    if (!this.ctx || this.isEngineRunning) return;

    // Play starter cranking ignition sound
    this.playIgnitionSequence();

    // Setup sustained looping engine synthesis
    setTimeout(() => {
      if (!this.ctx) return;
      this.isEngineRunning = true;

      this.engineOsc1 = this.ctx.createOscillator();
      this.engineOsc2 = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc1.type = 'sawtooth';
      this.engineOsc1.frequency.setValueAtTime(45, this.ctx.currentTime); // Base idle RPM

      this.engineOsc2.type = 'triangle';
      this.engineOsc2.frequency.setValueAtTime(90, this.ctx.currentTime);

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.setValueAtTime(250, this.ctx.currentTime);
      this.engineFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
      this.engineGain.gain.exponentialRampToValueAtTime(
        this.muted ? 0.001 : this.engineVolume * 0.35,
        this.ctx.currentTime + 0.3
      );

      this.engineOsc1.connect(this.engineFilter);
      this.engineOsc2.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      if (this.masterGain) {
        this.engineGain.connect(this.masterGain);
      }

      this.engineOsc1.start();
      this.engineOsc2.start();
    }, 400);
  }

  public updateEngineRPM(rpmNormalized: number, throttle: number) {
    // rpmNormalized: 0.0 (idle ~800 RPM) to 1.0 (redline ~7000 RPM)
    if (!this.ctx || !this.isEngineRunning || !this.engineOsc1 || !this.engineOsc2 || !this.engineFilter || !this.engineGain) return;

    const baseFreq = 42 + rpmNormalized * 110 + throttle * 25;
    const filterFreq = 220 + rpmNormalized * 750 + throttle * 280;

    const t = this.ctx.currentTime + 0.05;
    this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.06);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2.05, t, 0.06);
    this.engineFilter.frequency.setTargetAtTime(filterFreq, t, 0.08);

    const targetGain = (this.muted ? 0 : this.engineVolume * (0.3 + rpmNormalized * 0.25 + throttle * 0.15));
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.05);
  }

  public stopEngine() {
    if (!this.ctx || !this.isEngineRunning) return;
    this.isEngineRunning = false;

    if (this.engineGain) {
      this.engineGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);
    }
    setTimeout(() => {
      try {
        this.engineOsc1?.stop();
        this.engineOsc2?.stop();
        this.engineOsc1?.disconnect();
        this.engineOsc2?.disconnect();
        this.engineFilter?.disconnect();
        this.engineGain?.disconnect();
      } catch {
        // Safe cleanup
      }
      this.engineOsc1 = null;
      this.engineOsc2 = null;
      this.engineFilter = null;
      this.engineGain = null;
    }, 350);
  }

  private playIgnitionSequence() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Cranking clicks
    for (let i = 0; i < 4; i++) {
      const crankOsc = this.ctx.createOscillator();
      const crankGain = this.ctx.createGain();
      crankOsc.type = 'triangle';
      crankOsc.frequency.setValueAtTime(75, t + i * 0.09);
      crankGain.gain.setValueAtTime(0.3, t + i * 0.09);
      crankGain.gain.exponentialRampToValueAtTime(0.01, t + i * 0.09 + 0.05);

      crankOsc.connect(crankGain);
      crankGain.connect(this.sfxGain || this.ctx.destination);
      crankOsc.start(t + i * 0.09);
      crankOsc.stop(t + i * 0.09 + 0.06);
    }

    // Starter burst roar
    const roarOsc = this.ctx.createOscillator();
    const roarGain = this.ctx.createGain();
    roarOsc.type = 'sawtooth';
    roarOsc.frequency.setValueAtTime(60, t + 0.36);
    roarOsc.frequency.exponentialRampToValueAtTime(140, t + 0.55);
    roarOsc.frequency.exponentialRampToValueAtTime(50, t + 0.85);

    roarGain.gain.setValueAtTime(0.4, t + 0.36);
    roarGain.gain.exponentialRampToValueAtTime(0.01, t + 0.85);

    roarOsc.connect(roarGain);
    roarGain.connect(this.sfxGain || this.ctx.destination);
    roarOsc.start(t + 0.36);
    roarOsc.stop(t + 0.86);
  }

  // --- SEAT BELT ---
  public playSeatbeltBuckle() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Sharp metallic mechanical click
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.07);
  }

  public playSeatbeltWarning() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Ding-dong chime
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.setValueAtTime(660, t + 0.15);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.36);
  }

  // --- TURN SIGNALS / BLINKER ---
  public playBlinkerClick(isOn: boolean) {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(isOn ? 1100 : 850, t);
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  // --- BRAKES ---
  public playBrakeSqueak(intensity: number) {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(2400 + Math.random() * 400, t);
    osc.frequency.exponentialRampToValueAtTime(1800, t + 0.2);

    gain.gain.setValueAtTime(Math.min(0.2, intensity * 0.25), t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.23);
  }

  // --- GEAR SHIFT ---
  public playGearShift() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(90, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // --- COLLISION ---
  public playCollision(severity: 'minor' | 'major') {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    // Low boom thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(severity === 'major' ? 120 : 160, t);
    osc.frequency.exponentialRampToValueAtTime(30, t + (severity === 'major' ? 0.35 : 0.18));

    gain.gain.setValueAtTime(severity === 'major' ? 0.6 : 0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (severity === 'major' ? 0.36 : 0.2));

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.37);

    // Crunch noise buffer
    try {
      const bufferSize = this.ctx.sampleRate * (severity === 'major' ? 0.25 : 0.12);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'lowpass';
      noiseFilter.frequency.setValueAtTime(severity === 'major' ? 900 : 500, t);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(severity === 'major' ? 0.4 : 0.2, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + (severity === 'major' ? 0.25 : 0.12));

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(this.sfxGain || this.ctx.destination);
      noise.start(t);
    } catch {
      // Safe fallback
    }
  }

  // --- VICTORY FANFARE ---
  public playVictoryFanfare() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
    notes.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.12);

      gain.gain.setValueAtTime(0.3, t + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGain || this.ctx.destination);
      osc.start(t + idx * 0.12);
      osc.stop(t + idx * 0.12 + 0.45);
    });
  }

  // --- COIN ACCUMULATION ---
  public playCoin() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(987.77, t); // B5
    osc.frequency.setValueAtTime(1318.51, t + 0.07); // E6

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.26);
  }

  // --- UI SOUNDS ---
  public playClick() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  public playUpgradeSuccess() {
    this.initContext();
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, t); // C5
    osc.frequency.exponentialRampToValueAtTime(783.99, t + 0.15); // G5

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain || this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.32);
  }
}

export const SoundEffects = new SoundEffectsSystem();
