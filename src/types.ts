export type { ScenarioId, ScenarioData } from './data/scenarios';
export type TabId = 'raw-evidence' | 'investigation' | 'diagnostics' | 'output' | 'what-if';

export interface Tab {
  id: TabId;
  label: string;
  icon: string;
  description: string;
}

export const TABS: Tab[] = [
  { id: 'raw-evidence', label: 'Raw Evidence', icon: 'FileInput', description: 'Logs, Metrics, Traces & Timeline' },
  { id: 'investigation', label: 'Investigation', icon: 'Search', description: 'Pipeline & Dependency Graphs' },
  { id: 'diagnostics', label: 'Diagnostics', icon: 'Stethoscope', description: 'Hypotheses & Scoring' },
  { id: 'output', label: 'Root Cause', icon: 'Target', description: 'RCA, Evidence & Actions' },
  { id: 'what-if', label: 'What If?', icon: 'FlaskConical', description: 'Counterfactual Test' },
];
