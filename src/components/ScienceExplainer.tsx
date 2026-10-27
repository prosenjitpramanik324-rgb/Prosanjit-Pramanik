import React from 'react';
import { Mic, Zap, Users, Shield, Cpu, BookOpen } from 'lucide-react';

export const ScienceExplainer: React.FC = () => {
  return (
    <div className="w-full flex flex-col gap-6 font-sans">
      {/* Intro Header */}
      <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h2 className="text-base font-bold font-mono text-slate-100">
            ACOUSTIC PHYSICS & NEUROLOGICAL JAMMING PRINCIPLES
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          AcoustiJam implements two distinct scientific methods: neurological speech disruption via Delayed Auditory Feedback (DAF), and physical acoustic masking via ultrasonic intermodulation and formant cloaking.
        </p>
      </div>

      {/* Grid of Scientific Principles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Principle 1: DAF & The Lee Effect */}
        <div className="p-5 bg-[#0A0E17] border border-cyan-500/30 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 text-cyan-400">
            <Mic className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono text-slate-100">
              01. The Lee Effect & Cerebellar Speech Loops
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            In 1950, engineer Bernard Lee discovered that routing an individual's spoken voice back to their ears with a delay between <strong>150ms and 250ms</strong> causes fluent speakers to stutter, elongate vowels, and repeatedly halt.
          </p>
          <div className="p-3 bg-[#070A0F] border border-slate-800 rounded text-xs font-mono text-slate-400 flex flex-col gap-1.5">
            <span className="text-cyan-400 font-semibold">Neurological Mechanism:</span>
            <span>Motor Cortex Spoken Command → Bilateral Superior Temporal Gyrus → Delayed Auditory Match Failure (Δt ≈ 200ms) → Motor Pause / Syllable Repetition.</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Because a standard English syllable lasts roughly 200ms, the delayed voice arrives exactly as the speaker attempts to produce the subsequent syllable. The brain misinterprets this as a pronunciation error and involuntarily aborts the motor sequence.
          </p>
        </div>

        {/* Principle 2: Ultrasonic MEMS Intermodulation */}
        <div className="p-5 bg-[#0A0E17] border border-amber-500/30 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 text-amber-400">
            <Zap className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono text-slate-100">
              02. Ultrasonic MEMS Non-Linear Intermodulation
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Modern mobile phones and surveillance microphones utilize <strong>MEMS (Micro-Electro-Mechanical Systems)</strong> diaphragms. When exposed to high-power frequencies above 15kHz, the physical silicon diaphragm behaves non-linearly.
          </p>
          <div className="p-3 bg-[#070A0F] border border-slate-800 rounded text-xs font-mono text-slate-400 flex flex-col gap-1.5">
            <span className="text-amber-400 font-semibold">Intermodulation Distortion Equation:</span>
            <span>f_ghost = | f_carrier - f_modulation |  where f_ghost ∈ [300 Hz, 3.4 kHz]</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Sweeping ultrasonic frequencies down-mix into the audible voice band inside the microphone's analog preamplifier, creating intense broadband noise that drowns out conversations without requiring loud audible sound in the room.
          </p>
        </div>

        {/* Principle 3: Formant Speech Babble */}
        <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sky-400">
            <Users className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono text-slate-100">
              03. Synthetic Formant & Reverse Babble Cloak
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Standard white noise sounds harsh and fatiguing to human ears. <strong>Formant Babble</strong> mimics the natural vowel acoustic peaks (F1: ~500Hz, F2: ~1500Hz, F3: ~2500Hz) of overlapping human speech.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            When speech formants are reversed or modulated asynchronously, eavesdropping speech recognition algorithms (like Whisper or RNN beamformers) cannot isolate the target voice, while the ambient sound level remains comfortable for human discussion.
          </p>
        </div>

        {/* Principle 4: Binaural Beamforming Defeat */}
        <div className="p-5 bg-[#0A0E17] border border-slate-800 rounded-lg flex flex-col gap-3">
          <div className="flex items-center gap-2 text-purple-400">
            <Cpu className="w-4 h-4" />
            <h3 className="text-sm font-bold font-mono text-slate-100">
              04. Multi-Microphone Phase Disruption
            </h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Modern smart devices use 2 to 4 microphones to calculate <strong>Time Difference of Arrival (TDOA)</strong> and mathematically subtract background room noise.
          </p>
          <p className="text-xs text-slate-400 leading-relaxed">
            By emitting stereo binaural pulses with shifting phase angles, the beamformer's spatial covariance matrix is disrupted, preventing it from calculating a coherent directional vector for the speaker.
          </p>
        </div>
      </div>
    </div>
  );
};
