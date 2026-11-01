import type { TimelineEvent } from '../../data';
import { AlertTriangle, CheckCircle, XCircle, Eye, Wrench, ArrowDown, Clock, Zap, Search, Info } from 'lucide-react';
import type { ReactNode } from 'react';

const ROLE_CONFIG: Record<TimelineEvent['role'], { color: string; bg: string; border: string; icon: ReactNode; label: string }> = {
  CAUSE: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-400', icon: <Zap size={14} />, label: 'ROOT CAUSE' },
  ONSET: { color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300', icon: <AlertTriangle size={14} />, label: 'ONSET' },
  SYMPTOM: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-300', icon: <AlertTriangle size={14} />, label: 'SYMPTOM' },
  RED_HERRING: { color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-400', icon: <Eye size={14} />, label: 'RED HERRING' },
  MISLEADING: { color: 'text-violet-600', bg: 'bg-violet-50', border: 'border-violet-300', icon: <Eye size={14} />, label: 'MISLEADING' },
  NOISE: { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-300', icon: <Info size={14} />, label: 'NOISE' },
  CONTEXT: { color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Info size={14} />, label: 'CONTEXT' },
  HUMAN_ACTION: { color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-300', icon: <Wrench size={14} />, label: 'ACTION' },
  DOWNSTREAM: { color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <ArrowDown size={14} />, label: 'DOWNSTREAM' },
  DISCOVERY: { color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-300', icon: <Search size={14} />, label: 'DISCOVERY' },
  FIX: { color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-400', icon: <CheckCircle size={14} />, label: 'FIX' },
  RECOVERY: { color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300', icon: <CheckCircle size={14} />, label: 'RECOVERY' },
  CLOSE: { color: 'text-green-500', bg: 'bg-green-50', border: 'border-green-200', icon: <XCircle size={14} />, label: 'CLOSED' },
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
}

export function IncidentTimeline({ events }: { events: TimelineEvent[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Clock size={16} className="text-gray-500" />
        <h3 className="font-bold text-sm text-gray-800">Incident Timeline</h3>
        <span className="text-xs text-gray-400 ml-auto">{events.length} events</span>
      </div>
      <div className="max-h-[600px] overflow-y-auto p-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200" />

          {events.map((evt, i) => {
            const cfg = ROLE_CONFIG[evt.role];
            return (
              <div key={i} className="relative flex items-start gap-3 mb-4 last:mb-0">
                {/* Timestamp */}
                <div className="w-[60px] text-right shrink-0">
                  <span className="text-xs font-mono text-gray-500">{formatTime(evt.ts)}</span>
                </div>

                {/* Dot */}
                <div className={`relative z-10 w-3 h-3 rounded-full mt-1.5 shrink-0 border-2 ${cfg.border} ${cfg.bg}`} />

                {/* Card */}
                <div className={`flex-1 rounded-lg border ${cfg.border} ${cfg.bg} px-3 py-2`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`${cfg.color}`}>{cfg.icon}</span>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${cfg.color}`}>{cfg.label}</span>
                    {evt.service && (
                      <span className="text-[10px] bg-white/80 border border-gray-200 rounded px-1.5 py-0.5 font-mono text-gray-600">{evt.service}</span>
                    )}
                  </div>
                  <p className={`text-sm font-medium ${cfg.color}`}>{evt.label}</p>
                  {evt.detail && <p className="text-xs text-gray-600 mt-0.5">{evt.detail}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
