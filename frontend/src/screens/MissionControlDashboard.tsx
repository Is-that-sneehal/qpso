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
      
      {/* 1. Hero Layout - Centered Single Line Professional Hero */}
      <div className="w-full max-w-6xl mx-auto text-center space-y-6 py-4">
        <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight text-[#e9def5] leading-tight w-full mx-auto sm:whitespace-nowrap">
          Intelligence at the{' '}
          <span className="bg-gradient-to-r from-[#ff5719] via-[#ffb59e] to-[#9dcaff] bg-clip-text text-transparent">
            speed of light
          </span>
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#e6beb2]/85 leading-relaxed max-w-2xl mx-auto font-light">
          Next-generation route optimization powered by quantum-inspired algorithms. Navigate chaos with pinpoint precision under real-world traffic dynamics.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
          <button
            onClick={onNavigateToSimulation}
            className="btn-ember-gradient px-8 py-3.5 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-[#ff5719]/25 hover:shadow-[#ff5719]/40 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Deploy Engine</span>
          </button>
          <button
            onClick={onNavigateToEngine}
            className="px-8 py-3.5 text-sm font-semibold rounded-lg border border-[#5c4037] text-[#e9def5] hover:bg-[#221d2d] transition flex items-center gap-2 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-[#9dcaff]" />
            <span>View Engine Tuning</span>
          </button>
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


    </div>
  );
};
