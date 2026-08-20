import { 
  SimulationState, 
  OscilloscopeSample, 
  CircuitLogEvent, 
  StepTutorialItem 
} from '../types';
import { audioEngine } from '../audio/AudioEngine';

export class CircuitSimulationEngine {
  public state: SimulationState;
  
  // Oscilloscope ring buffer
  public scopeSamples: OscilloscopeSample[] = [];
  public maxScopeSamples = 300;
  
  // Event logs
  public eventLogs: CircuitLogEvent[] = [];
  public maxEventLogs = 100;
  
  // Callbacks
  private onStateChangeListeners: Array<(state: SimulationState) => void> = [];
  private onLogListeners: Array<(event: CircuitLogEvent) => void> = [];
  
  // Animation / simulation internal timer
  private lastTickTime = performance.now();
  private simTime = 0; // seconds
  private animId: number | null = null;
  
  // Active clap animation sequence timers
  private clapSequenceTimeout: number[] = [];

  constructor() {
    const r1 = 100000; // 100k
    const c1 = 0.0000047; // 4.7uF
    const duration = 1.1 * r1 * c1; // ~0.517s

    this.state = {
      powerOn: true,
      supplyVoltage: 5.0,
      simulationSpeed: 1.0,
      isPaused: false,
      
      r1TimingValue: r1,
      c1TimingValue: c1,
      timingDuration: duration,
      
      micAmplitude: 0.0,
      micSignalVoltage: 2.5,
      isClapActive: false,
      clapSource: 'none',
      
      transistorBaseVoltage: 0.0,
      transistorCollectorVoltage: 5.0,
      transistorIsOn: false,
      
      timer555TriggerVoltage: 5.0,
      timer555ThresholdVoltage: 0.0,
      timer555OutputVoltage: 0.0,
      timer555OutputState: 0,
      timer555IsTiming: false,
      timer555TimeRemaining: 0,
      
      flipFlopClockVoltage: 0.0,
      flipFlopClockState: 0,
      flipFlopClockEdgeDetected: false,
      flipFlopDInput: 0, // Inverted feedback from Q'=0
      flipFlopQOutput: 1, // LIGHT IS ON (Q=1)
      flipFlopQBarOutput: 0, // Q'=0
      
      ledVoltage: 2.1,
      ledCurrentMa: 3.0,
      ledIsOn: true, // LIGHT IS ON
      ledBrightness: 1.0,
      
      clapCount: 1,
      cycleCount: 1,
      lastClapTimestamp: performance.now(),
    };

    this.initScopeBuffer();
    this.addLog('SYSTEM', 'Circuit Simulator initialized. DC Power: +5.0V. Flip-Flop Q=1 (LIGHT IS ON).', 'success');
    this.startSimulationLoop();
  }

  private initScopeBuffer() {
    this.scopeSamples = [];
    for (let i = 0; i < this.maxScopeSamples; i++) {
      this.scopeSamples.push({
        time: i * 0.016,
        micAudio: 4.5,
        trigger555: 9.0,
        output555: 0.0,
        clock7474: 0.0,
        qOutput: 0.0,
        qBarOutput: 5.0,
      });
    }
  }

  public subscribe(listener: (state: SimulationState) => void): () => void {
    this.onStateChangeListeners.push(listener);
    return () => {
      this.onStateChangeListeners = this.onStateChangeListeners.filter(l => l !== listener);
    };
  }

  public subscribeLogs(listener: (event: CircuitLogEvent) => void): () => void {
    this.onLogListeners.push(listener);
    return () => {
      this.onLogListeners = this.onLogListeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.onStateChangeListeners.forEach(listener => listener({ ...this.state }));
  }

  public addLog(
    stage: CircuitLogEvent['stage'],
    message: string,
    level: CircuitLogEvent['level'] = 'info',
    voltageData?: string
  ) {
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0] + '.' + String(now.getMilliseconds()).padStart(3, '0');
    const logEvent: CircuitLogEvent = {
      id: Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      timeOffset: this.simTime,
      stage,
      message,
      level,
      voltageData,
    };
    this.eventLogs.unshift(logEvent);
    if (this.eventLogs.length > this.maxEventLogs) {
      this.eventLogs.pop();
    }
    this.onLogListeners.forEach(l => l(logEvent));
  }

  /**
   * Main animation & physics loop
   */
  private startSimulationLoop() {
    const tick = () => {
      const now = performance.now();
      const dtRaw = (now - this.lastTickTime) / 1000;
      this.lastTickTime = now;
      const dt = Math.min(0.1, dtRaw) * (this.state.isPaused ? 0 : this.state.simulationSpeed);

      if (this.state.powerOn) {
        this.simTime += dt;
        this.updatePhysics(dt);
      }

      this.animId = requestAnimationFrame(tick);
    };
    this.animId = requestAnimationFrame(tick);
  }

  private updatePhysics(dt: number) {
    // 1. Decay microphone amplitude if virtual clap was triggered
    if (this.state.isClapActive && this.state.micAmplitude > 0) {
      this.state.micAmplitude = Math.max(0, this.state.micAmplitude - dt * 4.0);
      // Oscillate AC mic voltage
      const freq = 1200; // Hz
      const acSwing = Math.sin(this.simTime * freq * 2 * Math.PI) * this.state.micAmplitude * 3.5;
      this.state.micSignalVoltage = 4.5 + acSwing;
      if (this.state.micAmplitude <= 0.01) {
        this.state.isClapActive = false;
        this.state.micAmplitude = 0;
        this.state.micSignalVoltage = 4.5;
      }
    } else if (!this.state.isClapActive) {
      this.state.micSignalVoltage = 4.5;
    }

    // 2. 555 Monostable timing capacitor charge curve
    if (this.state.timer555IsTiming) {
      this.state.timer555TimeRemaining = Math.max(0, this.state.timer555TimeRemaining - dt);
      
      const elapsed = this.state.timingDuration - this.state.timer555TimeRemaining;
      const tau = this.state.r1TimingValue * this.state.c1TimingValue; // R1 * C1
      // V_C(t) = VCC * (1 - e^(-t / tau))
      const vc = this.state.supplyVoltage * (1 - Math.exp(-elapsed / tau));
      this.state.timer555ThresholdVoltage = Math.min(this.state.supplyVoltage * (2/3), vc);

      if (this.state.timer555TimeRemaining <= 0) {
        // Monostable pulse ends! Threshold reached 2/3 VCC -> Pin 3 goes LOW
        this.state.timer555IsTiming = false;
        this.state.timer555OutputVoltage = 0.0;
        this.state.timer555OutputState = 0;
        this.state.flipFlopClockVoltage = 0.0;
        this.state.flipFlopClockState = 0;
        this.state.timer555ThresholdVoltage = 0.0; // Discharged via Pin 7
        this.addLog('TIMER_555', '555 Monostable pulse elapsed: Output Pin 3 returned LOW (0V). C1 discharged.', 'info', 'V_out=0.0V, V_C1=0.0V');
      }
    }

    // 3. Smooth LED visual brightness animation
    const targetBrightness = this.state.ledIsOn ? 1.0 : 0.0;
    this.state.ledBrightness += (targetBrightness - this.state.ledBrightness) * Math.min(1.0, dt * 15.0);

    // 4. Record sample for digital oscilloscope
    this.recordScopeSample();

    this.notify();
  }

  private recordScopeSample() {
    const sample: OscilloscopeSample = {
      time: this.simTime,
      micAudio: this.state.powerOn ? this.state.micSignalVoltage : 0,
      trigger555: this.state.powerOn ? this.state.timer555TriggerVoltage : 0,
      output555: this.state.powerOn ? this.state.timer555OutputVoltage : 0,
      clock7474: this.state.powerOn ? this.state.flipFlopClockVoltage : 0,
      qOutput: this.state.powerOn ? (this.state.flipFlopQOutput === 1 ? 5.0 : 0.0) : 0,
      qBarOutput: this.state.powerOn ? (this.state.flipFlopQBarOutput === 1 ? 5.0 : 0.0) : 0,
    };
    this.scopeSamples.push(sample);
    if (this.scopeSamples.length > this.maxScopeSamples) {
      this.scopeSamples.shift();
    }
  }

  /**
   * TRIGGER A CLAP EVENT (Virtual or Microphone-detected)
   * Executes the exact causal chain with pedagogically calibrated delays!
   */
  public triggerClap(source: 'virtual' | 'real_mic' | 'step' = 'virtual'): void {
    if (!this.state.powerOn) {
      this.addLog('SYSTEM', 'Clap ignored: Circuit power is OFF! Turn ON battery power first.', 'warn');
      return;
    }

    // Clear previous pending timeouts if any
    this.clapSequenceTimeout.forEach(clearTimeout);
    this.clapSequenceTimeout = [];

    const speed = this.state.simulationSpeed;
    const delay = (ms: number) => ms / speed;

    this.state.clapCount++;
    this.state.lastClapTimestamp = performance.now();
    this.state.isClapActive = true;
    this.state.micAmplitude = 0.95;
    this.state.clapSource = source;

    if (source === 'virtual') {
      audioEngine.playClapSound();
    }

    this.addLog('MIC', `CLAP #${this.state.clapCount} DETECTED (${source.toUpperCase()}): Acoustic pressure wave struck electret diaphragm.`, 'trigger', 'Peak Amplitude: 0.95');

    // STAGE 1: Microphone converts sound to AC electrical transient (T + 25ms)
    const t1 = window.setTimeout(() => {
      this.state.micSignalVoltage = 1.2; // AC swing drops then spikes
      this.addLog('MIC', 'Microphone generated AC voltage transient passed through C2 coupling capacitor.', 'info', 'V_mic_AC = 1.2V - 7.8V');
      this.notify();
    }, delay(25));
    this.clapSequenceTimeout.push(t1);

    // STAGE 2: BC547 Transistor Base drives into saturation (T + 60ms)
    const t2 = window.setTimeout(() => {
      this.state.transistorBaseVoltage = 0.74; // >0.7V silicon barrier
      this.state.transistorIsOn = true;
      this.state.transistorCollectorVoltage = 0.18; // Vce_sat
      this.addLog('TRANSISTOR', 'BC547 Base V_BE > 0.7V: Transistor SATURATED (ON). Collector pulled to 0.18V.', 'active', 'V_BE=0.74V, V_CE=0.18V');
      this.notify();
    }, delay(60));
    this.clapSequenceTimeout.push(t2);

    // STAGE 3: 555 Timer Pin 2 Triggered (T + 100ms)
    const t3 = window.setTimeout(() => {
      this.state.timer555TriggerVoltage = 0.18; // < 1/3 VCC (3.0V)
      this.addLog('TIMER_555', '555 Pin 2 (TRIG) < 1/3 VCC (3.0V): Internal comparator triggered monostable latch!', 'trigger', 'V_TRIG=0.18V (<3.0V threshold)');
      this.notify();
    }, delay(100));
    this.clapSequenceTimeout.push(t3);

    // STAGE 4: 555 Output Pin 3 fires HIGH -> Monostable Pulse Starts (T + 140ms)
    const t4 = window.setTimeout(() => {
      this.state.timer555OutputVoltage = 9.0;
      this.state.timer555OutputState = 1;
      this.state.timer555IsTiming = true;
      this.state.timer555TimeRemaining = this.state.timingDuration;
      
      // Clock input to 7474 receives the rising edge
      this.state.flipFlopClockVoltage = 5.0;
      this.state.flipFlopClockState = 1;
      this.state.flipFlopClockEdgeDetected = true;

      // Transistor returns to OFF as AC transient ends
      this.state.transistorBaseVoltage = 0.0;
      this.state.transistorIsOn = false;
      this.state.transistorCollectorVoltage = 9.0;
      this.state.timer555TriggerVoltage = 9.0;

      this.addLog('TIMER_555', `555 Output Pin 3 went HIGH (+9.0V). Timing capacitor C1 charging for T = ${this.state.timingDuration.toFixed(3)}s.`, 'active', 'V_OUT=9.0V');
      this.addLog('FLIPFLOP_7474', 'POSITIVE CLOCK EDGE (0 → 1) arrived at 7474 Pin 3 (CLK).', 'trigger', 'CLK: LOW -> HIGH');
      this.notify();
    }, delay(140));
    this.clapSequenceTimeout.push(t4);

    // STAGE 5: 7474 D Flip-Flop Samples D and Toggles (T + 180ms)
    const t5 = window.setTimeout(() => {
      // D is currently equal to Q_bar
      const currentD = this.state.flipFlopDInput;
      const prevQ = this.state.flipFlopQOutput;
      const nextQ = currentD; // Flip-flop copies D to Q on rising edge
      const nextQBar = (nextQ === 1 ? 0 : 1) as 0 | 1;
      const nextD = nextQBar; // Q' feeds back to D!

      this.state.flipFlopQOutput = nextQ;
      this.state.flipFlopQBarOutput = nextQBar;
      this.state.flipFlopDInput = nextD;

      if (nextQ === 1) {
        this.state.ledIsOn = true;
        this.state.ledVoltage = 2.1;
        this.state.ledCurrentMa = 14.8;
        this.state.cycleCount++;
        audioEngine.playRelayClick(true);
        this.addLog('FLIPFLOP_7474', `D FLIP-FLOP TOGGLED: Sampled D=${currentD} → Q changed from ${prevQ} to 1. Q' becomes 0 (feeding D=0).`, 'success', 'Q=1, Q\'=0, D_next=0');
        this.addLog('OUTPUT', 'CLAP ON! Forward current 14.8mA flowing through LED1. Red photons emitted.', 'success', 'V_LED=2.1V, I_LED=14.8mA');
      } else {
        this.state.ledIsOn = false;
        this.state.ledVoltage = 0.0;
        this.state.ledCurrentMa = 0.0;
        audioEngine.playRelayClick(false);
        this.addLog('FLIPFLOP_7474', `D FLIP-FLOP TOGGLED: Sampled D=${currentD} → Q changed from ${prevQ} to 0. Q' becomes 1 (feeding D=1).`, 'warn', 'Q=0, Q\'=1, D_next=1');
        this.addLog('OUTPUT', 'CLAP OFF! LED1 extinguished. Circuit ready for next turn-on clap.', 'warn', 'V_LED=0.0V, I_LED=0.0mA');
      }

      this.notify();
    }, delay(180));
    this.clapSequenceTimeout.push(t5);
  }

  /**
   * Update real microphone waveform data
   */
  public updateMicRealAudio(amplitude: number) {
    if (this.state.powerOn) {
      this.state.micAmplitude = amplitude;
      this.state.micSignalVoltage = 4.5 + (amplitude * 4.0 * (Math.random() > 0.5 ? 1 : -1));
      this.notify();
    }
  }

  /**
   * Step-by-Step execution handler
   */
  public executeTutorialStep(stepIndex: number, steps: StepTutorialItem[]) {
    if (!this.state.powerOn) return;
    const step = steps[stepIndex];
    if (!step) return;

    this.addLog('SYSTEM', `[STEP-BY-STEP] Executing Step ${step.stepNumber}: ${step.title}`, 'info');

    // Configure exact simulation snapshot for this educational step
    switch (stepIndex) {
      case 0: // Step 1: Initial Quiescent State
        this.state.micAmplitude = 0;
        this.state.micSignalVoltage = 4.5;
        this.state.transistorBaseVoltage = 0.0;
        this.state.transistorCollectorVoltage = 9.0;
        this.state.transistorIsOn = false;
        this.state.timer555TriggerVoltage = 9.0;
        this.state.timer555OutputVoltage = 0.0;
        this.state.timer555OutputState = 0;
        this.state.timer555IsTiming = false;
        this.state.flipFlopClockVoltage = 0.0;
        this.state.flipFlopClockState = 0;
        this.state.flipFlopDInput = 1;
        this.state.flipFlopQOutput = 0;
        this.state.flipFlopQBarOutput = 1;
        this.state.ledIsOn = false;
        this.state.ledVoltage = 0.0;
        this.state.ledCurrentMa = 0.0;
        break;
      case 1: // Step 2: Clap Sound Wave Approaching Mic
        this.state.micAmplitude = 0.95;
        audioEngine.playClapSound();
        break;
      case 2: // Step 3: Microphone Transducer AC Pulse
        this.state.micSignalVoltage = 7.5;
        this.state.micAmplitude = 0.8;
        break;
      case 3: // Step 4: BC547 Transistor Switches ON
        this.state.transistorBaseVoltage = 0.74;
        this.state.transistorIsOn = true;
        this.state.transistorCollectorVoltage = 0.18;
        break;
      case 4: // Step 5: 555 Pin 2 Triggered LOW
        this.state.timer555TriggerVoltage = 0.18;
        break;
      case 5: // Step 6: 555 Output Pin 3 Goes HIGH (Monostable Pulse)
        this.state.timer555OutputVoltage = 9.0;
        this.state.timer555OutputState = 1;
        this.state.timer555IsTiming = true;
        this.state.timer555TimeRemaining = this.state.timingDuration;
        this.state.flipFlopClockVoltage = 5.0;
        this.state.flipFlopClockState = 1;
        break;
      case 6: // Step 7: Rising Clock Edge Arrives at 7474 CLK
        this.state.flipFlopClockVoltage = 5.0;
        this.state.flipFlopClockState = 1;
        break;
      case 7: // Step 8: 7474 Samples D=1
        this.state.flipFlopDInput = 1;
        break;
      case 8: // Step 9: 7474 State Toggles (Q=1, Q'=0)
        this.state.flipFlopQOutput = 1;
        this.state.flipFlopQBarOutput = 0;
        this.state.flipFlopDInput = 0;
        break;
      case 9: // Step 10: LED Turns ON (Red glow)
        this.state.ledIsOn = true;
        this.state.ledVoltage = 2.1;
        this.state.ledCurrentMa = 14.8;
        audioEngine.playRelayClick(true);
        break;
      case 10: // Step 11: Second Clap Toggles LED OFF
        this.triggerClap('step');
        break;
    }

    this.notify();
  }

  /**
   * Reset the entire circuit to pristine initial state
   */
  public reset(): void {
    this.clapSequenceTimeout.forEach(clearTimeout);
    this.clapSequenceTimeout = [];

    this.state.micAmplitude = 0.0;
    this.state.micSignalVoltage = 4.5;
    this.state.isClapActive = false;
    this.state.clapSource = 'none';

    this.state.transistorBaseVoltage = 0.0;
    this.state.transistorCollectorVoltage = 9.0;
    this.state.transistorIsOn = false;

    this.state.timer555TriggerVoltage = 9.0;
    this.state.timer555ThresholdVoltage = 0.0;
    this.state.timer555OutputVoltage = 0.0;
    this.state.timer555OutputState = 0;
    this.state.timer555IsTiming = false;
    this.state.timer555TimeRemaining = 0;

    this.state.flipFlopClockVoltage = 0.0;
    this.state.flipFlopClockState = 0;
    this.state.flipFlopClockEdgeDetected = false;
    this.state.flipFlopDInput = 1; // Q'=1 -> D=1
    this.state.flipFlopQOutput = 0; // Initial Q=0
    this.state.flipFlopQBarOutput = 1; // Initial Q'=1

    this.state.ledVoltage = 0.0;
    this.state.ledCurrentMa = 0.0;
    this.state.ledIsOn = false;
    this.state.ledBrightness = 0.0;

    this.state.clapCount = 0;
    this.state.cycleCount = 0;

    this.initScopeBuffer();
    this.addLog('SYSTEM', 'Circuit RESET to Initial State: Q=0, Q\'=1, D=1, LED=OFF. Ready for next clap.', 'info');
    this.notify();
  }

  /**
   * Turn ON the light / LED
   */
  public turnOnLight(): void {
    if (!this.state.powerOn) {
      this.state.powerOn = true;
      this.addLog('POWER', 'MAIN POWER SWITCH CLOSED: +5.0V DC restored to VCC rail.', 'success');
    }
    if (!this.state.ledIsOn) {
      this.triggerClap('virtual');
    }
  }

  /**
   * Turn OFF the light / LED
   */
  public turnOffLight(): void {
    if (!this.state.powerOn) return;
    if (this.state.ledIsOn) {
      this.triggerClap('virtual');
    }
  }

  /**
   * Toggle the light / LED
   */
  public toggleLight(): void {
    if (!this.state.powerOn) {
      this.state.powerOn = true;
      this.addLog('POWER', 'MAIN POWER SWITCH CLOSED: +5.0V DC restored to VCC rail.', 'success');
    }
    this.triggerClap('virtual');
  }

  /**
   * Toggle main DC power switch
   */
  public togglePower(): void {
    this.state.powerOn = !this.state.powerOn;
    if (!this.state.powerOn) {
      this.clapSequenceTimeout.forEach(clearTimeout);
      this.clapSequenceTimeout = [];
      this.state.ledIsOn = false;
      this.state.ledBrightness = 0;
      this.state.ledVoltage = 0;
      this.state.ledCurrentMa = 0;
      this.state.timer555IsTiming = false;
      this.state.transistorIsOn = false;
      this.addLog('POWER', 'MAIN POWER SWITCH OPENED: Circuit de-energized (0V).', 'warn');
    } else {
      this.addLog('POWER', 'MAIN POWER SWITCH CLOSED: +9.0V DC restored to VCC rail.', 'success');
    }
    this.notify();
  }

  /**
   * Configure 555 Monostable Timing Parameters (R1 & C1)
   */
  public setTimingParameters(r1Ohms: number, c1Farads: number) {
    this.state.r1TimingValue = r1Ohms;
    this.state.c1TimingValue = c1Farads;
    this.state.timingDuration = 1.1 * r1Ohms * c1Farads;
    this.addLog('TIMER_555', `555 Timing parameters updated: R4 = ${(r1Ohms/1000).toFixed(1)}kΩ, C3 = ${(c1Farads*1e6).toFixed(1)}µF. Pulse duration T = ${this.state.timingDuration.toFixed(3)}s.`, 'info');
    this.notify();
  }

  /**
   * Configure simulation speed (0.25x, 0.5x, 1x, 2x)
   */
  public setSimulationSpeed(speed: number) {
    this.state.simulationSpeed = speed;
    this.addLog('SYSTEM', `Simulation speed set to ${speed}x`, 'info');
    this.notify();
  }

  public setPaused(paused: boolean) {
    this.state.isPaused = paused;
    this.addLog('SYSTEM', paused ? 'Simulation PAUSED' : 'Simulation RESUMED', 'info');
    this.notify();
  }

  public destroy() {
    if (this.animId) {
      cancelAnimationFrame(this.animId);
    }
    this.clapSequenceTimeout.forEach(clearTimeout);
  }
}

export const circuitSim = new CircuitSimulationEngine();
