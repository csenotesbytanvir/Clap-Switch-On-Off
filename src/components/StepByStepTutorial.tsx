import React, { useState, useEffect } from 'react';
import { STEP_TUTORIAL_DATA } from '../data/stepTutorialData';
import { circuitSim } from '../circuit/CircuitSimulationEngine';
import { 
  GraduationCap, 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  CheckCircle,
  Lightbulb
} from 'lucide-react';

interface StepByStepTutorialProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightComponents: (compIds: string[]) => void;
  onHighlightWires: (wireIds: string[]) => void;
}

export const StepByStepTutorial: React.FC<StepByStepTutorialProps> = ({
  isOpen,
  onClose,
  onHighlightComponents,
  onHighlightWires,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const currentStep = STEP_TUTORIAL_DATA[currentStepIndex];

  // Sync highlights and circuit state on step change
  useEffect(() => {
    if (!isOpen) {
      onHighlightComponents([]);
      onHighlightWires([]);
      return;
    }

    if (currentStep) {
      onHighlightComponents(currentStep.componentIds);
      onHighlightWires(currentStep.wireIds);
      circuitSim.executeTutorialStep(currentStepIndex, STEP_TUTORIAL_DATA);
    }
  }, [currentStepIndex, isOpen, currentStep, onHighlightComponents, onHighlightWires]);

  // Auto-play timer
  useEffect(() => {
    if (!isAutoPlaying || !isOpen) return;

    const timer = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev >= STEP_TUTORIAL_DATA.length - 1) {
          setIsAutoPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isAutoPlaying, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStepIndex < STEP_TUTORIAL_DATA.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleReset = () => {
    setCurrentStepIndex(0);
    setIsAutoPlaying(false);
    circuitSim.reset();
  };

  return (
    <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl bg-[#11141d]/98 backdrop-blur-xl border border-cyan-500/50 rounded-lg shadow-2xl overflow-hidden animate-slideUp font-mono text-xs text-slate-200">
      {/* Header Bar */}
      <div className="px-3.5 py-2 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-100 text-[11px] uppercase tracking-wider">
            Step-by-Step Educational Mode ({currentStepIndex + 1}/{STEP_TUTORIAL_DATA.length})
          </span>
          <span className="px-1.5 py-0.2 rounded bg-cyan-950/70 text-cyan-300 text-[9.5px] border border-cyan-500/40">
            {currentStep.stage}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`px-2 py-0.5 rounded flex items-center gap-1 text-[10px] transition-colors border ${
              isAutoPlaying ? 'bg-amber-950/90 border-amber-500/60 text-amber-200' : 'bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border-[#1f293d]'
            }`}
          >
            {isAutoPlaying ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3" />}
            {isAutoPlaying ? 'Pause Auto' : 'Auto Play'}
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d]"
            title="Reset to Step 1"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d]"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Progress Line */}
      <div className="w-full bg-[#0a0b0e] h-1">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 via-purple-500 to-red-500 transition-all duration-300"
          style={{ width: `${((currentStepIndex + 1) / STEP_TUTORIAL_DATA.length) * 100}%` }}
        />
      </div>

      {/* Main Body */}
      <div className="p-3.5 space-y-2.5">
        <div>
          <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 flex items-center justify-center text-[9.5px]">
              {currentStep.stepNumber}
            </span>
            {currentStep.title}
          </h4>
          <p className="mt-1 text-slate-300 leading-relaxed text-[11px]">
            {currentStep.explanation}
          </p>
        </div>

        {/* Technical Formula / Details Box */}
        <div className="p-2 rounded bg-[#0d1017] border border-[#1f293d] text-[10px] text-slate-400 space-y-0.5">
          <div className="flex items-center gap-1 text-purple-300 font-semibold">
            <Lightbulb className="w-3 h-3" /> Physics Breakdown:
          </div>
          <div className="text-slate-300 font-mono">
            {currentStep.technicalDetails}
          </div>
        </div>

        {/* Live Snapshot Badge Grid */}
        <div className="grid grid-cols-4 gap-1 bg-[#0d1017] p-1.5 rounded border border-[#1f293d] text-center text-[9.5px]">
          <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
            <div className="text-slate-500">BC547 (Q1)</div>
            <div className="font-bold text-amber-300 truncate">{currentStep.stateSnapshot.bc547State}</div>
          </div>
          <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
            <div className="text-slate-500">555 Out (P3)</div>
            <div className="font-bold text-purple-300 truncate">{currentStep.stateSnapshot.pin3State}</div>
          </div>
          <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
            <div className="text-slate-500">7474 Q / LED</div>
            <div className="font-bold text-red-400 truncate">{currentStep.stateSnapshot.qState} ({currentStep.stateSnapshot.ledState})</div>
          </div>
          <div className="bg-[#161b26] p-1 rounded border border-[#1f293d]">
            <div className="text-slate-500">7474 D</div>
            <div className="font-bold text-emerald-400 truncate">D = {currentStep.stateSnapshot.dState}</div>
          </div>
        </div>
      </div>

      {/* Footer Navigation */}
      <div className="px-3.5 py-2 bg-[#0d1017] border-t border-[#1f293d] flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStepIndex === 0}
          className="px-2.5 py-1 rounded bg-[#161b26] hover:bg-[#1f293d] disabled:opacity-30 disabled:hover:bg-[#161b26] text-slate-200 font-semibold flex items-center gap-1 transition-colors border border-[#1f293d] text-[11px]"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Previous
        </button>

        {/* Step dots */}
        <div className="flex gap-1">
          {STEP_TUTORIAL_DATA.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex 
                  ? 'bg-cyan-400 w-3' 
                  : idx < currentStepIndex 
                    ? 'bg-cyan-700 w-1.5' 
                    : 'bg-[#1f293d] w-1.5'
              }`}
              title={`Jump to Step ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          disabled={currentStepIndex === STEP_TUTORIAL_DATA.length - 1}
          className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-30 disabled:hover:bg-cyan-700 text-white font-semibold flex items-center gap-1 transition-all border border-cyan-500/50 text-[11px]"
        >
          {currentStepIndex === STEP_TUTORIAL_DATA.length - 1 ? (
            <>Done <CheckCircle className="w-3.5 h-3.5" /></>
          ) : (
            <>Next <ChevronRight className="w-3.5 h-3.5" /></>
          )}
        </button>
      </div>
    </div>
  );
};
