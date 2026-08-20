import React, { useEffect, useRef, useState } from 'react';
import { OscilloscopeSample, SimulationState } from '../types';
import { 
  Activity, 
  Pause, 
  Play, 
  Maximize2, 
  Minimize2, 
  Eye, 
  EyeOff, 
  Radio 
} from 'lucide-react';

interface OscilloscopePanelProps {
  samples: OscilloscopeSample[];
  simState: SimulationState;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

interface ChannelConfig {
  id: keyof Omit<OscilloscopeSample, 'time'>;
  name: string;
  color: string;
  voltageRange: [number, number]; // min, max
  unit: string;
  visible: boolean;
}

export const OscilloscopePanel: React.FC<OscilloscopePanelProps> = ({
  samples,
  simState,
  isExpanded,
  onToggleExpand,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isFrozen, setIsFrozen] = useState(false);
  const frozenSamplesRef = useRef<OscilloscopeSample[]>([]);

  // 6 Channel configurations
  const [channels, setChannels] = useState<ChannelConfig[]>([
    { id: 'micAudio', name: 'CH1: Mic Audio (AC)', color: '#06b6d4', voltageRange: [0, 9], unit: 'V', visible: true },
    { id: 'trigger555', name: 'CH2: 555 Pin 2 (TRIG)', color: '#f59e0b', voltageRange: [0, 9], unit: 'V', visible: true },
    { id: 'output555', name: 'CH3: 555 Pin 3 (OUT)', color: '#a855f7', voltageRange: [0, 9], unit: 'V', visible: true },
    { id: 'clock7474', name: 'CH4: 7474 Pin 3 (CLK)', color: '#8b5cf6', voltageRange: [0, 5], unit: 'V', visible: true },
    { id: 'qOutput', name: 'CH5: 7474 Pin 5 (Q / LED)', color: '#ef4444', voltageRange: [0, 5], unit: 'V', visible: true },
    { id: 'qBarOutput', name: 'CH6: 7474 Pin 6 (Q\' → D)', color: '#10b981', voltageRange: [0, 5], unit: 'V', visible: true },
  ]);

  const toggleChannel = (id: string) => {
    setChannels(prev => prev.map(ch => ch.id === id ? { ...ch, visible: !ch.visible } : ch));
  };

  const handleToggleFreeze = () => {
    if (!isFrozen) {
      frozenSamplesRef.current = [...samples];
    }
    setIsFrozen(!isFrozen);
  };

  // Render Oscilloscope Grid and Waveforms
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dataToDraw = isFrozen ? frozenSamplesRef.current : samples;
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Grid (8 vertical divisions, 6 horizontal divisions)
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const vDivs = 10;
    const hDivs = 6;

    for (let i = 0; i <= vDivs; i++) {
      const x = (width / vDivs) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let j = 0; j <= hDivs; j++) {
      const y = (height / hDivs) * j;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Center dotted reference line
    ctx.strokeStyle = '#334155';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    if (dataToDraw.length < 2) return;

    // 2. Draw active channel waveforms
    channels.forEach((ch, chIdx) => {
      if (!ch.visible) return;

      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const [minV, maxV] = ch.voltageRange;
      const vSpan = maxV - minV || 1;

      // In stacked or overlay mode: give each channel a slight baseline offset for clarity
      const channelBaseY = isExpanded 
        ? ((chIdx + 0.8) / (channels.length + 0.5)) * height 
        : height * 0.9;
      const channelScaleY = isExpanded ? (height / (channels.length + 1)) * 0.85 : height * 0.75;

      for (let i = 0; i < dataToDraw.length; i++) {
        const sample = dataToDraw[i];
        const val = sample[ch.id] as number;
        const normVal = Math.max(0, Math.min(1, (val - minV) / vSpan));

        const x = (i / (dataToDraw.length - 1)) * width;
        const y = channelBaseY - normVal * channelScaleY;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      ctx.stroke();

      // Current Value Badge
      const latestVal = dataToDraw[dataToDraw.length - 1][ch.id] as number;
      ctx.fillStyle = ch.color;
      ctx.font = '10px monospace';
      ctx.fillText(`${ch.name.split(':')[0]}: ${latestVal.toFixed(2)}${ch.unit}`, 10, 16 + chIdx * 14);
    });

    // 3. Trigger Line Indicator
    if (simState.timer555IsTiming) {
      ctx.fillStyle = 'rgba(168, 85, 247, 0.15)';
      ctx.fillRect(width - 80, 0, 80, height);
      ctx.fillStyle = '#a855f7';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('MONOSTABLE ACTIVE', width - 140, 20);
    }
  }, [samples, channels, isFrozen, isExpanded, simState]);

  return (
    <div
      id="oscilloscope-panel"
      className={`bg-[#11141d]/95 backdrop-blur-md border border-[#1f293d] rounded-lg overflow-hidden shadow-2xl flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-full h-80' : 'w-full h-64'
      }`}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d1017] border-b border-[#1f293d]">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Digital Oscilloscope (6-CH)
          </span>
          <span className={`px-1.5 py-0.2 rounded text-[9.5px] font-mono border ${
            simState.powerOn 
              ? (isFrozen ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50') 
              : 'bg-red-950/80 text-red-400 border-red-500/50'
          }`}>
            {simState.powerOn ? (isFrozen ? 'HOLD' : 'LIVE 60FPS') : 'OFF'}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleToggleFreeze}
            className={`px-2 py-0.5 rounded text-[10.5px] font-mono flex items-center gap-1 transition-colors border ${
              isFrozen ? 'bg-amber-950/90 border-amber-500/60 text-amber-200' : 'bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border-[#1f293d]'
            }`}
            title={isFrozen ? 'Resume live stream' : 'Freeze waveform for analysis'}
          >
            {isFrozen ? <Play className="w-3 h-3 text-amber-400" /> : <Pause className="w-3 h-3 text-slate-400" />}
            {isFrozen ? 'Resume' : 'Freeze'}
          </button>
          <button
            onClick={onToggleExpand}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-300 border border-[#1f293d] transition-colors"
            title={isExpanded ? 'Compact View' : 'Expanded View'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Screen Canvas */}
      <div className="relative flex-1 min-h-0 bg-[#07090e]">
        <canvas
          ref={canvasRef}
          width={640}
          height={isExpanded ? 240 : 170}
          className="w-full h-full block"
        />

        {/* Real-time trigger indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-1.5 bg-[#0d1017]/90 px-2 py-0.5 rounded border border-[#1f293d] text-[9.5px] font-mono text-slate-400 shadow-md">
          <Radio className="w-3 h-3 text-cyan-400" />
          <span>TRIG: BC547 &lt; 3.0V</span>
        </div>
      </div>

      {/* Channel Toggles Bar */}
      <div className="px-2 py-1.5 bg-[#0d1017] border-t border-[#1f293d] flex flex-wrap gap-1.5 items-center justify-between text-[10.5px] font-mono">
        <div className="flex flex-wrap gap-1">
          {channels.map((ch) => (
            <button
              key={ch.id}
              onClick={() => toggleChannel(ch.id)}
              className={`px-1.5 py-0.2 rounded border flex items-center gap-1 transition-all ${
                ch.visible
                  ? 'bg-[#161b26] text-slate-200 border-[#1f293d] shadow-sm'
                  : 'bg-[#0d1017] text-slate-600 border-transparent opacity-50'
              }`}
              style={{
                borderLeftColor: ch.visible ? ch.color : undefined,
                borderLeftWidth: ch.visible ? '3px' : undefined,
              }}
            >
              {ch.visible ? <Eye className="w-2.5 h-2.5 text-slate-400" /> : <EyeOff className="w-2.5 h-2.5 text-slate-600" />}
              <span style={{ color: ch.visible ? ch.color : undefined }}>{ch.name.split(':')[0]}</span>
            </button>
          ))}
        </div>

        <div className="text-[9.5px] text-slate-400 hidden sm:block">
          50ms/div | VCC: {simState.supplyVoltage.toFixed(1)}V
        </div>
      </div>
    </div>
  );
};
