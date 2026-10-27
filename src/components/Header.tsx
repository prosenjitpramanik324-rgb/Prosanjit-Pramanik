import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Radio, Activity } from 'lucide-react';

interface HeaderProps {
  activeTab: 'console' | 'challenge' | 'science';
  setActiveTab: (tab: 'console' | 'challenge' | 'science') => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onPanicStop: () => void;
  isEngineRunning: boolean;
  isRecording: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  isMuted,
  onToggleMute,
  onPanicStop,
  isEngineRunning,
  isRecording,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800/80 bg-[#0B0F17]/90 backdrop-blur-md sticky top-0 z-50">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Radio className="w-4 h-4 animate-pulse" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-wider font-mono text-slate-100 whitespace-nowrap">
            ACOUSTIJAM
          </span>
          <span className="text-[10px] font-mono tracking-tight text-cyan-400/80 uppercase">
            Acoustic & Speech Jammer
          </span>
        </div>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-xs font-mono font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('console')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'console' ? 'text-cyan-400 border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Control Rack
        </button>
        <button
          onClick={() => setActiveTab('challenge')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'challenge' ? 'text-cyan-400 border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Speech Stutter Test
        </button>
        <button
          onClick={() => setActiveTab('science')}
          className={`hover:text-slate-100 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'science' ? 'text-cyan-400 border-b border-cyan-400 pb-0.5' : ''
          }`}
        >
          Acoustic Physics
        </button>
      </nav>

      {/* Zone 3: 1 primary action / safety cluster */}
      <div className="flex items-center gap-3 shrink-0">
        {isRecording && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-950/60 border border-rose-500/40 text-rose-400 text-[11px] font-mono">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            <span>REC</span>
          </div>
        )}

        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute Master' : 'Mute Master'}
          className={`p-2 rounded border transition-colors cursor-pointer ${
            isMuted
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white'
          }`}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onPanicStop}
          title="Emergency Stop All Sound (Spacebar)"
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-mono font-semibold text-rose-300 bg-rose-950/50 hover:bg-rose-900/60 border border-rose-600/50 rounded transition-all cursor-pointer shadow-sm shadow-rose-950/50 active:scale-95"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
          <span className="whitespace-nowrap">PANIC STOP</span>
        </button>
      </div>
    </header>
  );
};
