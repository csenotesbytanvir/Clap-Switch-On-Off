import React, { useState, useEffect } from 'react';
import { 
  GitCommit, 
  ArrowRight, 
  Play, 
  X, 
  CheckCircle,
  Zap,
  Mic,
  Cpu,
  Clock,
  Lightbulb
} from 'lucide-react';
import { circuitSim } from '../circuit/CircuitSimulationEngine';

interface SignalTraceOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightComponents: (compIds: string[]) => void;
  onHighlightWires: (wireIds: string[]) => void;
}

const TRACE_STAGES = [
  {
    id: 'stage_mic',
    name: '1. Sound Sensor (Electret MIC1)',
    shortName: 'MIC',
    icon: Mic,
    color: '#06b6d4',
    compIds: ['MIC1', 'R_MIC', 'C_COUP'],
    wireIds: ['WIRE_MIC_TO_CCOUP', 'WIRE_CCOUP_TO_BASE'],
    desc: 'Sound wave → Diaphragm vibration → JFET modulation → AC voltage transient through C2',
  },
  {
    id: 'stage_q1',
    name: '2. NPN Switch (BC547 Q1)',
    shortName: 'BC547',
    icon: Cpu,
    color: '#f59e0b',
    compIds: ['Q1', 'R_BASE', 'R_COL'],
    wireIds: ['WIRE_CCOUP_TO_BASE', 'WIRE_Q1_TO_555_TRIG'],
    desc: 'Base voltage > 0.7V → Transistor saturates (ON) → Collector pulls down to 0.18V',
  },
  {
    id: 'stage_555_trig',
    name: '3. 555 Timer Trigger (Pin 2)',
    shortName: '555 TRIG',
    icon: Clock,
    color: '#a855f7',
    compIds: ['U1_555'],
    wireIds: ['WIRE_Q1_TO_555_TRIG'],
    desc: 'Trigger input falls < 1/3 VCC (3.0V) → Lower comparator fires → RS latch sets',
  },
  {
    id: 'stage_555_out',
    name: '4. Monostable Pulse (Pin 3 OUT)',
    shortName: '555 OUT',
    icon: Clock,
    color: '#8b5cf6',
    compIds: ['U1_555', 'R_TIMING', 'C_TIMING'],
    wireIds: ['WIRE_555_TO_7474_CLK', 'WIRE_555_RC_NODE'],
    desc: 'Pin 3 drives HIGH (+9V) → Timing capacitor C3 charges via R4 for debounce window T = 1.1*R4*C3',
  },
  {
    id: 'stage_7474_clk',
    name: '5. D Flip-Flop Clock Input (7474 Pin 3)',
    shortName: '7474 CLK',
    icon: Zap,
    color: '#3b82f6',
    compIds: ['U2_7474'],
    wireIds: ['WIRE_555_TO_7474_CLK'],
    desc: 'Positive clock edge (0 → 1) reaches 7474 master latch',
  },
  {
    id: 'stage_7474_feedback',
    name: '6. Q\' → D Feedback & Toggle',
    shortName: 'Q\' → D',
    icon: GitCommit,
    color: '#10b981',
    compIds: ['U2_7474'],
    wireIds: ['WIRE_7474_FEEDBACK'],
    desc: 'Samples D (fed by Q\') → Inverts state: Q flips (0 → 1 or 1 → 0) → Updates next D',
  },
  {
    id: 'stage_led',
    name: '7. LED & Load Driver (Pin 5 Q → LED1)',
    shortName: 'LED OUT',
    icon: Lightbulb,
    color: '#ef4444',
    compIds: ['U2_7474', 'R_LED', 'LED1'],
    wireIds: ['WIRE_7474_Q_TO_RLED', 'WIRE_RLED_TO_LED'],
    desc: 'Forward current flows through R5 (330Ω) → LED illuminates (CLAP ON) or extinguishes (CLAP OFF)',
  }
];

export const SignalTraceOverlay: React.FC<SignalTraceOverlayProps> = ({
  isOpen,
  onClose,
  onHighlightComponents,
  onHighlightWires,
}) => {
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [isTracing, setIsTracing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      onHighlightComponents([]);
      onHighlightWires([]);
      setIsTracing(false);
      return;
    }

    const current = TRACE_STAGES[activeStageIndex];
    if (current) {
      onHighlightComponents(current.compIds);
      onHighlightWires(current.wireIds);
    }
  }, [activeStageIndex, isOpen, onHighlightComponents, onHighlightWires]);

  // Automated Sequential Tracer
  useEffect(() => {
    if (!isTracing || !isOpen) return;

    const timer = setInterval(() => {
      setActiveStageIndex((prev) => {
        if (prev >= TRACE_STAGES.length - 1) {
          setIsTracing(false);
          return prev;
        }
        return prev + 1;
      });
    }, 1800);

    return () => clearInterval(timer);
  }, [isTracing, isOpen]);

  if (!isOpen) return null;

  const handleStartTrace = () => {
    setActiveStageIndex(0);
    setIsTracing(true);
    circuitSim.triggerClap('virtual');
  };

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-3xl bg-[#11141d]/98 backdrop-blur-xl border border-purple-500/50 rounded-lg shadow-2xl overflow-hidden animate-fadeIn font-mono text-xs text-slate-200">
      {/* Header */}
      <div className="px-3.5 py-2 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitCommit className="w-3.5 h-3.5 text-purple-400" />
          <span className="font-bold text-slate-100 text-[11px] uppercase tracking-wider">
            Signal Path Tracer: Acoustic Wave → LED Photons
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleStartTrace}
            disabled={isTracing}
            className="px-2.5 py-1 rounded bg-purple-900/90 hover:bg-purple-800 disabled:opacity-40 text-white font-semibold flex items-center gap-1 text-[10.5px] transition-all border border-purple-500/50 shadow-sm"
          >
            <Play className="w-3 h-3 text-purple-300" /> {isTracing ? 'Tracing...' : 'Trace & Trigger'}
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Signal Stage Breadcrumb Flow */}
      <div className="p-2.5 bg-[#0d1017] border-b border-[#1f293d] overflow-x-auto flex items-center gap-1">
        {TRACE_STAGES.map((stage, idx) => {
          const Icon = stage.icon;
          const isActive = idx === activeStageIndex;
          const isPassed = idx < activeStageIndex;
          return (
            <React.Fragment key={stage.id}>
              <button
                onClick={() => {
                  setIsTracing(false);
                  setActiveStageIndex(idx);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded border whitespace-nowrap transition-all text-[10.5px] ${
                  isActive
                    ? 'bg-purple-950/90 border-purple-500 text-purple-200 shadow-[0_0_8px_rgba(168,85,247,0.3)] font-bold'
                    : isPassed
                      ? 'bg-[#161b26] border-[#1f293d] text-slate-300'
                      : 'bg-[#0d1017] border-[#1f293d]/50 text-slate-500'
                }`}
              >
                <Icon className="w-3 h-3" style={{ color: isActive ? stage.color : undefined }} />
                <span>{stage.shortName}</span>
              </button>
              {idx < TRACE_STAGES.length - 1 && (
                <ArrowRight className={`w-3 h-3 flex-shrink-0 ${isPassed ? 'text-purple-400' : 'text-slate-700'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Active Stage Details */}
      <div className="p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center justify-center text-[9.5px]">
              {activeStageIndex + 1}
            </span>
            {TRACE_STAGES[activeStageIndex].name}
          </h4>
          <span className="text-[9.5px] text-slate-500">
            Stage {activeStageIndex + 1} of {TRACE_STAGES.length}
          </span>
        </div>

        <p className="text-slate-300 text-[11px] leading-relaxed bg-[#0d1017] p-2 rounded border border-[#1f293d]">
          {TRACE_STAGES[activeStageIndex].desc}
        </p>
      </div>
    </div>
  );
};
