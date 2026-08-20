import { CircuitWire } from '../types';

export const CIRCUIT_WIRES: CircuitWire[] = [
  // 1. Power Supply Rail Wires
  {
    id: 'WIRE_BAT_TO_SW',
    name: 'Battery (+) to Switch Input',
    fromComponentId: 'BAT1',
    fromPinId: 'BAT1_POS',
    toComponentId: 'SW1',
    toPinId: 'SW1_IN',
    signalType: 'power',
    color: '#ef4444', // Red
    voltage: 9.0,
    isActive: true,
    description: 'Connects +9V positive battery terminal to main power toggle switch.',
    waypoints: [
      [-9.65, 1.2, -4.5],
      [-9.0, 1.2, -4.5],
      [-8.3, 0.4, -4.5]
    ]
  },
  {
    id: 'WIRE_SW_TO_VCC_BUS',
    name: 'Switch Output to Main VCC Rail',
    fromComponentId: 'SW1',
    fromPinId: 'SW1_OUT',
    toComponentId: 'R_MIC',
    toPinId: 'R_MIC_VCC',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Main +9V VCC power distribution bus supplying all active stages.',
    waypoints: [
      [-7.7, 0.4, -4.5],
      [-7.4, 0.5, -3.5],
      [-7.4, 0.2, -2.5]
    ]
  },
  {
    id: 'WIRE_VCC_TO_RCOL',
    name: 'VCC Rail to Collector Pull-up (R3)',
    fromComponentId: 'SW1',
    fromPinId: 'SW1_OUT',
    toComponentId: 'R_COL',
    toPinId: 'R_COL_VCC',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Supplies +9V to R3 pull-up resistor holding 555 Trigger HIGH.',
    waypoints: [
      [-7.7, 0.4, -4.5],
      [-5.0, 0.3, -4.5],
      [-4.0, 0.2, -3.0]
    ]
  },
  {
    id: 'WIRE_VCC_TO_555_P8',
    name: 'VCC Rail to 555 Pin 8 (VCC)',
    fromComponentId: 'SW1',
    fromPinId: 'SW1_OUT',
    toComponentId: 'U1_555',
    toPinId: '555_P8',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Supplies operating power (+9V) to NE555 Timer IC Pin 8.',
    waypoints: [
      [-7.7, 0.4, -4.5],
      [0.0, 0.3, -4.5],
      [1.2, 0.2, -0.25]
    ]
  },
  {
    id: 'WIRE_VCC_TO_555_P4',
    name: 'VCC Rail to 555 Pin 4 (RESET)',
    fromComponentId: 'U1_555',
    fromPinId: '555_P8',
    toComponentId: 'U1_555',
    toPinId: '555_P4',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Ties 555 active-LOW Reset Pin 4 HIGH to prevent accidental resets.',
    waypoints: [
      [1.2, 0.2, -0.25],
      [0.5, 0.6, -1.8],
      [-0.2, 0.2, -1.75]
    ]
  },
  {
    id: 'WIRE_VCC_TO_RTIMING',
    name: 'VCC Rail to 555 Timing Resistor (R4)',
    fromComponentId: 'SW1',
    fromPinId: 'SW1_OUT',
    toComponentId: 'R_TIMING',
    toPinId: 'R_TIMING_VCC',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Supplies charging current from VCC into 555 RC timing branch.',
    waypoints: [
      [-7.7, 0.4, -4.5],
      [1.5, 0.3, -4.5],
      [1.9, 0.2, -3.2]
    ]
  },
  {
    id: 'WIRE_VCC_TO_7474_P14',
    name: 'VCC Rail to 7474 Pin 14 (VCC)',
    fromComponentId: 'SW1',
    fromPinId: 'SW1_OUT',
    toComponentId: 'U2_7474',
    toPinId: '7474_P14',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Powers 7474 Dual D-Type Flip Flop IC positive supply rail.',
    waypoints: [
      [-7.7, 0.4, -4.5],
      [5.5, 0.3, -4.5],
      [7.1, 0.2, 0.2]
    ]
  },
  {
    id: 'WIRE_VCC_TO_7474_P1_P4',
    name: 'VCC to 7474 Pin 1 (1CLR\') & Pin 4 (1PRE\')',
    fromComponentId: 'U2_7474',
    fromPinId: '7474_P14',
    toComponentId: 'U2_7474',
    toPinId: '7474_P1',
    signalType: 'power',
    color: '#ef4444',
    voltage: 9.0,
    isActive: true,
    description: 'Holds Active-LOW Asynchronous Preset and Clear inputs HIGH (inactive).',
    waypoints: [
      [7.1, 0.2, 0.2],
      [6.2, 0.6, 1.4],
      [5.3, 0.2, 0.2]
    ]
  },

  // 2. Common Ground Rail Wires
  {
    id: 'WIRE_BAT_GND_MAIN',
    name: 'Main Battery Ground Bus',
    fromComponentId: 'BAT1',
    fromPinId: 'BAT1_NEG',
    toComponentId: 'MIC1',
    toPinId: 'MIC1_NEG',
    signalType: 'ground',
    color: '#1e293b', // Dark slate / ground
    voltage: 0.0,
    isActive: true,
    description: 'Common 0V Ground reference return wire.',
    waypoints: [
      [-10.35, 1.2, -4.5],
      [-9.0, 0.1, 4.0],
      [-6.8, 0.6, 0.5]
    ]
  },
  {
    id: 'WIRE_GND_TO_Q1_EMITTER',
    name: 'Ground to BC547 Emitter',
    fromComponentId: 'MIC1',
    fromPinId: 'MIC1_NEG',
    toComponentId: 'Q1',
    toPinId: 'Q1_EMITTER',
    signalType: 'ground',
    color: '#1e293b',
    voltage: 0.0,
    isActive: true,
    description: 'Connects BC547 transistor Emitter directly to 0V ground.',
    waypoints: [
      [-6.8, 0.6, 0.5],
      [-5.0, 0.1, 1.5],
      [-3.4, 0.5, -0.2]
    ]
  },
  {
    id: 'WIRE_GND_TO_555_P1',
    name: 'Ground to 555 Pin 1 (GND)',
    fromComponentId: 'Q1',
    fromPinId: 'Q1_EMITTER',
    toComponentId: 'U1_555',
    toPinId: '555_P1',
    signalType: 'ground',
    color: '#1e293b',
    voltage: 0.0,
    isActive: true,
    description: 'Ground reference for 555 Timer IC.',
    waypoints: [
      [-3.4, 0.5, -0.2],
      [-1.5, 0.1, 3.5],
      [-0.2, 0.2, -0.25]
    ]
  },
  {
    id: 'WIRE_GND_TO_7474_P7',
    name: 'Ground to 7474 Pin 7 (GND)',
    fromComponentId: 'U1_555',
    fromPinId: '555_P1',
    toComponentId: 'U2_7474',
    toPinId: '7474_P7',
    signalType: 'ground',
    color: '#1e293b',
    voltage: 0.0,
    isActive: true,
    description: 'Ground reference for 7474 Flip-Flop IC.',
    waypoints: [
      [-0.2, 0.2, -0.25],
      [3.0, 0.1, 3.5],
      [5.3, 0.2, -2.2]
    ]
  },
  {
    id: 'WIRE_GND_TO_LED_CATHODE',
    name: 'Ground to LED Cathode',
    fromComponentId: 'U2_7474',
    fromPinId: '7474_P7',
    toComponentId: 'LED1',
    toPinId: 'LED1_CATHODE',
    signalType: 'ground',
    color: '#1e293b',
    voltage: 0.0,
    isActive: true,
    description: 'Ground return for LED cathode.',
    waypoints: [
      [5.3, 0.2, -2.2],
      [8.5, 0.1, -2.2],
      [10.8, 0.6, -1.6]
    ]
  },

  // 3. Audio & Acoustic Signal Flow Wires
  {
    id: 'WIRE_MIC_TO_CCOUP',
    name: 'Microphone Output to AC Coupling Capacitor (C2)',
    fromComponentId: 'MIC1',
    fromPinId: 'MIC1_POS',
    toComponentId: 'C_COUP',
    toPinId: 'C_COUP_IN',
    signalType: 'analog',
    color: '#06b6d4', // Cyan
    voltage: 4.5,
    isActive: false,
    description: 'Carries raw acoustic AC voltage oscillations from the electret microphone.',
    waypoints: [
      [-6.8, 0.6, -0.1],
      [-6.0, 0.4, -0.5],
      [-5.3, 0.3, -0.5]
    ]
  },
  {
    id: 'WIRE_CCOUP_TO_BASE',
    name: 'Coupling Capacitor (C2) to BC547 Base',
    fromComponentId: 'C_COUP',
    fromPinId: 'C_COUP_OUT',
    toComponentId: 'Q1',
    toPinId: 'Q1_BASE',
    signalType: 'analog',
    color: '#38bdf8', // Light sky blue
    voltage: 0.0,
    isActive: false,
    description: 'Injected AC clap transient pulse driving the base-emitter junction.',
    waypoints: [
      [-4.7, 0.3, -0.5],
      [-4.0, 0.4, -0.5],
      [-3.4, 0.5, -0.5]
    ]
  },
  {
    id: 'WIRE_RBASE_TO_BASE',
    name: 'R2 Base Pull-down to Base Node',
    fromComponentId: 'R_BASE',
    fromPinId: 'R_BASE_BASE',
    toComponentId: 'Q1',
    toPinId: 'Q1_BASE',
    signalType: 'analog',
    color: '#38bdf8',
    voltage: 0.0,
    isActive: false,
    description: 'Pulls Base to GND in silence.',
    waypoints: [
      [-3.8, 0.2, 1.2],
      [-3.4, 0.3, 0.2],
      [-3.4, 0.5, -0.5]
    ]
  },

  // 4. Trigger Stage Wire
  {
    id: 'WIRE_Q1_TO_555_TRIG',
    name: 'BC547 Collector to 555 Pin 2 (TRIG)',
    fromComponentId: 'Q1',
    fromPinId: 'Q1_COLLECTOR',
    toComponentId: 'U1_555',
    toPinId: '555_P2',
    signalType: 'trigger',
    color: '#f59e0b', // Amber / Orange
    voltage: 9.0,
    isActive: false,
    description: 'Active-LOW trigger line. Pulled from 9V down to 0.2V when BC547 fires.',
    waypoints: [
      [-3.4, 0.5, -0.8],
      [-2.0, 0.3, -0.75],
      [-0.2, 0.2, -0.75]
    ]
  },

  // 5. 555 Monostable RC Timing Node
  {
    id: 'WIRE_555_RC_NODE',
    name: '555 Pin 6 (THRESH) & Pin 7 (DISCH) to R4 & C3',
    fromComponentId: 'R_TIMING',
    fromPinId: 'R_TIMING_RC',
    toComponentId: 'U1_555',
    toPinId: '555_P6',
    signalType: 'analog',
    color: '#a855f7', // Purple
    voltage: 0.0,
    isActive: false,
    description: 'Exponential charging node V_C(t) reaching 2/3 VCC to terminate monostable pulse.',
    waypoints: [
      [3.1, 0.2, -3.2],
      [2.5, 0.4, -1.25],
      [1.2, 0.2, -1.25]
    ]
  },

  // 6. Clock Pulse Wire: 555 Pin 3 -> 7474 Pin 3 (CLK)
  {
    id: 'WIRE_555_TO_7474_CLK',
    name: '555 Pin 3 (OUT) to 7474 Pin 3 (CLK)',
    fromComponentId: 'U1_555',
    fromPinId: '555_P3',
    toComponentId: 'U2_7474',
    toPinId: '7474_P3',
    signalType: 'clock',
    color: '#8b5cf6', // Bright violet / clock
    voltage: 0.0,
    isActive: false,
    description: 'Clean digital square pulse (clock edge) triggered by the clap.',
    waypoints: [
      [-0.2, 0.2, -1.25],
      [2.5, 0.6, 2.0],
      [5.3, 0.2, -0.6]
    ]
  },

  // 7. KEY FEEDBACK WIRE: 7474 Pin 6 (Q') -> Pin 2 (D)
  {
    id: 'WIRE_7474_FEEDBACK',
    name: '7474 Inverted Feedback: Pin 6 (Q\') → Pin 2 (D)',
    fromComponentId: 'U2_7474',
    fromPinId: '7474_P6',
    toComponentId: 'U2_7474',
    toPinId: '7474_P2',
    signalType: 'feedback',
    color: '#10b981', // Emerald Green (Highlighted!)
    voltage: 5.0,
    isActive: true,
    description: 'CRITICAL TOGGLE FEEDBACK: Inverted output Q\' continuously feeds back into D, causing Q to toggle state on every positive clock edge.',
    waypoints: [
      [5.3, 0.2, -1.8],
      [4.2, 0.7, -1.2],
      [4.2, 0.7, -0.2],
      [5.3, 0.2, -0.2]
    ]
  },

  // 8. Output Logic Drive: 7474 Pin 5 (Q) -> R5 (Current Limiter) -> LED1
  {
    id: 'WIRE_7474_Q_TO_RLED',
    name: '7474 Pin 5 (Q) to LED Limiter Resistor (R5)',
    fromComponentId: 'U2_7474',
    fromPinId: '7474_P5',
    toComponentId: 'R_LED',
    toPinId: 'R_LED_IN',
    signalType: 'logic',
    color: '#eab308', // Yellow / Amber
    voltage: 0.0,
    isActive: false,
    description: 'True logic state Q driving the output LED resistor.',
    waypoints: [
      [5.3, 0.2, -1.4],
      [7.2, 0.3, -1.8],
      [8.4, 0.2, -1.8]
    ]
  },
  {
    id: 'WIRE_RLED_TO_LED',
    name: 'R5 Output to LED Anode (+)',
    fromComponentId: 'R_LED',
    fromPinId: 'R_LED_OUT',
    toComponentId: 'LED1',
    toPinId: 'LED1_ANODE',
    signalType: 'output',
    color: '#ef4444', // Red glow
    voltage: 0.0,
    isActive: false,
    description: 'Forward current path lighting up the LED diode.',
    waypoints: [
      [9.6, 0.2, -1.8],
      [10.2, 0.4, -1.8],
      [10.8, 0.6, -2.0]
    ]
  },

  // 9. Optional Relay / Appliance Wire
  {
    id: 'WIRE_7474_Q_TO_RELAY',
    name: '7474 Pin 5 (Q) to Relay Coil (+)',
    fromComponentId: 'U2_7474',
    fromPinId: '7474_P5',
    toComponentId: 'RL1',
    toPinId: 'RL1_COIL_POS',
    signalType: 'output',
    color: '#f59e0b',
    voltage: 0.0,
    isActive: false,
    description: 'Energizes magnetic relay coil for high-voltage AC load switching.',
    waypoints: [
      [5.3, 0.2, -1.4],
      [8.0, 0.2, 1.5],
      [10.4, 0.4, 1.5]
    ]
  }
];
