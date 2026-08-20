export type LogicLevel = 0 | 1;

export interface ComponentPin {
  id: string;
  name: string;
  pinNumber?: number;
  type: 'input' | 'output' | 'power' | 'ground' | 'passive' | 'control';
  relativePos: [number, number, number]; // Offset relative to component center
  currentVoltage: number;
  logicLevel?: LogicLevel;
  description: string;
}

export interface CircuitComponentData {
  id: string;
  name: string;
  designator: string; // e.g. "U1", "Q1", "MIC1", "LED1", "R1", "C1"
  type: 'ic_555' | 'ic_7474' | 'transistor_bc547' | 'mic' | 'led' | 'resistor' | 'capacitor' | 'battery' | 'switch' | 'relay';
  position: [number, number, number];
  rotation?: [number, number, number];
  value?: string;
  pins: ComponentPin[];
  section: 'power' | 'sensor' | 'amplifier' | 'timer' | 'flipflop' | 'output';
  description: string;
  detailedFunction: string;
  stateText: string;
}

export interface CircuitWire {
  id: string;
  name: string;
  fromComponentId: string;
  fromPinId: string;
  toComponentId: string;
  toPinId: string;
  signalType: 'power' | 'ground' | 'analog' | 'trigger' | 'clock' | 'feedback' | 'logic' | 'output';
  color: string;
  waypoints?: [number, number, number][]; // 3D path coordinates
  description: string;
  voltage: number;
  isActive: boolean;
  pulseProgress?: number;
}

export interface SimulationState {
  powerOn: boolean;
  supplyVoltage: number; // e.g. 9.0V
  simulationSpeed: number; // 0.25, 0.5, 1.0, 2.0
  isPaused: boolean;
  
  // Timing parameters
  r1TimingValue: number; // e.g. 100k Ohms
  c1TimingValue: number; // e.g. 4.7uF
  timingDuration: number; // T = 1.1 * R1 * C1 (seconds)
  
  // Stage States
  micAmplitude: number; // 0.0 to 1.0
  micSignalVoltage: number; // AC swing around bias
  isClapActive: boolean;
  clapSource: 'virtual' | 'real_mic' | 'step' | 'none';
  
  transistorBaseVoltage: number; // 0 to 0.75V
  transistorCollectorVoltage: number; // 9V down to 0.2V
  transistorIsOn: boolean;
  
  timer555TriggerVoltage: number; // Pin 2 voltage (normally VCC, drops < 1/3 VCC)
  timer555ThresholdVoltage: number; // Pin 6 voltage (capacitor charge curve)
  timer555OutputVoltage: number; // Pin 3 voltage (0V or 9V)
  timer555OutputState: LogicLevel;
  timer555IsTiming: boolean;
  timer555TimeRemaining: number;
  
  flipFlopClockVoltage: number; // 7474 Pin 3 (CLK)
  flipFlopClockState: LogicLevel;
  flipFlopClockEdgeDetected: boolean;
  flipFlopDInput: LogicLevel; // 7474 Pin 2 (D)
  flipFlopQOutput: LogicLevel; // 7474 Pin 5 (Q)
  flipFlopQBarOutput: LogicLevel; // 7474 Pin 6 (Q')
  
  ledVoltage: number; // 0V or ~2.1V
  ledCurrentMa: number; // 0 to ~15mA
  ledIsOn: boolean;
  ledBrightness: number; // 0.0 to 1.0 (smooth visual fade)
  
  // Stats
  clapCount: number;
  cycleCount: number;
  lastClapTimestamp: number;
}

export interface OscilloscopeSample {
  time: number; // seconds
  micAudio: number;
  trigger555: number;
  output555: number;
  clock7474: number;
  qOutput: number;
  qBarOutput: number;
}

export interface CircuitLogEvent {
  id: string;
  timestamp: string;
  timeOffset: number;
  stage: 'POWER' | 'MIC' | 'TRANSISTOR' | 'TIMER_555' | 'FLIPFLOP_7474' | 'OUTPUT' | 'SYSTEM';
  message: string;
  level: 'info' | 'trigger' | 'active' | 'success' | 'warn';
  voltageData?: string;
}

export interface StepTutorialItem {
  stepNumber: number;
  title: string;
  stage: string;
  componentIds: string[];
  wireIds: string[];
  explanation: string;
  technicalDetails: string;
  stateSnapshot: {
    micState: string;
    bc547State: string;
    pin2State: string;
    pin3State: string;
    clkState: string;
    dState: string;
    qState: string;
    qBarState: string;
    ledState: string;
  };
}

export type CameraPreset = 'overview' | 'sensor' | 'timer' | 'flipflop' | 'output' | 'pcb_top';
