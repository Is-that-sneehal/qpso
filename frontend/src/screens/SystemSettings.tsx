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
      
      <div className="pb-4" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
        <h1 className="text-3xl font-light" style={{ color: 'var(--color-text-primary)' }}>System Settings</h1>
        <p className="text-sm mt-1" style={{ color: 'color-mix(in srgb, var(--color-text-muted) 70%, transparent)' }}>
          Configure platform defaults, map graph cache preferences, and WebSocket telemetry stream options.
        </p>
      </div>

      <div className="space-y-6">
        
        {/* Card 1: Distance Units & Display */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-base font-medium pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
            <Settings className="w-4 h-4 text-[#ff5719]" />
            <span>Distance Units & Display</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Measurement Unit</div>
              <div className="text-xs" style={{ color: 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)' }}>Select default distance scale used in route manifests and KPIs.</div>
            </div>
            <div className="flex items-center p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}>
              <button
                onClick={() => setDistanceUnit('km')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition ${
                  distanceUnit === 'km' ? 'bg-[#ff5719] text-white' : ''
                }`}
                style={distanceUnit !== 'km' ? { color: 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)' } : {}}
              >
                Kilometers (km)
              </button>
              <button
                onClick={() => setDistanceUnit('mi')}
                className={`px-3 py-1.5 text-xs font-mono font-bold rounded-md transition ${
                  distanceUnit === 'mi' ? 'bg-[#ff5719] text-white' : ''
                }`}
                style={distanceUnit !== 'mi' ? { color: 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)' } : {}}
              >
                Miles (mi)
              </button>
            </div>
          </div>
        </div>

        {/* Card 2: Vehicle Capacity Constraints */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between pb-3" style={{ borderBottom: '1px solid color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
            <div className="flex items-center gap-2 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
              <Shield className="w-4 h-4 text-[#9dcaff]" />
              <span>Vehicle Capacity Constraints</span>
            </div>
            <span className="bg-[#ff5719]/20 text-[#ffb59e] border border-[#ff5719]/30 text-[10px] font-mono px-2 py-0.5 rounded font-bold">
              FUTURE WORK (STATED)
            </span>
          </div>
          <p className="text-xs leading-relaxed" style={{ color: 'color-mix(in srgb, var(--color-text-muted) 70%, transparent)' }}>
            Vehicle demand payload capacity constraints are flagged as a stated future-work module per Section 5.6 to avoid introducing ungrounded demand assumptions into the core QPSO evaluation loop.
          </p>
        </div>

        {/* Card 3: Map Cache & GraphML Management */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-base font-medium pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
            <HardDrive className="w-4 h-4 text-[#d0bcff]" />
            <span>Map Cache & GraphML Storage</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>Local GraphML Cache</div>
              <div className="text-xs" style={{ color: 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)' }}>Currently storing 3 preset graphs + 5 scoped bbox extracts (~42 MB).</div>
            </div>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 text-xs font-mono rounded-lg transition"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-accent-soft)' }}
            >
              {cacheCleared ? 'Cache Purged!' : 'Purge Cached GraphML'}
            </button>
          </div>
        </div>

        {/* Card 4: WebSocket Telemetry Throttle */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-base font-medium pb-3" style={{ color: 'var(--color-text-primary)', borderBottom: '1px solid color-mix(in srgb, var(--color-border) 30%, transparent)' }}>
            <Wifi className="w-4 h-4 text-[#44ff88]" />
            <span>WebSocket Telemetry Throttle Rate</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="" style={{ color: 'color-mix(in srgb, var(--color-text-muted) 70%, transparent)' }}>Iteration Broadcast Interval</span>
              <span className="font-bold" style={{ color: 'var(--color-accent-soft)' }}>Every {wsRate} ms</span>
            </div>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={wsRate}
              onChange={(e) => setWsRate(parseInt(e.target.value))}
              className="w-full accent-[#ffb59e] h-2 rounded-lg cursor-pointer"
              style={{ backgroundColor: 'var(--color-bg-primary)' }}
            />
          </div>
        </div>

        {/* Card 5: Theme Lock */}
        <div className="quantum-glow-card p-6 rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-base font-medium" style={{ color: 'var(--color-text-primary)' }}>
              <Lock className="w-4 h-4 text-[#ffb59e]" />
              <span>Theme Lock</span>
            </div>
            <span className="text-xs font-mono text-[#44ff88]">LOCKED TO QUANTUM MIDNIGHT</span>
          </div>
          <p className="text-xs" style={{ color: 'color-mix(in srgb, var(--color-text-muted) 60%, transparent)' }}>
            Light mode is strictly disabled on this build to ensure maximum contrast and visual fidelity under command-center low-light operational standards.
          </p>
        </div>

      </div>

    </div>
  );
};
