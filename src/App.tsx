import { useState } from 'react';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { TabContent } from './components/TabContent';
import type { TabId, ScenarioId } from './types';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('raw-evidence');
  const [selectedScenario, setSelectedScenario] = useState<ScenarioId>('INC-1042');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50 text-gray-900 font-sans">
      <TopBar selectedScenario={selectedScenario} onScenarioChange={setSelectedScenario} onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden relative">
        <Sidebar activeTab={activeTab} onTabChange={(tab) => { setActiveTab(tab); setSidebarOpen(false); }} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <TabContent activeTab={activeTab} selectedScenario={selectedScenario} />
      </div>
    </div>
  );
}

export default App;
