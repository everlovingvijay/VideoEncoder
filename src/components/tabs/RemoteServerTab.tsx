import React, { useState } from 'react';
import { Server, Wifi, CheckCircle2, Shield, RefreshCw, Cpu, Activity, Send } from 'lucide-react';

export const RemoteServerTab: React.FC = () => {
  const [serverHost, setServerHost] = useState('192.168.1.140');
  const [serverPort, setServerPort] = useState('8080');
  const [authToken, setAuthToken] = useState('hb_mac_studio_m2');
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [serverInfo, setServerInfo] = useState({
    name: 'Mac Studio (Apple M2 Ultra)',
    engine: 'HandBrakeCLI 1.9.0 (Apple Silicon Media Engine x2)',
    cpuLoad: 24,
    tempC: 48,
    activeEncodes: 1,
    storageFreeGB: 1840,
  });

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setIsConnected(true);
    }, 800);
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-slate-100 pb-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          Remote Node
          <span className="text-[10px] font-mono font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            Connected
          </span>
        </h1>
        <p className="text-xs text-slate-400">
          Offload 4K Blu-ray & huge batches to your desktop Mac/PC over LAN
        </p>
      </div>

      {/* Connection Status Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white">{serverInfo.name}</h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {serverHost}:{serverPort} · LAN Active
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 rounded-xl transition-colors border border-slate-700/60"
          >
            <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
            <span>Ping</span>
          </button>
        </div>

        {/* Remote Hardware Telemetry Grid */}
        <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-mono">
          <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">CPU / GPU LOAD</span>
            <span className="text-emerald-400 font-bold block">{serverInfo.cpuLoad}%</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">TEMP</span>
            <span className="text-slate-200 block">{serverInfo.tempC}°C</span>
          </div>
          <div className="bg-slate-950 p-2.5 rounded-xl border border-white/5">
            <span className="text-slate-500 block text-[10px]">DISK FREE</span>
            <span className="text-slate-200 block">{serverInfo.storageFreeGB} GB</span>
          </div>
        </div>
      </div>

      {/* Host Settings */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 text-xs">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
          <Wifi className="w-3.5 h-3.5 text-amber-400" />
          Remote Node Configuration
        </h3>

        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <label className="text-slate-400">Server IP / Hostname</label>
            <input
              type="text"
              value={serverHost}
              onChange={(e) => setServerHost(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400">Port</label>
            <input
              type="text"
              value={serverPort}
              onChange={(e) => setServerPort(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-slate-400">HandBrake Server API Token</label>
          <input
            type="password"
            value={authToken}
            onChange={(e) => setAuthToken(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white font-mono"
          />
        </div>
      </div>

      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 leading-relaxed">
        <strong>Tip:</strong> You can transcode videos directly on this device using Apple VideoToolbox, or trigger encoding tasks on your workstation to save mobile battery life.
      </div>
    </div>
  );
};
