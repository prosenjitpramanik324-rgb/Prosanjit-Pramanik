import { ChannelSettings, AudioMetrics, JammerPreset, NoiseType, MicDeviceInfo, MicConnectionState } from './types';

export class AudioJammerEngine {
  private ctx: AudioContext | null = null;
  private isRunning: boolean = false;
  private masterGain: GainNode | null = null;
  private masterMuted: boolean = false;
  private masterVolume: number = 0.8;
  private limiter: DynamicsCompressorNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;
  private micAnalyser: AnalyserNode | null = null;

  // Recording
  private destNode: MediaStreamAudioDestinationNode | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];

  // Channel 1: DAF Speech Jammer
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private micPreampGain: GainNode | null = null;
  private micHighPass: BiquadFilterNode | null = null;
  private micLowPass: BiquadFilterNode | null = null;
  private dafDelayNode: DelayNode | null = null;
  private dafFeedbackGain: GainNode | null = null;
  private dafGateGain: GainNode | null = null;
  private dafPitchMod: OscillatorNode | null = null;
  private dafPitchModGain: GainNode | null = null;
  private dafChannelGain: GainNode | null = null;
  private dafDryGain: GainNode | null = null;

  // Channel 2: Ultrasonic MEMS Disrupter
  private ultrasonicOsc: OscillatorNode | null = null;
  private ultrasonicLfo: OscillatorNode | null = null;
  private ultrasonicLfoGain: GainNode | null = null;
  private ultrasonicPulseGain: GainNode | null = null;
  private ultrasonicPulseLfo: OscillatorNode | null = null;
  private ultrasonicChannelGain: GainNode | null = null;

  // Channel 3: Synthetic Babble
  private babbleNoiseSource: AudioBufferSourceNode | null = null;
  private babbleFilter1: BiquadFilterNode | null = null;
  private babbleFilter2: BiquadFilterNode | null = null;
  private babbleFilter3: BiquadFilterNode | null = null;
  private babbleLfo: OscillatorNode | null = null;
  private babbleLfoGain: GainNode | null = null;
  private babbleChannelGain: GainNode | null = null;

  // Channel 4: Spectral Noise Shield
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseLowCut: BiquadFilterNode | null = null;
  private noiseHighCut: BiquadFilterNode | null = null;
  private noiseChannelGain: GainNode | null = null;

  // Channel 5: Binaural & Phase Disrupter
  private binauralLeftOsc: OscillatorNode | null = null;
  private binauralRightOsc: OscillatorNode | null = null;
  private binauralMerger: ChannelMergerNode | null = null;
  private binauralChannelGain: GainNode | null = null;

  // Built-in speech synth test loop
  private isTestVoicePlaying: boolean = false;
  private testSpeechUtterance: SpeechSynthesisUtterance | null = null;

  // Current channel settings
  private settings: ChannelSettings = {
    daf: {
      enabled: true,
      volume: 0.95,
      delayMs: 200,
      feedback: 0.15,
      noiseGateEnabled: false, // Default to FALSE so mic is NEVER accidentally blocked!
      noiseGateThresholdDb: -65,
      micGainBoost: 1.8, // 1.8x digital preamp boost for clear vocal signal
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
  };

  private micState: MicConnectionState = 'disconnected';
  private micError: string | null = null;
  private selectedDeviceId: string | null = null;
  private micDataArray: Float32Array = new Float32Array(512);

  constructor() {
    // Lazy initialized on first user click
  }

  public async initAudioContext(): Promise<boolean> {
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
      }

      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }

      this.setupMasterBus();
      this.isRunning = true;
      return true;
    } catch (e) {
      console.error('AudioContext init error:', e);
      return false;
    }
  }

  private setupMasterBus() {
    if (!this.ctx) return;

    if (!this.masterGain) {
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterMuted ? 0 : this.masterVolume, this.ctx.currentTime);
    }

    if (!this.limiter) {
      this.limiter = this.ctx.createDynamicsCompressor();
      this.limiter.threshold.setValueAtTime(-2, this.ctx.currentTime);
      this.limiter.knee.setValueAtTime(6, this.ctx.currentTime);
      this.limiter.ratio.setValueAtTime(20, this.ctx.currentTime);
      this.limiter.attack.setValueAtTime(0.002, this.ctx.currentTime);
      this.limiter.release.setValueAtTime(0.1, this.ctx.currentTime);
    }

    if (!this.masterAnalyser) {
      this.masterAnalyser = this.ctx.createAnalyser();
      this.masterAnalyser.fftSize = 2048;
      this.masterAnalyser.smoothingTimeConstant = 0.8;
    }

    if (!this.micAnalyser) {
      this.micAnalyser = this.ctx.createAnalyser();
      this.micAnalyser.fftSize = 512;
      this.micAnalyser.smoothingTimeConstant = 0.2;
    }

    if (!this.destNode) {
      this.destNode = this.ctx.createMediaStreamDestination();
    }

    try {
      this.masterGain.disconnect();
      this.limiter.disconnect();
      this.masterAnalyser.disconnect();
    } catch {
      // ignore
    }

    this.masterGain.connect(this.limiter);
    this.limiter.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
    this.masterAnalyser.connect(this.destNode);
  }

  private makeSoftClipCurve(): Float32Array {
    const k = 2;
    const n = 1024;
    const curve = new Float32Array(n);
    const deg = Math.PI / 180;
    for (let i = 0; i < n; ++i) {
      const x = (i * 2) / n - 1;
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
    return curve;
  }

  // Enumerate audio input devices
  public async getAudioInputDevices(): Promise<MicDeviceInfo[]> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return [];
    }
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices
        .filter((d) => d.kind === 'audioinput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${index + 1}`,
        }));
    } catch {
      return [];
    }
  }

  // Robust Microphone Connection with Multiple Fallbacks
  public async enableMicrophone(deviceId?: string): Promise<{ success: boolean; error?: string }> {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.micState = 'error';
      this.micError = 'Your browser does not support microphone audio capture (navigator.mediaDevices is unavailable).';
      return { success: false, error: this.micError };
    }

    if (!this.ctx) {
      await this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.micState = 'requesting';
    this.micError = null;
    if (deviceId) {
      this.selectedDeviceId = deviceId;
    }

    // Stop existing mic stream if any
    this.stopMicrophoneStream();

    let stream: MediaStream | null = null;

    // Strategy 1: Preferred low-latency constraints for DAF
    try {
      const preferredConstraints: MediaStreamConstraints = {
        audio: this.selectedDeviceId
          ? {
              deviceId: { exact: this.selectedDeviceId },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            }
          : {
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
      };

      stream = await navigator.mediaDevices.getUserMedia(preferredConstraints);
    } catch (prefErr: unknown) {
      console.warn('Preferred mic constraints failed, attempting fallback audio constraints:', prefErr);

      // Strategy 2: If overconstrained, try with basic audio: true or deviceId without advanced flags
      try {
        const fallbackConstraints: MediaStreamConstraints = {
          audio: this.selectedDeviceId ? { deviceId: { exact: this.selectedDeviceId } } : true,
        };
        stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      } catch (fallbackErr: unknown) {
        // Strategy 3: Absolute simplest audio: true
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch (finalErr: unknown) {
          const err = finalErr as { name?: string; message?: string };
          console.error('All getUserMedia attempts failed:', err);

          if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
            this.micState = 'denied';
            this.micError = 'Microphone permission denied. Please click the lock icon in your browser address bar and allow microphone access.';
          } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
            this.micState = 'error';
            this.micError = 'No microphone device was detected on your computer. Please connect a headset or microphone.';
          } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
            this.micState = 'error';
            this.micError = 'Microphone is currently in use by another app (e.g. Zoom, Teams, Meet) or driver error.';
          } else {
            this.micState = 'error';
            this.micError = err.message || 'Failed to access microphone.';
          }

          return { success: false, error: this.micError };
        }
      }
    }

    if (!stream) {
      this.micState = 'error';
      this.micError = 'No audio stream returned by browser.';
      return { success: false, error: this.micError };
    }

    this.micStream = stream;
    this.micState = 'connected';
    this.micError = null;

    // Check track state
    const audioTrack = stream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = true;
      audioTrack.onended = () => {
        this.micState = 'disconnected';
      };
    }

    this.setupDafNodes();
    return { success: true };
  }

  private stopMicrophoneStream() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      this.micStream = null;
    }
  }

  public disableMicrophone() {
    this.stopMicrophoneStream();
    this.cleanupDafNodes();
    this.micState = 'disconnected';
  }

  private setupDafNodes() {
    if (!this.ctx || !this.micStream || !this.masterGain) return;

    this.cleanupDafNodes();

    try {
      this.micSource = this.ctx.createMediaStreamSource(this.micStream);

      // Preamp Gain Boost: multiplies mic signal so quiet mics sound loud & clear
      this.micPreampGain = this.ctx.createGain();
      this.micPreampGain.gain.setValueAtTime(this.settings.daf.micGainBoost, this.ctx.currentTime);

      // Dedicated mic analyser taps directly after preamp so input level meter reacts immediately
      if (this.micAnalyser) {
        this.micPreampGain.connect(this.micAnalyser);
      }

      // Highpass filter: removes 80Hz rumble/handling noise
      this.micHighPass = this.ctx.createBiquadFilter();
      this.micHighPass.type = 'highpass';
      this.micHighPass.frequency.setValueAtTime(80, this.ctx.currentTime);

      // Lowpass filter: prevents high-frequency acoustic whistle
      this.micLowPass = this.ctx.createBiquadFilter();
      this.micLowPass.type = 'lowpass';
      this.micLowPass.frequency.setValueAtTime(this.settings.daf.highCutHz, this.ctx.currentTime);

      // Gate gain: if gate is disabled, this stays 1.0 (always open)
      this.dafGateGain = this.ctx.createGain();
      const initialGate = this.settings.daf.noiseGateEnabled ? 0 : 1.0;
      this.dafGateGain.gain.setValueAtTime(initialGate, this.ctx.currentTime);

      // Precision Delay Node
      this.dafDelayNode = this.ctx.createDelay(1.0);
      this.dafDelayNode.delayTime.setValueAtTime(this.settings.daf.delayMs / 1000, this.ctx.currentTime);

      // Feedback loop with soft saturator
      this.dafFeedbackGain = this.ctx.createGain();
      this.dafFeedbackGain.gain.setValueAtTime(this.settings.daf.feedback, this.ctx.currentTime);

      const softClipper = this.ctx.createWaveShaper();
      softClipper.curve = this.makeSoftClipCurve() as unknown as Float32Array<ArrayBuffer>;
      softClipper.oversample = '2x';

      // Pitch detune / vibrato modulator
      this.dafPitchMod = this.ctx.createOscillator();
      this.dafPitchMod.frequency.setValueAtTime(this.settings.daf.pitchModulationHz, this.ctx.currentTime);
      this.dafPitchModGain = this.ctx.createGain();
      this.dafPitchModGain.gain.setValueAtTime(0.002, this.ctx.currentTime);
      this.dafPitchMod.connect(this.dafPitchModGain);
      this.dafPitchModGain.connect(this.dafDelayNode.delayTime);
      this.dafPitchMod.start();

      // Channel output gain (Wet delayed signal)
      this.dafChannelGain = this.ctx.createGain();
      const effectiveVol = this.settings.daf.enabled ? this.settings.daf.volume : 0;
      this.dafChannelGain.gain.setValueAtTime(effectiveVol, this.ctx.currentTime);

      // Direct dry monitor gain (immediate raw voice for testing or loopback)
      this.dafDryGain = this.ctx.createGain();
      const dryVol = (this.settings.daf.enabled && this.settings.daf.directMonitor) 
        ? this.settings.daf.directMonitorVolume 
        : 0;
      this.dafDryGain.gain.setValueAtTime(dryVol, this.ctx.currentTime);

      // Chain 1: micSource -> micPreampGain
      this.micSource.connect(this.micPreampGain);

      // Chain 2: micPreampGain -> micHighPass -> micLowPass -> dafGateGain
      this.micPreampGain.connect(this.micHighPass);
      this.micHighPass.connect(this.micLowPass);
      this.micLowPass.connect(this.dafGateGain);

      // Wet delayed route: dafGateGain -> dafDelayNode -> dafChannelGain -> masterGain
      this.dafGateGain.connect(this.dafDelayNode);
      this.dafDelayNode.connect(this.dafChannelGain);
      this.dafChannelGain.connect(this.masterGain);

      // Feedback loop: dafDelayNode -> dafFeedbackGain -> softClipper -> dafDelayNode
      this.dafDelayNode.connect(this.dafFeedbackGain);
      this.dafFeedbackGain.connect(softClipper);
      softClipper.connect(this.dafDelayNode);

      // Direct dry monitor route: micPreampGain -> dafDryGain -> masterGain
      this.micPreampGain.connect(this.dafDryGain);
      this.dafDryGain.connect(this.masterGain);
    } catch (e) {
      console.error('Error setting up DAF nodes:', e);
    }
  }

  private cleanupDafNodes() {
    try {
      this.micSource?.disconnect();
      this.micPreampGain?.disconnect();
      this.micHighPass?.disconnect();
      this.micLowPass?.disconnect();
      this.dafDelayNode?.disconnect();
      this.dafFeedbackGain?.disconnect();
      this.dafGateGain?.disconnect();
      this.dafPitchMod?.stop();
      this.dafPitchMod?.disconnect();
      this.dafPitchModGain?.disconnect();
      this.dafChannelGain?.disconnect();
      this.dafDryGain?.disconnect();
    } catch {
      // ignore
    }
  }

  // Ultrasonic Channel
  public updateUltrasonic() {
    if (!this.ctx || !this.masterGain) return;

    const u = this.settings.ultrasonic;
    if (!u.enabled) {
      if (this.ultrasonicChannelGain) {
        this.ultrasonicChannelGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    const carrier = u.audiblePreviewMode ? u.carrierFreqHz / 2 : u.carrierFreqHz;

    if (!this.ultrasonicOsc) {
      this.ultrasonicOsc = this.ctx.createOscillator();
      this.ultrasonicOsc.type = u.waveform;
      this.ultrasonicOsc.frequency.setValueAtTime(carrier, this.ctx.currentTime);

      this.ultrasonicLfo = this.ctx.createOscillator();
      this.ultrasonicLfo.type = 'sawtooth';
      this.ultrasonicLfo.frequency.setValueAtTime(u.pulseRateHz, this.ctx.currentTime);

      this.ultrasonicLfoGain = this.ctx.createGain();
      this.ultrasonicLfoGain.gain.setValueAtTime(u.sweepRangeHz, this.ctx.currentTime);
      this.ultrasonicLfo.connect(this.ultrasonicLfoGain);
      this.ultrasonicLfoGain.connect(this.ultrasonicOsc.frequency);

      this.ultrasonicPulseGain = this.ctx.createGain();
      this.ultrasonicPulseLfo = this.ctx.createOscillator();
      this.ultrasonicPulseLfo.type = 'square';
      this.ultrasonicPulseLfo.frequency.setValueAtTime(u.pulseRateHz * 1.5, this.ctx.currentTime);

      const pulseAmp = this.ctx.createGain();
      pulseAmp.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.ultrasonicPulseLfo.connect(pulseAmp);
      pulseAmp.connect(this.ultrasonicPulseGain.gain);

      this.ultrasonicChannelGain = this.ctx.createGain();
      this.ultrasonicChannelGain.gain.setValueAtTime(u.volume, this.ctx.currentTime);

      this.ultrasonicOsc.connect(this.ultrasonicPulseGain);
      this.ultrasonicPulseGain.connect(this.ultrasonicChannelGain);
      this.ultrasonicChannelGain.connect(this.masterGain);

      this.ultrasonicOsc.start();
      this.ultrasonicLfo.start();
      this.ultrasonicPulseLfo.start();
    } else {
      this.ultrasonicOsc.type = u.waveform;
      this.ultrasonicOsc.frequency.setTargetAtTime(carrier, this.ctx.currentTime, 0.05);
      if (this.ultrasonicLfo) {
        this.ultrasonicLfo.frequency.setTargetAtTime(u.pulseRateHz, this.ctx.currentTime, 0.05);
      }
      if (this.ultrasonicLfoGain) {
        this.ultrasonicLfoGain.gain.setTargetAtTime(u.sweepRangeHz, this.ctx.currentTime, 0.05);
      }
      if (this.ultrasonicPulseLfo) {
        this.ultrasonicPulseLfo.frequency.setTargetAtTime(u.pulseRateHz * 1.5, this.ctx.currentTime, 0.05);
      }
      if (this.ultrasonicChannelGain) {
        this.ultrasonicChannelGain.gain.setTargetAtTime(u.volume, this.ctx.currentTime, 0.05);
      }
    }
  }

  // Babble Channel
  public updateBabble() {
    if (!this.ctx || !this.masterGain) return;

    const b = this.settings.babble;
    if (!b.enabled) {
      if (this.babbleChannelGain) {
        this.babbleChannelGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    if (!this.babbleNoiseSource) {
      const sampleRate = this.ctx.sampleRate;
      const bufferLength = sampleRate * 4;
      const buffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
      const data = buffer.getChannelData(0);

      for (let i = 0; i < bufferLength; i++) {
        const t = i / sampleRate;
        const envelope = Math.sin(t * Math.PI * 4 * b.chatterSpeed) * 0.5 + 0.5;
        data[i] = (Math.random() * 2 - 1) * envelope;
      }

      this.babbleNoiseSource = this.ctx.createBufferSource();
      this.babbleNoiseSource.buffer = buffer;
      this.babbleNoiseSource.loop = true;

      this.babbleFilter1 = this.ctx.createBiquadFilter();
      this.babbleFilter1.type = 'bandpass';
      this.babbleFilter1.frequency.setValueAtTime(550, this.ctx.currentTime);
      this.babbleFilter1.Q.setValueAtTime(4.0, this.ctx.currentTime);

      this.babbleFilter2 = this.ctx.createBiquadFilter();
      this.babbleFilter2.type = 'bandpass';
      this.babbleFilter2.frequency.setValueAtTime(1450, this.ctx.currentTime);
      this.babbleFilter2.Q.setValueAtTime(3.5, this.ctx.currentTime);

      this.babbleFilter3 = this.ctx.createBiquadFilter();
      this.babbleFilter3.type = 'bandpass';
      this.babbleFilter3.frequency.setValueAtTime(2600, this.ctx.currentTime);
      this.babbleFilter3.Q.setValueAtTime(3.0, this.ctx.currentTime);

      this.babbleLfo = this.ctx.createOscillator();
      this.babbleLfo.frequency.setValueAtTime(3.5 * b.chatterSpeed, this.ctx.currentTime);
      this.babbleLfoGain = this.ctx.createGain();
      this.babbleLfoGain.gain.setValueAtTime(400, this.ctx.currentTime);
      this.babbleLfo.connect(this.babbleLfoGain);
      this.babbleLfoGain.connect(this.babbleFilter2.frequency);

      this.babbleChannelGain = this.ctx.createGain();
      this.babbleChannelGain.gain.setValueAtTime(b.volume, this.ctx.currentTime);

      this.babbleNoiseSource.connect(this.babbleFilter1);
      this.babbleNoiseSource.connect(this.babbleFilter2);
      this.babbleNoiseSource.connect(this.babbleFilter3);

      this.babbleFilter1.connect(this.babbleChannelGain);
      this.babbleFilter2.connect(this.babbleChannelGain);
      this.babbleFilter3.connect(this.babbleChannelGain);

      this.babbleChannelGain.connect(this.masterGain);

      this.babbleNoiseSource.start();
      this.babbleLfo.start();
    } else {
      if (this.babbleChannelGain) {
        this.babbleChannelGain.gain.setTargetAtTime(b.volume, this.ctx.currentTime, 0.05);
      }
      if (this.babbleLfo) {
        this.babbleLfo.frequency.setTargetAtTime(3.5 * b.chatterSpeed, this.ctx.currentTime, 0.05);
      }
    }
  }

  // Noise Channel
  public updateNoise() {
    if (!this.ctx || !this.masterGain) return;

    const n = this.settings.noise;
    if (!n.enabled) {
      if (this.noiseChannelGain) {
        this.noiseChannelGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    if (this.noiseSource) {
      try {
        this.noiseSource.stop();
        this.noiseSource.disconnect();
      } catch {
        // ignore
      }
      this.noiseSource = null;
    }

    const sampleRate = this.ctx.sampleRate;
    const bufferLength = sampleRate * 3;
    const buffer = this.ctx.createBuffer(1, bufferLength, sampleRate);
    const data = buffer.getChannelData(0);

    this.generateNoiseData(data, n.type, bufferLength);

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = buffer;
    this.noiseSource.loop = true;

    if (!this.noiseLowCut) {
      this.noiseLowCut = this.ctx.createBiquadFilter();
      this.noiseLowCut.type = 'highpass';
    }
    this.noiseLowCut.frequency.setValueAtTime(n.lowCutHz, this.ctx.currentTime);

    if (!this.noiseHighCut) {
      this.noiseHighCut = this.ctx.createBiquadFilter();
      this.noiseHighCut.type = 'lowpass';
    }
    this.noiseHighCut.frequency.setValueAtTime(n.highCutHz, this.ctx.currentTime);

    if (!this.noiseChannelGain) {
      this.noiseChannelGain = this.ctx.createGain();
      this.noiseChannelGain.connect(this.masterGain);
    }
    this.noiseChannelGain.gain.setValueAtTime(n.volume, this.ctx.currentTime);

    this.noiseSource.connect(this.noiseLowCut);
    this.noiseLowCut.connect(this.noiseHighCut);
    this.noiseHighCut.connect(this.noiseChannelGain);

    this.noiseSource.start();
  }

  private generateNoiseData(data: Float32Array, type: NoiseType, length: number) {
    if (type === 'white') {
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    } else if (type === 'pink') {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
        b6 = white * 0.115926;
      }
    } else if (type === 'brown') {
      let lastOut = 0.0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = data[i];
        data[i] *= 3.5;
      }
    } else if (type === 'violet') {
      let lastWhite = 0.0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        data[i] = (white - lastWhite) * 0.5;
        lastWhite = white;
      }
    }
  }

  // Binaural Channel
  public updateBinaural() {
    if (!this.ctx || !this.masterGain) return;

    const bin = this.settings.binaural;
    if (!bin.enabled) {
      if (this.binauralChannelGain) {
        this.binauralChannelGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.05);
      }
      return;
    }

    if (!this.binauralLeftOsc) {
      this.binauralLeftOsc = this.ctx.createOscillator();
      this.binauralRightOsc = this.ctx.createOscillator();
      this.binauralMerger = this.ctx.createChannelMerger(2);

      this.binauralLeftOsc.type = 'sine';
      this.binauralRightOsc.type = 'sine';

      this.binauralLeftOsc.frequency.setValueAtTime(bin.baseFreqHz, this.ctx.currentTime);
      this.binauralRightOsc.frequency.setValueAtTime(bin.baseFreqHz + bin.beatFreqHz, this.ctx.currentTime);

      this.binauralChannelGain = this.ctx.createGain();
      this.binauralChannelGain.gain.setValueAtTime(bin.volume, this.ctx.currentTime);

      this.binauralLeftOsc.connect(this.binauralMerger, 0, 0);
      this.binauralRightOsc.connect(this.binauralMerger, 0, 1);
      this.binauralMerger.connect(this.binauralChannelGain);
      this.binauralChannelGain.connect(this.masterGain);

      this.binauralLeftOsc.start();
      this.binauralRightOsc.start();
    } else {
      this.binauralLeftOsc.frequency.setTargetAtTime(bin.baseFreqHz, this.ctx.currentTime, 0.05);
      if (this.binauralRightOsc) {
        this.binauralRightOsc.frequency.setTargetAtTime(bin.baseFreqHz + bin.beatFreqHz, this.ctx.currentTime, 0.05);
      }
      if (this.binauralChannelGain) {
        this.binauralChannelGain.gain.setTargetAtTime(bin.volume, this.ctx.currentTime, 0.05);
      }
    }
  }

  // Master Controls
  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.masterMuted) {
      this.masterGain.gain.setTargetAtTime(this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public setMasterMute(muted: boolean) {
    this.masterMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.masterVolume, this.ctx.currentTime, 0.02);
    }
  }

  public panicStop() {
    this.setMasterMute(true);
    this.settings.daf.enabled = false;
    this.settings.ultrasonic.enabled = false;
    this.settings.babble.enabled = false;
    this.settings.noise.enabled = false;
    this.settings.binaural.enabled = false;
    this.applyAllSettings();
    if (this.isTestVoicePlaying) {
      this.stopTestVoice();
    }
  }

  public applyPreset(preset: JammerPreset) {
    switch (preset) {
      case 'daf_classic':
        this.settings.daf.enabled = true;
        this.settings.daf.delayMs = 200;
        this.settings.daf.feedback = 0.15;
        this.settings.daf.volume = 0.95;
        this.settings.daf.noiseGateEnabled = false;
        this.settings.ultrasonic.enabled = false;
        this.settings.babble.enabled = false;
        this.settings.noise.enabled = false;
        this.settings.binaural.enabled = false;
        break;

      case 'privacy_shield':
        this.settings.daf.enabled = false;
        this.settings.ultrasonic.enabled = true;
        this.settings.ultrasonic.volume = 0.65;
        this.settings.babble.enabled = true;
        this.settings.babble.volume = 0.7;
        this.settings.noise.enabled = true;
        this.settings.noise.type = 'pink';
        this.settings.noise.volume = 0.6;
        this.settings.binaural.enabled = false;
        break;

      case 'ultrasonic_pulse':
        this.settings.daf.enabled = false;
        this.settings.ultrasonic.enabled = true;
        this.settings.ultrasonic.carrierFreqHz = 17500;
        this.settings.ultrasonic.sweepRangeHz = 3000;
        this.settings.ultrasonic.pulseRateHz = 24;
        this.settings.ultrasonic.volume = 0.85;
        this.settings.babble.enabled = false;
        this.settings.noise.enabled = false;
        this.settings.binaural.enabled = false;
        break;

      case 'babble_cloak':
        this.settings.daf.enabled = false;
        this.settings.ultrasonic.enabled = false;
        this.settings.babble.enabled = true;
        this.settings.babble.volume = 0.85;
        this.settings.babble.density = 4;
        this.settings.babble.chatterSpeed = 1.4;
        this.settings.noise.enabled = true;
        this.settings.noise.type = 'brown';
        this.settings.noise.volume = 0.45;
        this.settings.binaural.enabled = false;
        break;

      case 'acoustic_blackout':
        this.settings.daf.enabled = true;
        this.settings.daf.delayMs = 215;
        this.settings.daf.volume = 0.85;
        this.settings.daf.noiseGateEnabled = false;
        this.settings.ultrasonic.enabled = true;
        this.settings.ultrasonic.volume = 0.75;
        this.settings.babble.enabled = true;
        this.settings.babble.volume = 0.7;
        this.settings.noise.enabled = true;
        this.settings.noise.type = 'pink';
        this.settings.noise.volume = 0.7;
        this.settings.binaural.enabled = true;
        this.settings.binaural.volume = 0.55;
        break;

      case 'custom':
        break;
    }

    this.applyAllSettings();
  }

  public applyAllSettings() {
    if (!this.ctx) return;

    // DAF Settings
    if (this.dafDelayNode) {
      this.dafDelayNode.delayTime.setTargetAtTime(this.settings.daf.delayMs / 1000, this.ctx.currentTime, 0.05);
    }
    if (this.dafFeedbackGain) {
      this.dafFeedbackGain.gain.setTargetAtTime(this.settings.daf.feedback, this.ctx.currentTime, 0.05);
    }
    if (this.micPreampGain) {
      this.micPreampGain.gain.setTargetAtTime(this.settings.daf.micGainBoost, this.ctx.currentTime, 0.05);
    }
    if (this.micLowPass) {
      this.micLowPass.frequency.setTargetAtTime(this.settings.daf.highCutHz, this.ctx.currentTime, 0.05);
    }
    if (this.dafChannelGain) {
      const vol = this.settings.daf.enabled ? this.settings.daf.volume : 0;
      this.dafChannelGain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.05);
    }
    if (this.dafDryGain) {
      const dryVol = (this.settings.daf.enabled && this.settings.daf.directMonitor) 
        ? this.settings.daf.directMonitorVolume 
        : 0;
      this.dafDryGain.gain.setTargetAtTime(dryVol, this.ctx.currentTime, 0.05);
    }

    // Other channels
    this.updateUltrasonic();
    this.updateBabble();
    this.updateNoise();
    this.updateBinaural();
  }

  // Periodic Metrics Tick
  public getMetrics(): AudioMetrics {
    let masterPeakDbfs = -100;
    let micInputDbfs = -100;
    let dominantFreqHz = 0;
    let isGateOpen = true; // default open
    let isClipping = false;
    const isMicActive = this.micState === 'connected' && !!this.micStream;

    if (!this.ctx) {
      return { masterPeakDbfs, micInputDbfs, dominantFreqHz, isGateOpen, isClipping, isMicActive };
    }

    // Measure Mic level and operate Gate
    if (this.micAnalyser && this.dafGateGain) {
      (this.micAnalyser as unknown as { getFloatTimeDomainData: (arr: Float32Array) => void }).getFloatTimeDomainData(this.micDataArray);
      let sumSquares = 0;
      for (let i = 0; i < this.micDataArray.length; i++) {
        const val = this.micDataArray[i];
        sumSquares += val * val;
      }
      const rms = Math.sqrt(sumSquares / this.micDataArray.length);
      micInputDbfs = rms > 0.00001 ? 20 * Math.log10(rms) : -100;

      if (this.settings.daf.noiseGateEnabled) {
        isGateOpen = micInputDbfs > this.settings.daf.noiseGateThresholdDb;
        const targetGateGain = isGateOpen ? 1.0 : 0.0;
        this.dafGateGain.gain.setTargetAtTime(targetGateGain, this.ctx.currentTime, 0.03);
      } else {
        // Gate is bypassed: audio always passes unconditionally!
        isGateOpen = true;
        this.dafGateGain.gain.setTargetAtTime(1.0, this.ctx.currentTime, 0.02);
      }
    }

    // Measure Master Analyser
    if (this.masterAnalyser) {
      const timeData = new Float32Array(this.masterAnalyser.fftSize);
      (this.masterAnalyser as unknown as { getFloatTimeDomainData: (arr: Float32Array) => void }).getFloatTimeDomainData(timeData);
      let maxVal = 0;
      for (let i = 0; i < timeData.length; i++) {
        const abs = Math.abs(timeData[i]);
        if (abs > maxVal) maxVal = abs;
      }
      masterPeakDbfs = maxVal > 0.0001 ? 20 * Math.log10(maxVal) : -100;
      isClipping = maxVal >= 0.99;

      const freqData = new Uint8Array(this.masterAnalyser.frequencyBinCount);
      (this.masterAnalyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(freqData);
      let highestBin = 0;
      let highestVal = 0;
      for (let i = 0; i < freqData.length; i++) {
        if (freqData[i] > highestVal) {
          highestVal = freqData[i];
          highestBin = i;
        }
      }
      if (highestVal > 20) {
        dominantFreqHz = Math.round((highestBin * this.ctx.sampleRate) / this.masterAnalyser.fftSize);
      }
    }

    return { masterPeakDbfs, micInputDbfs, dominantFreqHz, isGateOpen, isClipping, isMicActive };
  }

  // Visualizer Hooks
  public getFrequencyData(outArray: Uint8Array) {
    if (this.masterAnalyser) {
      (this.masterAnalyser as unknown as { getByteFrequencyData: (arr: Uint8Array) => void }).getByteFrequencyData(outArray);
    }
  }

  public getTimeDomainData(outArray: Uint8Array) {
    if (this.masterAnalyser) {
      (this.masterAnalyser as unknown as { getByteTimeDomainData: (arr: Uint8Array) => void }).getByteTimeDomainData(outArray);
    }
  }

  public getMasterAnalyser(): AnalyserNode | null {
    return this.masterAnalyser;
  }

  public getMicAnalyser(): AnalyserNode | null {
    return this.micAnalyser;
  }

  // Built-in Speech Synth Test Monologue
  public playTestVoice(text?: string) {
    if (!('speechSynthesis' in window)) return;
    this.stopTestVoice();

    const sampleText = text || "Testing delayed auditory feedback. Notice how acoustic interference systematically alters normal syllable articulation, forcing vocal pacing to stumble under delayed return.";
    this.testSpeechUtterance = new SpeechSynthesisUtterance(sampleText);
    this.testSpeechUtterance.rate = 1.0;
    this.testSpeechUtterance.pitch = 1.0;

    this.testSpeechUtterance.onend = () => {
      this.isTestVoicePlaying = false;
    };
    this.testSpeechUtterance.onerror = () => {
      this.isTestVoicePlaying = false;
    };

    window.speechSynthesis.speak(this.testSpeechUtterance);
    this.isTestVoicePlaying = true;
  }

  public stopTestVoice() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isTestVoicePlaying = false;
  }

  public getIsTestVoicePlaying(): boolean {
    return this.isTestVoicePlaying;
  }

  // Recording
  public startRecording(): boolean {
    if (!this.destNode) return false;
    try {
      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(this.destNode.stream);
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };
      this.mediaRecorder.start(200);
      return true;
    } catch (err) {
      console.error('Failed to start recording:', err);
      return false;
    }
  }

  public stopRecording(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        if (this.recordedChunks.length === 0) {
          resolve(null);
          return;
        }
        const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        resolve(url);
      };

      this.mediaRecorder.stop();
    });
  }

  // Getters & Setters
  public getSettings(): ChannelSettings {
    return this.settings;
  }

  public updateSettings(newSettings: Partial<ChannelSettings>) {
    this.settings = { ...this.settings, ...newSettings };
    this.applyAllSettings();
  }

  public getMicState(): MicConnectionState {
    return this.micState;
  }

  public isMicConnected(): boolean {
    return this.micState === 'connected' && !!this.micStream;
  }

  public getMicError(): string | null {
    return this.micError;
  }

  public getAudioContextState(): AudioContextState | null {
    return this.ctx ? this.ctx.state : null;
  }

  public getMasterVolume(): number {
    return this.masterVolume;
  }

  public isMasterMuted(): boolean {
    return this.masterMuted;
  }

  public destroy() {
    this.stopTestVoice();
    this.stopMicrophoneStream();
    this.cleanupDafNodes();
    try {
      this.ultrasonicOsc?.stop();
      this.ultrasonicLfo?.stop();
      this.ultrasonicPulseLfo?.stop();
      this.babbleNoiseSource?.stop();
      this.babbleLfo?.stop();
      this.noiseSource?.stop();
      this.binauralLeftOsc?.stop();
      this.binauralRightOsc?.stop();
      this.ctx?.close();
    } catch {
      // ignore
    }
  }
}
