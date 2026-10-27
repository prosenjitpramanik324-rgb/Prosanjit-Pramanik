import React, { useState } from 'react';
import { Mic, MicOff, Play, Headphones, Disc, Download, AlertTriangle, ShieldCheck, Settings } from 'lucide-react';
import { JammerPreset, AudioMetrics, MicConnectionState } from '../audio/types';

interface MasterControlBarProps {
  isEngineActive: boolean;
  onInitAudio: () => void;
  micState: MicConnectionState;
  isMicConnected: boolean;
  onToggleMic: () => void;
  micError: string | null;
  activePreset: JammerPreset;
  onSelectPreset: (preset: JammerPreset) => void;
  masterVolume: number;
  onMasterVolumeChange: (vol: number) => void;
  metrics: AudioMetrics;
  isRecording: boolean;
  onToggleRecording: () => void;
  recordedAudioUrl: string | null;
  onOpenMicSetup?: () => void;
}

export const MasterControlBar: React.FC<MasterControlBarProps> = ({
  isEngineActive,
  onInitAudio,
  micState,
  isMicConnected,
  onToggleMic,
  micError,
  activePreset,
  onSelectPreset,
  masterVolume,
  onMasterVolumeChange,
  metrics,
  isRecording,
  onToggleRecording,
  recordedAudioUrl,
  onOpenMicSetup,
}) => {
  const [showHeadphoneTip, setShowHeadphoneTip] = useState(true);

  const presets: { id: JammerPreset; label: string; desc: string }[] = [
    { id: 'daf_classic', label: 'Classic DAF Jammer', desc: 'Real-time 200ms speech disrupter' },
    { id: 'privacy_shield', label: 'Privacy Shield', desc: 'Acoustic room mask for conversations' },
    { id: 'ultrasonic_pulse', label: 'MEMS Mic Pulse', desc: '17.5kHz high-frequency sweep' },
    { id: 'babble_cloak', label: 'Babble Cloak', desc: 'Multi-voice crowd reverse formant' },
    { id: 'acoustic_blackout', label: 'Full Spectrum Blackout', desc: 'Synchronized multi-vector jamming' },
  ];

  return (
    <div className="w-full flex flex-col gap-3">
      {/* Headphone Advice Banner */}
      {showHeadphoneTip && (
        <div className="flex items-center justify-between gap-3 px-4 py-2 bg-amber-950/20 border border-amber-500/30 rounded text-xs text-amber-300/90 font-mono">
          <div className="flex items-center gap-2">
            <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              <strong>Crucial for Speech Jamming:</strong> Wear headphones! Hearing your delayed voice through headphones directly triggers the brain's auditory-motor stutter loop, while preventing room feedback echo.
            </span>
          </div>
          <button
            onClick={() => setShowHeadphoneTip(false)}
            className="text-[11px] text-amber-400/60 hover:text-amber-300 underline cursor-pointer shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-[#0A0E17] border border-slate-800 rounded-lg">
        {/* Left Side: Audio Engine & Mic Connect */}
        <div className="flex flex-wrap items-center gap-3">
          {!isEngineActive ? (
            <button
              onClick={onInitAudio}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded shadow-lg shadow-cyan-900/30 transition-all cursor-pointer animate-pulse"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>START AUDIO ENGINE</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-950/40 border border-emerald-500/30 rounded text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>ENGINE READY</span>
            </div>
          )}

          {/* Mic Button with state badge */}
          <button
            onClick={onToggleMic}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded text-xs font-mono transition-all border cursor-pointer ${
              isMicConnected
                ? 'bg-emerald-950/50 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950/50'
                : micState === 'denied' || micState === 'error'
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 animate-pulse'
                : 'bg-cyan-950/40 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/40'
            }`}
          >
            {isMicConnected ? (
              <Mic className="w-3.5 h-3.5 text-emerald-400" />
            ) : micState === 'denied' || micState === 'error' ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span>
              {isMicConnected
                ? 'MIC ACTIVE'
                : micState === 'requesting'
                ? 'REQUESTING...'
                : micState === 'denied'
                ? 'MIC BLOCKED (FIX)'
                : 'CONNECT MICROPHONE'}
            </span>
          </button>

          {/* Mic Level VU indicator */}
          {isMicConnected && (
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-900 border border-slate-800 rounded text-xs font-mono">
              <span className="text-[10px] text-slate-500">INPUT:</span>
              <div className="w-16 h-2 bg-slate-950 rounded overflow-hidden flex">
                <div
                  className={`h-full transition-all duration-75 ${
                    metrics.micInputDbfs > -45 ? 'bg-cyan-400' : 'bg-slate-700'
                  }`}
                  style={{
                    width: `${Math.max(0, Math.min(100, (metrics.micInputDbfs + 75) * 1.5))}%`,
                  }}
                />
              </div>
              <span className="text-[10px] text-slate-400 tabular-nums">
                {metrics.micInputDbfs > -80 ? `${metrics.micInputDbfs.toFixed(0)} dB` : '-inf'}
              </span>
            </div>
          )}

          {micError && !isMicConnected && (
            <div className="flex items-center gap-1.5 text-xs text-rose-400 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate max-w-[280px]" title={micError}>
                {micError}
              </span>
            </div>
          )}
        </div>

        {/* Right Side: Recorder & Master Fader */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Recorder Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleRecording}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-colors border cursor-pointer ${
                isRecording
                  ? 'bg-rose-950/80 border-rose-500 text-rose-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Disc className={`w-3.5 h-3.5 ${isRecording ? 'text-rose-500 animate-spin' : ''}`} />
              <span>{isRecording ? 'STOP REC' : 'REC SESSION'}</span>
            </button>

            {recordedAudioUrl && (
              <a
                href={recordedAudioUrl}
                download="acoustijam-session.webm"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-xs font-mono hover:bg-cyan-900/40 transition-colors"
                title="Download Jamming Session"
              >
                <Download className="w-3 h-3" />
                <span>SAVE</span>
              </a>
            )}
          </div>

          {/* Master Volume Fader */}
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900 border border-slate-800 rounded">
            <span className="text-[10px] font-mono text-slate-500">MASTER:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-[11px] font-mono text-slate-300 tabular-nums w-8 text-right">
              {Math.round(masterVolume * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Preset Strips */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-[#0A0E17]/60 border border-slate-800/80 rounded-lg">
        <span className="text-[11px] font-mono uppercase text-slate-500 px-2">Presets:</span>
        {presets.map((p) => {
          const isActive = activePreset === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onSelectPreset(p.id)}
              title={p.desc}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-sm shadow-cyan-900/30'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              {p.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
