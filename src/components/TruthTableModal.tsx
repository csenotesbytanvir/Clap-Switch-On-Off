import React, { useState } from 'react';
import { SimulationState } from '../types';
import { 
  X, 
  Table, 
  Sliders, 
  Calculator, 
  ArrowRight, 
  Check, 
  Sparkles,
  Zap
} from 'lucide-react';
import { circuitSim } from '../circuit/CircuitSimulationEngine';

interface TruthTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  simState: SimulationState;
}

export const TruthTableModal: React.FC<TruthTableModalProps> = ({
  isOpen,
  onClose,
  simState,
}) => {
  const [r1KiloOhms, setR1KiloOhms] = useState(simState.r1TimingValue / 1000);
  const [c1MicroFarads, setC1MicroFarads] = useState(simState.c1TimingValue * 1e6);

  if (!isOpen) return null;

  const currentDuration = 1.1 * (r1KiloOhms * 1000) * (c1MicroFarads * 1e-6);

  const handleApplyParameters = () => {
    circuitSim.setTimingParameters(r1KiloOhms * 1000, c1MicroFarads * 1e-6);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#11141d] border border-[#1f293d] rounded-lg max-w-2xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 font-mono">
              7474 Truth Table & 555 Timing Calculator
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-5 text-slate-300 font-mono text-xs">
          {/* Section 1: 7474 Flip-Flop Truth Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-cyan-400" /> 7474 D Flip-Flop Truth Table
              </h4>
              <span className="text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/40">
                Mode: Q&apos; → D Feedback
              </span>
            </div>

            <div className="overflow-x-auto rounded border border-[#1f293d] bg-[#0d1017]">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-[#1f293d] bg-[#161b26] text-slate-400 text-[10px]">
                    <th className="p-2">Clock (CLK)</th>
                    <th className="p-2">D Input (Q&apos;)</th>
                    <th className="p-2">Q Output (LED)</th>
                    <th className="p-2">Q&apos; (Inverted)</th>
                    <th className="p-2">State</th>
                    <th className="p-2">Live</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1f293d]/60">
                  {/* Row 1: Low / Inactive */}
                  <tr className={`transition-colors ${simState.flipFlopClockState === 0 ? 'bg-[#161b26]/70' : ''}`}>
                    <td className="p-2 font-bold text-slate-400">0 (LOW)</td>
                    <td className="p-2">X (Don&apos;t care)</td>
                    <td className="p-2 font-semibold text-slate-300">Q₀ (No change)</td>
                    <td className="p-2 font-semibold text-slate-300">Q₀&apos; (No change)</td>
                    <td className="p-2 text-slate-400">Memory Hold</td>
                    <td className="p-2">
                      {simState.flipFlopClockState === 0 && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-slate-400">
                          <Check className="w-3 h-3 text-cyan-400" /> Current
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 2: Rising Edge Clock with D=1 (Turn ON) */}
                  <tr className={`transition-colors ${simState.flipFlopQOutput === 1 && simState.flipFlopClockState === 1 ? 'bg-emerald-950/50 border-l-2 border-l-emerald-500' : ''}`}>
                    <td className="p-2 font-bold text-purple-400 flex items-center gap-1">
                      ↑ Rising (0→1)
                    </td>
                    <td className="p-2 font-bold text-emerald-400">1 (HIGH)</td>
                    <td className="p-2 font-bold text-red-400">1 (HIGH)</td>
                    <td className="p-2 font-bold text-slate-400">0 (LOW)</td>
                    <td className="p-2 text-emerald-300 font-semibold">CLAP ON (LED ON)</td>
                    <td className="p-2">
                      {simState.flipFlopQOutput === 1 && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                          <Sparkles className="w-2.5 h-2.5" /> Q=1
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 3: Rising Edge Clock with D=0 (Turn OFF) */}
                  <tr className={`transition-colors ${simState.flipFlopQOutput === 0 && simState.flipFlopClockState === 1 ? 'bg-amber-950/50 border-l-2 border-l-amber-500' : ''}`}>
                    <td className="p-2 font-bold text-purple-400 flex items-center gap-1">
                      ↑ Rising (0→1)
                    </td>
                    <td className="p-2 font-bold text-amber-400">0 (LOW)</td>
                    <td className="p-2 font-bold text-slate-400">0 (LOW)</td>
                    <td className="p-2 font-bold text-emerald-400">1 (HIGH)</td>
                    <td className="p-2 text-amber-300 font-semibold">CLAP OFF (LED OFF)</td>
                    <td className="p-2">
                      {simState.flipFlopQOutput === 0 && (
                        <span className="inline-flex items-center gap-1 text-[9.5px] text-amber-400 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40">
                          <Check className="w-2.5 h-2.5" /> Q=0
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-2 p-2.5 rounded bg-[#0d1017] border border-[#1f293d] text-slate-300 text-[11px] space-y-1">
              <div className="font-bold text-emerald-400 text-xs">Why Does It Toggle on Every Clap?</div>
              <p className="text-slate-400 leading-relaxed text-[10.5px]">
                By connecting <span className="text-emerald-300 font-bold">Q&apos; (Pin 6)</span> back to <span className="text-emerald-300 font-bold">D (Pin 2)</span>, the data input always holds the exact inversion of the current output. When a clock pulse arrives from the 555 timer, the flip-flop samples D, inverting the state:
              </p>
              <div className="flex items-center gap-1.5 pt-0.5 font-bold text-cyan-300 text-[10.5px]">
                <span>Q = 0</span> <ArrowRight className="w-3 h-3" /> <span>Q&apos; = 1</span> <ArrowRight className="w-3 h-3" /> <span>D = 1</span> <ArrowRight className="w-3 h-3 text-purple-400" /> <span className="text-purple-300">Next Clap: Q = 1</span>
              </div>
            </div>
          </div>

          {/* Section 2: 555 Monostable Timing Calculator */}
          <div className="pt-3 border-t border-[#1f293d]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-purple-400" /> 555 Monostable Pulse Width Calculator
              </h4>
              <span className="text-[10px] text-purple-300 bg-purple-950/60 px-2 py-0.5 rounded border border-purple-500/40">
                T = 1.1 × R₄ × C₃
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#0d1017] p-3 rounded border border-[#1f293d]">
              {/* Sliders */}
              <div className="space-y-2.5">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Timing Resistor R₄:</span>
                    <span className="text-purple-300 font-bold">{r1KiloOhms} kΩ</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="470"
                    step="5"
                    value={r1KiloOhms}
                    onChange={(e) => setR1KiloOhms(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9.5px] text-slate-500">
                    <span>10 kΩ</span>
                    <span>100 kΩ (Default)</span>
                    <span>470 kΩ</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="text-slate-400">Timing Capacitor C₃:</span>
                    <span className="text-purple-300 font-bold">{c1MicroFarads.toFixed(1)} µF</span>
                  </div>
                  <input
                    type="range"
                    min="0.47"
                    max="47"
                    step="0.5"
                    value={c1MicroFarads}
                    onChange={(e) => setC1MicroFarads(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9.5px] text-slate-500">
                    <span>0.47 µF</span>
                    <span>4.7 µF (Default)</span>
                    <span>47 µF</span>
                  </div>
                </div>

                <button
                  onClick={handleApplyParameters}
                  className="w-full py-1.5 px-3 rounded bg-purple-900/80 hover:bg-purple-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all border border-purple-500/40"
                >
                  <Calculator className="w-3.5 h-3.5" /> Apply Parameters to Simulation
                </button>
              </div>

              {/* Calculated Results */}
              <div className="bg-[#161b26] p-3 rounded border border-[#1f293d] flex flex-col justify-between space-y-2">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">Calculated Pulse Duration (T)</div>
                  <div className="text-xl font-bold text-purple-300 font-mono">
                    {currentDuration.toFixed(3)} <span className="text-xs font-normal text-slate-400">seconds</span>
                  </div>
                  <div className="text-[9.5px] text-slate-500 mt-0.5">
                    = 1.1 × {r1KiloOhms}kΩ × {c1MicroFarads.toFixed(1)}µF
                  </div>
                </div>

                <div className="p-2 rounded bg-[#0d1017] border border-[#1f293d] text-[9.5px] text-slate-400">
                  <span className="text-purple-300 font-semibold">Debounce Window:</span> The 555 output remains HIGH for {currentDuration.toFixed(2)}s, preventing acoustic reverberations from false double-triggering.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0d1017] border-t border-[#1f293d] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-200 text-xs font-mono border border-[#1f293d] transition-colors"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
