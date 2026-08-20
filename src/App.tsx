import React, { useState, useEffect } from 'react';
import { 
  CircuitComponentData, 
  CircuitWire, 
  SimulationState, 
  OscilloscopeSample, 
  CircuitLogEvent, 
  CameraPreset 
} from './types';
import { circuitSim } from './circuit/CircuitSimulationEngine';
import { ThreeCircuitCanvas } from './components/ThreeCircuitCanvas';
import { OscilloscopePanel } from './components/OscilloscopePanel';
import { CircuitStatePanel } from './components/CircuitStatePanel';
import { TruthTableModal } from './components/TruthTableModal';
import { StepByStepTutorial } from './components/StepByStepTutorial';
import { SignalTraceOverlay } from './components/SignalTraceOverlay';
import { ComponentDetailsModal } from './components/ComponentDetailsModal';
import { EventLogPanel } from './components/EventLogPanel';
import { EducationalGuideModal } from './components/EducationalGuideModal';
import { AssumptionsModal } from './components/AssumptionsModal';
import { ControlToolbar } from './components/ControlToolbar';
import { 
  Zap, 
  Lightbulb, 
  Radio, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  FileText,
  AlertTriangle,
  PanelLeftClose, 
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen
} from 'lucide-react';

export default function App() {
  const [simState, setSimState] = useState<SimulationState>(circuitSim.state);
  const [scopeSamples, setScopeSamples] = useState<OscilloscopeSample[]>([]);
  const [eventLogs, setEventLogs] = useState<CircuitLogEvent[]>(circuitSim.eventLogs);

  // Component & Wire selection state
  const [selectedComponent, setSelectedComponent] = useState<CircuitComponentData | null>(null);
  const [hoveredWire, setHoveredWire] = useState<CircuitWire | null>(null);

  // Modal visibility states
  const [isStepTutorialOpen, setIsStepTutorialOpen] = useState(false);
  const [isTraceModeOpen, setIsTraceModeOpen] = useState(false);
  const [isTruthTableOpen, setIsTruthTableOpen] = useState(false);
  const [isEduGuideOpen, setIsEduGuideOpen] = useState(false);
  const [isAssumptionsOpen, setIsAssumptionsOpen] = useState(false);

  // Layout panel collapse states
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(true);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState(true);
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);

  // Display toggles
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('overview');
  const [showCurrentFlow, setShowCurrentFlow] = useState(true);
  const [showElectronFlow, setShowElectronFlow] = useState(false);
  const [showPinLabels, setShowPinLabels] = useState(true);
  const [showWireLabels, setShowWireLabels] = useState(false);
  const [showOscilloscope, setShowOscilloscope] = useState(true);

  // Highlight arrays from Step / Trace modes
  const [highlightedComponentIds, setHighlightedComponentIds] = useState<string[]>([]);
  const [highlightedWireIds, setHighlightedWireIds] = useState<string[]>([]);

  // Subscribe to simulation updates and global keyboard shortcuts
  useEffect(() => {
    const unsubState = circuitSim.subscribe((newState) => {
      setSimState(newState);
      setScopeSamples([...circuitSim.scopeSamples]);
    });

    const unsubLogs = circuitSim.subscribeLogs((newLog) => {
      setEventLogs([...circuitSim.eventLogs]);
    });

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.code === 'Space' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        circuitSim.triggerClap('virtual');
      } else if (e.key.toLowerCase() === 'l') {
        e.preventDefault();
        circuitSim.toggleLight();
      } else if (e.key.toLowerCase() === 'p') {
        e.preventDefault();
        circuitSim.togglePower();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        circuitSim.reset();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubState();
      unsubLogs();
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div id="clap-circuit-app" className="relative w-screen h-screen bg-[#0a0b0e] text-slate-100 flex flex-col overflow-hidden select-none font-sans">
      {/* 1. TOP HEADER BAR - Hardware Rack Style */}
      <header className="h-12 bg-[#0d1017] border-b border-[#1f293d] px-4 flex items-center justify-between z-30 flex-shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#161b26] border border-[#1f293d] flex items-center justify-center shadow-inner">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xs font-mono font-bold tracking-wider text-slate-100 flex items-center gap-2">
                <span>CLAP ON / CLAP OFF SWITCH</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#161b26] text-cyan-400 border border-[#1f293d] font-semibold">
                  3D CIRCUIT INSTRUMENT
                </span>
              </h1>
            </div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-2.5">
          {/* LED Output Status Pill / Direct Toggle Button */}
          <button
            onClick={() => circuitSim.toggleLight()}
            className={`px-3 py-1 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-all border cursor-pointer active:scale-95 ${
              simState.ledIsOn
                ? 'bg-red-950/80 text-red-200 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)] hover:bg-red-900/90'
                : 'bg-[#11141d] text-slate-400 border-[#1f293d] hover:text-slate-200 hover:border-slate-700'
            }`}
            title="Click or press 'L' / Space to Toggle Light (Q=1/Q=0)"
          >
            <span className={`w-2 h-2 rounded-full ${simState.ledIsOn ? 'bg-red-500 shadow-[0_0_8px_#ef4444]' : 'bg-slate-700'}`} />
            <Lightbulb className="w-3.5 h-3.5" />
            <span>{simState.ledIsOn ? 'OUT: LED ON (Q=1)' : 'OUT: LED OFF (Q=0)'}</span>
          </button>

          {/* 555 State */}
          <div className={`hidden sm:flex px-2.5 py-1 rounded font-mono text-[11px] items-center gap-1.5 border ${
            simState.timer555OutputState === 1
              ? 'bg-purple-950/70 text-purple-300 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]'
              : 'bg-[#11141d] text-slate-400 border-[#1f293d]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${simState.timer555OutputState === 1 ? 'bg-purple-400 animate-ping' : 'bg-slate-600'}`} />
            <span>555 OUT: {simState.timer555OutputState === 1 ? 'HIGH (Pulse)' : 'LOW (0V)'}</span>
          </div>

          {/* Assumptions & Uncertain Values Shortcut */}
          <button
            onClick={() => setIsAssumptionsOpen(true)}
            className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 text-[11px] font-mono border border-amber-500/40 transition-colors"
            title="Ground Truth Schematic & Soldered Build Analysis"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>Assumptions</span>
          </button>

          {/* Help / Guide Shortcut */}
          <button
            onClick={() => setIsEduGuideOpen(true)}
            className="p-1.5 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border border-[#1f293d] transition-colors"
            title="How the Clap Switch Works Guide"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </header>

      {/* 2. MAIN 3D SIMULATOR VIEWPORT */}
      <div className="relative flex-1 min-h-0 w-full flex overflow-hidden bg-[#0a0b0e]">
        {/* 3D WebGL Canvas Layer */}
        <div className="absolute inset-0 z-0">
          <ThreeCircuitCanvas
            simState={simState}
            selectedComponent={selectedComponent}
            onSelectComponent={setSelectedComponent}
            hoveredWire={hoveredWire}
            onHoverWire={setHoveredWire}
            cameraPreset={cameraPreset}
            showCurrentFlow={showCurrentFlow}
            showElectronFlow={showElectronFlow}
            showPinLabels={showPinLabels}
            showWireLabels={showWireLabels}
            highlightedComponentIds={highlightedComponentIds}
            highlightedWireIds={highlightedWireIds}
          />
        </div>

        {/* 3. LEFT DOCK: CIRCUIT TELEMETRY & NODE GAUGES */}
        <div className={`absolute top-3 left-3 bottom-3 z-20 transition-all duration-300 flex ${
          isLeftPanelOpen ? 'w-80' : 'w-0'
        }`}>
          {isLeftPanelOpen && (
            <div className="w-full h-full animate-fadeIn">
              <CircuitStatePanel
                simState={simState}
                onSelectComponent={setSelectedComponent}
              />
            </div>
          )}
          <button
            onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
            className="absolute -right-7 top-2 p-1.5 rounded-r bg-[#11141d]/95 border-y border-r border-[#1f293d] text-slate-400 hover:text-white shadow-xl backdrop-blur-md transition-colors"
            title={isLeftPanelOpen ? 'Collapse Left Panel' : 'Expand Telemetry Panel'}
          >
            {isLeftPanelOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>
        </div>

        {/* 4. RIGHT DOCK: OSCILLOSCOPE & EVENT CONSOLE */}
        <div className={`absolute top-3 right-3 bottom-3 z-20 transition-all duration-300 flex ${
          isRightPanelOpen ? 'w-96' : 'w-0'
        }`}>
          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className="absolute -left-7 top-2 p-1.5 rounded-l bg-[#11141d]/95 border-y border-l border-[#1f293d] text-slate-400 hover:text-white shadow-xl backdrop-blur-md transition-colors"
            title={isRightPanelOpen ? 'Collapse Right Panel' : 'Expand Oscilloscope Panel'}
          >
            {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
          </button>

          {isRightPanelOpen && (
            <div className="w-full h-full flex flex-col gap-3 overflow-hidden animate-fadeIn">
              {showOscilloscope && (
                <OscilloscopePanel
                  samples={scopeSamples}
                  simState={simState}
                  isExpanded={isScopeExpanded}
                  onToggleExpand={() => setIsScopeExpanded(!isScopeExpanded)}
                />
              )}
              <div className="flex-1 min-h-0">
                <EventLogPanel
                  logs={eventLogs}
                  onClearLogs={() => {
                    circuitSim.eventLogs = [];
                    setEventLogs([]);
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Wire Hover Card in 3D Space */}
        {hoveredWire && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-4 py-2 rounded bg-[#11141d]/95 backdrop-blur-md border border-cyan-500/50 text-xs font-mono shadow-2xl animate-fadeIn">
            <div className="font-bold text-cyan-300 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: hoveredWire.color }} />
              <span>{hoveredWire.name}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#161b26] text-slate-400 uppercase border border-[#1f293d]">
                {hoveredWire.signalType}
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-1">
              {hoveredWire.description}
            </div>
            <div className="text-[10px] text-slate-400 mt-0.5">
              Live Voltage: <span className="text-cyan-400 font-bold">{hoveredWire.voltage.toFixed(2)}V</span> | From: {hoveredWire.fromPinId} → To: {hoveredWire.toPinId}
            </div>
          </div>
        )}
      </div>

      {/* 5. MASTER LABORATORY CONTROL TOOLBAR */}
      <ControlToolbar
        simState={simState}
        onOpenStepTutorial={() => {
          setIsStepTutorialOpen(true);
          setIsTraceModeOpen(false);
        }}
        onOpenTraceMode={() => {
          setIsTraceModeOpen(true);
          setIsStepTutorialOpen(false);
        }}
        onOpenTruthTable={() => setIsTruthTableOpen(true)}
        onOpenEduGuide={() => setIsEduGuideOpen(true)}
        onOpenAssumptions={() => setIsAssumptionsOpen(true)}
        cameraPreset={cameraPreset}
        onSetCameraPreset={setCameraPreset}
        showCurrentFlow={showCurrentFlow}
        onToggleCurrentFlow={() => setShowCurrentFlow(!showCurrentFlow)}
        showElectronFlow={showElectronFlow}
        onToggleElectronFlow={() => setShowElectronFlow(!showElectronFlow)}
        showPinLabels={showPinLabels}
        onTogglePinLabels={() => setShowPinLabels(!showPinLabels)}
        showOscilloscope={showOscilloscope}
        onToggleOscilloscope={() => setShowOscilloscope(!showOscilloscope)}
      />

      {/* 6. MODALS & INTERACTIVE OVERLAYS */}
      <StepByStepTutorial
        isOpen={isStepTutorialOpen}
        onClose={() => {
          setIsStepTutorialOpen(false);
          setHighlightedComponentIds([]);
          setHighlightedWireIds([]);
        }}
        onHighlightComponents={setHighlightedComponentIds}
        onHighlightWires={setHighlightedWireIds}
      />

      <SignalTraceOverlay
        isOpen={isTraceModeOpen}
        onClose={() => {
          setIsTraceModeOpen(false);
          setHighlightedComponentIds([]);
          setHighlightedWireIds([]);
        }}
        onHighlightComponents={setHighlightedComponentIds}
        onHighlightWires={setHighlightedWireIds}
      />

      <TruthTableModal
        isOpen={isTruthTableOpen}
        onClose={() => setIsTruthTableOpen(false)}
        simState={simState}
      />

      <ComponentDetailsModal
        component={selectedComponent}
        onClose={() => setSelectedComponent(null)}
        simState={simState}
      />

      <EducationalGuideModal
        isOpen={isEduGuideOpen}
        onClose={() => setIsEduGuideOpen(false)}
      />

      <AssumptionsModal
        isOpen={isAssumptionsOpen}
        onClose={() => setIsAssumptionsOpen(false)}
        simState={simState}
      />
    </div>
  );
}
