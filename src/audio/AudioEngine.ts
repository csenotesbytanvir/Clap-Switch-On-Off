export class AudioEngine {
  private audioCtx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private isListening = false;
  private animFrameId: number | null = null;
  
  // Microphone detection parameters
  public threshold = 0.35; // 0.05 to 0.95
  public sensitivity = 1.2;
  private lastClapTime = 0;
  private debounceMs = 450;
  
  constructor() {
    // Lazy AudioContext initialization on first user interaction
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Synthesize a highly realistic acoustic hand-clap sound using Web Audio API:
   * Double transient noise bursts + bandpass filter (1.2kHz - 2.8kHz) + room reverberation decay
   */
  public playClapSound(): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // 1. Initial finger transient burst (0.015s)
      this.createNoiseBurst(ctx, now, 0.018, 0.7, 1800);
      
      // 2. Primary palm slap burst (0.045s, delayed by 15ms)
      this.createNoiseBurst(ctx, now + 0.014, 0.045, 1.0, 1400);

      // 3. Low thump resonance (air cavity between cupped hands)
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);
      oscGain.gain.setValueAtTime(0.4, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // AudioContext policy fallback
    }
  }

  private createNoiseBurst(ctx: AudioContext, startTime: number, duration: number, peakGain: number, centerFreq: number) {
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill with pink/white noise
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Slight pink filter for organic texture
      lastOut = (lastOut * 0.4) + (white * 0.6);
      data[i] = lastOut;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(centerFreq, startTime);
    filter.Q.setValueAtTime(2.2, startTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.01, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.003);
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration + 0.01);
  }

  /**
   * Relay click acoustic feedback
   */
  public playRelayClick(isEngaged: boolean): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isEngaged ? 1200 : 800, now);
      osc.frequency.exponentialRampToValueAtTime(150, now + 0.025);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    } catch {
      // Ignored
    }
  }

  /**
   * Start listening to real microphone
   */
  public async startMicrophone(
    onClapDetected: (amplitude: number) => void,
    onWaveformUpdate: (timeDomain: Uint8Array, amplitude: number) => void,
    onError: (err: string) => void
  ): Promise<boolean> {
    try {
      const ctx = this.getAudioContext();
      if (this.isListening) return true;

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        }
      });

      this.micStream = stream;
      this.micSource = ctx.createMediaStreamSource(stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this.analyser.smoothingTimeConstant = 0.2;
      this.micSource.connect(this.analyser);
      this.isListening = true;

      const bufferLength = this.analyser.frequencyBinCount;
      const timeData = new Uint8Array(bufferLength);
      let prevEnergy = 0;

      const checkAudio = () => {
        if (!this.isListening || !this.analyser) return;

        this.analyser.getByteTimeDomainData(timeData);
        
        // Calculate peak amplitude and RMS
        let sumSquares = 0;
        let peak = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (timeData[i] - 128) / 128; // -1.0 to 1.0
          const absVal = Math.abs(val);
          if (absVal > peak) peak = absVal;
          sumSquares += val * val;
        }
        const rms = Math.sqrt(sumSquares / bufferLength) * this.sensitivity;
        const currentPeak = Math.min(1.0, peak * this.sensitivity);

        onWaveformUpdate(timeData, currentPeak);

        // Detect sharp transient rise (clap characteristic)
        const energyDelta = currentPeak - prevEnergy;
        const now = performance.now();

        if (
          currentPeak > this.threshold &&
          energyDelta > 0.15 &&
          now - this.lastClapTime > this.debounceMs
        ) {
          this.lastClapTime = now;
          onClapDetected(currentPeak);
        }

        prevEnergy = currentPeak * 0.6; // Decay
        this.animFrameId = requestAnimationFrame(checkAudio);
      };

      this.animFrameId = requestAnimationFrame(checkAudio);
      return true;
    } catch (err: unknown) {
      this.isListening = false;
      const msg = err instanceof Error ? err.message : 'Microphone access failed';
      onError(msg);
      return false;
    }
  }

  /**
   * Stop microphone
   */
  public stopMicrophone(): void {
    this.isListening = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    this.analyser = null;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const audioEngine = new AudioEngine();
