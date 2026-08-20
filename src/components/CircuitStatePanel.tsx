import React from 'react';
import { SimulationState, CircuitComponentData } from '../types';
import { 
  Zap, 
  Mic, 
  Cpu, 
  Clock, 
  Lightbulb, 
  CheckCircle2, 
  XCircle, 
  ArrowRight,
  TrendingDown,
  Gauge
} from 'lucide-react';

interface CircuitStatePanelProps {
  simState: SimulationState;
  onSelectComponent: (comp: CircuitComponentData | null) => void;
}

export const CircuitStatePanel: React.FC<CircuitStatePanelProps> = ({
  simState,
}) => {
  return (
    <div 
      id="circuit-state-panel"
      className="bg-[#11141d]/95 backdrop-blur-md border border-[#1f293d] rounded-lg overflow-hidden shadow-2xl flex flex-col h-full font-mono text-xs text-slate-300"
    >
      {/* Header */}
      <div className="px-3 py-2 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gauge className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-semibold text-slate-100 uppercase tracking-wider text-[11px]">
            Circuit Telemetry
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px]">
          <span className={`w-1.5 h-1.5 rounded-full ${simState.powerOn ? 'bg-emerald-400 animate-ping' : 'bg-red-500'}`} />
          <span className={simState.powerOn ? 'text-emerald-400 font-bold' : 'text-slate-500'}>
            {simState.powerOn ? 'VCC: 9.0V' : 'OFF'}
          </span>
        </div>
      </div>

      {/* Main Status Grid */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 divide-y divide-[#1f293d]/70">
        {/* STAGE 1: SOUND SENSOR (MICROPHONE) */}
        <div className="pt-2 first:pt-0">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-cyan-400 text-[11px]">
              <Mic className="w-3.5 h-3.5" /> STAGE 1: SOUND SENSOR (MIC1)
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9.5px] border ${
              simState.isClapActive ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50' : 'bg-[#161b26] text-slate-500 border-[#1f293d]'
            }`}>
              {simState.isClapActive ? 'CLAP DETECTED' : 'LISTENING'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#0d1017] p-2 rounded border border-[#1f293d]">
            <div>
              <div className="text-[9.5px] text-slate-500 uppercase">Acoustic Amp</div>
              <div className="font-bold text-slate-200 flex items-center gap-1 mt-0.5">
                <div className="w-14 h-1.5 bg-[#161b26] rounded-full overflow-hidden border border-[#1f293d]">
                  <div 
                    className="h-full bg-cyan-400 transition-all duration-75"
                    style={{ width: `${Math.min(100, simState.micAmplitude * 100)}%` }}
                  />
                </div>
                <span className="text-[10px]">{(simState.micAmplitude * 100).toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-slate-500 uppercase">AC Signal (C2)</div>
              <div className="font-bold text-cyan-300 text-xs mt-0.5">
                {simState.micSignalVoltage.toFixed(2)} V
              </div>
            </div>
          </div>
        </div>

        {/* STAGE 2: NPN INVERTER SWITCH (BC547) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-amber-400 text-[11px]">
              <Cpu className="w-3.5 h-3.5" /> STAGE 2: AMPLIFIER SWITCH (Q1)
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9.5px] border ${
              simState.transistorIsOn ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-[#161b26] text-slate-500 border-[#1f293d]'
            }`}>
              {simState.transistorIsOn ? 'SATURATED (ON)' : 'CUTOFF (OFF)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#0d1017] p-2 rounded border border-[#1f293d]">
            <div>
              <div className="text-[9.5px] text-slate-500 uppercase">Base (V_BE)</div>
              <div className={`font-bold text-xs mt-0.5 ${simState.transistorBaseVoltage >= 0.7 ? 'text-amber-300' : 'text-slate-300'}`}>
                {simState.transistorBaseVoltage.toFixed(2)} V {simState.transistorBaseVoltage >= 0.7 && '(>0.7V)'}
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-slate-500 uppercase">Collector (V_CE)</div>
              <div className={`font-bold text-xs mt-0.5 ${simState.transistorCollectorVoltage < 1.0 ? 'text-amber-300 flex items-center gap-1' : 'text-slate-300'}`}>
                {simState.transistorCollectorVoltage < 1.0 && <TrendingDown className="w-3 h-3 text-amber-400" />}
                {simState.transistorCollectorVoltage.toFixed(2)} V
              </div>
            </div>
          </div>
        </div>

        {/* STAGE 3: MONOSTABLE TIMER (NE555) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-purple-400 text-[11px]">
              <Clock className="w-3.5 h-3.5" /> STAGE 3: 555 MONOSTABLE (U1)
            </span>
            <span className={`px-1.5 py-0.2 rounded text-[9.5px] border ${
              simState.timer555OutputState === 1 ? 'bg-purple-950/80 text-purple-300 border-purple-500/50' : 'bg-[#161b26] text-slate-500 border-[#1f293d]'
            }`}>
              {simState.timer555OutputState === 1 ? 'PULSE ACTIVE' : 'IDLE'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1 bg-[#0d1017] p-1.5 rounded border border-[#1f293d] text-center">
            <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
              <div className="text-[8.5px] text-slate-500">Pin 2 (TRIG)</div>
              <div className={`font-bold text-xs ${simState.timer555TriggerVoltage < 3.0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {simState.timer555TriggerVoltage.toFixed(1)}V
              </div>
              <div className="text-[7.5px] text-slate-500">
                {simState.timer555TriggerVoltage < 3.0 ? '< 1/3 VCC' : 'HIGH'}
              </div>
            </div>

            <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
              <div className="text-[8.5px] text-slate-500">Pin 6 (THRESH)</div>
              <div className="font-bold text-xs text-purple-300">
                {simState.timer555ThresholdVoltage.toFixed(2)}V
              </div>
              <div className="text-[7.5px] text-slate-500">Target 6.0V</div>
            </div>

            <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
              <div className="text-[8.5px] text-slate-500">Pin 3 (OUT)</div>
              <div className={`font-bold text-xs ${simState.timer555OutputState === 1 ? 'text-purple-300' : 'text-slate-400'}`}>
                {simState.timer555OutputVoltage.toFixed(1)}V
              </div>
              <div className="text-[7.5px] text-slate-500">
                LOGIC {simState.timer555OutputState}
              </div>
            </div>
          </div>
        </div>

        {/* STAGE 4: D FLIP-FLOP TOGGLE (7474) */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-emerald-400 text-[11px]">
              <Zap className="w-3.5 h-3.5" /> STAGE 4: D FLIP-FLOP (U2 / 7474)
            </span>
            <span className="px-1.5 py-0.2 rounded text-[9.5px] bg-emerald-950/60 text-emerald-300 border border-emerald-500/40">
              Q&apos; → D FEEDBACK
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 bg-[#0d1017] p-1.5 rounded border border-[#1f293d] text-center">
            <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
              <div className="text-[8.5px] text-slate-500">CLK (P3)</div>
              <div className={`font-bold text-xs ${simState.flipFlopClockState === 1 ? 'text-purple-300' : 'text-slate-400'}`}>
                {simState.flipFlopClockState}
              </div>
            </div>

            <div className="bg-[#161b26] p-1 rounded border border-emerald-500/40">
              <div className="text-[8.5px] text-emerald-400 font-bold">D (P2)</div>
              <div className="font-bold text-xs text-emerald-300">
                {simState.flipFlopDInput}
              </div>
              <div className="text-[7px] text-emerald-500">(=Q&apos;)</div>
            </div>

            <div className="bg-[#161b26] p-1 rounded border border-red-500/30">
              <div className="text-[8.5px] text-red-400 font-bold">Q (P5)</div>
              <div className={`font-bold text-xs ${simState.flipFlopQOutput === 1 ? 'text-red-400' : 'text-slate-400'}`}>
                {simState.flipFlopQOutput}
              </div>
              <div className="text-[7px] text-slate-500">→ LED</div>
            </div>

            <div className="bg-[#161b26] p-1 rounded border border-emerald-500/40">
              <div className="text-[8.5px] text-emerald-400 font-bold">Q&apos; (P6)</div>
              <div className={`font-bold text-xs ${simState.flipFlopQBarOutput === 1 ? 'text-emerald-400' : 'text-slate-400'}`}>
                {simState.flipFlopQBarOutput}
              </div>
              <div className="text-[7px] text-emerald-500">→ D Feed</div>
            </div>
          </div>

          <div className="mt-1.5 px-2 py-1 bg-[#0d1017] rounded border border-[#1f293d] text-[9.5px] text-slate-400 flex items-center justify-between">
            <span>Feedback Equation:</span>
            <span className="text-emerald-300 font-semibold flex items-center gap-1">
              D = Q&apos; <ArrowRight className="w-2.5 h-2.5" /> Next Q = {simState.flipFlopDInput}
            </span>
          </div>
        </div>

        {/* STAGE 5: LED OUTPUT & RELAY */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="flex items-center gap-1.5 font-semibold text-red-400 text-[11px]">
              <Lightbulb className="w-3.5 h-3.5" /> STAGE 5: OUTPUT (LED1)
            </span>
            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold flex items-center gap-1 border ${
              simState.ledIsOn ? 'bg-red-950/90 text-red-200 border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.4)]' : 'bg-[#161b26] text-slate-500 border-[#1f293d]'
            }`}>
              {simState.ledIsOn ? <CheckCircle2 className="w-3 h-3 text-red-400" /> : <XCircle className="w-3 h-3" />}
              {simState.ledIsOn ? 'STATE: ON' : 'STATE: OFF'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 bg-[#0d1017] p-2 rounded border border-[#1f293d]">
            <div>
              <div className="text-[9.5px] text-slate-500 uppercase">V_LED Drop</div>
              <div className={`font-bold text-xs mt-0.5 ${simState.ledIsOn ? 'text-red-400' : 'text-slate-400'}`}>
                {simState.ledVoltage.toFixed(2)} V
              </div>
            </div>
            <div>
              <div className="text-[9.5px] text-slate-500 uppercase">Current (I_F)</div>
              <div className={`font-bold text-xs mt-0.5 ${simState.ledIsOn ? 'text-red-400' : 'text-slate-400'}`}>
                {simState.ledCurrentMa.toFixed(1)} mA
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="px-3 py-1.5 bg-[#0d1017] border-t border-[#1f293d] flex items-center justify-between text-[10.5px] text-slate-400">
        <div>Total Claps: <span className="font-bold text-cyan-300">{simState.clapCount}</span></div>
        <div>Toggles: <span className="font-bold text-emerald-300">{simState.cycleCount}</span></div>
      </div>
    </div>
  );
};
