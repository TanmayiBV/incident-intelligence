import { Zap, Database, Menu } from 'lucide-react';
import type { ScenarioId } from '../types';
import { SCENARIO_DATA } from '../data';

interface TopBarProps {
  selectedScenario: ScenarioId;
  onScenarioChange: (id: ScenarioId) => void;
  onMenuToggle: () => void;
}

export function TopBar({ selectedScenario, onScenarioChange, onMenuToggle }: TopBarProps) {
  const scenario = SCENARIO_DATA[selectedScenario];

  return (
    <div className="w-full h-14 md:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shrink-0">
      <div className="flex items-center gap-2 md:gap-3">
        {/* Hamburger — mobile only */}
        <button onClick={onMenuToggle} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 text-gray-600">
          <Menu size={20} />
        </button>
        <div className="flex items-center justify-center bg-blue-100 p-1.5 rounded-lg text-blue-600">
          <Zap size={18} className="fill-current md:w-5 md:h-5" />
        </div>
        <div>
          <h1 className="text-base md:text-xl font-bold text-gray-900 leading-none">Pygenic Arc</h1>
          <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 font-medium hidden sm:block">Production Incident Intelligence System</p>
        </div>
      </div>

      <div className="flex-1 flex justify-center max-w-[180px] sm:max-w-xs md:max-w-xl px-2 md:px-4">
        <div className="relative w-full">
          <select
            value={selectedScenario}
            onChange={(e) => onScenarioChange(e.target.value as ScenarioId)}
            className="w-full appearance-none bg-gray-50 border border-gray-300 text-gray-900 text-xs md:text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block p-2 md:p-2.5 shadow-sm font-medium pr-8"
          >
            {Object.values(SCENARIO_DATA).map((s) => (
              <option key={s.id} value={s.id}>
                {s.id} · {s.title}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <div className="text-right mr-2 hidden lg:block">
          <span className="text-xs text-gray-400 font-medium">{scenario.domain}</span>
          <span className="block text-xs font-bold text-gray-700">{scenario.incidentWindow}</span>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2 bg-green-50 border border-green-200 rounded-full px-2 md:px-3 py-1">
          <Database size={12} className="text-green-600 md:w-3.5 md:h-3.5" />
          <span className="text-[10px] md:text-xs font-bold text-green-700 hidden sm:inline">SYNTHETIC DATA</span>
          <span className="text-[10px] font-bold text-green-700 sm:hidden">SYN</span>
        </div>
      </div>
    </div>
  );
}
