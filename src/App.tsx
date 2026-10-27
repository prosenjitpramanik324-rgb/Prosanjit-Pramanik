import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioJammerEngine } from './audio/AudioJammerEngine';
import { ChannelSettings, AudioMetrics, JammerPreset, MicDeviceInfo, MicConnectionState } from './audio/types';
import { Header } from './components/Header';
import { SpectrumVisualizer } from './components/SpectrumVisualizer';
import { MasterControlBar } from './components/MasterControlBar';
import { MicrophoneDiagnostics } from './components/MicrophoneDiagnostics';
import { ChannelRack } from './components/ChannelRack';
import { SpeechChallenge } from './components/SpeechChallenge';
import { AudioSimulator } from './components/AudioSimulator';
import { ScienceExplainer } from './components/ScienceExplainer';

export default function App() {
  const engineRef = useRef<AudioJammerEngine | null>(null);

  const [activeTab, setActiveTab] = useState<'console' | 'challenge' | 'science'>('console');
  const [isEngineActive, setIsEngineActive] = useState<boolean>(false);
  const [micState, setMicState] = useState<MicConnectionState>('disconnected');
  const [micError, setMicError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MicDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [masterVolume, setMasterVolume] = useState<number>(0.8);
  const [activePreset, setActivePreset] = useState<JammerPreset>('daf_classic');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isTestVoicePlaying, setIsTestVoicePlaying] = useState<boolean>(false);

  const [channelSettings, setChannelSettings] = useState<ChannelSettings>({
    daf: {
      enabled: true,
      volume: 0.95,
      delayMs: 200,
      feedback: 0.15,
      noiseGateEnabled: false, // Default to FALSE so mic is never muted accidentally!
      noiseGateThresholdDb: -65,
      micGainBoost: 1.8,
      pitchModulationHz: 1.5,
      highCutHz: 6500,
      directMonitor: false,
      directMonitorVolume: 0.5,
    },
    ultrasonic: {
      enabled: false,
      volume: 0.7,
      carrierFreqHz: 16500,
      sweepRangeHz: 2500,
      pulseRateHz: 18,
      waveform: 'sawtooth',
      audiblePreviewMode: false,
    },
    babble: {
      enabled: false,
      volume: 0.75,
      density: 3,
      chatterSpeed: 1.2,
      reverseCadence: true,
      roomReverb: 0.4,
    },
    noise: {
      enabled: false,
      volume: 0.65,
      type: 'pink',
      lowCutHz: 300,
      highCutHz: 3400,
    },
    binaural: {
      enabled: false,
      volume: 0.6,
      baseFreqHz: 220,
      beatFreqHz: 7,
      phaseInvert: false,
    },
  });

  const [metrics, setMetrics] = useState<AudioMetrics>({
    masterPeakDbfs: -100,
    micInputDbfs: -100,
    dominantFreqHz: 0,
    isGateOpen: true,
    isClipping: false,
    isMicActive: false,
  });

  // Initialize engine reference
  useEffect(() => {
    const engine = new AudioJammerEngine();
    engineRef.current = engine;

    return () => {
      engine.destroy();
    };
  }, []);

  // Real-time animation loop for metrics
  useEffect(() => {
    let animId: number;
    const updateMetrics = () => {
      if (engineRef.current) {
        setMetrics(engineRef.current.getMetrics());
        setMicState(engineRef.current.getMicState());
        setIsTestVoicePlaying(engineRef.current.getIsTestVoicePlaying());
      }
      animId = requestAnimationFrame(updateMetrics);
    };

    animId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcut: Spacebar or Escape triggers panic stop
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        e.preventDefault();
        handlePanicStop();
      } else if (e.key === 'Escape') {
        handlePanicStop();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Refresh audio device list
  const refreshDevices = useCallback(async () => {
    if (!engineRef.current) return;
    const devs = await engineRef.current.getAudioInputDevices();
    setAvailableDevices(devs);
    if (devs.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(devs[0].deviceId);
    }
  }, [selectedDeviceId]);

  // Start audio engine
  const handleInitAudio = async () => {
    if (!engineRef.current) return;
    await engineRef.current.initAudioContext();
    setIsEngineActive(true);
    engineRef.current.applyAllSettings();
    await refreshDevices();
  };

  // Connect Microphone
  const handleConnectMic = async () => {
    if (!engineRef.current) return;
    if (!isEngineActive) {
      await handleInitAudio();
    }

    setMicState('requesting');
    const result = await engineRef.current.enableMicrophone(selectedDeviceId || undefined);
    setMicState(engineRef.current.getMicState());
    setMicError(engineRef.current.getMicError());

    if (result.success) {
      engineRef.current.updateSettings({ daf: { ...channelSettings.daf, enabled: true } });
      setChannelSettings((prev) => ({
        ...prev,
        daf: { ...prev.daf, enabled: true },
      }));
      await refreshDevices();
    }
  };

  // Disconnect Microphone
  const handleDisconnectMic = () => {
    if (!engineRef.current) return;
    engineRef.current.disableMicrophone();
    setMicState('disconnected');
    setMicError(null);
    setChannelSettings((prev) => ({
      ...prev,
      daf: { ...prev.daf, enabled: false },
    }));
  };

  // Toggle Microphone
  const handleToggleMic = async () => {
    if (micState === 'connected') {
      handleDisconnectMic();
    } else {
      await handleConnectMic();
    }
  };

  // Change input device
  const handleSelectDevice = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (micState === 'connected' && engineRef.current) {
      await engineRef.current.enableMicrophone(deviceId);
    }
  };

  // Preamp Gain Boost
  const handleMicGainBoostChange = (boost: number) => {
    if (!engineRef.current) return;
    const updated = {
      ...channelSettings.daf,
      micGainBoost: boost,
    };
    engineRef.current.updateSettings({ daf: updated });
    setChannelSettings((prev) => ({ ...prev, daf: updated }));
  };

  // Toggle Direct Monitor (Hear Raw Mic)
  const handleToggleDirectMonitor = () => {
    if (!engineRef.current) return;
    const nextVal = !channelSettings.daf.directMonitor;
    const updated = {
      ...channelSettings.daf,
      directMonitor: nextVal,
    };
    engineRef.current.updateSettings({ daf: updated });
    setChannelSettings((prev) => ({ ...prev, daf: updated }));
  };

  // Master Volume
  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    if (engineRef.current) {
      engineRef.current.setMasterVolume(vol);
    }
  };

  // Master Mute
  const handleToggleMute = () => {
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    if (engineRef.current) {
      engineRef.current.setMasterMute(nextMute);
    }
  };

  // Panic Stop
  const handlePanicStop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.panicStop();
    }
    setIsMuted(true);
    setChannelSettings((prev) => ({
      daf: { ...prev.daf, enabled: false },
      ultrasonic: { ...prev.ultrasonic, enabled: false },
      babble: { ...prev.babble, enabled: false },
      noise: { ...prev.noise, enabled: false },
      binaural: { ...prev.binaural, enabled: false },
    }));
  }, []);

  // Select Preset
  const handleSelectPreset = async (preset: JammerPreset) => {
    if (!engineRef.current) return;
    if (!isEngineActive) {
      await handleInitAudio();
    }
    setActivePreset(preset);
    engineRef.current.applyPreset(preset);
    setChannelSettings(engineRef.current.getSettings());
    setIsMuted(false);
  };

  // Update Settings
  const handleUpdateSettings = async (partial: Partial<ChannelSettings>) => {
    if (!engineRef.current) return;
    if (!isEngineActive) {
      await handleInitAudio();
    }
    engineRef.current.updateSettings(partial);
    setChannelSettings(engineRef.current.getSettings());
    setActivePreset('custom');
  };

  // Delay change from speech challenge
  const handleApplyDelay = async (ms: number) => {
    if (!engineRef.current) return;
    if (!isEngineActive) {
      await handleInitAudio();
    }
    const updated = {
      ...channelSettings.daf,
      enabled: true,
      delayMs: ms,
    };
    engineRef.current.updateSettings({ daf: updated });
    setChannelSettings((prev) => ({ ...prev, daf: updated }));
  };

  // Recording
  const handleToggleRecording = async () => {
    if (!engineRef.current) return;
    if (!isRecording) {
      if (!isEngineActive) {
        await handleInitAudio();
      }
      const started = engineRef.current.startRecording();
      if (started) {
        setIsRecording(true);
        setRecordedAudioUrl(null);
      }
    } else {
      const url = await engineRef.current.stopRecording();
      setIsRecording(false);
      if (url) {
        setRecordedAudioUrl(url);
      }
    }
  };

  const handleStartRecording = () => {
    if (engineRef.current && !isRecording) {
      engineRef.current.startRecording();
      setIsRecording(true);
    }
  };

  const handleStopRecording = async (): Promise<string | null> => {
    if (engineRef.current && isRecording) {
      const url = await engineRef.current.stopRecording();
      setIsRecording(false);
      return url;
    }
    return null;
  };

  // Simulator Test Voice
  const handlePlayTestVoice = (text?: string) => {
    if (!engineRef.current) return;
    if (!isEngineActive) {
      handleInitAudio();
    }
    engineRef.current.playTestVoice(text);
    setIsTestVoicePlaying(true);
  };

  const handleStopTestVoice = () => {
    if (engineRef.current) {
      engineRef.current.stopTestVoice();
    }
    setIsTestVoicePlaying(false);
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/20 selection:text-cyan-200">
      {/* Top Bar Contract compliant navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onPanicStop={handlePanicStop}
        isEngineRunning={isEngineActive}
        isRecording={isRecording}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* Real-time Spectrum Visualizer Stage */}
        <section aria-label="Audio Visualizer">
          <SpectrumVisualizer
            analyser={engineRef.current ? engineRef.current.getMasterAnalyser() : null}
            metrics={metrics}
            isEngineActive={isEngineActive}
          />
        </section>

        {/* Master Control & Presets Strip */}
        <section aria-label="Master Controls">
          <MasterControlBar
            isEngineActive={isEngineActive}
            onInitAudio={handleInitAudio}
            micState={micState}
            isMicConnected={micState === 'connected'}
            onToggleMic={handleToggleMic}
            micError={micError}
            activePreset={activePreset}
            onSelectPreset={handleSelectPreset}
            masterVolume={masterVolume}
            onMasterVolumeChange={handleMasterVolumeChange}
            metrics={metrics}
            isRecording={isRecording}
            onToggleRecording={handleToggleRecording}
            recordedAudioUrl={recordedAudioUrl}
          />
        </section>

        {/* Dynamic View by Selected Tab */}
        {activeTab === 'console' && (
          <div className="flex flex-col gap-6">
            {/* Dedicated Hardware Microphone Diagnostics & Calibration Panel */}
            <section aria-label="Microphone Hardware Calibration">
              <MicrophoneDiagnostics
                micState={micState}
                micError={micError}
                devices={availableDevices}
                selectedDeviceId={selectedDeviceId}
                onSelectDevice={handleSelectDevice}
                onConnectMic={handleConnectMic}
                onDisconnectMic={handleDisconnectMic}
                metrics={metrics}
                micGainBoost={channelSettings.daf.micGainBoost}
                onMicGainBoostChange={handleMicGainBoostChange}
                directMonitor={channelSettings.daf.directMonitor}
                onToggleDirectMonitor={handleToggleDirectMonitor}
              />
            </section>

            <section aria-label="Channel Strips">
              <ChannelRack
                settings={channelSettings}
                onUpdateSettings={handleUpdateSettings}
                metrics={metrics}
                isMicConnected={micState === 'connected'}
                onEnableMic={handleConnectMic}
              />
            </section>

            <section aria-label="Acoustic Voice Simulator">
              <AudioSimulator
                onPlayTestVoice={handlePlayTestVoice}
                onStopTestVoice={handleStopTestVoice}
                isPlaying={isTestVoicePlaying}
              />
            </section>
          </div>
        )}

        {activeTab === 'challenge' && (
          <section aria-label="Speech Stutter Challenge">
            <SpeechChallenge
              onApplyDelay={handleApplyDelay}
              isMicConnected={micState === 'connected'}
              onEnableMic={handleConnectMic}
              metrics={metrics}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
            />
          </section>
        )}

        {activeTab === 'science' && (
          <section aria-label="Acoustic Science Principles">
            <ScienceExplainer />
          </section>
        )}
      </main>

      {/* Quiet Technical Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-[#06080D] px-6 py-4 text-xs font-mono text-slate-500 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span>AcoustiJam Sound & Speech Jammer</span>
          <span aria-hidden="true">·</span>
          <span>Web Audio API DAF Synthesis</span>
          <span aria-hidden="true">·</span>
          <span>Sample Rate: 48,000 Hz</span>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <span>Emergency Stop: Press Spacebar or Esc</span>
        </div>
      </footer>
    </div>
  );
}
