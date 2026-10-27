import React, { useState } from 'react';
import { Mic, MicOff, AlertCircle, CheckCircle2, RefreshCw, Volume2, Settings2, HelpCircle } from 'lucide-react';
import { MicConnectionState, MicDeviceInfo, AudioMetrics } from '../audio/types';

interface MicrophoneDiagnosticsProps {
  micState: MicConnectionState;
  micError: string | null;
  devices: MicDeviceInfo[];
  selectedDeviceId: string;
  onSelectDevice: (deviceId: string) => void;
  onConnectMic: () => void;
  onDisconnectMic: () => void;
  metrics: AudioMetrics;
  micGainBoost: number;
  onMicGainBoostChange: (boost: number) => void;
  directMonitor: boolean;
  onToggleDirectMonitor: () => void;
}

export const MicrophoneDiagnostics: React.FC<MicrophoneDiagnosticsProps> = ({
  micState,
  micError,
  devices,
  selectedDeviceId,
  onSelectDevice,
  onConnectMic,
  onDisconnectMic,
  metrics,
  micGainBoost,
  onMicGainBoostChange,
  directMonitor,
  onToggleDirectMonitor,
}) => {
  const [showTroubleshoot, setShowTroubleshoot] = useState(false);

  // Meter percentage
  const dbClamped = Math.max(-75, Math.min(0, metrics.micInputDbfs));
  const meterPercent = Math.max(0, Math.min(100, ((dbClamped + 75) / 75) * 100));

  return (
    <div className="p-4 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3 font-mono">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded border ${
              micState === 'connected'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
                : micState === 'denied' || micState === 'error'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-400'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <span>Microphone Hardware & Input Status</span>
              {micState === 'connected' && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  ONLINE
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Required for real-time Delayed Auditory Feedback (DAF) speech jamming
            </p>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-2">
          {micState === 'connected' ? (
            <button
              onClick={onDisconnectMic}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs transition-colors cursor-pointer"
            >
              <MicOff className="w-3.5 h-3.5" />
              <span>DISCONNECT MIC</span>
            </button>
          ) : (
            <button
              onClick={onConnectMic}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded text-xs transition-all shadow-md shadow-cyan-900/30 cursor-pointer animate-pulse"
            >
              <Mic className="w-4 h-4 fill-current" />
              <span>{micState === 'requesting' ? 'CONNECTING...' : 'ALLOW & CONNECT MIC'}</span>
            </button>
          )}

          <button
            onClick={() => setShowTroubleshoot((prev) => !prev)}
            title="Troubleshooting Instructions"
            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded text-xs cursor-pointer"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Permission Denied or Error Banner */}
      {(micState === 'denied' || micState === 'error') && (
        <div className="p-3 bg-rose-950/40 border border-rose-500/50 rounded flex flex-col gap-2 text-xs text-rose-300">
          <div className="flex items-center gap-2 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Microphone Not Accessible</span>
          </div>
          <p className="font-sans text-slate-300">
            {micError || 'Microphone access was denied or could not be established by your browser.'}
          </p>
          <div className="p-2.5 bg-black/40 rounded border border-rose-900/60 font-sans text-[11px] text-slate-300 flex flex-col gap-1">
            <span className="font-bold text-rose-300">Quick Fix:</span>
            <span>1. Look at your browser address bar (URL bar at top).</span>
            <span>2. Click the <strong>Lock icon</strong> or <strong>Microphone icon</strong> next to the URL.</span>
            <span>3. Set <strong>Microphone</strong> to <strong>"Allow"</strong>.</span>
            <span>4. Click <strong>"Retry Connection"</strong> below.</span>
          </div>
          <button
            onClick={onConnectMic}
            className="self-start mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>RETRY CONNECTION</span>
          </button>
        </div>
      )}

      {/* Troubleshooting Collapsible */}
      {showTroubleshoot && (
        <div className="p-3 bg-[#070A0F] border border-cyan-500/30 rounded text-xs text-slate-300 font-sans flex flex-col gap-2">
          <div className="font-bold font-mono text-cyan-400">Microphone Diagnostics & System Settings:</div>
          <ul className="list-disc pl-5 flex flex-col gap-1 text-[11px] text-slate-400">
            <li><strong>Iframe & Web Sandbox:</strong> In preview environments, browser security requires you to click "Allow" on the permission prompt.</li>
            <li><strong>Windows / Mac System Privacy:</strong> Ensure your OS settings (Windows: Settings &gt; Privacy &gt; Microphone; macOS: System Settings &gt; Privacy & Security &gt; Microphone) have allowed Chrome/Edge/Firefox to access audio hardware.</li>
            <li><strong>Multiple Microphones:</strong> If you use an external headset, AirPods, or USB mic, use the device selector below to select the specific hardware.</li>
            <li><strong>Preamp Gain Boost:</strong> If your microphone is quiet, increase the "Preamp Boost" slider below up to 3.5x.</li>
          </ul>
        </div>
      )}

      {/* Live Input Meter & Device Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
        {/* Live VU Meter */}
        <div className="p-2.5 bg-[#070A0F] border border-slate-800 rounded flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">LIVE MIC INPUT LEVEL:</span>
            <span
              className={`font-bold tabular-nums ${
                metrics.micInputDbfs > -45 ? 'text-cyan-400' : 'text-slate-500'
              }`}
            >
              {micState === 'connected' && metrics.micInputDbfs > -80
                ? `${metrics.micInputDbfs.toFixed(1)} dBFS`
                : 'OFFLINE'}
            </span>
          </div>

          <div className="w-full h-3 bg-slate-950 rounded overflow-hidden flex relative">
            {/* Grid markers */}
            <div className="absolute inset-0 flex justify-between px-1 pointer-events-none opacity-20 text-[8px] font-mono">
              <span>-60</span>
              <span>-30</span>
              <span>-12</span>
              <span>0dB</span>
            </div>
            <div
              className={`h-full transition-all duration-75 ${
                meterPercent > 80
                  ? 'bg-rose-500 shadow-sm shadow-rose-500'
                  : meterPercent > 50
                  ? 'bg-amber-400'
                  : 'bg-cyan-400'
              }`}
              style={{ width: micState === 'connected' ? `${meterPercent}%` : '0%' }}
            />
          </div>
          <span className="text-[10px] text-slate-500">
            {micState === 'connected' ? (
              meterPercent > 10 ? 'Signal detected · Speak to verify' : 'Quiet · Speak into your microphone'
            ) : (
              'Connect microphone above to start capture'
            )}
          </span>
        </div>

        {/* Input Preamp Boost Slider */}
        <div className="p-2.5 bg-[#070A0F] border border-slate-800 rounded flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">MIC PREAMP GAIN BOOST:</span>
            <span className="text-amber-400 font-bold tabular-nums">{micGainBoost.toFixed(1)}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="4.0"
            step="0.1"
            value={micGainBoost}
            onChange={(e) => onMicGainBoostChange(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer mt-1"
          />
          <span className="text-[10px] text-slate-500">
            Amplify quiet laptop or headset microphones (+12 dB headroom)
          </span>
        </div>

        {/* Direct Raw Voice Monitor Toggle */}
        <div className="p-2.5 bg-[#070A0F] border border-slate-800 rounded flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">RAW VOICE LOOPBACK:</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${directMonitor ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-900 text-slate-500'}`}>
              {directMonitor ? 'ACTIVE' : 'OFF'}
            </span>
          </div>
          <button
            onClick={onToggleDirectMonitor}
            className={`w-full py-1.5 text-xs rounded border transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
              directMonitor
                ? 'bg-cyan-950/80 border-cyan-500/60 text-cyan-200'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{directMonitor ? 'TEST VOICE: PLAYING RAW' : 'TEST RAW MIC (HEAR YOURSELF)'}</span>
          </button>
        </div>
      </div>

      {/* Device Picker if multiple microphones available */}
      {devices.length > 1 && (
        <div className="flex items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] shrink-0">SELECT HARDWARE MIC:</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded px-2.5 py-1 font-mono focus:border-cyan-500 outline-none"
          >
            {devices.map((d) => (
              <option key={d.deviceId} value={d.deviceId}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
