import type { MetricSeries, ChangeEvent, ScenarioId } from '../../data';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { BarChart3, AlertTriangle, Eye } from 'lucide-react';

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

const COLORS = ['#2563EB', '#DC2626', '#D97706', '#7C3AED', '#059669'];

interface MetricScore {
  anomalyMag: number;       // how dramatic it looks (0-100)
  causalScore: number;      // actual causal relevance after diagnostics (0-100)
  tag: 'ROOT_SIGNAL' | 'CORRELATED' | 'RED_HERRING' | 'NOISE';
  delta: string;
}

const METRIC_SCORES_1042: Record<string, MetricScore> = {
  'CBS Connector Pool Utilization':  { anomalyMag: 88, causalScore: 96, tag: 'ROOT_SIGNAL', delta: '24% → 100%' },
  'CBS Connector p99 Latency':      { anomalyMag: 92, causalScore: 92, tag: 'ROOT_SIGNAL', delta: '160ms → 6,200ms' },
  'UPI Gateway Failure Rate':       { anomalyMag: 85, causalScore: 78, tag: 'CORRELATED', delta: '1.1% → 22%' },
  'Pending Transactions':           { anomalyMag: 80, causalScore: 69, tag: 'CORRELATED', delta: '12 → 4,800' },
  'Redis VPA Cache Memory':         { anomalyMag: 96, causalScore: 12, tag: 'RED_HERRING', delta: '89% → 94%' },
};

const METRIC_SCORES_2057: Record<string, MetricScore> = {
  'Pricing Service p99 Latency':    { anomalyMag: 90, causalScore: 95, tag: 'ROOT_SIGNAL', delta: '160ms → 2,400ms' },
  'Place-Order Error Rate':         { anomalyMag: 87, causalScore: 80, tag: 'CORRELATED', delta: '0.8% → 19%' },
  'Cart-to-Order Conversion':       { anomalyMag: 78, causalScore: 72, tag: 'CORRELATED', delta: '68% → 32%' },
  'Dispatch Order Volume':          { anomalyMag: 65, causalScore: 55, tag: 'CORRELATED', delta: '178 → 82 ord/min' },
  'Redis Menu Cache Memory':        { anomalyMag: 94, causalScore: 11, tag: 'RED_HERRING', delta: '86% → 91%' },
};

const TAG_STYLE = {
  ROOT_SIGNAL: { label: 'Root Signal', bg: 'bg-red-100 text-red-700 border-red-200' },
  CORRELATED:  { label: 'Correlated', bg: 'bg-blue-100 text-blue-700 border-blue-200' },
  RED_HERRING: { label: 'Red Herring', bg: 'bg-violet-100 text-violet-700 border-violet-200' },
  NOISE:       { label: 'Noise', bg: 'bg-gray-100 text-gray-500 border-gray-200' },
};

export function MetricCharts({ metrics, changes, scenarioId }: { metrics: MetricSeries[]; changes: ChangeEvent[]; scenarioId: ScenarioId }) {
  const deployTs = changes.length > 0 ? changes[0].ts : null;
  const scores = scenarioId === 'INC-1042' ? METRIC_SCORES_1042 : METRIC_SCORES_2057;

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <BarChart3 size={16} className="text-gray-500" />
        <h3 className="font-bold text-sm text-gray-800">Metric Series</h3>
        <span className="text-xs text-gray-400 ml-auto">{metrics.length} series</span>
      </div>

      {/* Anomaly magnitude summary bar */}
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Anomaly Magnitudes vs Causal Relevance</span>
          <span className="text-[10px] text-gray-400 ml-auto">Higher drama ≠ higher cause</span>
        </div>
        <div className="space-y-1.5">
          {metrics.map((series) => {
            const sc = scores[series.name];
            if (!sc) return null;
            const tag = TAG_STYLE[sc.tag];
            const isHerring = sc.tag === 'RED_HERRING';
            return (
              <div key={series.name} className={`flex items-center gap-2 text-xs rounded-lg px-2.5 py-1.5 ${isHerring ? 'bg-violet-50 border border-violet-200' : 'bg-white border border-gray-100'}`}>
                <span className={`w-[170px] truncate font-medium ${isHerring ? 'text-violet-700' : 'text-gray-700'}`}>{series.name}</span>
                {/* Anomaly bar */}
                <div className="flex items-center gap-1 w-[140px]">
                  <span className="text-[9px] text-gray-400 w-[45px]">Drama</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isHerring ? 'bg-violet-400' : 'bg-amber-400'}`} style={{ width: `${sc.anomalyMag}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 w-[28px] text-right">{sc.anomalyMag}%</span>
                </div>
                {/* Causal bar */}
                <div className="flex items-center gap-1 w-[140px]">
                  <span className="text-[9px] text-gray-400 w-[45px]">Causal</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${isHerring ? 'bg-violet-300' : 'bg-green-500'}`} style={{ width: `${sc.causalScore}%` }} />
                  </div>
                  <span className={`text-[10px] font-bold w-[28px] text-right ${isHerring ? 'text-violet-600' : 'text-green-700'}`}>{sc.causalScore}%</span>
                </div>
                <span className="text-[10px] font-mono text-gray-400 w-[110px] text-right">{sc.delta}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border shrink-0 ${tag.bg}`}>{tag.label}</span>
                {isHerring && <Eye size={12} className="text-violet-400 shrink-0" />}
              </div>
            );
          })}
        </div>
        <p className="text-[10px] text-gray-400 mt-2 italic">
          ⚠ Redis cache has the highest drama (alert visibility) but the lowest causal relevance — classic red herring pattern.
        </p>
      </div>

      {/* Charts */}
      <div className="p-4 space-y-6">
        {metrics.map((series, idx) => {
          const data = series.points.map((p) => ({
            time: formatTime(p.ts),
            value: p.value,
          }));
          const color = COLORS[idx % COLORS.length];
          const deployTimeLabel = deployTs ? formatTime(deployTs) : null;
          const sc = scores[series.name];
          const isHerring = sc?.tag === 'RED_HERRING';

          return (
            <div key={series.name} className={isHerring ? 'rounded-lg border border-violet-200 bg-violet-50/30 p-3' : ''}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isHerring ? 'text-violet-700' : 'text-gray-800'}`}>{series.name}</span>
                  <span className="text-xs text-gray-400 font-mono">{series.service}</span>
                  {sc && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${TAG_STYLE[sc.tag].bg}`}>
                      {TAG_STYLE[sc.tag].label}
                    </span>
                  )}
                  {isHerring && <span className="text-[9px] text-violet-500 italic">High drama, low cause</span>}
                </div>
                <span className="text-xs font-mono text-gray-400">{series.unit}</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} width={50} />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                    formatter={(value: unknown) => [`${value} ${series.unit}`, series.name]}
                  />
                  {deployTimeLabel && (
                    <ReferenceLine x={deployTimeLabel} stroke="#DC2626" strokeDasharray="5 5" strokeWidth={2} label={{ value: 'DEPLOY', position: 'top', fontSize: 9, fill: '#DC2626', fontWeight: 'bold' }} />
                  )}
                  <Line type="monotone" dataKey="value" stroke={isHerring ? '#8B5CF6' : color} strokeWidth={2} dot={{ r: 3, fill: isHerring ? '#8B5CF6' : color }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          );
        })}
      </div>
    </div>
  );
}
