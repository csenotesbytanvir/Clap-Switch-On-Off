import React from 'react';
import { 
  X, 
  BookOpen, 
  HelpCircle, 
  CheckCircle, 
  Lightbulb, 
  Layers, 
  ArrowRight,
  Zap
} from 'lucide-react';

interface EducationalGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EducationalGuideModal: React.FC<EducationalGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn font-mono text-xs">
      <div className="bg-[#11141d] border border-[#1f293d] rounded-lg max-w-3xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-4 py-3 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                How the Clap ON / Clap OFF Switch Works
              </h3>
              <div className="text-[10px] text-slate-400">
                Engineering Theory & Viva Reference Guide
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
        <div className="p-4 overflow-y-auto space-y-5 text-slate-300">
          {/* 1. Core Operating Principle */}
          <div className="bg-[#0d1017] p-3.5 rounded border border-[#1f293d] space-y-2">
            <h4 className="font-bold text-xs text-cyan-300 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-cyan-400" /> 1. Core Operating Principle
            </h4>
            <p className="text-slate-300 leading-relaxed text-[11px]">
              The Clap ON / Clap OFF switch converts an acoustic transient pressure wave into a stable bistable logic memory state:
            </p>
            <div className="p-2 bg-[#161b26] rounded border border-[#1f293d] font-bold text-cyan-300 flex flex-wrap items-center gap-1.5 text-[11px]">
              <span>Sound Clap</span>
              <ArrowRight className="w-3 h-3 text-cyan-500" />
              <span>Microphone</span>
              <ArrowRight className="w-3 h-3 text-cyan-500" />
              <span>BC547 Switch</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span>555 Timer Monostable</span>
              <ArrowRight className="w-3 h-3 text-purple-500" />
              <span>Clock Pulse</span>
              <ArrowRight className="w-3 h-3 text-emerald-500" />
              <span>7474 D Flip-Flop (Q&apos;→D)</span>
              <ArrowRight className="w-3 h-3 text-red-500" />
              <span>LED / Output</span>
            </div>
          </div>

          {/* 2. Detailed Stage by Stage Breakdown */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-xs text-purple-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-purple-400" /> 2. Stage-by-Stage Electrical Operation
            </h4>

            <div className="space-y-2">
              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <span className="font-bold text-cyan-400 text-xs">Stage A: Acoustic Sensing (Electret Condenser Microphone)</span>
                <p className="text-slate-400 text-[10.5px] mt-0.5 leading-relaxed">
                  Sound vibrations alter distance between capacitor plates inside the mic capsule, modulating the gate of an internal JFET biased by R1 (10kΩ). This produces an AC voltage signal.
                </p>
              </div>

              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <span className="font-bold text-amber-400 text-xs">Stage B: AC Coupling & Transistor Switching (C2 & BC547)</span>
                <p className="text-slate-400 text-[10.5px] mt-0.5 leading-relaxed">
                  Capacitor C2 (100nF) blocks the microphone&apos;s +4.5V DC bias while passing high-frequency clap transients to BC547 base. The positive spike drives V_BE &gt; 0.7V, turning Q1 ON and pulling Collector down from 9V to ~0.18V.
                </p>
              </div>

              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <span className="font-bold text-purple-400 text-xs">Stage C: Debounced Monostable Pulse Generation (NE555 Timer)</span>
                <p className="text-slate-400 text-[10.5px] mt-0.5 leading-relaxed">
                  When 555 Pin 2 (TRIG) drops below 1/3 VCC (&lt;3.0V), Pin 3 (OUT) drives HIGH (+9V) and Pin 7 opens, allowing C3 (4.7µF) to charge through R4 (100kΩ). Pulse duration:
                  <span className="block mt-1 font-bold text-purple-300 bg-[#161b26] p-1.5 rounded border border-[#1f293d]">
                    T = 1.1 × R₄ × C₃ = 1.1 × 100kΩ × 4.7µF ≈ 0.517 seconds
                  </span>
                  This debounces acoustic reverberations or echoes.
                </p>
              </div>

              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <span className="font-bold text-emerald-400 text-xs">Stage D: Bistable Memory Toggle (7474 D Flip-Flop with Q&apos; → D Feedback)</span>
                <p className="text-slate-400 text-[10.5px] mt-0.5 leading-relaxed">
                  On the rising clock edge from 555 Pin 3, 7474 transfers D to Q. With Q&apos; (Pin 6) wired directly to D (Pin 2), D always holds the opposite state of Q:
                  <span className="block mt-1 text-emerald-300 font-bold">
                    • Clap 1: Q=0 → D=1 → Clock rises → Q becomes 1, Q&apos; becomes 0 (LED ON)<br />
                    • Clap 2: Q=1 → D=0 → Clock rises → Q becomes 0, Q&apos; becomes 1 (LED OFF)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* 3. Frequently Asked Viva / Project Questions */}
          <div className="space-y-2.5 pt-2 border-t border-[#1f293d]">
            <h4 className="font-bold text-xs text-amber-300 flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> 3. Frequently Asked Viva / Project Questions
            </h4>

            <div className="space-y-1.5">
              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <div className="font-bold text-slate-200 text-xs">Q1: Why is the 555 timer necessary between the transistor and flip-flop?</div>
                <div className="text-slate-400 text-[10.5px] mt-0.5">
                  <span className="text-emerald-400 font-bold">Answer:</span> Mechanical claps produce chaotic ringing waveforms with dozens of micro-spikes. The 555 monostable produces a single clean digital pulse with fixed refractory period.
                </div>
              </div>

              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <div className="font-bold text-slate-200 text-xs">Q2: Why connect Q&apos; back to D instead of using a JK flip-flop?</div>
                <div className="text-slate-400 text-[10.5px] mt-0.5">
                  <span className="text-emerald-400 font-bold">Answer:</span> Wiring Q&apos; → D on a standard D flip-flop creates a Toggle flip-flop with a single IC, halving component count and board layout complexity.
                </div>
              </div>

              <div className="p-2.5 bg-[#0d1017] rounded border border-[#1f293d]">
                <div className="font-bold text-slate-200 text-xs">Q3: What is the role of capacitor C2 (100nF)?</div>
                <div className="text-slate-400 text-[10.5px] mt-0.5">
                  <span className="text-emerald-400 font-bold">Answer:</span> It acts as an AC coupling capacitor, blocking the microphone&apos;s +4.5V DC bias while transmitting rapid acoustic AC spikes to the transistor base.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-[#0d1017] border-t border-[#1f293d] flex justify-end">
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-white font-bold text-xs border border-cyan-500/50 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
