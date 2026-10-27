import React from 'react';
import { ChannelSettings, AudioMetrics, UltrasonicWaveform, NoiseType } from '../audio/types';
import { Mic, Zap, Users, Shield, Radio, Volume2, Info, Headphones } from 'lucide-react';

interface ChannelRackProps {
  settings: ChannelSettings;
  onUpdateSettings: (newSettings: Partial<ChannelSettings>) => void;
  metrics: AudioMetrics;
  isMicConnected: boolean;
  onEnableMic: () => void;
}

export const ChannelRack: React.FC<ChannelRackProps> = ({
  settings,
  onUpdateSettings,
  metrics,
  isMicConnected,
  onEnableMic,
}) => {
  const updateDaf = (partial: Partial<ChannelSettings['daf']>) => {
    onUpdateSettings({ daf: { ...settings.daf, ...partial } });
  };

  const updateUltrasonic = (partial: Partial<ChannelSettings['ultrasonic']>) => {
    onUpdateSettings({ ultrasonic: { ...settings.ultrasonic, ...partial } });
  };

  const updateBabble = (partial: Partial<ChannelSettings['babble']>) => {
    onUpdateSettings({ babble: { ...settings.babble, ...partial } });
  };

  const updateNoise = (partial: Partial<ChannelSettings['noise']>) => {
    onUpdateSettings({ noise: { ...settings.noise, ...partial } });
  };

  const updateBinaural = (partial: Partial<ChannelSettings['binaural']>) => {
    onUpdateSettings({ binaural: { ...settings.binaural, ...partial } });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* CHANNEL 1: DAF SPEECH JAMMER */}
      <div className="p-4 bg-[#0A0E17] border border-cyan-500/30 rounded-lg flex flex-col gap-3 relative shadow-sm">
        {/* Strip Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                <span>01. DAF SPEECH JAMMER</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-500/30">
                  PRIMARY
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">Delayed Auditory Feedback disrupter</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.daf.enabled}
              onChange={(e) => updateDaf({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-cyan-500"></div>
          </label>
        </div>

        {/* Mic connection warning if disabled */}
        {!isMicConnected && settings.daf.enabled && (
          <div className="p-2.5 bg-amber-950/30 border border-amber-500/40 rounded text-xs text-amber-300 font-mono flex items-center justify-between gap-2">
            <span>Microphone required for speech jamming</span>
            <button
              onClick={onEnableMic}
              className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded text-[11px] text-amber-200 cursor-pointer"
            >
              Connect
            </button>
          </div>
        )}

        {/* Parameter: Delay Time Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">FEEDBACK DELAY:</span>
            <span className="text-cyan-400 font-bold tabular-nums">{settings.daf.delayMs} ms</span>
          </div>
          <input
            type="range"
            min="50"
            max="450"
            step="5"
            value={settings.daf.delayMs}
            onChange={(e) => updateDaf({ delayMs: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          {/* Quick preset buttons for DAF sweet spots */}
          <div className="flex items-center justify-between gap-1 pt-1">
            {[
              { ms: 175, label: '175ms (Fast)' },
              { ms: 200, label: '200ms (Gold)' },
              { ms: 220, label: '220ms (Severe)' },
            ].map((b) => (
              <button
                key={b.ms}
                onClick={() => updateDaf({ delayMs: b.ms })}
                className={`flex-1 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  settings.daf.delayMs === b.ms
                    ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                {b.label}
              </button>
            ))}
          </div>
        </div>

        {/* Parameter: Echo Feedback & Noise Gate */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">FEEDBACK:</span>
              <span className="text-slate-200 tabular-nums">{Math.round(settings.daf.feedback * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="0.5"
              step="0.02"
              value={settings.daf.feedback}
              onChange={(e) => updateDaf({ feedback: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <button
                type="button"
                onClick={() => updateDaf({ noiseGateEnabled: !settings.daf.noiseGateEnabled })}
                className={`text-[10px] underline cursor-pointer ${
                  settings.daf.noiseGateEnabled ? 'text-amber-400 font-bold' : 'text-slate-400'
                }`}
              >
                GATE: {settings.daf.noiseGateEnabled ? 'ON' : 'BYPASSED'}
              </button>
              <span className="text-slate-200 tabular-nums">
                {settings.daf.noiseGateEnabled ? `${settings.daf.noiseGateThresholdDb} dB` : 'OPEN'}
              </span>
            </div>
            {settings.daf.noiseGateEnabled ? (
              <input
                type="range"
                min="-75"
                max="-25"
                step="1"
                value={settings.daf.noiseGateThresholdDb}
                onChange={(e) => updateDaf({ noiseGateThresholdDb: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
              />
            ) : (
              <div className="text-[10px] text-emerald-400/90 font-mono py-0.5">
                Always open (no speech gating)
              </div>
            )}
          </div>
        </div>

        {/* Preamp Boost & High Cut */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">MIC BOOST:</span>
              <span className="text-amber-400 font-bold tabular-nums">{settings.daf.micGainBoost.toFixed(1)}x</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.1"
              value={settings.daf.micGainBoost}
              onChange={(e) => updateDaf({ micGainBoost: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">HIGH-CUT:</span>
              <span className="text-slate-200 tabular-nums">{(settings.daf.highCutHz / 1000).toFixed(1)} kHz</span>
            </div>
            <input
              type="range"
              min="2500"
              max="9000"
              step="250"
              value={settings.daf.highCutHz}
              onChange={(e) => updateDaf({ highCutHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Channel Volume & Dry Monitor */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-slate-500 text-[11px]">GAIN:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={settings.daf.volume}
              onChange={(e) => updateDaf({ volume: parseFloat(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
            <span className="text-slate-300 tabular-nums text-[11px] w-7 text-right">
              {Math.round(settings.daf.volume * 100)}%
            </span>
          </div>

          <button
            onClick={() => updateDaf({ directMonitor: !settings.daf.directMonitor })}
            className={`px-2 py-1 text-[10px] rounded border transition-colors cursor-pointer whitespace-nowrap ${
              settings.daf.directMonitor
                ? 'bg-cyan-950/60 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
          >
            {settings.daf.directMonitor ? 'DRY MONITOR: ON' : 'DRY MONITOR: OFF'}
          </button>
        </div>
      </div>

      {/* CHANNEL 2: ULTRASONIC MEMS DISRUPTER */}
      <div className="p-4 bg-[#0A0E17] border border-amber-500/30 rounded-lg flex flex-col gap-3 relative shadow-sm">
        {/* Strip Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-amber-950/60 border border-amber-500/30 text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                <span>02. ULTRASONIC MEMS PULSE</span>
              </h3>
              <p className="text-[11px] text-slate-400">Overloads microphone preamplifiers</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.ultrasonic.enabled}
              onChange={(e) => updateUltrasonic({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {/* Carrier Frequency Slider */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">CARRIER FREQUENCY:</span>
            <span className="text-amber-400 font-bold tabular-nums">
              {(settings.ultrasonic.carrierFreqHz / 1000).toFixed(1)} kHz
            </span>
          </div>
          <input
            type="range"
            min="12000"
            max="21000"
            step="200"
            value={settings.ultrasonic.carrierFreqHz}
            onChange={(e) => updateUltrasonic({ carrierFreqHz: parseInt(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        {/* Pulse Rate & Sweep Width */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">BURST RATE:</span>
              <span className="text-slate-200 tabular-nums">{settings.ultrasonic.pulseRateHz} Hz</span>
            </div>
            <input
              type="range"
              min="1"
              max="50"
              step="1"
              value={settings.ultrasonic.pulseRateHz}
              onChange={(e) => updateUltrasonic({ pulseRateHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">SWEEP WIDTH:</span>
              <span className="text-slate-200 tabular-nums">±{settings.ultrasonic.sweepRangeHz} Hz</span>
            </div>
            <input
              type="range"
              min="500"
              max="5000"
              step="250"
              value={settings.ultrasonic.sweepRangeHz}
              onChange={(e) => updateUltrasonic({ sweepRangeHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Waveform Selector & Audible Preview Mode */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-1">
            {(['sawtooth', 'sine', 'square'] as UltrasonicWaveform[]).map((wf) => (
              <button
                key={wf}
                onClick={() => updateUltrasonic({ waveform: wf })}
                className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer uppercase ${
                  settings.ultrasonic.waveform === wf
                    ? 'bg-amber-950/80 text-amber-300 border-amber-500/50'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {wf}
              </button>
            ))}
          </div>

          <button
            onClick={() =>
              updateUltrasonic({ audiblePreviewMode: !settings.ultrasonic.audiblePreviewMode })
            }
            title="Halves frequency so human ears can hear the jamming pattern on normal speakers"
            className={`px-2 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
              settings.ultrasonic.audiblePreviewMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
          >
            {settings.ultrasonic.audiblePreviewMode ? 'AUDIBLE PREVIEW: ON' : 'PREVIEW: OFF'}
          </button>
        </div>

        {/* Gain Slider */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">GAIN:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={settings.ultrasonic.volume}
            onChange={(e) => updateUltrasonic({ volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-slate-300 tabular-nums text-[11px] w-7 text-right">
            {Math.round(settings.ultrasonic.volume * 100)}%
          </span>
        </div>
      </div>

      {/* CHANNEL 3: SYNTHETIC BABBLE CLOAK */}
      <div className="p-4 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3 relative shadow-sm">
        {/* Strip Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <Users className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                <span>03. SYNTHETIC BABBLE CLOAK</span>
              </h3>
              <p className="text-[11px] text-slate-400">Multi-voice formant cocktail chatter</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.babble.enabled}
              onChange={(e) => updateBabble({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-500"></div>
          </label>
        </div>

        {/* Chatter Speed */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">CHATTER CADENCE:</span>
            <span className="text-sky-400 font-bold tabular-nums">
              {settings.babble.chatterSpeed.toFixed(1)}x Speed
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={settings.babble.chatterSpeed}
            onChange={(e) => updateBabble({ chatterSpeed: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        {/* Density & Reverse Cadence */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1">
            <span className="text-[11px] font-mono text-slate-400">DENSITY:</span>
            {[2, 3, 4, 5].map((d) => (
              <button
                key={d}
                onClick={() => updateBabble({ density: d })}
                className={`w-6 h-6 text-[10px] font-mono rounded border flex items-center justify-center cursor-pointer ${
                  settings.babble.density === d
                    ? 'bg-sky-950/80 text-sky-300 border-sky-500/50'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          <button
            onClick={() => updateBabble({ reverseCadence: !settings.babble.reverseCadence })}
            className={`px-2.5 py-1 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
              settings.babble.reverseCadence
                ? 'bg-sky-950/60 text-sky-300 border-sky-500/40'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            {settings.babble.reverseCadence ? 'REVERSE FORMANTS' : 'STANDARD FORMANTS'}
          </button>
        </div>

        {/* Gain Slider */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono mt-auto">
          <span className="text-slate-500 text-[11px]">GAIN:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={settings.babble.volume}
            onChange={(e) => updateBabble({ volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-slate-300 tabular-nums text-[11px] w-7 text-right">
            {Math.round(settings.babble.volume * 100)}%
          </span>
        </div>
      </div>

      {/* CHANNEL 4: SPECTRAL NOISE SHIELD */}
      <div className="p-4 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3 relative shadow-sm">
        {/* Strip Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <Shield className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                <span>04. SPECTRAL NOISE SHIELD</span>
              </h3>
              <p className="text-[11px] text-slate-400">Full-frequency acoustic masking</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.noise.enabled}
              onChange={(e) => updateNoise({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* Noise Type Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-mono text-slate-400">TYPE:</span>
          {(['pink', 'white', 'brown', 'violet'] as NoiseType[]).map((t) => (
            <button
              key={t}
              onClick={() => updateNoise({ type: t })}
              className={`flex-1 py-1 text-[11px] font-mono rounded border transition-colors cursor-pointer uppercase ${
                settings.noise.type === t
                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                  : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Low-Cut and High-Cut Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">LOW CUT:</span>
              <span className="text-slate-200 tabular-nums">{settings.noise.lowCutHz} Hz</span>
            </div>
            <input
              type="range"
              min="20"
              max="1000"
              step="20"
              value={settings.noise.lowCutHz}
              onChange={(e) => updateNoise({ lowCutHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">HIGH CUT:</span>
              <span className="text-slate-200 tabular-nums">{settings.noise.highCutHz} Hz</span>
            </div>
            <input
              type="range"
              min="1000"
              max="16000"
              step="500"
              value={settings.noise.highCutHz}
              onChange={(e) => updateNoise({ highCutHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Gain Slider */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono mt-auto">
          <span className="text-slate-500 text-[11px]">GAIN:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={settings.noise.volume}
            onChange={(e) => updateNoise({ volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-slate-300 tabular-nums text-[11px] w-7 text-right">
            {Math.round(settings.noise.volume * 100)}%
          </span>
        </div>
      </div>

      {/* CHANNEL 5: BINAURAL & PHASE DISRUPTER */}
      <div className="p-4 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3 relative shadow-sm">
        {/* Strip Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
              <Radio className="w-4 h-4 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-mono text-slate-100 flex items-center gap-1.5">
                <span>05. BINAURAL PHASE DISRUPTER</span>
              </h3>
              <p className="text-[11px] text-slate-400">Defeats beamforming mic arrays</p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.binaural.enabled}
              onChange={(e) => updateBinaural({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-500"></div>
          </label>
        </div>

        {/* Base Frequency & Beat Delta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">BASE TONE:</span>
              <span className="text-purple-400 font-bold tabular-nums">{settings.binaural.baseFreqHz} Hz</span>
            </div>
            <input
              type="range"
              min="100"
              max="500"
              step="10"
              value={settings.binaural.baseFreqHz}
              onChange={(e) => updateBinaural({ baseFreqHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">BEAT DRIFT:</span>
              <span className="text-slate-200 tabular-nums">+{settings.binaural.beatFreqHz} Hz</span>
            </div>
            <input
              type="range"
              min="1"
              max="25"
              step="1"
              value={settings.binaural.beatFreqHz}
              onChange={(e) => updateBinaural({ beatFreqHz: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Disorientation Info */}
        <div className="p-2 bg-purple-950/20 border border-purple-500/20 rounded text-[11px] text-purple-300/80 font-mono">
          Stereo interaural phase disparity disrupts automated beamforming spatial filters used in smartphones.
        </div>

        {/* Gain Slider */}
        <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2 text-xs font-mono mt-auto">
          <span className="text-slate-500 text-[11px]">GAIN:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={settings.binaural.volume}
            onChange={(e) => updateBinaural({ volume: parseFloat(e.target.value) })}
            className="w-full h-1.5 bg-slate-800 rounded cursor-pointer"
          />
          <span className="text-slate-300 tabular-nums text-[11px] w-7 text-right">
            {Math.round(settings.binaural.volume * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
