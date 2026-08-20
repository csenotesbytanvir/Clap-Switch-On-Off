import { CircuitComponentData } from '../types';

export const CIRCUIT_COMPONENTS: CircuitComponentData[] = [
  // 1. DC Power Supply / Battery (5V as drawn on schematic)
  {
    id: 'BAT1',
    name: '5V DC Power Source',
    designator: 'BAT1',
    type: 'battery',
    position: [-10, 0, -4.5],
    rotation: [0, 0, 0],
    value: '5.0V DC Source (Schematic 5V)',
    section: 'power',
    description: '5.0V regulated DC power supply as marked explicitly on the schematic right-side DC cell symbol.',
    detailedFunction: 'Supplies continuous positive rail voltage (VCC = +5.0V) and 0V ground reference across the brass armature skeleton. Distributes power to the microphone bias network, transistor pre-amp, NE555 timer, 7474 D flip-flop, and LED output.',
    stateText: 'Active 5.0V Output',
    pins: [
      { id: 'BAT1_POS', name: 'Positive (+5V)', type: 'power', relativePos: [0.35, 1.2, 0], currentVoltage: 5.0, description: '+5V DC Rail' },
      { id: 'BAT1_NEG', name: 'Negative (GND)', type: 'ground', relativePos: [-0.35, 1.2, 0], currentVoltage: 0.0, description: 'Common 0V Ground' },
    ]
  },
  // 2. Power Switch
  {
    id: 'SW1',
    name: 'Main Power Switch',
    designator: 'SW1',
    type: 'switch',
    position: [-8.0, 0, -4.5],
    rotation: [0, 0, 0],
    value: 'SPST Toggle',
    section: 'power',
    description: 'Main power switch connecting the 5V positive terminal to the VCC rail.',
    detailedFunction: 'When closed, connects the 5V terminal to the main VCC bus. When open, removes all operating power and resets the active circuits.',
    stateText: 'Closed (ON)',
    pins: [
      { id: 'SW1_IN', name: 'In', type: 'power', relativePos: [-0.3, 0.4, 0], currentVoltage: 5.0, description: '5V Battery input' },
      { id: 'SW1_OUT', name: 'Out (VCC)', type: 'power', relativePos: [0.3, 0.4, 0], currentVoltage: 5.0, description: 'Main 5V VCC bus' },
    ]
  },

  // 3. Microphone Bias Resistor R_MIC (1kΩ as labeled in schematic / bias network)
  {
    id: 'R_MIC',
    name: 'Mic Bias Pull-Up Resistor',
    designator: 'R1',
    type: 'resistor',
    position: [-6.8, 0, -2.5],
    rotation: [0, 0, 0],
    value: '1 kΩ (Bias Pull-Up)',
    section: 'sensor',
    description: 'Bias pull-up resistor supplying quiescent operating current to the internal JFET in the electret microphone capsule.',
    detailedFunction: 'Supplies operating current (~0.5mA) from the 5V rail to power the internal pre-amplifier JFET inside the condenser microphone, establishing a quiescent DC operating point of ~2.5V.',
    stateText: 'Biasing Microphone (~2.5V quiescent)',
    pins: [
      { id: 'R_MIC_VCC', name: 'VCC Side', type: 'power', relativePos: [-0.6, 0.2, 0], currentVoltage: 5.0, description: 'Connected to +5V VCC rail' },
      { id: 'R_MIC_OUT', name: 'Mic Junction', type: 'passive', relativePos: [0.6, 0.2, 0], currentVoltage: 2.5, description: 'DC bias & audio signal' },
    ]
  },

  // 4. Acoustic Transducer / Condenser Microphone (MIC1)
  {
    id: 'MIC1',
    name: 'Condenser Microphone / Transducer',
    designator: 'MIC1',
    type: 'mic',
    position: [-6.8, 0, 0.2],
    rotation: [0, 0, 0],
    value: 'Electret Microphone Capsule (2-Pin)',
    section: 'sensor',
    description: 'Acoustic sound sensor (drawn as speaker/mic symbol with +/- on schematic) converting acoustic sound waves into AC electrical signals.',
    detailedFunction: 'Contains a flexible metallized diaphragm and backplate charged by electret material. When a sound wave strikes the diaphragm, capacitance variations modulate the gate of the internal JFET, outputting an AC audio spike.',
    stateText: 'Listening for sound / clap transients...',
    pins: [
      { id: 'MIC1_POS', name: 'Terminal +', type: 'passive', relativePos: [0, 0.6, -0.3], currentVoltage: 2.5, description: 'Audio output & DC bias' },
      { id: 'MIC1_NEG', name: 'Terminal - (GND)', type: 'ground', relativePos: [0, 0.6, 0.3], currentVoltage: 0.0, description: 'Metal case connected to 0V ground' },
    ]
  },

  // 5. AC Coupling Capacitor C_COUPLING (0.1 µF as drawn)
  {
    id: 'C_COUP',
    name: 'AC Coupling Capacitor',
    designator: 'C2',
    type: 'capacitor',
    position: [-5.0, 0, -0.5],
    rotation: [0, 0, 0],
    value: '0.1 µF (100 nF Ceramic Disc)',
    section: 'sensor',
    description: 'DC blocking capacitor (0.1 µF) that passes transient acoustic spikes while blocking the steady DC microphone bias.',
    detailedFunction: 'Blocks the steady +2.5V DC bias from the microphone from reaching the base of BC547, allowing only the sharp AC pressure spike of a clap to pass through.',
    stateText: 'Blocking DC / Passing AC Spikes',
    pins: [
      { id: 'C_COUP_IN', name: 'Mic Side', type: 'passive', relativePos: [-0.3, 0.3, 0], currentVoltage: 2.5, description: 'Audio AC + DC Bias' },
      { id: 'C_COUP_OUT', name: 'Base Side', type: 'passive', relativePos: [0.3, 0.3, 0], currentVoltage: 0.0, description: 'Pure AC clap transient' },
    ]
  },

  // 6. Input Network Bias Resistor (10 kΩ as drawn on schematic)
  {
    id: 'R_BASE',
    name: 'Input Bias Resistor (10 kΩ)',
    designator: 'R2',
    type: 'resistor',
    position: [-3.8, 0, 1.8],
    rotation: [0, 0, 0],
    value: '10 kΩ (Input Bias)',
    section: 'amplifier',
    description: '10 kΩ input network resistor shown on schematic keeping BC547 base biased at ground cutoff during silence.',
    detailedFunction: 'Holds the transistor base at 0V during silence (well below 0.7V threshold), ensuring BC547 is in cutoff (OFF). When an audio spike arrives through the 0.1 µF cap, Vbe exceeds 0.7V.',
    stateText: 'Holding Base in Cutoff (0V)',
    pins: [
      { id: 'R_BASE_BASE', name: 'Base Junction', type: 'passive', relativePos: [0, 0.2, -0.6], currentVoltage: 0.0, description: 'BC547 Base connection' },
      { id: 'R_BASE_GND', name: 'Ground Side', type: 'ground', relativePos: [0, 0.2, 0.6], currentVoltage: 0.0, description: 'Connected to Ground (0V)' },
    ]
  },

  // 7. BC547 NPN Bipolar Junction Transistor (Q1 - labeled "547" on schematic)
  {
    id: 'Q1',
    name: 'BC547 NPN Transistor (Labeled "547")',
    designator: 'Q1',
    type: 'transistor_bc547',
    position: [-3.4, 0, -0.5],
    rotation: [0, 0, 0],
    value: 'BC547 NPN (TO-92 Pre-amp)',
    section: 'amplifier',
    description: 'NPN switching pre-amplifier (small 3-pin TO-92 device near mic in photo; labeled "547" in schematic).',
    detailedFunction: 'Normally in cutoff mode (OFF). When a clap pulse drives Base-Emitter voltage Vbe > 0.7V, Q1 enters saturation mode (ON), pulling its Collector terminal down from 5V to ~0.15V. This creates the negative-going falling edge to trigger Pin 2 of the 555 timer.',
    stateText: 'State: Cutoff (OFF) | Vce = 5.0V',
    pins: [
      { id: 'Q1_COLLECTOR', name: 'Collector (C)', type: 'output', relativePos: [0, 0.5, -0.3], currentVoltage: 5.0, description: 'Pulls 555 Trigger Pin 2 LOW when ON' },
      { id: 'Q1_BASE', name: 'Base (B)', type: 'input', relativePos: [0, 0.5, 0], currentVoltage: 0.0, description: 'Receives AC clap transient' },
      { id: 'Q1_EMITTER', name: 'Emitter (E)', type: 'ground', relativePos: [0, 0.5, 0.3], currentVoltage: 0.0, description: 'Connected to 0V Ground' },
    ]
  },

  // 8. Collector Pull-Up / Network Resistor (100 kΩ / 10 kΩ as drawn)
  {
    id: 'R_COL',
    name: 'Collector Pull-Up Resistor (100 kΩ)',
    designator: 'R3',
    type: 'resistor',
    position: [-3.4, 0, -3.0],
    rotation: [0, 0, 0],
    value: '100 kΩ (Collector Pull-Up)',
    section: 'amplifier',
    description: 'Pulls 555 Trigger Pin 2 HIGH to 5V during silence.',
    detailedFunction: 'Ensures Pin 2 of the 555 IC is held safely at +5.0V (HIGH, > 1/3 VCC = 1.67V), keeping the 555 un-triggered until BC547 conducts.',
    stateText: 'Holding Trigger Node HIGH (+5.0V)',
    pins: [
      { id: 'R_COL_VCC', name: 'VCC Side', type: 'power', relativePos: [-0.6, 0.2, 0], currentVoltage: 5.0, description: 'Connected to VCC (+5V)' },
      { id: 'R_COL_COLL', name: 'Collector Side', type: 'passive', relativePos: [0.6, 0.2, 0], currentVoltage: 5.0, description: 'Connected to Q1 Collector & 555 Pin 2' },
    ]
  },

  // 9. NE555 Timer IC (U1 - Monostable Config)
  {
    id: 'U1_555',
    name: 'NE555 Precision Timer IC',
    designator: 'U1',
    type: 'ic_555',
    position: [0.5, 0, -1.0],
    rotation: [0, 0, 0],
    value: 'NE555 (DIP-8 Monostable)',
    section: 'timer',
    description: 'Precision timer configured as a Monostable Multivibrator to produce a clean, debounced digital clock pulse.',
    detailedFunction: 'When Pin 2 (Trigger) is pulled below 1/3 VCC (< 1.67V at 5V supply), the internal comparator sets the 555 latch. Pin 3 (Output) switches HIGH (+5V) and Pin 7 (Discharge) opens. Timing capacitor C3 charges exponentially through R4 toward 5V. When Pin 6 (Threshold) reaches 2/3 VCC (3.33V), the comparator resets the latch. Pulse duration: T = 1.1 × R_timing × C_timing.',
    stateText: 'State: IDLE (Output Pin 3 = LOW 0.0V)',
    pins: [
      { id: '555_P1', name: 'Pin 1: GND', pinNumber: 1, type: 'ground', relativePos: [-0.7, 0.2, 0.75], currentVoltage: 0.0, description: 'Ground reference 0V' },
      { id: '555_P2', name: 'Pin 2: TRIG', pinNumber: 2, type: 'input', relativePos: [-0.7, 0.2, 0.25], currentVoltage: 5.0, logicLevel: 1, description: 'Active-LOW trigger input (<1/3 VCC = 1.67V triggers pulse)' },
      { id: '555_P3', name: 'Pin 3: OUT', pinNumber: 3, type: 'output', relativePos: [-0.7, 0.2, -0.25], currentVoltage: 0.0, logicLevel: 0, description: 'Monostable square pulse output to 7474 CLK' },
      { id: '555_P4', name: 'Pin 4: RESET', pinNumber: 4, type: 'power', relativePos: [-0.7, 0.2, -0.75], currentVoltage: 5.0, logicLevel: 1, description: 'Active-LOW reset tied to +5V VCC' },
      { id: '555_P5', name: 'Pin 5: CTRL', pinNumber: 5, type: 'passive', relativePos: [0.7, 0.2, -0.75], currentVoltage: 3.33, description: 'Control voltage decoupled via 0.1 µF to GND' },
      { id: '555_P6', name: 'Pin 6: THRESH', pinNumber: 6, type: 'input', relativePos: [0.7, 0.2, -0.25], currentVoltage: 0.0, description: 'Threshold input (monitors C3 charge level)' },
      { id: '555_P7', name: 'Pin 7: DISCH', pinNumber: 7, type: 'passive', relativePos: [0.7, 0.2, 0.25], currentVoltage: 0.0, description: 'Discharge transistor pin tied to Pin 6' },
      { id: '555_P8', name: 'Pin 8: VCC', pinNumber: 8, type: 'power', relativePos: [0.7, 0.2, 0.75], currentVoltage: 5.0, description: 'Positive supply voltage (+5.0V)' },
    ]
  },

  // 10. 555 Timing Resistor (100 kΩ as labeled on schematic)
  {
    id: 'R_TIMING',
    name: '555 Timing Resistor (100 kΩ)',
    designator: 'R4',
    type: 'resistor',
    position: [2.5, 0, -3.2],
    rotation: [0, 0, 0],
    value: '100 kΩ (Timing Resistor - Adjustable)',
    section: 'timer',
    description: '100 kΩ timing resistor drawn in schematic controlling the charging rate of timing capacitor C3.',
    detailedFunction: 'Supplies charging current from VCC into C3 when 555 Pin 7 discharge transistor opens. Sets pulse duration according to T = 1.1 × R_timing × C_timing.',
    stateText: 'Charging Resistor (100 kΩ)',
    pins: [
      { id: 'R_TIMING_VCC', name: 'VCC Side', type: 'power', relativePos: [-0.6, 0.2, 0], currentVoltage: 5.0, description: 'Connected to +5V VCC' },
      { id: 'R_TIMING_RC', name: 'RC Junction', type: 'passive', relativePos: [0.6, 0.2, 0], currentVoltage: 0.0, description: 'Connected to 555 Pins 6 & 7 and C3 (+)' },
    ]
  },

  // 11. 555 Timing Capacitor (100 µF as labeled on schematic)
  {
    id: 'C_TIMING',
    name: '555 Timing Capacitor (100 µF)',
    designator: 'C3',
    type: 'capacitor',
    position: [2.5, 0, 1.2],
    rotation: [0, 0, 0],
    value: '100 µF (Timing Cap - Adjustable)',
    section: 'timer',
    description: '100 µF electrolytic capacitor as marked on the schematic next to the 555 timer.',
    detailedFunction: 'When triggered, charges from 0V to 2/3 VCC (3.33V) through R4 (100kΩ). With R=100kΩ and C=100µF, nominal T = 1.1 × 100k × 100µ = 11.0 seconds (adjustable via UI sliders).',
    stateText: 'Voltage: 0.00V (Discharged)',
    pins: [
      { id: 'C_TIMING_POS', name: 'Anode (+)', type: 'passive', relativePos: [0, 0.4, -0.3], currentVoltage: 0.0, description: 'Connected to 555 Pins 6 & 7 and R4' },
      { id: 'C_TIMING_NEG', name: 'Cathode (-)', type: 'ground', relativePos: [0, 0.4, 0.3], currentVoltage: 0.0, description: 'Connected to 0V Ground' },
    ]
  },

  // 12. 555 Control Decoupling Capacitor (0.1 µF on Pin 5 as drawn)
  {
    id: 'C_CTRL',
    name: '555 Control Capacitor (0.1 µF on Pin 5)',
    designator: 'C4',
    type: 'capacitor',
    position: [0.5, 0, -3.2],
    rotation: [0, 0, 0],
    value: '0.1 µF (Control Voltage Bypass)',
    section: 'timer',
    description: '0.1 µF capacitor on 555 Pin 5 (Control Voltage) shown in schematic to filter supply ripple and stabilize comparator references.',
    detailedFunction: 'Connects Pin 5 (the internal 2/3 VCC node) to Ground to bypass electrical noise and stabilize internal comparator threshold voltages.',
    stateText: 'Stabilizing 2/3 VCC (3.33V) node',
    pins: [
      { id: 'C_CTRL_PIN5', name: 'Pin 5 Side', type: 'passive', relativePos: [0, 0.2, -0.4], currentVoltage: 3.33, description: 'Connected to 555 Pin 5' },
      { id: 'C_CTRL_GND', name: 'Ground Side', type: 'ground', relativePos: [0, 0.2, 0.4], currentVoltage: 0.0, description: 'Connected to 0V Ground' },
    ]
  },

  // 13. 74-Series Dual D Flip-Flop IC (7474 / 74LS74 - labeled "54" / "547" on schematic)
  {
    id: 'U2_7474',
    name: '7474 D Flip-Flop (DIP-14, Labeled "54"/"547")',
    designator: 'U2',
    type: 'ic_7474',
    position: [6.2, 0, -1.0],
    rotation: [0, 0, 0],
    value: '74LS74 / 7474 (DIP-14)',
    section: 'flipflop',
    description: '14-pin IC labeled "54"/"547" in schematic; interpreted as 7474 dual D-type flip-flop with Q\' connected to D for toggle memory.',
    detailedFunction: 'On each rising edge (0 -> 1) from the 555 timer pulse at Pin 3 (CLK), the flip-flop transfers the logic state at Pin 2 (D) to Pin 5 (Q), setting Pin 6 (Q\') to its complement. Because Q\' is wired back to D, every clock edge toggles Q: 0 -> 1 (Clap 1), 1 -> 0 (Clap 2).',
    stateText: 'D: 1 | CLK: 0 | Q: 0 | Q\': 1 (LED OFF)',
    pins: [
      { id: '7474_P1', name: 'Pin 1: 1CLR\'', pinNumber: 1, type: 'power', relativePos: [-0.9, 0.2, 1.2], currentVoltage: 5.0, logicLevel: 1, description: 'Active-LOW Clear (tied to +5V VCC)' },
      { id: '7474_P2', name: 'Pin 2: 1D', pinNumber: 2, type: 'input', relativePos: [-0.9, 0.2, 0.8], currentVoltage: 5.0, logicLevel: 1, description: 'Data input fed by Q\' (Pin 6) inverted feedback' },
      { id: '7474_P3', name: 'Pin 3: 1CLK', pinNumber: 3, type: 'input', relativePos: [-0.9, 0.2, 0.4], currentVoltage: 0.0, logicLevel: 0, description: 'Positive-edge clock input fed by 555 Pin 3' },
      { id: '7474_P4', name: 'Pin 4: 1PRE\'', pinNumber: 4, type: 'power', relativePos: [-0.9, 0.2, 0.0], currentVoltage: 5.0, logicLevel: 1, description: 'Active-LOW Preset (tied to +5V VCC)' },
      { id: '7474_P5', name: 'Pin 5: 1Q', pinNumber: 5, type: 'output', relativePos: [-0.9, 0.2, -0.4], currentVoltage: 0.0, logicLevel: 0, description: 'True output Q driving LED via 1 kΩ resistor' },
      { id: '7474_P6', name: 'Pin 6: 1Q\' (Q_BAR)', pinNumber: 6, type: 'output', relativePos: [-0.9, 0.2, -0.8], currentVoltage: 5.0, logicLevel: 1, description: 'Inverted output Q\' wired back to Pin 2 (D)' },
      { id: '7474_P7', name: 'Pin 7: GND', pinNumber: 7, type: 'ground', relativePos: [-0.9, 0.2, -1.2], currentVoltage: 0.0, description: 'Ground reference (0V)' },
      
      { id: '7474_P8', name: 'Pin 8: 2Q\'', pinNumber: 8, type: 'passive', relativePos: [0.9, 0.2, -1.2], currentVoltage: 0.0, description: 'Unit 2 Q\' (Unused)' },
      { id: '7474_P9', name: 'Pin 9: 2Q', pinNumber: 9, type: 'passive', relativePos: [0.9, 0.2, -0.8], currentVoltage: 0.0, description: 'Unit 2 Q (Unused)' },
      { id: '7474_P10', name: 'Pin 10: 2PRE\'', pinNumber: 10, type: 'power', relativePos: [0.9, 0.2, -0.4], currentVoltage: 5.0, description: 'Unit 2 Preset' },
      { id: '7474_P11', name: 'Pin 11: 2CLK', pinNumber: 11, type: 'passive', relativePos: [0.9, 0.2, 0.0], currentVoltage: 0.0, description: 'Unit 2 Clock' },
      { id: '7474_P12', name: 'Pin 12: 2D', pinNumber: 12, type: 'passive', relativePos: [0.9, 0.2, 0.4], currentVoltage: 0.0, description: 'Unit 2 D' },
      { id: '7474_P13', name: 'Pin 13: 2CLR\'', pinNumber: 13, type: 'power', relativePos: [0.9, 0.2, 0.8], currentVoltage: 5.0, description: 'Unit 2 Clear' },
      { id: '7474_P14', name: 'Pin 14: VCC', pinNumber: 14, type: 'power', relativePos: [0.9, 0.2, 1.2], currentVoltage: 5.0, description: 'Positive supply (+5.0V logic VCC)' },
    ]
  },

  // 14. LED Current Limiting Resistor (1 kΩ as labeled on schematic)
  {
    id: 'R_LED',
    name: 'LED Current Limiting Resistor (1 kΩ)',
    designator: 'R5',
    type: 'resistor',
    position: [9.0, 0, -1.8],
    rotation: [0, 0, 0],
    value: '1 kΩ (Schematic Labeled)',
    section: 'output',
    description: '1 kΩ resistor shown on schematic between 7474 output and LED anode.',
    detailedFunction: 'Limits forward current through the LED: I = (5.0V - 2.0V) / 1000Ω = 3.0 mA, safely protecting the IC and LED.',
    stateText: 'Current Limit: 3.0 mA at 5V',
    pins: [
      { id: 'R_LED_IN', name: '7474 Q Side', type: 'input', relativePos: [-0.6, 0.2, 0], currentVoltage: 0.0, description: 'Connected to 7474 Pin 5 (Q)' },
      { id: 'R_LED_OUT', name: 'LED Anode Side', type: 'output', relativePos: [0.6, 0.2, 0], currentVoltage: 0.0, description: 'Connected to LED Anode (+)' },
    ]
  },

  // 15. Output Indicator LED (LED1 as seen mounted at top of hand build)
  {
    id: 'LED1',
    name: 'Status Indicator LED (5mm)',
    designator: 'LED1',
    type: 'led',
    position: [10.8, 0, -1.8],
    rotation: [0, 0, 0],
    value: '5mm Clear / Red LED (Top Mount)',
    section: 'output',
    description: '5mm indicator LED (prominently standing at the top of the hand-held soldered sculpture) that illuminates when Q=1 (Clap ON) and turns off when Q=0.',
    detailedFunction: 'When 7474 Pin 5 (Q) goes HIGH (+5V), forward current flows through the 1 kΩ resistor and the LED P-N junction to ground, emitting visible light.',
    stateText: 'Status: OFF (0.00V, 0.0mA)',
    pins: [
      { id: 'LED1_ANODE', name: 'Anode (+)', type: 'input', relativePos: [0, 0.6, -0.2], currentVoltage: 0.0, description: 'Connected to 1 kΩ resistor' },
      { id: 'LED1_CATHODE', name: 'Cathode (-)', type: 'ground', relativePos: [0, 0.6, 0.2], currentVoltage: 0.0, description: 'Connected to 0V Ground' },
    ]
  },

  // 16. Optional Output Relay / Load Driver (RL1)
  {
    id: 'RL1',
    name: 'Optional Output Relay / Load Driver',
    designator: 'RL1',
    type: 'relay',
    position: [10.8, 0, 1.8],
    rotation: [0, 0, 0],
    value: '5V SPDT Relay (10A 250VAC)',
    section: 'output',
    description: 'Switches high-power AC appliance loads (e.g. lamp) synchronously with the LED.',
    detailedFunction: 'When Q=1, coil energizes magnetic armature closing contacts to switch external appliances safely isolated from the sensor circuit.',
    stateText: 'Relay: De-energized (Contacts OPEN)',
    pins: [
      { id: 'RL1_COIL_POS', name: 'Coil +', type: 'input', relativePos: [-0.4, 0.4, -0.3], currentVoltage: 0.0, description: 'Coil drive from Q' },
      { id: 'RL1_COIL_NEG', name: 'Coil - (GND)', type: 'ground', relativePos: [-0.4, 0.4, 0.3], currentVoltage: 0.0, description: 'Coil Ground return' },
      { id: 'RL1_COM', name: 'AC Common', type: 'power', relativePos: [0.4, 0.4, -0.3], currentVoltage: 120.0, description: 'Mains AC Live' },
      { id: 'RL1_NO', name: 'AC Output (NO)', type: 'output', relativePos: [0.4, 0.4, 0.3], currentVoltage: 0.0, description: 'Mains Appliance Socket' },
    ]
  }
];

