import React, { useState } from 'react';
import { Settings, Shield, HardDrive, Wifi, Lock } from 'lucide-react';

export const SystemSettings: React.FC = () => {
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mi'>('km');
  const [wsRate, setWsRate] = useState<number>(50);
  const [cacheCleared, setCacheCleared] = useState<boolean>(false);

  const handleClearCache = () => {
    setCacheCleared(true);
    setTimeout(() => setCacheCleared(false), 3000);
  };

  return (
    <div className="max-w-[1000px] mx-auto px-6 py-10 space-y-8">
      
      <div className="border-b border-[#5c4037]/30 pb-4">
        <h1 className="text-3xl font-light text-[#e9def5]">System Settings</h1>
        <p className="text-sm text-[#e6beb2]/70 mt-1">
          Configure platform defaults, map graph cache preferences, and WebSocket telemetry stream options.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Card 1: Distance Units & Display */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-base font-medium text-[#e9def5] border-b border-[#5c4037]/30 pb-3">
            <Settings className="w-4 h-4 text-[#ff5719]" />
            <span>Distance Units & Display</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#e9def5]">Measurement Unit</div>
              <div className="text-xs text-[#e6beb2]/60">Select default distance scale used in route manifests and KPIs.</div>
            </div>
            <div className="flex items-center bg-[#110b1b] p-1 rounded-lg border border-[#5c4037]">
              <button
                onClick={() => setDistanceUnit('km')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition ${
                  distanceUnit === 'km' ? 'bg-[#ff5719] text-white' : 'text-[#e6beb2]/60 hover:text-[#e9def5]'
                }`}
              >
                Kilometers (km)
              </button>
              <button
                onClick={() => setDistanceUnit('mi')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition ${
                  distanceUnit === 'mi' ? 'bg-[#ff5719] text-white' : 'text-[#e6beb2]/60 hover:text-[#e9def5]'
                }`}
              >
                Miles (mi)
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Vehicle Capacity Constraints */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[#5c4037]/30 pb-3">
            <div className="flex items-center gap-2 text-base font-medium text-[#e9def5]">
              <Shield className="w-4 h-4 text-[#9dcaff]" />
              <span>Vehicle Capacity Constraints</span>
            </div>
            <span className="bg-[#ff5719]/20 text-[#ffb59e] border border-[#ff5719]/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              FUTURE WORK (STATED)
            </span>
          </div>
          <p className="text-xs text-[#e6beb2]/70 leading-relaxed">
            Vehicle demand payload capacity constraints are flagged as a stated future-work module per Section 5.6 to avoid introducing ungrounded demand assumptions into the core QPSO evaluation loop.
          </p>
        </div>

        {/* Card 3: Map Cache & GraphML Management */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-base font-medium text-[#e9def5] border-b border-[#5c4037]/30 pb-3">
            <HardDrive className="w-4 h-4 text-[#d0bcff]" />
            <span>Map Cache & GraphML Storage</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#e9def5]">Local GraphML Cache</div>
              <div className="text-xs text-[#e6beb2]/60">Currently storing 3 preset graphs + 5 scoped bbox extracts (~42 MB).</div>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-[#110b1b] border border-[#5c4037] text-xs font-mono text-[#ffb59e] rounded-lg hover:bg-[#221d2d] transition"
            >
              {cacheCleared ? 'Cache Purged!' : 'Purge Cached GraphML'}
            </button>
          </div>
        </div>

        {/* Card 4: WebSocket Telemetry Throttle */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-base font-medium text-[#e9def5] border-b border-[#5c4037]/30 pb-3">
            <Wifi className="w-4 h-4 text-[#44ff88]" />
            <span>WebSocket Telemetry Throttle Rate</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-[#e6beb2]/70">Iteration Broadcast Interval</span>
              <span className="text-[#ffb59e] font-bold">Every {wsRate} ms</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={wsRate}
              onChange={(e) => setWsRate(parseInt(e.target.value))}
              className="w-full accent-[#ffb59e] bg-[#110b1b] h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Card 5: Theme Lock */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-medium text-[#e9def5]">
              <Lock className="w-4 h-4 text-[#ffb59e]" />
              <span>Theme Lock</span>
            </div>
            <span className="text-xs font-mono text-[#44ff88]">LOCKED TO QUANTUM MIDNIGHT</span>
          </div>
          <p className="text-xs text-[#e6beb2]/60">
            Light mode is strictly disabled on this build to ensure maximum contrast and visual fidelity under command-center low-light operational standards.
          </p>
        </div>

      </div>

    </div>
  );
};
