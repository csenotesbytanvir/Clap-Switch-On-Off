import React from 'react';
import { CircuitComponentData, SimulationState } from '../types';
import { 
  X, 
  Cpu, 
  Info, 
  Activity, 
  CheckCircle2, 
  Zap 
} from 'lucide-react';

interface ComponentDetailsModalProps {
  component: CircuitComponentData | null;
  onClose: () => void;
  simState: SimulationState;
}

export const ComponentDetailsModal: React.FC<ComponentDetailsModalProps> = ({
  component,
  onClose,
  simState,
}) => {
  if (!component) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono">
      <div className="bg-[#11141d] border border-[#1f293d] rounded-lg max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{component.name}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-500/40">
                  {component.designator}
                </span>
              </h3>
              <div className="text-[9.5px] text-slate-500">
                Specification: {component.value || 'Discrete Component'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-3.5 text-xs text-slate-300">
          {/* Function Description */}
          <div className="bg-[#0d1017] p-3 rounded border border-[#1f293d] space-y-1.5">
            <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-xs">
              <Info className="w-3.5 h-3.5 text-cyan-400" /> Circuit Function
            </div>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              {component.description}
            </p>
          </div>

          {/* Detailed Electrical Physics */}
          <div className="bg-[#0d1017] p-3 rounded border border-[#1f293d] space-y-1">
            <div className="flex items-center gap-1.5 text-purple-300 font-bold text-xs">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> Operating Principles
            </div>
            <p className="text-slate-400 leading-relaxed text-[10.5px]">
              {component.detailedFunction}
            </p>
          </div>

          {/* Real-time Pin Telemetry */}
          {component.pins && component.pins.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-emerald-300 font-bold text-xs mb-1.5">
                <Activity className="w-3.5 h-3.5 text-emerald-400" /> Live Pin Voltages & Net Connections
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {component.pins.map((pin) => {
                  let liveVoltage = pin.currentVoltage;
                  // Map live simulation voltages
                  if (component.id === 'U1_555') {
                    if (pin.id === '555_P2') liveVoltage = simState.timer555TriggerVoltage;
                    if (pin.id === '555_P3') liveVoltage = simState.timer555OutputVoltage;
                    if (pin.id === '555_P6') liveVoltage = simState.timer555ThresholdVoltage;
                  } else if (component.id === 'U2_7474') {
                    if (pin.id === '7474_P3') liveVoltage = simState.flipFlopClockVoltage;
                    if (pin.id === '7474_P2') liveVoltage = simState.flipFlopDInput === 1 ? 5.0 : 0.0;
                    if (pin.id === '7474_P5') liveVoltage = simState.flipFlopQOutput === 1 ? 5.0 : 0.0;
                    if (pin.id === '7474_P6') liveVoltage = simState.flipFlopQBarOutput === 1 ? 5.0 : 0.0;
                  } else if (component.id === 'Q1') {
                    if (pin.id === 'Q1_BASE') liveVoltage = simState.transistorBaseVoltage;
                    if (pin.id === 'Q1_COLLECTOR') liveVoltage = simState.transistorCollectorVoltage;
                  } else if (component.id === 'LED1') {
                    if (pin.id === 'LED1_ANODE') liveVoltage = simState.ledVoltage;
                  }

                  return (
                    <div
                      key={pin.id}
                      className="bg-[#0d1017] p-2 rounded border border-[#1f293d] flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between text-[10.5px]">
                        <span className="font-bold text-slate-200">{pin.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-[#161b26] text-cyan-300 font-bold border border-[#1f293d]">
                          {liveVoltage.toFixed(2)}V
                        </span>
                      </div>
                      <div className="text-[9.5px] text-slate-500 mt-0.5">
                        {pin.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0d1017] border-t border-[#1f293d] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-200 text-xs border border-[#1f293d] transition-colors"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
};
