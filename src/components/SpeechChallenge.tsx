import React, { useState, useEffect, useRef } from 'react';
import { READING_CHALLENGES } from '../audio/challenges';
import { ReadingChallenge, AudioMetrics } from '../audio/types';
import { Play, RotateCcw, Award, CheckCircle2, Headphones, Mic, Volume2 } from 'lucide-react';

interface SpeechChallengeProps {
  onApplyDelay: (ms: number) => void;
  isMicConnected: boolean;
  onEnableMic: () => void;
  metrics: AudioMetrics;
  onStartRecording: () => void;
  onStopRecording: () => Promise<string | null>;
}

export const SpeechChallenge: React.FC<SpeechChallengeProps> = ({
  onApplyDelay,
  isMicConnected,
  onEnableMic,
  metrics,
  onStartRecording,
  onStopRecording,
}) => {
  const [selectedChallenge, setSelectedChallenge] = useState<ReadingChallenge>(READING_CHALLENGES[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [stumbles, setStumbles] = useState(0);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);

  // Auto-detect speech pauses/stumbles using gate metric
  const lastGateStateRef = useRef<boolean>(false);
  const speechPauseTimerRef = useRef<number>(0);

  useEffect(() => {
    let timer: number;
    if (isRunning) {
      timer = window.setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning]);

  // Track potential stumbles (repeated hesitations)
  useEffect(() => {
    if (!isRunning) return;

    if (lastGateStateRef.current && !metrics.isGateOpen) {
      // User paused speech
      speechPauseTimerRef.current = Date.now();
    } else if (!lastGateStateRef.current && metrics.isGateOpen) {
      // User resumed speech after pause
      if (speechPauseTimerRef.current > 0 && Date.now() - speechPauseTimerRef.current > 400) {
        setStumbles((s) => s + 1);
      }
    }
    lastGateStateRef.current = metrics.isGateOpen;
  }, [metrics.isGateOpen, isRunning]);

  const handleSelectChallenge = (ch: ReadingChallenge) => {
    setSelectedChallenge(ch);
    setIsRunning(false);
    setSecondsElapsed(0);
    setStumbles(0);
    setSessionCompleted(false);
    onApplyDelay(ch.recommendedDelayMs);
  };

  const handleStart = () => {
    if (!isMicConnected) {
      onEnableMic();
      return;
    }
    onApplyDelay(selectedChallenge.recommendedDelayMs);
    setIsRunning(true);
    setSecondsElapsed(0);
    setStumbles(0);
    setSessionCompleted(false);
    setRecordedUrl(null);
    onStartRecording();
  };

  const handleFinish = async () => {
    setIsRunning(false);
    setSessionCompleted(true);
    const url = await onStopRecording();
    if (url) {
      setRecordedUrl(url);
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setSecondsElapsed(0);
    setStumbles(0);
    setSessionCompleted(false);
    setRecordedUrl(null);
  };

  // Calculate difficulty score
  const wordCount = selectedChallenge.text.split(' ').length;
  const wordsPerMinute = secondsElapsed > 0 ? Math.round((wordCount / secondsElapsed) * 60) : 0;
  const resistanceScore = Math.max(
    10,
    Math.min(99, Math.round(100 - (secondsElapsed / selectedChallenge.targetSeconds) * 30 - stumbles * 8))
  );

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Intro Header */}
      <div className="p-4 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
            <span>SPEECH STUTTER CHALLENGE</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              DAF EXPERIMENT
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Delayed Auditory Feedback (DAF) disrupts your brain's auditory-motor speech monitor.
            Put on headphones, activate the delay, and try to read the passages below without stumbling!
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-amber-300 bg-amber-950/30 border border-amber-500/30 px-3 py-1.5 rounded">
          <Headphones className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Headphones Mandatory</span>
        </div>
      </div>

      {/* Challenge Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {READING_CHALLENGES.map((ch) => {
          const isSelected = selectedChallenge.id === ch.id;
          return (
            <button
              key={ch.id}
              onClick={() => handleSelectChallenge(ch)}
              className={`p-2.5 rounded border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-500/60 text-slate-100 shadow-sm shadow-cyan-900/20'
                  : 'bg-[#0A0E17] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[9px] font-mono uppercase px-1 rounded ${
                    ch.difficulty === 'Extreme'
                      ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                      : ch.difficulty === 'Hard'
                      ? 'bg-amber-950 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {ch.difficulty}
                </span>
                <span className="text-[10px] font-mono text-cyan-400 tabular-nums">{ch.recommendedDelayMs}ms</span>
              </div>
              <span className="text-xs font-bold font-mono truncate">{ch.title}</span>
              <span className="text-[10px] text-slate-500 truncate">{ch.category}</span>
            </button>
          );
        })}
      </div>

      {/* Prompter & Reader Box */}
      <div className="p-6 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-6 relative">
        {/* Top Challenge Metadata */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80 text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="text-cyan-400 font-bold">{selectedChallenge.title}</span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-400">Target: {selectedChallenge.targetSeconds}s</span>
            <span className="text-slate-500">·</span>
            <span className="text-amber-400">DAF Delay: {selectedChallenge.recommendedDelayMs}ms</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">TIMER:</span>
              <span className="text-base font-bold text-slate-100 tabular-nums">{secondsElapsed}s</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">PAUSES / STUMBLES:</span>
              <span className="text-base font-bold text-rose-400 tabular-nums">{stumbles}</span>
            </div>
          </div>
        </div>

        {/* Big Reading Prompt Box */}
        <div className="p-6 bg-[#070A0F] border border-slate-800 rounded-md">
          <p className="text-lg sm:text-xl font-medium text-slate-200 leading-relaxed font-sans select-none tracking-wide">
            {selectedChallenge.text}
          </p>
        </div>

        {/* Live Mic Activity Bar */}
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <Mic className={`w-3.5 h-3.5 ${metrics.isGateOpen ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-slate-400">VOICE SPEECH SENSOR:</span>
          </div>
          <div className="flex-1 h-2 bg-slate-900 rounded overflow-hidden">
            <div
              className={`h-full transition-all duration-75 ${
                metrics.isGateOpen ? 'bg-cyan-400 shadow-sm shadow-cyan-400' : 'bg-slate-700'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (metrics.micInputDbfs + 70) * 1.6))}%`,
              }}
            />
          </div>
          <span className="text-[11px] text-slate-400 tabular-nums">
            {metrics.isGateOpen ? 'DETECTED' : 'SILENCE'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-mono text-xs font-bold rounded shadow-md shadow-cyan-900/30 transition-all cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START STUTTER RUN</span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded shadow-md shadow-rose-900/30 transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>COMPLETE READING</span>
              </button>
            )}

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 rounded text-xs font-mono transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>RESET</span>
            </button>
          </div>

          {/* Recording Playback */}
          {recordedUrl && (
            <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded">
              <span className="text-xs font-mono text-slate-400">PLAYBACK RUN:</span>
              <audio src={recordedUrl} controls className="h-7 w-48 sm:w-60" />
            </div>
          )}
        </div>

        {/* Results Card if completed */}
        {sessionCompleted && (
          <div className="p-4 bg-cyan-950/30 border border-cyan-500/40 rounded-lg flex flex-col gap-3 mt-2 font-mono">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-sm">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>CHALLENGE PERFORMANCE ANALYSIS</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">TIME TAKEN:</span>
                <span className="text-base font-bold text-slate-100 tabular-nums">{secondsElapsed}s</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Target: {selectedChallenge.targetSeconds}s</span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">READING PACE:</span>
                <span className="text-base font-bold text-cyan-400 tabular-nums">{wordsPerMinute} WPM</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{wordCount} total words</span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">HESITATIONS:</span>
                <span className="text-base font-bold text-amber-400 tabular-nums">{stumbles}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">DAF vocal stalls</span>
              </div>

              <div className="p-2.5 bg-slate-900/80 rounded border border-slate-800">
                <span className="text-slate-500 text-[10px] block">JAM RESISTANCE:</span>
                <span className="text-base font-bold text-emerald-400 tabular-nums">{resistanceScore} / 100</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">Neurological Pacing</span>
              </div>
            </div>

            <p className="text-xs text-slate-300/90 font-sans mt-1">
              <strong>Observation:</strong> At {selectedChallenge.recommendedDelayMs}ms delay, the cerebellum's internal forward speech model receives delayed vocal feedback, forcing the motor cortex to repeat or prolong vowels. Notice how much slower and deliberate your speech became!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
