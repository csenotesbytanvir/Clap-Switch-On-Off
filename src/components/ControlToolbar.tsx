import React, { useState } from 'react';
import { SimulationState, CameraPreset } from '../types';
import { circuitSim } from '../circuit/CircuitSimulationEngine';
import { audioEngine } from '../audio/AudioEngine';
import { 
  Power, 
  Hand, 
  Mic, 
  MicOff, 
  RotateCcw, 
  GraduationCap, 
  GitCommit, 
  Table, 
  BookOpen, 
  Camera, 
  Sliders, 
  Sparkles, 
  Eye,
  Activity,
  Layers,
  Lightbulb
} from 'lucide-react';

interface ControlToolbarProps {
  simState: SimulationState;
  onOpenStepTutorial: () => void;
  onOpenTraceMode: () => void;
  onOpenTruthTable: () => void;
  onOpenEduGuide: () => void;
  onOpenAssumptions: () => void;
  cameraPreset: CameraPreset;
  onSetCameraPreset: (preset: CameraPreset) => void;
  showCurrentFlow: boolean;
  onToggleCurrentFlow: () => void;
  showElectronFlow: boolean;
  onToggleElectronFlow: () => void;
  showPinLabels: boolean;
  onTogglePinLabels: () => void;
  showOscilloscope: boolean;
  onToggleOscilloscope: () => void;
}

export const ControlToolbar: React.FC<ControlToolbarProps> = ({
  simState,
  onOpenStepTutorial,
  onOpenTraceMode,
  onOpenTruthTable,
  onOpenEduGuide,
  onOpenAssumptions,
  cameraPreset,
  onSetCameraPreset,
  showCurrentFlow,
  onToggleCurrentFlow,
  showElectronFlow,
  onToggleElectronFlow,
  showPinLabels,
  onTogglePinLabels,
  showOscilloscope,
  onToggleOscilloscope,
}) => {
  const [isMicActive, setIsMicActive] = useState(false);
  const [micThreshold, setMicThreshold] = useState(0.35);
  const [micError, setMicError] = useState<string | null>(null);

  const handleVirtualClap = () => {
    circuitSim.triggerClap('virtual');
  };

  const handleToggleRealMic = async () => {
    if (isMicActive) {
      audioEngine.stopMicrophone();
      setIsMicActive(false);
      setMicError(null);
      circuitSim.addLog('SYSTEM', 'Real Microphone listening disabled.', 'info');
    } else {
      audioEngine.threshold = micThreshold;
      const success = await audioEngine.startMicrophone(
        (amp) => {
          circuitSim.triggerClap('real_mic');
        },
        (_data, amp) => {
          circuitSim.updateMicRealAudio(amp);
        },
        (err) => {
          setMicError(err);
          setIsMicActive(false);
        }
      );

      if (success) {
        setIsMicActive(true);
        setMicError(null);
        circuitSim.addLog('SYSTEM', 'Real Microphone LIVE! Clap your hands to trigger the circuit.', 'success');
      }
    }
  };

  return (
    <div 
      id="control-toolbar"
      className="bg-[#0d1017] border-t border-[#1f293d] px-4 py-2 flex flex-wrap items-center justify-between gap-3 shadow-2xl font-mono text-xs z-30 flex-shrink-0"
    >
      {/* Left Group: Primary Simulation Triggers */}
      <div className="flex flex-wrap items-center gap-2">
        {/* 1. Main Power Switch */}
        <button
          onClick={() => circuitSim.togglePower()}
          className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${
            simState.powerOn
              ? 'bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
              : 'bg-[#161b26] border-[#1f293d] text-slate-400 hover:text-slate-200'
          }`}
          title="Toggle Main DC Power (5V Supply)"
        >
          <Power className="w-3.5 h-3.5" />
          <span>{simState.powerOn ? 'POWER (5V) [ON]' : 'POWER [OFF]'}</span>
        </button>

        {/* 2. THE BIG CLAP BUTTON */}
        <button
          onClick={handleVirtualClap}
          disabled={!simState.powerOn}
          className="px-4 py-1.5 rounded bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-30 disabled:pointer-events-none text-white font-bold flex items-center gap-2 transition-all border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.35)] active:scale-95 cursor-pointer"
          title="Trigger Acoustic Clap Pulse [Spacebar or 'C']"
        >
          <Hand className="w-3.5 h-3.5 animate-bounce" />
          <span className="text-xs tracking-wider">TRIG CLAP</span>
          <span className="text-[9.5px] px-1 py-0.2 rounded bg-black/40 text-cyan-200 border border-cyan-400/30">Space</span>
        </button>

        {/* 2b. Direct Light Toggle Button */}
        <button
          onClick={() => circuitSim.toggleLight()}
          className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all border active:scale-95 cursor-pointer ${
            simState.ledIsOn
              ? 'bg-red-950/80 hover:bg-red-900/90 text-red-200 border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.35)]'
              : 'bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border-[#1f293d]'
          }`}
          title="Directly Toggle Light ON/OFF ['L']"
        >
          <Lightbulb className={`w-3.5 h-3.5 ${simState.ledIsOn ? 'text-red-400 fill-red-400' : 'text-slate-400'}`} />
          <span>{simState.ledIsOn ? 'LIGHT ON' : 'LIGHT OFF'}</span>
          <span className="text-[9.5px] px-1 py-0.2 rounded bg-black/40 text-slate-300 border border-[#1f293d]">L</span>
        </button>

        {/* 3. Real Microphone Toggle */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleToggleRealMic}
            disabled={!simState.powerOn}
            className={`px-3 py-1.5 rounded font-bold flex items-center gap-1.5 transition-all border active:scale-95 ${
              isMicActive
                ? 'bg-amber-950/80 hover:bg-amber-900/90 text-amber-300 border-amber-500/60 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse'
                : 'bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border-[#1f293d]'
            }`}
            title="Listen to real audio claps via Web Audio API"
          >
            {isMicActive ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{isMicActive ? 'MIC: LIVE' : 'MIC: IN'}</span>
          </button>

          {isMicActive && (
            <div className="flex items-center gap-1 bg-[#11141d] px-2 py-1 rounded border border-[#1f293d]">
              <span className="text-[10px] text-slate-400">Sens:</span>
              <input
                type="range"
                min="0.1"
                max="0.8"
                step="0.05"
                value={micThreshold}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setMicThreshold(v);
                  audioEngine.threshold = v;
                }}
                className="w-14 accent-amber-500 h-1 bg-[#1f293d] rounded"
                title="Clap Detection Sensitivity"
              />
            </div>
          )}
        </div>

        {/* 4. Reset Button */}
        <button
          onClick={() => circuitSim.reset()}
          className="p-1.5 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border border-[#1f293d] transition-colors"
          title="Reset Circuit to Initial State (Q=0, Q'=1, LED=OFF)"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Center Group: Educational & Mode Modals */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          onClick={onOpenStepTutorial}
          className="px-2.5 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 transition-colors text-[11px]"
        >
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <span>Step-by-Step</span>
        </button>

        <button
          onClick={onOpenTraceMode}
          className="px-2.5 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-purple-300 border border-purple-500/30 flex items-center gap-1.5 transition-colors text-[11px]"
        >
          <GitCommit className="w-3.5 h-3.5 text-purple-400" />
          <span>Signal Trace</span>
        </button>

        <button
          onClick={onOpenTruthTable}
          className="px-2.5 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 transition-colors text-[11px]"
        >
          <Table className="w-3.5 h-3.5 text-emerald-400" />
          <span>Truth Table / 555</span>
        </button>

        <button
          onClick={onOpenEduGuide}
          className="px-2.5 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors text-[11px]"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Theory Guide</span>
        </button>

        <button
          onClick={onOpenAssumptions}
          className="px-2.5 py-1 rounded bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 transition-colors text-[11px]"
          title="Review exact Ground Truth Schematic & Soldered Build Analysis"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Assumptions & Values</span>
        </button>
      </div>

      {/* Right Group: Simulation Controls & Camera Views */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Speed Selector */}
        <div className="flex items-center gap-1 bg-[#11141d] px-2 py-0.5 rounded border border-[#1f293d]">
          <span className="text-[10px] text-slate-500 uppercase">Rate:</span>
          {[0.25, 0.5, 1.0, 2.0].map((spd) => (
            <button
              key={spd}
              onClick={() => circuitSim.setSimulationSpeed(spd)}
              className={`px-1 py-0.2 rounded text-[10px] transition-colors ${
                simState.simulationSpeed === spd
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {spd}x
            </button>
          ))}
        </div>

        {/* Camera Preset Dropdown */}
        <div className="flex items-center gap-1 bg-[#11141d] px-2 py-0.5 rounded border border-[#1f293d]">
          <Camera className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={cameraPreset}
            onChange={(e) => onSetCameraPreset(e.target.value as CameraPreset)}
            className="bg-transparent text-slate-300 text-[10.5px] outline-none cursor-pointer font-mono"
          >
            <option value="overview" className="bg-[#11141d]">View: Overview</option>
            <option value="sensor" className="bg-[#11141d]">View: Mic / BC547</option>
            <option value="timer" className="bg-[#11141d]">View: 555 Timer</option>
            <option value="flipflop" className="bg-[#11141d]">View: 7474 D-FF</option>
            <option value="output" className="bg-[#11141d]">View: LED Output</option>
            <option value="pcb_top" className="bg-[#11141d]">View: Top PCB</option>
          </select>
        </div>

        {/* Display Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={onToggleCurrentFlow}
            className={`p-1.5 rounded border transition-colors ${
              showCurrentFlow ? 'bg-[#161b26] text-cyan-300 border-cyan-500/50 shadow-sm' : 'bg-[#11141d] text-slate-500 border-[#1f293d]'
            }`}
            title="Toggle Moving Current Flow Particles"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleElectronFlow}
            className={`px-1.5 py-0.5 rounded border text-[9.5px] transition-colors ${
              showElectronFlow ? 'bg-amber-950/70 text-amber-300 border-amber-500/50' : 'bg-[#11141d] text-slate-400 border-[#1f293d]'
            }`}
            title="Switch between Conventional Current and Electron Flow"
          >
            {showElectronFlow ? 'e⁻' : 'Conv'}
          </button>

          <button
            onClick={onTogglePinLabels}
            className={`p-1.5 rounded border transition-colors ${
              showPinLabels ? 'bg-[#161b26] text-emerald-300 border-emerald-500/50 shadow-sm' : 'bg-[#11141d] text-slate-500 border-[#1f293d]'
            }`}
            title="Toggle 3D Section & Pin Labels"
          >
            <Layers className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={onToggleOscilloscope}
            className={`p-1.5 rounded border transition-colors ${
              showOscilloscope ? 'bg-[#161b26] text-purple-300 border-purple-500/50 shadow-sm' : 'bg-[#11141d] text-slate-500 border-[#1f293d]'
            }`}
            title="Toggle Digital Oscilloscope"
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {micError && (
        <div className="w-full text-red-400 text-[10px] text-center bg-red-950/60 py-1 rounded border border-red-800/60">
          Microphone Notice: {micError} (You can still use the virtual TRIG CLAP button!)
        </div>
      )}
    </div>
  );
};
