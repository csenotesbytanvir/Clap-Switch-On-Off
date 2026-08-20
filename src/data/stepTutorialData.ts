import { StepTutorialItem } from '../types';

export const STEP_TUTORIAL_DATA: StepTutorialItem[] = [
  {
    stepNumber: 1,
    title: 'Initial Quiescent State',
    stage: 'Quiescence',
    componentIds: ['BAT1', 'SW1', 'U1_555', 'U2_7474', 'LED1'],
    wireIds: ['WIRE_BAT_TO_SW', 'WIRE_SW_TO_VCC_BUS', 'WIRE_BAT_GND_MAIN'],
    explanation: 'The circuit is powered by 9V DC in silence. The microphone produces no AC signal, BC547 is cutoff (OFF), the 555 timer output is LOW (0V), the 7474 flip-flop holds Q=0 (Q\'=1, D=1), and the LED is completely OFF.',
    technicalDetails: 'VCC = 9.0V | Transistor Base = 0.0V (R2 pull-down) | 555 Pin 2 = 9.0V (R3 pull-up) | 555 Pin 3 = 0.0V | 7474 D = 1, CLK = 0, Q = 0, Q\' = 1 | LED = OFF (0mA)',
    stateSnapshot: {
      micState: 'IDLE (4.5V DC Bias)',
      bc547State: 'CUTOFF (OFF, Vbe=0V)',
      pin2State: 'HIGH (+9.0V)',
      pin3State: 'LOW (0.0V)',
      clkState: 'LOW (0V)',
      dState: 'HIGH (1)',
      qState: 'LOW (0)',
      qBarState: 'HIGH (1)',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 2,
    title: 'Clap Acoustic Wave Detection',
    stage: 'Acoustic Sensing',
    componentIds: ['MIC1'],
    wireIds: ['WIRE_MIC_TO_CCOUP'],
    explanation: 'A sharp hand clap creates a sudden compression wave in the air. The acoustic pressure wave strikes the flexible electret diaphragm inside the condenser microphone capsule.',
    technicalDetails: 'Diaphragm deflection varies internal capacitance, modulating the gate of the internal JFET and producing an AC electrical voltage fluctuation.',
    stateSnapshot: {
      micState: 'ACOUSTIC WAVE STRIKING DIAPHRAGM',
      bc547State: 'OFF',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'LOW (0.0V)',
      clkState: 'LOW (0V)',
      dState: '1',
      qState: '0',
      qBarState: '1',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 3,
    title: 'Microphone Electrical Conversion & AC Coupling',
    stage: 'Transducer & Coupling',
    componentIds: ['MIC1', 'R_MIC', 'C_COUP'],
    wireIds: ['WIRE_MIC_TO_CCOUP', 'WIRE_CCOUP_TO_BASE'],
    explanation: 'The microphone transforms sound pressure into an AC electrical pulse. Capacitor C2 (100nF) blocks the steady DC bias voltage (+4.5V) while letting the high-speed transient pulse pass directly to the transistor base.',
    technicalDetails: 'DC blocking capacitor formula: passes high-frequency edge (dt < 1ms) while isolating DC operating points. Base transient voltage spikes positive.',
    stateSnapshot: {
      micState: 'AC VOLTAGE SPIKE GENERATED',
      bc547State: 'ABOUT TO CONDUCT',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'LOW (0.0V)',
      clkState: 'LOW (0V)',
      dState: '1',
      qState: '0',
      qBarState: '1',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 4,
    title: 'BC547 Transistor Switches ON (Saturation)',
    stage: 'Amplification & Inversion',
    componentIds: ['Q1', 'R_BASE', 'R_COL'],
    wireIds: ['WIRE_CCOUP_TO_BASE', 'WIRE_Q1_TO_555_TRIG'],
    explanation: 'The positive transient pulse charges BC547 Base-Emitter junction above 0.7V. The transistor abruptly switches from cutoff into full saturation (ON), conducting collector current down to ground.',
    technicalDetails: 'Base-Emitter Vbe = 0.74V > 0.7V. Collector-Emitter Vce collapses from 9.0V down to Vce(sat) ≈ 0.18V. The collector node undergoes a rapid falling edge (9V -> 0.2V).',
    stateSnapshot: {
      micState: 'ACTIVE',
      bc547State: 'SATURATED (ON, Vce=0.18V)',
      pin2State: 'FALLING (9V → 0.18V)',
      pin3State: 'LOW (0.0V)',
      clkState: 'LOW (0V)',
      dState: '1',
      qState: '0',
      qBarState: '1',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 5,
    title: '555 Timer Pin 2 Triggered LOW',
    stage: 'Comparator Trigger',
    componentIds: ['U1_555', 'Q1'],
    wireIds: ['WIRE_Q1_TO_555_TRIG'],
    explanation: 'Because BC547 Collector is wired to 555 Pin 2 (TRIG), Pin 2 is pulled down to 0.18V. This is far below the internal 1/3 VCC threshold (3.0V), triggering the 555\'s lower internal comparator.',
    technicalDetails: '555 Internal Trigger Comparator: Compares Pin 2 against 1/3 VCC reference. Since 0.18V < 3.00V, the comparator outputs a SET pulse to the internal RS flip-flop latch.',
    stateSnapshot: {
      micState: 'DECAYING',
      bc547State: 'PULLING PIN 2 LOW',
      pin2State: 'TRIGGERED (<1/3 VCC, 0.18V)',
      pin3State: 'SWITCHING HIGH',
      clkState: '0 → 1 RISING EDGE',
      dState: '1',
      qState: '0',
      qBarState: '1',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 6,
    title: '555 Monostable Output Fires HIGH',
    stage: 'Pulse Generation',
    componentIds: ['U1_555', 'R_TIMING', 'C_TIMING'],
    wireIds: ['WIRE_555_TO_7474_CLK', 'WIRE_555_RC_NODE'],
    explanation: 'The 555 latch sets: Output Pin 3 instantly drives HIGH (+9.0V), while Pin 7 (Discharge) turns OFF. Timing capacitor C3 begins charging exponentially through R4 toward VCC for duration T = 1.1 × R4 × C3 ≈ 0.5s.',
    technicalDetails: 'Output Pin 3 produces a clean, debounced digital clock pulse. Even if the microphone rattles or rings, the monostable pulse width ignores further claps during this window.',
    stateSnapshot: {
      micState: 'IDLE',
      bc547State: 'OFF (Reset by R2)',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'HIGH (+9.0V Monostable Pulse)',
      clkState: 'RISING EDGE (0 → 1)',
      dState: '1 (Ready to be clocked)',
      qState: '0',
      qBarState: '1',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 7,
    title: 'Positive Clock Edge Arrives at 7474 (CLK)',
    stage: 'Clock Edge Arrival',
    componentIds: ['U1_555', 'U2_7474'],
    wireIds: ['WIRE_555_TO_7474_CLK'],
    explanation: 'The sharp 0V → 9V rising edge from 555 Pin 3 travels through the connecting wire to Pin 3 (CLK) of the DM74S74N D-type flip-flop.',
    technicalDetails: 'Positive Edge Triggering: The 7474 master-slave gate structure triggers only on the low-to-high transition (↑), ignoring steady HIGH or falling edges.',
    stateSnapshot: {
      micState: 'IDLE',
      bc547State: 'OFF',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'HIGH (+9.0V)',
      clkState: 'POSITIVE EDGE DETECTED (↑)',
      dState: '1',
      qState: '0',
      qBarState: '1',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 8,
    title: '7474 Samples D Input (Fed by Q\')',
    stage: 'Data Sampling & Feedback',
    componentIds: ['U2_7474'],
    wireIds: ['WIRE_7474_FEEDBACK'],
    explanation: 'At the exact instant of the clock rising edge, the 7474 samples the logic level at Pin 2 (D). Since Pin 2 is connected to Pin 6 (Q\') and Q\' was previously 1, D = 1 is sampled.',
    technicalDetails: 'Feedback Loop Equation: D(t) = Q\'(t). Before clap, Q=0, so Q\'=1, making D=1. The flip-flop prepares to transfer 1 into Q.',
    stateSnapshot: {
      micState: 'IDLE',
      bc547State: 'OFF',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'HIGH (9.0V)',
      clkState: 'HIGH (1)',
      dState: 'SAMPLED (D = 1)',
      qState: 'CHANGING (0 → 1)',
      qBarState: 'CHANGING (1 → 0)',
      ledState: 'OFF'
    }
  },
  {
    stepNumber: 9,
    title: 'Flip-Flop Latches New State (Q=1, Q\'=0)',
    stage: 'Bistable Memory Toggle',
    componentIds: ['U2_7474'],
    wireIds: ['WIRE_7474_FEEDBACK', 'WIRE_7474_Q_TO_RLED'],
    explanation: 'The internal logic gates lock in the new state: Pin 5 (Q) flips from 0 to 1 (+5V), while Pin 6 (Q\') flips from 1 to 0 (0V). The feedback wire immediately updates Pin 2 (D) to 0 in preparation for the next clap!',
    technicalDetails: 'Bistable Toggle: Q_new = D_sampled = 1. Q\'_new = NOT(Q_new) = 0. D_new = Q\'_new = 0.',
    stateSnapshot: {
      micState: 'IDLE',
      bc547State: 'OFF',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'HIGH (Timing...',
      clkState: 'HIGH (1)',
      dState: 'UPDATED TO 0 (via Q\')',
      qState: 'LATCHED HIGH (1)',
      qBarState: 'LATCHED LOW (0)',
      ledState: 'TURNING ON'
    }
  },
  {
    stepNumber: 10,
    title: 'Output Stage: Current Flows and LED Illuminates',
    stage: 'Photon Emission (CLAP ON)',
    componentIds: ['U2_7474', 'R_LED', 'LED1', 'RL1'],
    wireIds: ['WIRE_7474_Q_TO_RLED', 'WIRE_RLED_TO_LED'],
    explanation: 'With Q=1 (+5V), forward current flows through current-limiting resistor R5 (330Ω) into LED1. The LED turns ON with a bright red glow, and the relay switches the room appliance ON!',
    technicalDetails: 'I_LED = (V_Q - V_LED) / R5 = (5.0V - 2.1V) / 330Ω ≈ 8.8mA - 15mA. Safe forward bias emits 630nm red photons. CLAP ON cycle complete!',
    stateSnapshot: {
      micState: 'IDLE',
      bc547State: 'OFF',
      pin2State: 'HIGH (9.0V)',
      pin3State: 'RETURNING LOW (0V)',
      clkState: 'LOW (0V)',
      dState: '0 (Ready for turn OFF)',
      qState: '1 (HIGH)',
      qBarState: '0 (LOW)',
      ledState: 'GLOWING BRIGHT RED (ON)'
    }
  },
  {
    stepNumber: 11,
    title: 'Second Clap: Toggle Cycle (CLAP OFF)',
    stage: 'Symmetrical Turn-Off',
    componentIds: ['MIC1', 'Q1', 'U1_555', 'U2_7474', 'LED1'],
    wireIds: ['WIRE_7474_FEEDBACK', 'WIRE_RLED_TO_LED'],
    explanation: 'When the user claps a second time, the exact same trigger pulse occurs. But this time D = 0 (since Q\'=0). The rising clock edge transfers D=0 to Q: Q becomes 0, Q\' becomes 1, and the LED turns OFF!',
    technicalDetails: 'Second Clap Transition: Clock rising edge samples D=0 → Q flips from 1 to 0 → Q\' flips from 0 to 1 → D becomes 1 again → LED forward current drops to 0mA (OFF).',
    stateSnapshot: {
      micState: 'SECOND CLAP DETECTED',
      bc547State: 'SWITCHED & RESET',
      pin2State: 'PULSED',
      pin3State: 'PULSED HIGH',
      clkState: 'RISING EDGE',
      dState: '0 (Sampled)',
      qState: 'FLIPPED TO 0 (LOW)',
      qBarState: 'FLIPPED TO 1 (HIGH)',
      ledState: 'EXTINGUISHED (OFF)'
    }
  }
];
