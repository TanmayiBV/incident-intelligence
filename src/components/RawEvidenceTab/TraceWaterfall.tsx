import type { Trace } from '../../data';
import { GitBranch } from 'lucide-react';

const STATUS_COLOR: Record<string, string> = {
  OK: 'bg-blue-500',
  ERROR: 'bg-red-500',
  TIMEOUT: 'bg-amber-500',
};

const STATUS_BG: Record<string, string> = {
  OK: 'bg-blue-50 border-blue-200',
  ERROR: 'bg-red-50 border-red-200',
  TIMEOUT: 'bg-amber-50 border-amber-200',
};

export function TraceWaterfall({ traces }: { traces: Trace[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <GitBranch size={16} className="text-gray-500" />
        <h3 className="font-bold text-sm text-gray-800">Distributed Traces</h3>
        <span className="text-xs text-gray-400 ml-auto">{traces.length} traces</span>
      </div>
      <div className="p-4 space-y-6">
        {traces.map((trace) => {
          const maxMs = Math.max(...trace.spans.map((s) => s.startMs + s.durationMs));
          const isHealthy = trace.spans.every((s) => s.status === 'OK');

          return (
            <div key={trace.traceId}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-mono font-bold text-gray-700">{trace.traceId}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isHealthy ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {isHealthy ? 'HEALTHY' : 'DEGRADED'}
                </span>
                <span className="text-[10px] text-gray-400">{new Date(trace.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}</span>
                <span className="text-[10px] text-gray-400 ml-auto">Total: {maxMs}ms</span>
              </div>
              <div className="space-y-1.5">
                {trace.spans.map((span, j) => {
                  const leftPct = (span.startMs / maxMs) * 100;
                  const widthPct = Math.max((span.durationMs / maxMs) * 100, 1);
                  const status = span.status || 'OK';

                  return (
                    <div key={j} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-gray-600 w-[130px] text-right truncate shrink-0">{span.service}</span>
                      <div className="flex-1 h-7 bg-gray-50 rounded relative border border-gray-100">
                        <div
                          className={`absolute top-0.5 bottom-0.5 rounded ${STATUS_COLOR[status]} opacity-80`}
                          style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '4px' }}
                        />
                        <span className="absolute top-1 text-[9px] font-mono text-gray-600" style={{ left: `${leftPct + widthPct + 1}%` }}>
                          {span.durationMs > 0 ? `${span.durationMs}ms` : status}
                        </span>
                      </div>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border font-bold shrink-0 w-[60px] text-center ${STATUS_BG[status]}`}>
                        {status}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
