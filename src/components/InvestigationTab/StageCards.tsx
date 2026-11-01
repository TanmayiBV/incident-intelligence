import { useState, useRef, useEffect, useCallback } from 'react';
import type { InvestigationStage, ScenarioData } from '../../data';
import { ChevronDown, ChevronRight, ArrowRight, CheckCircle2, Play, Terminal, Wifi } from 'lucide-react';

const STAGE_COLORS = [
  'border-blue-300 bg-blue-50', 'border-indigo-300 bg-indigo-50', 'border-violet-300 bg-violet-50',
  'border-amber-300 bg-amber-50', 'border-teal-300 bg-teal-50', 'border-cyan-300 bg-cyan-50',
  'border-orange-300 bg-orange-50', 'border-emerald-300 bg-emerald-50', 'border-red-300 bg-red-50',
  'border-green-400 bg-green-50',
];

interface LogLine { time: string; stage: string; text: string; }

function buildLocalLines(scenario: ScenarioData): LogLine[] {
  const lines: LogLine[] = [];
  let sec = 10;
  const t = () => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `10:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };
  lines.push({ time: t(), stage: 'INGEST', text: `INGEST started for ${scenario.id}` }); sec++;
  lines.push({ time: t(), stage: 'INGEST', text: `Loading ${scenario.logs.length} log entries...` }); sec++;
  lines.push({ time: t(), stage: 'INGEST', text: `Loading ${scenario.metrics.length} metric series (${scenario.metrics.reduce((a, m) => a + m.points.length, 0)} points)...` }); sec++;
  lines.push({ time: t(), stage: 'INGEST', text: `Loading ${scenario.traces.length} traces, ${scenario.changes.length} change events...` }); sec++;
  lines.push({ time: t(), stage: 'INGEST', text: `INGEST completed. ${scenario.investigationStages[0]?.outputCount ?? 0} raw events.` }); sec += 2;
  lines.push({ time: t(), stage: 'NORMALIZE', text: 'NORMALIZE started' }); sec++;
  lines.push({ time: t(), stage: 'NORMALIZE', text: 'Normalizing logs and metrics...' }); sec++;
  lines.push({ time: t(), stage: 'NORMALIZE', text: `NORMALIZE completed. ${scenario.investigationStages[1]?.outputCount ?? 0} canonical events.` }); sec += 2;
  lines.push({ time: t(), stage: 'BASELINE', text: 'BASELINE started' }); sec++;
  lines.push({ time: t(), stage: 'BASELINE', text: `BASELINE completed. Thresholds for ${scenario.servicesAffected.length} services.` }); sec += 2;
  lines.push({ time: t(), stage: 'DETECT', text: 'DETECT started' }); sec++;
  lines.push({ time: t(), stage: 'DETECT', text: `DETECT found ${scenario.investigationStages[3]?.outputCount ?? 0} anomalies across services` }); sec += 2;
  lines.push({ time: t(), stage: 'MAP', text: `MAP completed. ${scenario.topology.nodes.length} nodes, ${scenario.topology.edges.length} edges.` }); sec++;
  scenario.candidates.forEach((c) => { sec++; lines.push({ time: t(), stage: 'HYPOTHESIZE', text: `Generated H: ${c.label}` }); });
  scenario.candidates.forEach((c) => { sec++; lines.push({ time: t(), stage: 'TEST', text: `Score: ${c.id} = ${c.composite.toFixed(2)}` }); });
  sec++;
  scenario.candidates.filter((c) => c.verdict === 'REJECTED').forEach((c) => {
    lines.push({ time: t(), stage: 'RED_HERRING', text: `${c.id} classified as REJECTED` }); sec++;
  });
  lines.push({ time: t(), stage: 'COUNTERFACTUAL', text: `Removed ${scenario.counterfactual.removedEventId}: ${scenario.counterfactual.verdict}` }); sec++;
  const root = scenario.candidates.find((c) => c.verdict === 'PROBABLE_ROOT_CAUSE');
  if (root) { lines.push({ time: t(), stage: 'RCA', text: `Finalized: ${root.label} -> ${root.composite.toFixed(2)}` }); sec++; }
  lines.push({ time: t(), stage: 'RCA', text: `${scenario.nextActions.length} recommended actions generated.` }); sec += 2;
  lines.push({ time: t(), stage: 'DONE', text: `${scenario.title} resolved. MTTR: ${scenario.mttr}` });
  return lines;
}

export function StageCards({ stages, scenario }: { stages: InvestigationStage[]; scenario: ScenarioData }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [visibleLines, setVisibleLines] = useState<LogLine[]>([]);
  const [hasRun, setHasRun] = useState(false);
  const [runningFlag, setRunningFlag] = useState(false);
  const [apiConnected, setApiConnected] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(true);
  const timerRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const apiBase = isLocalhost ? 'http://localhost:8000' : '';

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      if (abortRef.current) { abortRef.current.abort(); }
    };
  }, []);

  // Reset when scenario changes
  useEffect(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    if (abortRef.current) { abortRef.current.abort(); }
    setVisibleLines([]);
    setHasRun(false);
    setRunningFlag(false);
  }, [scenario.id]);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [visibleLines.length]);

  // Check API availability
  useEffect(() => {
    fetch(`${apiBase}/api/scenarios`)
      .then((r) => { if (r.ok && mountedRef.current) setApiConnected(true); })
      .catch(() => { if (mountedRef.current) setApiConnected(false); });
  }, []);

  const runLocal = useCallback(() => {
    const lines = buildLocalLines(scenario);
    let idx = 0;

    function tick() {
      if (!mountedRef.current) return;
      if (idx < lines.length) {
        const line = lines[idx];
        idx++;
        setVisibleLines(prev => [...prev, line]);
        timerRef.current = window.setTimeout(tick, 150 + Math.random() * 200);
      } else {
        setRunningFlag(false);
        timerRef.current = null;
      }
    }
    timerRef.current = window.setTimeout(tick, 400);
  }, [scenario]);

  const runSSE = useCallback(async () => {
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const resp = await fetch(`${apiBase}/api/investigate/${scenario.id}`, {
        signal: controller.signal,
      });
      if (!resp.ok || !resp.body) throw new Error('API unavailable');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (!mountedRef.current) break;
        buffer += decoder.decode(value, { stream: true });

        const chunks = buffer.split('\n\n');
        buffer = chunks.pop() || '';

        for (const chunk of chunks) {
          const dataLine = chunk.trim().replace(/^data:\s*/, '');
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine);
            if (parsed.stage === 'DONE') continue;
            if (mountedRef.current) {
              setVisibleLines(prev => [...prev, {
                time: parsed.timestamp,
                stage: parsed.stage,
                text: parsed.message,
              }]);
            }
          } catch { /* skip */ }
        }
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      if (mountedRef.current) {
        // Fallback to local
        runLocal();
        return; // runLocal handles its own runningFlag
      }
    }
    if (mountedRef.current) setRunningFlag(false);
  }, [scenario, apiBase, runLocal]);

  function runSimulation() {
    if (runningFlag) return;
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    setRunningFlag(true);
    setHasRun(true);
    setVisibleLines([]);

    if (apiConnected) {
      runSSE();
    } else {
      runLocal();
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
        <CheckCircle2 size={16} className="text-green-500" />
        <h3 className="font-bold text-sm text-gray-800">Investigation Stages</h3>
        <span className="text-xs text-gray-400 ml-auto">Click stages to expand · Run to simulate</span>
      </div>

      {/* RUN button + Terminal */}
      <div className="px-4 py-3 border-b border-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={runSimulation}
            disabled={runningFlag}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all ${
              runningFlag
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow'
            }`}
          >
            {runningFlag ? (
              <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> Running...</>
            ) : (
              <><Play size={14} /> {hasRun ? 'Re-run Investigation' : 'Run Investigation'}</>
            )}
          </button>

          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
            apiConnected
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-gray-200 bg-gray-50 text-gray-400'
          }`}>
            <Wifi size={11} />
            {apiConnected ? 'LIVE API · localhost:8000' : 'Local Simulation Mode'}
          </div>
        </div>

        {/* CLI Terminal */}
        {hasRun && (
          <div className="rounded-lg border border-gray-700 bg-[#0d1117] overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#161b22] border-b border-gray-700">
              <Terminal size={12} className="text-gray-500" />
              <span className="text-[10px] font-mono text-gray-400">LIVE ENGINE LOG</span>
              {apiConnected && (
                <span className="text-[9px] font-mono text-cyan-500 ml-1">
                  {isLocalhost ? `SSE://localhost:8000/api/investigate/${scenario.id}` : `SSE:///api/investigate/${scenario.id}`}
                </span>
              )}
              {runningFlag && <span className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <div ref={terminalRef} className="p-3 max-h-[320px] overflow-y-auto font-mono text-xs leading-relaxed">
              {visibleLines.map((line, i) => (
                <div key={i} className="flex gap-2 mb-0.5">
                  <span className="text-gray-500 shrink-0">[{line.time}]</span>
                  <span className={`font-bold shrink-0 ${line.stage === 'ERROR' ? 'text-red-400' : 'text-cyan-400'}`}>{line.stage}:</span>
                  <span className={line.stage === 'ERROR' ? 'text-red-400' : 'text-green-400'}>{line.text}</span>
                </div>
              ))}
              {runningFlag && <span className="inline-block w-2 h-4 bg-green-400 animate-pulse ml-1" />}
            </div>
          </div>
        )}
      </div>

      {/* Pipeline flow */}
      <div className="px-4 py-3 border-b border-gray-50 overflow-x-auto">
        <div className="flex items-center gap-1 min-w-[700px]">
          {stages.map((s, i) => (
            <div key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className={`rounded px-2 py-1 text-[10px] font-bold border transition-all ${
                  expanded === s.id ? 'ring-2 ring-blue-400 scale-105' : ''
                } ${STAGE_COLORS[i % STAGE_COLORS.length]}`}
              >
                {s.label}
              </button>
              {i < stages.length - 1 && <ArrowRight size={12} className="text-gray-300 shrink-0" />}
            </div>
          ))}
        </div>
      </div>

      {/* Stage cards */}
      <div className="divide-y divide-gray-100">
        {stages.map((stage, i) => {
          const isExpanded = expanded === stage.id;
          return (
            <div key={stage.id}>
              <button
                onClick={() => setExpanded(isExpanded ? null : stage.id)}
                className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${STAGE_COLORS[i % STAGE_COLORS.length]}`}>
                  {stage.id}
                </span>
                <div className="flex-1">
                  <span className="text-sm font-semibold text-gray-800">{stage.label}</span>
                  <span className="text-xs text-gray-500 ml-2">{stage.description}</span>
                </div>
                {stage.inputCount != null && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-gray-400">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{stage.inputCount} in</span>
                    <ArrowRight size={10} />
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{stage.outputCount} out</span>
                  </div>
                )}
                {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pl-14">
                  <div className={`rounded-lg border p-3 text-sm text-gray-700 ${STAGE_COLORS[i % STAGE_COLORS.length]}`}>
                    {stage.detail}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
