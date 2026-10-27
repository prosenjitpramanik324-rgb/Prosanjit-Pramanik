export type JammerPreset = 
  | 'daf_classic'
  | 'privacy_shield'
  | 'ultrasonic_pulse'
  | 'babble_cloak'
  | 'acoustic_blackout'
  | 'custom';

export type NoiseType = 'pink' | 'white' | 'brown' | 'violet';
export type UltrasonicWaveform = 'sine' | 'sawtooth' | 'triangle' | 'square';

export type MicConnectionState = 'disconnected' | 'requesting' | 'connected' | 'denied' | 'error';

export interface ChannelSettings {
  // Channel 1: DAF Speech Jammer
  daf: {
    enabled: boolean;
    volume: number; // 0 to 1
    delayMs: number; // 50 to 500ms
    feedback: number; // 0 to 0.7
    noiseGateEnabled: boolean; // default false to prevent accidental muting!
    noiseGateThresholdDb: number; // -75 to -20 dB
    micGainBoost: number; // 1.0 to 4.0 digital preamp boost
    pitchModulationHz: number; // 0 to 10 Hz
    highCutHz: number; // 2000 to 10000 Hz
    directMonitor: boolean; // whether to hear dry voice along with delayed
    directMonitorVolume: number; // 0 to 1
  };

  // Channel 2: Ultrasonic MEMS Disrupter
  ultrasonic: {
    enabled: boolean;
    volume: number;
    carrierFreqHz: number; // 12000 to 22000 Hz
    sweepRangeHz: number; // 500 to 6000 Hz
    pulseRateHz: number; // 1 to 60 Hz
    waveform: UltrasonicWaveform;
    audiblePreviewMode: boolean; // lowers carrier by 1 octave to test on laptop speakers
  };

  // Channel 3: Synthetic Speech Babble
  babble: {
    enabled: boolean;
    volume: number;
    density: number; // 1 to 5 voices
    chatterSpeed: number; // 0.5 to 2.5
    reverseCadence: boolean;
    roomReverb: number; // 0 to 1
  };

  // Channel 4: Spectral Noise Shield
  noise: {
    enabled: boolean;
    volume: number;
    type: NoiseType;
    lowCutHz: number; // 20 to 1000 Hz
    highCutHz: number; // 1000 to 18000 Hz
  };

  // Channel 5: Binaural & Phase Disrupter
  binaural: {
    enabled: boolean;
    volume: number;
    baseFreqHz: number; // 100 to 800 Hz
    beatFreqHz: number; // 1 to 30 Hz
    phaseInvert: boolean;
  };
}

export interface AudioMetrics {
  masterPeakDbfs: number;
  micInputDbfs: number;
  dominantFreqHz: number;
  isGateOpen: boolean;
  isClipping: boolean;
  isMicActive: boolean;
}

export interface ReadingChallenge {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Hard' | 'Extreme';
  category: string;
  text: string;
  recommendedDelayMs: number;
  targetSeconds: number;
}

export interface MicDeviceInfo {
  deviceId: string;
  label: string;
}
