import type { ScenarioData } from '../../data';
import { AlertTriangle, Check, X, Eye, ArrowRight, Play } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

const VERDICT_CFG = {
  PROBABLE_ROOT_CAUSE: { label: 'STRONGEST', badgeBg: 'bg-green-100 text-green-800 border-green-300', bar: 'bg-blue-500', ring: 'border-blue-400' },
  INSUFFICIENT: { label: 'INSUFFICIENT', badgeBg: 'bg-amber-100 text-amber-800 border-amber-300', bar: 'bg-amber-400', ring: 'border-amber-300' },
  REJECTED: { label: 'REJECTED', badgeBg: 'bg-red-100 text-red-700 border-red-300', bar: 'bg-red-400', ring: 'border-red-300' },
};

// Animation phases per hypothesis:
// 0: hidden, 1-5: signal bars animating one by one, 6: evidence popping, 7: score revealed
const TOTAL_PHASES = 8;

export function DiagnosticsTab({ scenario }: { scenario: ScenarioData }) {
  const redHerring = scenario.candidates.find((c) => c.verdict === 'REJECTED' && c.rejectionRules && c.rejectionRules.length >= 2);
  const rootCause = scenario.candidates.find((c) => c.verdict === 'PROBABLE_ROOT_CAUSE');
  const evidenceMap = new Map(scenario.evidenceLedger.map((e) => [e.id, e]));

  // Animation state
  const [hasRun, setHasRun] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  // Per hypothesis: which phase (0=hidden, 1-5=bars, 6=evidence, 7=score)
  const [phases, setPhases] = useState<number[]>(scenario.candidates.map(() => 0));
  const timerRef = useRef<number | null>(null);
  const isRunningRef = useRef(false);

  // Reset on scenario change
  useEffect(() => {
    setHasRun(false);
    setIsRunning(false);
    isRunningRef.current = false;
    setPhases(scenario.candidates.map(() => 0));
    if (timerRef.current) clearTimeout(timerRef.current);
  }, [scenario.id]);

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, []);

  function runAnimation() {
    if (isRunningRef.current) return;
    isRunningRef.current = true;
    setIsRunning(true);
    setHasRun(true);

    const totalCandidates = scenario.candidates.length;
    // Reset all phases
    const allPhases = scenario.candidates.map(() => 0);
    setPhases([...allPhases]);

    let cIdx = 0;
    let phase = 0;

    function tick() {
      if (!isRunningRef.current) return;
      phase++;
      if (phase > TOTAL_PHASES - 1) {
        // Move to next candidate
        cIdx++;
        phase = 0;
        if (cIdx >= totalCandidates) {
          isRunningRef.current = false;
          setIsRunning(false);
          return;
        }
      }
      allPhases[cIdx] = phase;
      setPhases([...allPhases]);

      // Timing: bars are faster, evidence + score slower
      const delay = phase <= 5 ? 350 : phase === 6 ? 600 : 500;
      timerRef.current = window.setTimeout(tick, delay);
    }

    timerRef.current = window.setTimeout(tick, 400);
  }

  return (
    <div className="space-y-5">
      {/* Header + Run button */}
      <div className="flex items-center gap-3">
        <button
          onClick={runAnimation}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
            isRunning
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow'
          }`}
        >
          {isRunning ? (
            <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Scoring...</>
          ) : (
            <><Play size={14} /> {hasRun ? 'Re-run Scoring' : 'Run Scoring Engine'}</>
          )}
        </button>
        <h3 className="text-lg font-black text-gray-900">Hypothesis Arena</h3>
        {redHerring && (
          <span className="text-[10px] font-bold px-2.5 py-1 rounded bg-red-100 text-red-700 border border-red-300 uppercase tracking-wider">Red Herring Present</span>
        )}
      </div>

      {/* Scoring formula — different per scenario */}
      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Scoring Method:</span>
          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-2 py-0.5">
            {scenario.id === 'INC-1042' ? 'Weighted Bayesian Inference' : 'Gradient Descent Convergence'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {scenario.id === 'INC-1042' ? (
            <>
              {['Temporal Prior (0.25)', 'Topological Likelihood (0.25)', 'Onset Posterior (0.20)', 'Blast Radius (0.15)', 'Change Evidence (0.15)'].map((s, i) => (
                <span key={i} className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-0.5 font-bold">{s}</span>
              ))}
            </>
          ) : (
            <>
              {['Temporal Gradient (0.30)', 'Topology Loss (0.20)', 'Onset Ordering (0.20)', 'Coverage Penalty (0.18)', 'Change Signal (0.12)'].map((s, i) => (
                <span key={i} className="text-[10px] bg-violet-50 text-violet-700 border border-violet-200 rounded px-2 py-0.5 font-bold">{s}</span>
              ))}
            </>
          )}
        </div>
        <div className="mt-1.5 flex gap-4 text-[10px]">
          <span className="text-green-600 font-bold">≥0.60 Root Cause</span>
          <span className="text-amber-600 font-bold">0.35–0.60 Insufficient</span>
          <span className="text-red-500 font-bold">&lt;0.35 Rejected</span>
          <span className="text-gray-400 ml-auto font-mono">{scenario.id === 'INC-1042' ? 'lr=0.03 · epochs=200 · λ=0.01' : 'lr=0.05 · epochs=350 · λ=0.02 · momentum=0.9'}</span>
        </div>
      </div>

      {/* Candidate cards */}
      {scenario.candidates.map((c, idx) => {
        const cfg = VERDICT_CFG[c.verdict];
        const supporting = c.supportingEvidence.map((id) => evidenceMap.get(id)).filter(Boolean);
        const contradicting = (c.contradictingEvidence || []).map((id) => evidenceMap.get(id)).filter(Boolean);
        const ph = hasRun ? phases[idx] : TOTAL_PHASES - 1; // If never run, show everything

        return (
          <div key={c.id} className={`bg-white rounded-lg border-2 ${cfg.ring} shadow-sm overflow-hidden transition-all ${ph === 0 && hasRun ? 'opacity-40' : 'opacity-100'}`}>
            {/* Header row */}
            <div className="px-5 py-3 flex items-start gap-3">
              <span className="text-sm font-black text-gray-400 mt-0.5">H{idx + 1}</span>
              <div className="flex-1">
                <h4 className="text-base font-bold text-gray-900">{c.label}</h4>
              </div>
              {/* Badge + score: only show after phase 7 */}
              {ph >= 7 && (
                <>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${cfg.badgeBg} transition-all animate-fadeIn`}>{cfg.label}</span>
                  <span className="text-3xl font-black text-gray-800 ml-2 animate-fadeIn">{Math.round(c.composite * 100)}%</span>
                </>
              )}
              {ph > 0 && ph < 7 && hasRun && (
                <span className="text-xs text-gray-400 animate-pulse">computing...</span>
              )}
            </div>

            {/* Score bar — only after phase 7 */}
            {ph >= 7 && (
              <div className="px-5 pb-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${cfg.bar} transition-all duration-700`} style={{ width: `${c.composite * 100}%` }} />
                </div>
              </div>
            )}

            {/* Signal breakdown — bars animate one by one at phases 1-5 */}
            <div className="px-5 py-2">
              <div className="grid grid-cols-5 gap-2">
                {c.signals.map((s, si) => {
                  const barVisible = ph >= si + 1;
                  return (
                    <div key={s.name} className={`text-center transition-opacity duration-300 ${barVisible ? 'opacity-100' : 'opacity-20'}`}>
                      <div className="text-[10px] text-gray-500 truncate">{s.name.split(' ')[0]}</div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-0.5">
                        <div
                          className={`h-full rounded-full ${cfg.bar} transition-all`}
                          style={{
                            width: barVisible ? `${s.score * 100}%` : '0%',
                            transitionDuration: '600ms',
                          }}
                        />
                      </div>
                      <div className={`text-[10px] font-bold text-gray-600 mt-0.5 transition-opacity ${barVisible ? 'opacity-100' : 'opacity-0'}`}>
                        {s.score.toFixed(2)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Evidence lines — pop in at phase 6 */}
            {ph >= 6 && (
              <div className="px-5 pb-3 space-y-1">
                {supporting.map((e) => e && (
                  <div key={e.id} className="flex items-start gap-1.5 text-xs animate-fadeIn">
                    <Check size={13} className="text-green-500 mt-0.5 shrink-0" />
                    <span className="text-gray-700">{e.claim}</span>
                  </div>
                ))}
                {contradicting.map((e) => e && (
                  <div key={e.id} className="flex items-start gap-1.5 text-xs animate-fadeIn">
                    <X size={13} className="text-red-500 mt-0.5 shrink-0" />
                    <span className="text-gray-600">{e.claim}</span>
                  </div>
                ))}
                {c.rejectionRules && c.rejectionRules.map((r) => (
                  <div key={r.ruleId} className="flex items-start gap-1.5 text-xs animate-fadeIn">
                    <X size={13} className="text-red-400 mt-0.5 shrink-0" />
                    <span className="text-gray-500"><span className="font-mono font-bold text-red-500">{r.ruleId}</span> — {r.reason}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* RED HERRING DETECTED callout */}
      {redHerring && (!hasRun || phases[phases.length - 1] >= 7) && (
        <div className="rounded-lg border-2 border-violet-300 bg-violet-50 overflow-hidden">
          <div className="px-5 py-3 border-b border-violet-200 flex items-center gap-2">
            <AlertTriangle size={18} className="text-violet-600" />
            <h3 className="font-black text-sm text-violet-800 uppercase tracking-wider">Red Herring Detected</h3>
          </div>
          <div className="px-5 py-3 space-y-2">
            <div className="text-sm">
              <span className="font-bold text-violet-700">Signal:</span>
              <span className="text-gray-700 ml-1">{redHerring.label}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-violet-700">DRAMA:</span>
              <span className="text-gray-700 ml-1">Loud alert with high visibility — draws attention away from the real cause</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-violet-700">TRUTH:</span>
              <span className="text-gray-700 ml-1">{redHerring.rejectionRules?.[0]?.reason || 'Fails causal tests'}</span>
            </div>
            <div className="text-sm">
              <span className="font-bold text-violet-700">CLASSIFICATION:</span>
              <span className="ml-1 font-bold text-red-600 uppercase">Downstream Effect · Not Root Cause</span>
            </div>
            {rootCause && (
              <div className="flex items-center gap-2 flex-wrap mt-3 pt-3 border-t border-violet-200">
                <div className="rounded border-2 border-green-300 bg-green-50 px-3 py-1.5 text-xs font-bold text-green-800">Root Cause · {rootCause.id}</div>
                <div className="flex items-center gap-1 text-xs text-gray-500"><ArrowRight size={12} /> <span className="font-mono">precedes onset</span> <ArrowRight size={12} /></div>
                <div className="rounded border-2 border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Red Herring · {redHerring.id}</div>
                <span className="text-[10px] text-violet-600 font-medium ml-2">You cannot cause something that starts before you.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timeline */}
      {(!hasRun || phases[phases.length - 1] >= 7) && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
            <Eye size={14} className="text-gray-500" />
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">Incident Timeline — Red Herring Marked</span>
            <span className="text-[10px] text-gray-400 ml-auto">{scenario.timeline.length} rows</span>
          </div>
          <div className="divide-y divide-gray-50 max-h-[300px] overflow-y-auto">
            {scenario.timeline.map((evt, i) => {
              const isHerring = evt.role === 'RED_HERRING' || evt.role === 'MISLEADING';
              const isCause = evt.role === 'CAUSE';
              const isOnset = evt.role === 'ONSET';
              return (
                <div key={i} className={`flex items-center gap-3 px-4 py-2 text-xs ${isHerring ? 'bg-red-50/60' : ''}`}>
                  <span className="font-mono text-gray-400 w-[65px] shrink-0 text-right">
                    {new Date(evt.ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isCause ? 'bg-red-500' : isOnset ? 'bg-orange-500' : isHerring ? 'bg-violet-500' : 'bg-gray-300'}`} />
                  <span className={`flex-1 ${isHerring ? 'text-gray-500' : 'text-gray-800'} ${isCause ? 'font-bold' : ''}`}>
                    {evt.label}
                    {evt.service && <span className="ml-1 text-gray-400 font-mono text-[10px]">{evt.service}</span>}
                  </span>
                  {isCause && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-yellow-300 bg-yellow-50 text-yellow-700">CHANGE</span>}
                  {isOnset && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-orange-300 bg-orange-50 text-orange-700">ANOMALY · FIRST</span>}
                  {isHerring && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-300 bg-red-50 text-red-600">RED HERRING</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
