import type { ScenarioData } from '../../data';
import { CheckCircle, Lightbulb, ArrowDown, Eye, FlaskConical, Download } from 'lucide-react';

function exportReport(scenario: ScenarioData) {
  const root = scenario.candidates.find((c) => c.verdict === 'PROBABLE_ROOT_CAUSE');
  const supporting = scenario.evidenceLedger.filter((e) => e.role === 'supporting');
  const misleading = scenario.evidenceLedger.filter((e) => e.role === 'misleading' || e.role === 'contradicting');
  const report = `# Incident RCA Report — ${scenario.id}
## ${scenario.title}
**Generated**: ${new Date().toISOString()}
**Domain**: ${scenario.domain}
**Incident Window**: ${scenario.incidentWindow}
**Services Affected**: ${scenario.servicesAffected.join(', ')}
**Peak Error Rate**: ${scenario.peakErrorRate}
**MTTR**: ${scenario.mttr}

---

## Root Cause
**${scenario.rootCauseLabel}**
Confidence: ${(scenario.rootCauseConfidence * 100).toFixed(0)}% (evidence-weighted)

### Causal Chain
${scenario.causalChain.map((s, i) => `${i + 1}. ${s}`).join('\n')}

---

## Supporting Evidence
${supporting.map((e) => `- **${e.id}** [${e.sourceType}]: ${e.claim} _(${e.sourceRef})_`).join('\n')}

## Misleading Signals
${misleading.map((e) => `- **${e.id}** [${e.role}]: ${e.claim}`).join('\n')}

---

## Scoring Breakdown (${root?.id})
${root?.signals.map((s) => `| ${s.name} | weight=${s.weight} | score=${s.score.toFixed(2)} | contribution=${s.contribution.toFixed(3)} |`).join('\n')}
**Composite**: ${root?.composite.toFixed(2)}

## Counterfactual Test
Remove: ${scenario.counterfactual.removedEventLabel}
Verdict: **${scenario.counterfactual.verdict}**
${scenario.counterfactual.symptoms.map((s) => `- ${s.symptom}: ${s.stillOccurs ? '⚠ still occurs' : '✓ resolved'}`).join('\n')}

${scenario.counterfactual.summary}

---

## Recommended Actions
${scenario.nextActions.map((a, i) => `${i + 1}. **${a.action}** — ${a.rationale}\n   Verify: ${a.verifySignal}`).join('\n')}

---
_Pygenic Arc · Anvation 2026 · AI-03_
`;
  const blob = new Blob([report], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RCA_Report_${scenario.id}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

const SOURCE_BADGE: Record<string, string> = {
  log: 'bg-blue-100 text-blue-700',
  metric: 'bg-amber-100 text-amber-700',
  trace: 'bg-cyan-100 text-cyan-700',
  change: 'bg-green-100 text-green-700',
};

export function OutputTab({ scenario }: { scenario: ScenarioData }) {
  const supporting = scenario.evidenceLedger.filter((e) => e.role === 'supporting');
  const misleading = scenario.evidenceLedger.filter((e) => e.role === 'misleading' || e.role === 'contradicting');

  return (
    <div className="space-y-5">
      {/* Top row: Root Cause + Recommended Action */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Root cause — 3 cols */}
        <div className="md:col-span-3 rounded-lg border-2 border-red-300 bg-gradient-to-br from-red-50 to-white p-4 md:p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Most Probable Root Cause</span>
            <button
              onClick={() => exportReport(scenario)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
            >
              <Download size={13} /> Export RCA Report
            </button>
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-1">{scenario.rootCauseLabel}</h3>
          <p className="text-xs text-gray-500 mb-3">{scenario.subtitle} — identified during {scenario.incidentWindow}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black text-red-700">{Math.round(scenario.rootCauseConfidence * 100)}%</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Confidence<br/>Evidence-Weighted</span>
          </div>
        </div>

        {/* Recommended action — 2 cols */}
        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Recommended Next Action</div>
          {scenario.nextActions[0] && (
            <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 mb-3">
              <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">Action</div>
              <div className="text-sm font-bold text-gray-900">{scenario.nextActions[0].action}</div>
              <div className="text-xs text-gray-600 mt-1">
                Verification signal: <span className="font-mono text-blue-700">{scenario.nextActions[0].verifySignal}</span>
              </div>
            </div>
          )}
          <p className="text-[10px] text-gray-400 italic">
            {scenario.id === 'INC-1042'
              ? 'Tuning Redis is the tempting move — and it would not have fixed anything.'
              : 'Flushing the menu cache is the tempting move — and it would not have fixed anything.'}
          </p>
        </div>
      </div>

      {/* Middle row: Causal Chain + Evidence */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {/* Causal chain — 2 cols */}
        <div className="md:col-span-2 rounded-lg border border-gray-200 bg-white p-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Causal Chain</div>
          <div className="space-y-0">
            {scenario.causalChain.map((step, i) => (
              <div key={i}>
                <div className="flex items-start gap-2">
                  <span className={`mt-1 w-2.5 h-2.5 rounded-full shrink-0 ${i === 0 ? 'bg-red-500' : i === scenario.causalChain.length - 1 ? 'bg-amber-500' : 'bg-blue-400'}`} />
                  <div>
                    <div className={`text-sm ${i === 0 ? 'font-bold text-red-700' : 'font-medium text-gray-800'}`}>{step}</div>
                  </div>
                </div>
                {i < scenario.causalChain.length - 1 && (
                  <div className="ml-1 flex items-center gap-1 py-1">
                    <div className="w-px h-4 bg-gray-200 ml-[4px]" />
                    <ArrowDown size={10} className="text-gray-300 ml-1" />
                    <span className="text-[10px] text-gray-400 font-mono ml-1">propagates</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Supporting evidence — 3 cols */}
        <div className="md:col-span-3 rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <CheckCircle size={14} className="text-green-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              Supporting Evidence · {supporting.length} of {supporting.length} Symptoms Explained
            </span>
          </div>
          <div className="divide-y divide-gray-50">
            {supporting.map((e) => (
              <div key={e.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-xs">
                <span className={`font-mono font-bold px-2 py-0.5 rounded border text-[10px] ${SOURCE_BADGE[e.sourceType]}`}>
                  {e.id}-{e.sourceType}
                </span>
                <span className="text-gray-700 flex-1">{e.claim}</span>
              </div>
            ))}
          </div>

          {/* Misleading signal */}
          {misleading.length > 0 && (
            <>
              <div className="px-4 py-2 border-t border-gray-200 flex items-center gap-2 bg-violet-50/50">
                <Eye size={14} className="text-violet-500" />
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Misleading Signal</span>
              </div>
              {misleading.map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-2 bg-violet-50/30 border-t border-violet-100 text-xs">
                  <span className="font-mono font-bold px-2 py-0.5 rounded border border-violet-200 bg-violet-50 text-violet-700 text-[10px]">
                    {e.id}
                  </span>
                  <span className="text-gray-600">{e.claim}</span>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Counterfactual Check */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
          <FlaskConical size={14} className="text-cyan-600" />
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Counterfactual Check</span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ml-2 ${scenario.counterfactual.verdict === 'NECESSARY' ? 'bg-green-100 text-green-700 border border-green-300' : 'bg-amber-100 text-amber-700 border border-amber-300'}`}>
            {scenario.counterfactual.verdict}
          </span>
        </div>
        <div className="px-5 py-4 border-l-4 border-cyan-400 mx-4 my-3 bg-cyan-50/30 rounded-r">
          <p className="text-sm text-gray-700 italic leading-relaxed">
            "Remove {scenario.counterfactual.removedEventLabel} — {scenario.counterfactual.summary}"
          </p>
        </div>
      </div>

      {/* Remaining actions */}
      {scenario.nextActions.length > 1 && (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <Lightbulb size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Additional Actions</span>
          </div>
          <div className="divide-y divide-gray-100">
            {scenario.nextActions.slice(1).map((a, i) => (
              <div key={i} className="px-4 py-2.5 flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center shrink-0">{i + 2}</span>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-800">{a.action}</span>
                  <span className="text-xs text-gray-500 ml-2">{a.rationale}</span>
                </div>
                <span className="text-[10px] text-green-600 font-mono">✓ {a.verifySignal}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
