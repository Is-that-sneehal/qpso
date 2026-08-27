import React, { useState } from 'react';
import { Activity, Clock, Cpu, Play, BarChart2 } from 'lucide-react';
import { RouteMap } from '../components/RouteMap';

interface DashboardProps {
  optimizationResult: any;
  startLocation: { name: string; coords: [number, number] };
  onNavigateToSimulation: () => void;
  onNavigateToEngine: () => void;
}

export const MissionControlDashboard: React.FC<DashboardProps> = ({
  optimizationResult,
  startLocation,
  onNavigateToSimulation,
  onNavigateToEngine
}) => {
  const [mapMode, setMapMode] = useState<'topology' | 'heatmap'>('topology');

  const metrics = optimizationResult?.metrics || {
    total_distance_km: 142.8,
    total_time_min: 118,
    fuel_liters: 11.9,
    cost_inr: 1142
  };
  console.log("Current active metrics:", metrics);

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-10">
      
      {/* 1. Hero Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column: Hero Text */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5719]/10 border border-[#ff5719]/30 text-xs font-mono text-[#ffb59e]">
            <span className="w-2 h-2 rounded-full bg-[#ff5719] animate-pulse"></span>
            <span>NEXT-GEN ROUTE OPTIMIZATION ENGINE</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[56px] font-bold tracking-tight text-[#e9def5] whitespace-normal sm:whitespace-nowrap leading-tight">
            Intelligence at the{' '}
            <span className="bg-gradient-to-r from-[#ff5719] via-[#ffb59e] to-[#9dcaff] bg-clip-text text-transparent">
              speed of light
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#e6beb2]/80 leading-relaxed max-w-xl">
            Next-generation route optimization powered by quantum-inspired algorithms. Navigate chaos with pinpoint precision under real-world traffic dynamics.
          </p>

          <div className="flex items-center gap-4 pt-2">
            <button
              onClick={onNavigateToSimulation}
              className="btn-ember-gradient px-6 py-3 text-sm font-semibold flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Deploy Engine</span>
            </button>
            <button
              onClick={onNavigateToEngine}
              className="px-6 py-3 text-sm font-semibold rounded-lg border border-[#5c4037] text-[#e9def5] hover:bg-[#221d2d] transition flex items-center gap-2"
            >
              <BarChart2 className="w-4 h-4 text-[#9dcaff]" />
              <span>View Engine Tuning</span>
            </button>
          </div>
        </div>

        {/* Right Column: QPSO Telemetry Panel */}
        <div className="lg:col-span-5">
          <div className="quantum-glow-card rounded-2xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#5c4037]/30 pb-4 mb-4">
              <span className="text-xs font-mono text-[#ffb59e] tracking-wider uppercase">QPSO DELTA-POTENTIAL ENGINE</span>
              <span className="text-xs font-mono text-[#9dcaff] bg-[#110b1b] px-2.5 py-1 rounded border border-[#5c4037]">4,092 NODES</span>
            </div>

            {/* Particle HUD Canvas Graphic */}
            <div className="h-56 bg-[#110b1b] rounded-xl border border-[#5c4037]/50 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#ff5719_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
              <div className="relative z-10 text-center space-y-2">
                <div className="w-16 h-16 rounded-full border-2 border-[#ff5719] border-t-transparent animate-spin mx-auto flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full border-2 border-[#9dcaff] border-b-transparent animate-spin"></div>
                </div>
                <div className="text-xs font-mono text-[#e9def5]">QPSO Delta-Potential Well Active</div>
                <div className="text-[10px] font-mono text-[#e6beb2]/60">Latency: 12ms | Convergence: 99.8%</div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 2. Three Stat Cards Side-by-Side */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 1: Global Flow */}
        <div className="quantum-glow-card p-6 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#ffb59e] uppercase">
            <span>Global Flow</span>
            <Activity className="w-4 h-4 text-[#ff5719]" />
          </div>
          <div className="text-3xl font-light text-[#e9def5]">98.2%</div>
          <div className="text-xs text-[#9dcaff] font-mono">+2.4% vs last hr</div>
        </div>

        {/* Card 2: Avg Latency */}
        <div className="quantum-glow-card p-6 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#ffb59e] uppercase">
            <span>Avg Latency</span>
            <Clock className="w-4 h-4 text-[#9dcaff]" />
          </div>
          <div className="text-3xl font-light text-[#e9def5]">12ms</div>
          <div className="text-xs text-[#e6beb2]/70 font-mono">Optimal range</div>
        </div>

        {/* Card 3: Active Nodes */}
        <div className="quantum-glow-card p-6 rounded-xl space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#ffb59e] uppercase">
            <span>Active Nodes</span>
            <Cpu className="w-4 h-4 text-[#d0bcff]" />
          </div>
          <div className="text-3xl font-light text-[#e9def5]">4,092</div>
          <div className="text-xs text-[#ff5719] font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#ff5719] animate-pulse"></span>
            <span>Live synchronization</span>
          </div>
        </div>

      </div>

      {/* 3. Workflow Canvas Card */}
      <div className="quantum-glow-card p-6 rounded-2xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#5c4037]/30 pb-4">
          <div>
            <h2 className="text-xl font-normal text-[#e9def5]">Workflow Canvas</h2>
            <p className="text-xs text-[#e6beb2]/70">Real-time visualization of routing topology across OpenStreetMap graph</p>
          </div>

          {/* Segmented Control Toggle */}
          <div className="flex items-center bg-[#110b1b] p-1 rounded-lg border border-[#5c4037]">
            <button
              onClick={() => setMapMode('topology')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                mapMode === 'topology' ? 'bg-[#ff5719] text-white font-semibold' : 'text-[#e6beb2]/70 hover:text-[#e9def5]'
              }`}
            >
              Topology
            </button>
            <button
              onClick={() => setMapMode('heatmap')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${
                mapMode === 'heatmap' ? 'bg-[#ff5719] text-white font-semibold' : 'text-[#e6beb2]/70 hover:text-[#e9def5]'
              }`}
            >
              Heatmap
            </button>
          </div>
        </div>

        {/* Live Route Map */}
        <RouteMap
          startLocation={startLocation}
          routes={optimizationResult?.routes || []}
          height="450px"
        />

        {/* Legend */}
        <div className="flex items-center gap-6 text-xs font-mono text-[#e6beb2]/70 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#ff5719]"></span>
            <span>Node Alpha - Critical (Hub)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#9dcaff]"></span>
            <span>Node Beta - Stable (Stops)</span>
          </div>
        </div>
      </div>

      {/* 4. Trust Strip */}
      <div className="py-6 border-t border-b border-[#5c4037]/20 text-center space-y-4">
        <span className="text-[11px] font-mono uppercase text-[#e6beb2]/50 tracking-widest">
          TRUSTED BY GLOBAL TRANSIT NETWORKS
        </span>
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-40 font-mono text-sm tracking-widest text-[#e9def5]">
          <span>AEROLOGISTICS</span>
          <span>URBANTRANSIT</span>
          <span>NEXUS</span>
          <span>SYS-Q</span>
          <span>METROCORE</span>
        </div>
      </div>

    </div>
  );
};
