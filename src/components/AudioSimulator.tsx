import React, { useState } from 'react';
import { Play, Square, Volume2, Sparkles, MessageSquare } from 'lucide-react';

interface AudioSimulatorProps {
  onPlayTestVoice: (text?: string) => void;
  onStopTestVoice: () => void;
  isPlaying: boolean;
}

export const AudioSimulator: React.FC<AudioSimulatorProps> = ({
  onPlayTestVoice,
  onStopTestVoice,
  isPlaying,
}) => {
  const [selectedScript, setSelectedScript] = useState<number>(0);

  const scripts = [
    {
      title: 'Confidential Conversation Sample',
      text: 'The confidential quarterly acquisition review will proceed at 0900 hours in boardroom delta. Keep all secondary credentials secure and verify perimeter acoustics.',
    },
    {
      title: 'Rapid Speech & Consonant Articulation',
      text: 'Synthesizing precision ultrasonic bursts across non-linear diaphragm structures to effectively saturate microphone preamplifiers without acoustic leakage.',
    },
    {
      title: 'Casual Meeting Chatter',
      text: 'Hey everyone, let us run through the agenda for this afternoon. We need to finalize the product release roadmap and review the telemetry metrics from yesterday.',
    },
  ];

  return (
    <div className="p-4 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-cyan-400">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
              Acoustic Simulator: Test Without Microphone
            </h3>
            <p className="text-[11px] text-slate-400">
              Inject synthesized speech to observe acoustic masking on the spectrum analyzer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isPlaying ? (
            <button
              onClick={() => onPlayTestVoice(scripts[selectedScript].text)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600/90 hover:bg-cyan-500 text-slate-950 text-xs font-mono font-bold rounded transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>TEST VOICE PLAY</span>
            </button>
          ) : (
            <button
              onClick={onStopTestVoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold rounded transition-colors cursor-pointer"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>STOP VOICE</span>
            </button>
          )}
        </div>
      </div>

      {/* Script picker */}
      <div className="flex flex-wrap gap-2">
        {scripts.map((s, idx) => (
          <button
            key={idx}
            onClick={() => {
              setSelectedScript(idx);
              if (isPlaying) {
                onPlayTestVoice(s.text);
              }
            }}
            className={`px-2.5 py-1 text-xs font-mono rounded border transition-colors cursor-pointer ${
              selectedScript === idx
                ? 'bg-slate-800 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-300'
            }`}
          >
            {s.title}
          </button>
        ))}
      </div>

      <div className="p-2.5 bg-[#070A0F] border border-slate-800/80 rounded text-xs text-slate-300 font-sans italic">
        "{scripts[selectedScript].text}"
      </div>
    </div>
  );
};
