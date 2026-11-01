import { useState } from 'react';
import type { ScenarioData } from '../../data';
import { IncidentTimeline } from './IncidentTimeline';
import { LogViewer } from './LogViewer';
import { MetricCharts } from './MetricCharts';
import { TraceWaterfall } from './TraceWaterfall';
import { ChangesFeed } from './ChangesFeed';
import { FileText, BarChart3, GitBranch, Rocket } from 'lucide-react';

type SubTab = 'logs' | 'metrics' | 'traces' | 'changes';

const SUB_TABS: { id: SubTab; label: string; icon: typeof FileText }[] = [
  { id: 'logs', label: 'Logs', icon: FileText },
  { id: 'metrics', label: 'Metrics', icon: BarChart3 },
  { id: 'traces', label: 'Traces', icon: GitBranch },
  { id: 'changes', label: 'Changes', icon: Rocket },
];

export function RawEvidenceTab({ scenario }: { scenario: ScenarioData }) {
  const [subTab, setSubTab] = useState<SubTab>('logs');

  return (
    <div className="space-y-6">
      {/* Incident Timeline — always visible */}
      <IncidentTimeline events={scenario.timeline} />

      {/* Sub-tab selector */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                isActive
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <Icon size={15} />
              {tab.label}
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-500'}`}>
                {tab.id === 'logs' && scenario.logs.length}
                {tab.id === 'metrics' && scenario.metrics.length}
                {tab.id === 'traces' && scenario.traces.length}
                {tab.id === 'changes' && scenario.changes.length}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-tab content */}
      {subTab === 'logs' && <LogViewer logs={scenario.logs} />}
      {subTab === 'metrics' && <MetricCharts metrics={scenario.metrics} changes={scenario.changes} scenarioId={scenario.id} />}
      {subTab === 'traces' && <TraceWaterfall traces={scenario.traces} />}
      {subTab === 'changes' && <ChangesFeed changes={scenario.changes} />}
    </div>
  );
}
