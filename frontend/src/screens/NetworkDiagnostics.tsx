import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, PlugZap, RefreshCw, Terminal, X } from 'lucide-react';
import { fetchNetworkHealth } from '../api/client';

export const NetworkDiagnostics: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([
    '> INITIALIZING GLOBAL DIAGNOSTIC SUITE...',
    '> CONNECTING TO OPENSTREETMAP ROUTING NODES...',
    '> OSMNX GRAPH DATA LOADED: 4,092 NODES, 11,480 EDGES',
    '> MONITORING REAL-TIME CONGESTION MULTIPLIERS...'
  ]);

  useEffect(() => {
    fetchNetworkHealth().then(res => {
      setData(res);
      if (res.cities && res.cities.length > 0) {
        setSelectedCity(res.cities[0]);
      }
    }).catch(err => console.error(err));
  }, []);

  const handleReboot = (cityCode: string) => {
    setLogs(prev => [
      ...prev,
      `> REBOOT COMMAND SENT TO SECTOR [${cityCode}]...`,
      `> FLUSHING GRAPHML LOCAL CACHE FOR ${cityCode}...`,
      `> RE-FETCHING SCOPED OSM GRAPH FROM OVERPASS PASS...`,
      `> SECTOR [${cityCode}] RE-ESTABLISHED. STATUS: HEALTHY.`
    ]);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle2 className="w-4 h-4 text-[#44ff88]" />;
      case 'congested': return <AlertTriangle className="w-4 h-4 text-[#ffb59e]" />;
      case 'critical': return <AlertCircle className="w-4 h-4 text-[#ff4444]" />;
      case 'offline': return <PlugZap className="w-4 h-4 text-[#e6beb2]/40" />;
      default: return null;
    }
  };

  const summary = data?.summary || { healthy_nodes: 6, congested_nodes: 1, critical_alert: 1, offline: 1 };
  const cities = data?.cities || [];

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
      
      {/* 1. Top Strip: Four Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        <div className="bg-[#110b1b] border border-[#5c4037] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#e6beb2]/60 uppercase">Healthy Nodes</div>
            <div className="text-3xl font-light text-[#e9def5] mt-1">{summary.healthy_nodes}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#44ff88]/10 border border-[#44ff88]/30 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-[#44ff88]" />
          </div>
        </div>

        <div className="bg-[#110b1b] border border-[#5c4037] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#e6beb2]/60 uppercase">Congested</div>
            <div className="text-3xl font-light text-[#e9def5] mt-1">{summary.congested_nodes}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#ffb59e]/10 border border-[#ffb59e]/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-[#ffb59e]" />
          </div>
        </div>

        <div className="bg-[#110b1b] border border-[#5c4037] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#e6beb2]/60 uppercase">Critical Alert</div>
            <div className="text-3xl font-light text-[#e9def5] mt-1">{summary.critical_alert}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#ff4444]/10 border border-[#ff4444]/30 flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-[#ff4444]" />
          </div>
        </div>

        <div className="bg-[#110b1b] border border-[#5c4037] p-5 rounded-xl flex items-center justify-between">
          <div>
            <div className="text-xs font-mono text-[#e6beb2]/60 uppercase">Offline</div>
            <div className="text-3xl font-light text-[#e9def5] mt-1">{summary.offline}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#e6beb2]/10 border border-[#e6beb2]/30 flex items-center justify-center">
            <PlugZap className="w-5 h-5 text-[#e6beb2]/50" />
          </div>
        </div>

      </div>

      {/* 2. Global Hub Status & Diagnostic Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Dense Grid of City Tiles */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-normal text-[#e9def5]">Global Hub Status</h2>
            <div className="flex items-center gap-2 text-xs font-mono text-[#e6beb2]/70">
              <span>Filter: All</span>
              <span>|</span>
              <span>Sort: Risk</span>
            </div>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-3 gap-4">
            {cities.map((city: any, idx: number) => {
              const isSelected = selectedCity?.code === city.code;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedCity(city)}
                  className={`p-4 rounded-xl border text-left transition relative ${
                    isSelected
                      ? 'bg-[#221d2d] border-[#ff5719] shadow-lg shadow-[#ff5719]/15 ring-2 ring-[#ff5719]/40'
                      : 'bg-[#1e1929] border-[#5c4037] hover:border-[#5c4037]/80'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-base text-[#e9def5]">{city.code}</span>
                    {getStatusIcon(city.status)}
                  </div>
                  <div className="text-xs text-[#e6beb2]/80 truncate">{city.name}</div>
                  <div className="text-[10px] font-mono text-[#e6beb2]/50 mt-2 flex justify-between">
                    <span>{city.latency}</span>
                    <span>{city.bandwidth}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Diagnostic Card */}
        <div className="lg:col-span-5">
          {selectedCity && (
            <div className="quantum-glow-card p-6 rounded-2xl space-y-5">
              
              <div className="flex items-center justify-between border-b border-[#5c4037]/30 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#ff5719] animate-pulse"></span>
                  <span className="text-xs font-mono text-[#ffb59e] uppercase font-bold">
                    ● ACTIVE DIAGNOSTIC: {selectedCity.name} ({selectedCity.code})
                  </span>
                </div>
                <button onClick={() => setSelectedCity(null)} className="text-[#e6beb2]/50 hover:text-[#e9def5]">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Metric Rows */}
              <div className="space-y-3 font-mono text-xs">
                <div className="flex justify-between py-1 border-b border-[#5c4037]/20">
                  <span className="text-[#e6beb2]/60">Latency</span>
                  <span className="text-[#e9def5]">{selectedCity.latency}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#5c4037]/20">
                  <span className="text-[#e6beb2]/60">Packet Loss</span>
                  <span className="text-[#ffb59e]">{selectedCity.loss}</span>
                </div>
                <div className="space-y-1 pt-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#e6beb2]/60">Bandwidth Throughput</span>
                    <span className="text-[#9dcaff]">{selectedCity.bandwidth}</span>
                  </div>
                  <div className="w-full bg-[#110b1b] h-2 rounded-full overflow-hidden border border-[#5c4037]">
                    <div className="bg-[#9dcaff] h-full" style={{ width: selectedCity.bandwidth }}></div>
                  </div>
                </div>
              </div>

              {/* Diagnostic Log Terminal Block */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#ffb59e]">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>DIAGNOSTIC LOG</span>
                </div>
                <div className="bg-[#110b1b] border border-[#5c4037] rounded-xl p-3.5 h-36 font-mono text-[11px] text-[#44ff88] overflow-y-auto space-y-1 leading-relaxed">
                  {logs.map((log, i) => (
                    <div key={i}>{log}</div>
                  ))}
                </div>
              </div>

              {/* Reboot Node Button */}
              <button
                onClick={() => handleReboot(selectedCity.code)}
                className="w-full btn-ember-gradient py-3 px-4 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>↻ Reboot Node</span>
              </button>

            </div>
          )}
        </div>

      </div>

    </div>
  );
};
