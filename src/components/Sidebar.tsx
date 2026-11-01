import type { ReactNode } from 'react';
import { FileInput, Search, Stethoscope, Target, FlaskConical, X } from 'lucide-react';
import type { TabId } from '../types';
import { TABS } from '../types';

interface SidebarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  isOpen: boolean;
  onClose: () => void;
}

const ICONS: Record<string, ReactNode> = {
  FileInput: <FileInput size={20} />,
  Search: <Search size={20} />,
  Stethoscope: <Stethoscope size={20} />,
  Target: <Target size={20} />,
  FlaskConical: <FlaskConical size={20} />,
};

export function Sidebar({ activeTab, onTabChange, isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay — mobile only */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:static inset-y-0 left-0 z-40
        w-[260px] md:w-[220px] bg-white border-r border-gray-200 h-full flex flex-col shrink-0
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0
      `}>
        {/* Close button — mobile only */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 md:hidden">
          <span className="text-sm font-bold text-gray-800">Navigation</span>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 text-gray-500">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 py-4 flex flex-col gap-1 overflow-y-auto">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-start gap-3 w-full text-left px-4 py-3 transition-colors duration-200 ${
                  isActive
                    ? 'border-l-4 border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-l-4 border-transparent text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className={`mt-0.5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                  {ICONS[tab.icon]}
                </div>
                <div>
                  <div className={`font-semibold text-sm ${isActive ? 'text-blue-800' : 'text-gray-800'}`}>
                    {tab.label}
                  </div>
                  <div className={`text-xs mt-0.5 leading-snug ${isActive ? 'text-blue-600/80' : 'text-gray-500'}`}>
                    {tab.description}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-gray-100 text-center">
          <span className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold">Anvation 2026 · AI-03</span>
        </div>
      </div>
    </>
  );
}
