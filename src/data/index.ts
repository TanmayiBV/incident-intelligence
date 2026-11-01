export type {
  ScenarioId, TimelineEvent, LogEntry, MetricPoint, MetricSeries,
  TraceSpan, Trace, ChangeEvent, TopologyNode, TopologyEdge,
  CausalSignal, RejectionRule, Candidate, CounterfactualSymptom,
  CounterfactualResult, EvidenceItem, NextAction, InvestigationStage,
  ScenarioData,
} from './scenarios';

export { INC_1042 } from './inc1042';
export { INC_2057 } from './inc2057';

import type { ScenarioId, ScenarioData } from './scenarios';
import { INC_1042 } from './inc1042';
import { INC_2057 } from './inc2057';

export const SCENARIO_DATA: Record<ScenarioId, ScenarioData> = {
  'INC-1042': INC_1042,
  'INC-2057': INC_2057,
};
