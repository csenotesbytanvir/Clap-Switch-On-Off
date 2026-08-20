import React, { useState } from 'react';
import { CircuitLogEvent } from '../types';
import { 
  Terminal, 
  Trash2, 
  Download, 
  Filter, 
  Maximize2, 
  Minimize2 
} from 'lucide-react';

interface EventLogPanelProps {
  logs: CircuitLogEvent[];
  onClearLogs: () => void;
}

export const EventLogPanel: React.FC<EventLogPanelProps> = ({
  logs,
  onClearLogs,
}) => {
  const [filterStage, setFilterStage] = useState<string>('ALL');
  const [isExpanded, setIsExpanded] = useState(false);

  const filteredLogs = filterStage === 'ALL'
    ? logs
    : logs.filter(l => l.stage === filterStage);

  const handleExportLogs = () => {
    const text = logs
      .map(l => `[${l.timestamp}] [${l.stage}] ${l.message} ${l.voltageData ? `(${l.voltageData})` : ''}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clap-switch-event-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="event-log-panel"
      className={`bg-[#11141d]/95 backdrop-blur-md border border-[#1f293d] rounded-lg overflow-hidden shadow-2xl flex flex-col font-mono text-xs text-slate-300 transition-all duration-300 ${
        isExpanded ? 'h-72' : 'h-40'
      }`}
    >
      {/* Header */}
      <div className="px-3 py-1.5 bg-[#0d1017] border-b border-[#1f293d] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-semibold text-slate-100 uppercase tracking-wider text-[10.5px]">
            Event Console & Net Log
          </span>
          <span className="text-[9.5px] text-slate-500">({filteredLogs.length})</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Stage Filter */}
          <div className="flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              className="bg-[#161b26] text-slate-300 text-[10px] px-1.5 py-0.5 rounded border border-[#1f293d] outline-none cursor-pointer font-mono"
            >
              <option value="ALL">All Stages</option>
              <option value="MIC">Microphone</option>
              <option value="TRANSISTOR">BC547</option>
              <option value="TIMER_555">555 Timer</option>
              <option value="FLIPFLOP_7474">7474 D-FF</option>
              <option value="OUTPUT">LED Output</option>
              <option value="POWER">Power</option>
            </select>
          </div>

          <button
            onClick={handleExportLogs}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d]"
            title="Download Log History"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={onClearLogs}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d]"
            title="Clear Console"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded bg-[#161b26] hover:bg-[#1f293d] text-slate-400 hover:text-white border border-[#1f293d]"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 bg-[#0a0b0e]/95 divide-y divide-[#161b26] font-mono text-[10.5px]">
        {filteredLogs.length === 0 ? (
          <div className="text-slate-600 text-center py-4 text-[10px]">No events logged for selected filter.</div>
        ) : (
          filteredLogs.map((log) => {
            let badgeClass = 'bg-[#161b26] text-slate-400 border border-[#1f293d]';
            if (log.level === 'trigger') badgeClass = 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/40';
            if (log.level === 'active') badgeClass = 'bg-amber-950/70 text-amber-300 border border-amber-500/40';
            if (log.level === 'success') badgeClass = 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/40 font-bold';
            if (log.level === 'warn') badgeClass = 'bg-red-950/70 text-red-300 border border-red-500/40';

            return (
              <div key={log.id} className="pt-1 first:pt-0 flex items-start gap-1.5">
                <span className="text-slate-500 text-[9.5px] whitespace-nowrap pt-0.5">{log.timestamp}</span>
                <span className={`px-1 py-0.2 rounded text-[9px] whitespace-nowrap ${badgeClass}`}>
                  {log.stage}
                </span>
                <span className="text-slate-300 flex-1 leading-snug">
                  {log.message}
                  {log.voltageData && (
                    <span className="ml-1 text-[9.5px] text-cyan-400 font-semibold">[{log.voltageData}]</span>
                  )}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
