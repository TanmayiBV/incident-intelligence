import type { ScenarioData } from '../../data';
import { DependencyGraph } from './DependencyGraph';
import { CausalChain } from './CausalChain';
import { StageCards } from './StageCards';

export function InvestigationTab({ scenario }: { scenario: ScenarioData }) {
  return (
    <div className="space-y-6">
      <CausalChain chain={scenario.causalChain} />
      <DependencyGraph nodes={scenario.topology.nodes} edges={scenario.topology.edges} scenarioId={scenario.id} />
      <StageCards stages={scenario.investigationStages} scenario={scenario} />
    </div>
  );
}
