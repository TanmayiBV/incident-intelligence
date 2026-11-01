import { useState } from 'react';
import type { ScenarioData } from '../data';
import { FlaskConical, CheckCircle, XCircle, Info, Minus, ArrowRight } from 'lucide-react';

interface SimResult {
  eventId: string;
  eventLabel: string;
  verdict: 'NECESSARY' | 'INSUFFICIENT';
  symptoms: { symptom: string; resolved: boolean; reason: string }[];
  summary: string;
}

function buildSimulations(scenario: ScenarioData): SimResult[] {
  const cf = scenario.counterfactual;

  // Root cause removal — from real counterfactual data
  const rootSim: SimResult = {
    eventId: cf.removedEventId,
    eventLabel: cf.removedEventLabel,
    verdict: 'NECESSARY',
    symptoms: cf.symptoms.map((s: { symptom: string; stillOccurs: boolean }) => ({
      symptom: s.symptom,
      resolved: !s.stillOccurs,
      reason: s.stillOccurs ? 'Independent issue — unrelated to the incident chain' : 'Directly caused by the removed event',
    })),
    summary: cf.summary,
  };

  // Build sims for other candidates (removing them shows symptoms persist)
  const otherSims: SimResult[] = scenario.candidates
    .filter((c: { verdict: string }) => c.verdict !== 'PROBABLE_ROOT_CAUSE')
    .map((c: { id: string; label: string; verdict: string; rejectionRules?: { ruleId: string; reason: string }[] }) => ({
      eventId: c.id,
      eventLabel: c.label,
      verdict: 'INSUFFICIENT' as const,
      symptoms: cf.symptoms.map((s: { symptom: string; stillOccurs: boolean }) => ({
        symptom: s.symptom,
        resolved: false,
        reason: c.verdict === 'REJECTED'
          ? `${c.label} has no causal path to this symptom`
          : `Removing ${c.id} does not address the real bottleneck`,
      })),
      summary: `Removing ${c.label} has no effect on the primary symptoms. ${
        c.rejectionRules?.[0]?.reason || 'This event is not on the critical path.'
      }`,
    }));

  return [rootSim, ...otherSims];
}

export function WhatIfTab({ scenario }: { scenario: ScenarioData }) {
  const simulations = buildSimulations(scenario);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const sim = simulations[selectedIdx];
  const resolved = sim.symptoms.filter((s) => s.resolved);
  const remaining = sim.symptoms.filter((s) => !s.resolved);
  const coverage = sim.symptoms.length > 0 ? (resolved.length / sim.symptoms.length) * 100 : 0;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <FlaskConical size={20} className="text-cyan-600" />
        <h3 className="text-lg font-black text-gray-900">Counterfactual Simulation</h3>
        <span className="text-xs text-gray-500">Select an event to remove and observe the predicted impact on downstream symptoms.</span>
      </div>

      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Event selector */}
        <div className="col-span-1 rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="px-4 py-2.5 border-b border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remove Event</span>
          </div>
          <div className="p-2 space-y-1">
            {simulations.map((s, i) => {
              const isRoot = s.verdict === 'NECESSARY';
              const isActive = selectedIdx === i;
              return (
                <button
                  key={s.eventId}
                  onClick={() => setSelectedIdx(i)}
                  className={`w-full text-left rounded-lg px-3 py-2.5 transition-all border-2 ${
                    isActive
                      ? isRoot ? 'border-red-400 bg-red-50' : 'border-amber-400 bg-amber-50'
                      : 'border-transparent hover:bg-gray-50 hover:border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Minus size={12} className={isActive ? (isRoot ? 'text-red-500' : 'text-amber-500') : 'text-gray-400'} />
                    <span className={`text-xs font-bold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>{s.eventId}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 ml-5 leading-tight truncate">{s.eventLabel}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Impact visualization */}
        <div className="md:col-span-2 space-y-4">
          {/* Hypothesis banner */}
          <div className={`rounded-lg border-2 px-5 py-3 ${
            sim.verdict === 'NECESSARY' ? 'border-cyan-300 bg-cyan-50' : 'border-gray-300 bg-gray-50'
          }`}>
            <p className="text-sm text-gray-800">
              <span className="font-black">"What if</span> <span className="font-bold text-red-600">{sim.eventLabel}</span> <span className="font-black">had never occurred?"</span>
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded border ${
                sim.verdict === 'NECESSARY'
                  ? 'bg-green-100 text-green-800 border-green-300'
                  : 'bg-red-100 text-red-700 border-red-300'
              }`}>
                {sim.verdict === 'NECESSARY' ? '✓ NECESSARY CAUSE' : '✗ NOT SUFFICIENT'}
              </span>
              <span className="text-xs text-gray-500">
                {sim.verdict === 'NECESSARY'
                  ? 'Removing this event eliminates the primary symptoms.'
                  : 'Removing this event does not fix anything.'}
              </span>
            </div>
          </div>

          {/* Symptoms table */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <div className="divide-y divide-gray-50">
              {sim.symptoms.map((s, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-2.5 ${s.resolved ? 'bg-green-50/40' : ''}`}>
                  {s.resolved ? (
                    <CheckCircle size={16} className="text-green-500 shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-red-400 shrink-0" />
                  )}
                  <div className="flex-1">
                    <span className={`text-sm ${s.resolved ? 'line-through text-gray-400' : 'text-gray-800'}`}>{s.symptom}</span>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.reason}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    s.resolved ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                  }`}>
                    {s.resolved ? 'RESOLVED' : 'PERSISTS'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Confidence gauge */}
          <div className="flex items-center gap-4 px-1">
            {/* SVG arc gauge */}
            <div className="flex flex-col items-center">
              <svg width="100" height="60" viewBox="0 0 100 60">
                <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#E5E7EB" strokeWidth="8" strokeLinecap="round" />
                <path
                  d="M 10 55 A 40 40 0 0 1 90 55"
                  fill="none"
                  stroke={coverage >= 60 ? '#22C55E' : coverage > 0 ? '#F59E0B' : '#EF4444'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${coverage * 1.26} 126`}
                  style={{ transition: 'stroke-dasharray 0.8s ease-out, stroke 0.5s' }}
                />
                <text x="50" y="50" textAnchor="middle" fontSize="18" fontWeight="900"
                  fill={coverage >= 60 ? '#16A34A' : coverage > 0 ? '#D97706' : '#DC2626'}>
                  {coverage.toFixed(0)}%
                </text>
                <text x="50" y="12" textAnchor="middle" fontSize="7" fill="#9CA3AF" fontWeight="700">BLAST COVERAGE</text>
              </svg>
            </div>

            {/* Blast bar */}
            <div className="flex-1">
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${coverage >= 60 ? 'bg-green-500' : coverage > 0 ? 'bg-amber-400' : 'bg-red-400'}`}
                  style={{ width: `${coverage}%` }}
                />
              </div>
              <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                <span>0%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Counters */}
            <div className="flex gap-4">
              <div className="text-center px-3 py-2 rounded-lg bg-green-50 border border-green-200">
                <div className="text-2xl font-black text-green-700" style={{ transition: 'all 0.3s' }}>{resolved.length}</div>
                <div className="text-[10px] text-green-600 font-bold">resolved</div>
              </div>
              <div className="text-center px-3 py-2 rounded-lg bg-red-50 border border-red-200">
                <div className="text-2xl font-black text-red-500" style={{ transition: 'all 0.3s' }}>{remaining.length}</div>
                <div className="text-[10px] text-red-500 font-bold">persist</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Proof flow + summary */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <div className="flex items-center gap-2 justify-center mb-3">
          <div className="rounded border-2 border-red-300 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Remove: {sim.eventId}</div>
          <ArrowRight size={14} className="text-gray-400" />
          <div className={`rounded border-2 px-3 py-1.5 text-xs font-bold ${
            sim.verdict === 'NECESSARY' ? 'border-green-300 bg-green-50 text-green-700' : 'border-gray-300 bg-gray-50 text-gray-500'
          }`}>
            {resolved.length} symptom{resolved.length !== 1 ? 's' : ''} disappear
          </div>
          <ArrowRight size={14} className="text-gray-400" />
          <div className={`rounded border-2 px-3 py-1.5 text-xs font-bold ${
            sim.verdict === 'NECESSARY' ? 'border-blue-300 bg-blue-50 text-blue-700' : 'border-gray-300 bg-gray-50 text-gray-500'
          }`}>
            ∴ {sim.eventId} is {sim.verdict === 'NECESSARY' ? 'a necessary cause' : 'not sufficient'}
          </div>
        </div>
        <p className="text-xs text-gray-600 text-center leading-relaxed max-w-2xl mx-auto">{sim.summary}</p>
      </div>

      {/* Caveat */}
      <div className="flex gap-2 px-1 items-start">
        <Info size={13} className="text-gray-300 mt-0.5 shrink-0" />
        <p className="text-[10px] text-gray-400 leading-relaxed">{scenario.counterfactual.caveat}</p>
      </div>
    </div>
  );
}
