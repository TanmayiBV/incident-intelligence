import type { ChangeEvent } from '../../data';
import { Rocket, Settings, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';

const KIND_CONFIG: Record<string, { icon: ReactNode; color: string; bg: string }> = {
  deploy: { icon: <Rocket size={14} />, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  config: { icon: <Settings size={14} />, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  scale: { icon: <ArrowUpDown size={14} />, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function ChangesFeed({ changes }: { changes: ChangeEvent[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Rocket size={16} className="text-gray-500" />
        <h3 className="font-bold text-sm text-gray-800">Deployment / Change Events</h3>
        <span className="text-xs text-gray-400 ml-auto">{changes.length} events</span>
      </div>
      <div className="p-4 space-y-3">
        {changes.map((change) => {
          const cfg = KIND_CONFIG[change.kind] || KIND_CONFIG.deploy;
          return (
            <div key={change.id} className={`rounded-lg border ${cfg.bg} p-3`}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cfg.color}>{cfg.icon}</span>
                <span className="text-sm font-bold text-gray-800">{change.id}</span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-white/80 px-1.5 py-0.5 rounded">{change.kind}</span>
                <span className="text-xs text-gray-500 ml-auto font-mono">{formatTime(change.ts)}</span>
              </div>
              <p className="text-xs text-gray-700 mb-2">{change.description}</p>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono text-gray-500">service:</span>
                <span className="text-xs font-mono font-semibold text-gray-700">{change.service}</span>
                <span className="text-[10px] font-mono text-gray-500 ml-2">author:</span>
                <span className="text-xs font-mono text-gray-600">{change.author}</span>
              </div>
              {/* Diff */}
              <div className="mt-2 bg-white/80 rounded border border-gray-200 p-2">
                {Object.entries(change.diff).map(([key, val]) => (
                  <div key={key} className="font-mono text-xs">
                    <span className="text-gray-500">{key}: </span>
                    <span className="text-red-500 line-through">{String(val.from)}</span>
                    <span className="text-gray-400"> → </span>
                    <span className="text-green-600 font-bold">{String(val.to)}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
