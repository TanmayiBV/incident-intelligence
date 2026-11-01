// ============================================================
// TYPES
// ============================================================

export type ScenarioId = 'INC-1042' | 'INC-2057';

export interface TimelineEvent {
  ts: string;
  label: string;
  service?: string;
  role: 'CAUSE' | 'CONTEXT' | 'MISLEADING' | 'ONSET' | 'SYMPTOM' | 'RED_HERRING' | 'NOISE' | 'HUMAN_ACTION' | 'DOWNSTREAM' | 'DISCOVERY' | 'FIX' | 'RECOVERY' | 'CLOSE';
  detail?: string;
}

export interface LogEntry {
  ts: string;
  service: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  message: string;
  traceId?: string;
}

export interface MetricPoint { ts: string; value: number; }

export interface MetricSeries {
  name: string;
  service: string;
  unit: string;
  points: MetricPoint[];
}

export interface TraceSpan {
  service: string;
  startMs: number;
  durationMs: number;
  status?: 'OK' | 'ERROR' | 'TIMEOUT';
}

export interface Trace { traceId: string; ts: string; spans: TraceSpan[]; }

export interface ChangeEvent {
  ts: string;
  id: string;
  service: string;
  kind: 'deploy' | 'config' | 'scale';
  diff: Record<string, { from: string | number; to: string | number }>;
  author: string;
  description: string;
}

export interface TopologyNode {
  id: string;
  label: string;
  type: 'service' | 'cache' | 'database' | 'external' | 'worker';
}

export interface TopologyEdge { from: string; to: string; label?: string; }

export interface CausalSignal { name: string; weight: number; score: number; contribution: number; }

export interface RejectionRule { ruleId: string; reason: string; }

export interface Candidate {
  id: string;
  label: string;
  composite: number;
  verdict: 'PROBABLE_ROOT_CAUSE' | 'INSUFFICIENT' | 'REJECTED';
  signals: CausalSignal[];
  rejectionRules?: RejectionRule[];
  supportingEvidence: string[];
  contradictingEvidence?: string[];
}

export interface CounterfactualSymptom { symptom: string; stillOccurs: boolean; }

export interface CounterfactualResult {
  removedEventId: string;
  removedEventLabel: string;
  verdict: 'NECESSARY' | 'INSUFFICIENT';
  symptoms: CounterfactualSymptom[];
  summary: string;
  caveat: string;
}

export interface EvidenceItem {
  id: string;
  claim: string;
  sourceType: 'log' | 'metric' | 'trace' | 'change';
  sourceRef: string;
  role: 'supporting' | 'contradicting' | 'misleading' | 'missing';
}

export interface NextAction { action: string; rationale: string; verifySignal: string; }

export interface InvestigationStage {
  id: number;
  name: string;
  label: string;
  description: string;
  inputCount?: number;
  outputCount?: number;
  detail: string;
}

export interface ScenarioData {
  id: ScenarioId;
  title: string;
  subtitle: string;
  domain: string;
  incidentWindow: string;
  servicesAffected: string[];
  peakErrorRate: string;
  mttr: string;
  rootCauseLabel: string;
  rootCauseConfidence: number;
  timeline: TimelineEvent[];
  logs: LogEntry[];
  metrics: MetricSeries[];
  traces: Trace[];
  changes: ChangeEvent[];
  topology: { nodes: TopologyNode[]; edges: TopologyEdge[] };
  candidates: Candidate[];
  evidenceLedger: EvidenceItem[];
  nextActions: NextAction[];
  counterfactual: CounterfactualResult;
  investigationStages: InvestigationStage[];
  causalChain: string[];
}
