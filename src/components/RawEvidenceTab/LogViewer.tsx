import type { LogEntry } from '../../data';
import { Terminal } from 'lucide-react';

const LEVEL_STYLE: Record<LogEntry['level'], string> = {
  INFO: 'text-blue-600 bg-blue-50',
  WARN: 'text-amber-700 bg-amber-50',
  ERROR: 'text-red-600 bg-red-50',
  CRITICAL: 'text-red-800 bg-red-100 font-bold',
};

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hour12: false });
}

export function LogViewer({ logs }: { logs: LogEntry[] }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <Terminal size={16} className="text-gray-500" />
        <h3 className="font-bold text-sm text-gray-800">Application Logs</h3>
        <span className="text-xs text-gray-400 ml-auto">{logs.length} entries</span>
      </div>
      <div className="max-h-[500px] overflow-y-auto">
        <table className="w-full text-xs font-mono">
          <thead className="sticky top-0 bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-3 py-2 text-gray-500 font-semibold w-[120px]">TIME</th>
              <th className="text-left px-3 py-2 text-gray-500 font-semibold w-[60px]">LEVEL</th>
              <th className="text-left px-3 py-2 text-gray-500 font-semibold w-[140px]">SERVICE</th>
              <th className="text-left px-3 py-2 text-gray-500 font-semibold">MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log, i) => (
              <tr key={i} className={`border-b border-gray-50 hover:bg-gray-50 ${log.level === 'CRITICAL' ? 'bg-red-50/50' : ''}`}>
                <td className="px-3 py-1.5 text-gray-500 whitespace-nowrap">{formatTime(log.ts)}</td>
                <td className="px-3 py-1.5">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${LEVEL_STYLE[log.level]}`}>
                    {log.level}
                  </span>
                </td>
                <td className="px-3 py-1.5 text-gray-700 whitespace-nowrap">{log.service}</td>
                <td className="px-3 py-1.5 text-gray-800">
                  {log.message}
                  {log.traceId && <span className="ml-2 text-blue-500 text-[10px]">[{log.traceId}]</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
