import { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { MissionControlDashboard } from './screens/MissionControlDashboard';
import { LiveSimulationControl } from './screens/LiveSimulationControl';
import { OptimizationEngine } from './screens/OptimizationEngine';
import { NetworkDiagnostics } from './screens/NetworkDiagnostics';
import { SystemSettings } from './screens/SystemSettings';
import { ReportModal } from './components/ReportModal';
import { runOptimization } from './api/client';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');

  const [startLocation, setStartLocation] = useState<{ name: string; coords: [number, number] }>({
    name: 'Empire State Building, NY',
    coords: [40.748817, -73.985428]
  });

  const [qpsoParams, setQpsoParams] = useState({
    beta_start: 1.0,
    swarm_size: 30,
    max_iter: 300,
    plateau_window: 50
  });

  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [globalReportModalOpen, setGlobalReportModalOpen] = useState<boolean>(false);

  const handleStartOptimizationFromNav = () => {
    setCurrentTab('live-simulation');
  };

  const handleOpenGlobalReport = async () => {
    if (!optimizationResult) {
      try {
        const res = await runOptimization({ preset: 'manhattan-core', qpso_params: qpsoParams });
        setOptimizationResult(res);
      } catch (err) {
        console.error("Auto-run for report failed:", err);
      }
    }
    setGlobalReportModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#161120] text-[#e9def5] flex flex-col justify-between">
      <div>
        <Navbar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          onStartOptimization={handleStartOptimizationFromNav}
          onOpenReport={handleOpenGlobalReport}
        />

        <main>
          {currentTab === 'dashboard' && (
            <MissionControlDashboard
              optimizationResult={optimizationResult}
              startLocation={startLocation}
              onNavigateToSimulation={() => setCurrentTab('live-simulation')}
              onNavigateToEngine={() => setCurrentTab('optimization-engine')}
            />
          )}

          {currentTab === 'live-simulation' && (
            <LiveSimulationControl
              startLocation={startLocation}
              setStartLocation={setStartLocation}
              optimizationResult={optimizationResult}
              setOptimizationResult={setOptimizationResult}
              qpsoParams={qpsoParams}
            />
          )}

          {currentTab === 'optimization-engine' && (
            <OptimizationEngine
              qpsoParams={qpsoParams}
              setQpsoParams={setQpsoParams}
              onDeploy={() => setCurrentTab('live-simulation')}
            />
          )}

          {currentTab === 'network-health' && (
            <NetworkDiagnostics />
          )}

          {currentTab === 'system-settings' && (
            <SystemSettings />
          )}
        </main>
      </div>

      <ReportModal
        isOpen={globalReportModalOpen}
        onClose={() => setGlobalReportModalOpen(false)}
        runId={optimizationResult?.run_id}
        optimizationResult={optimizationResult}
        startLocation={startLocation}
      />

      <Footer />
    </div>
  );
}

export default App;
