import React, { useEffect, useRef, useState } from 'react';
import { AudioMetrics } from '../audio/types';
import { BarChart3, Activity, Waves } from 'lucide-react';

interface SpectrumVisualizerProps {
  analyser: AnalyserNode | null;
  metrics: AudioMetrics;
  isEngineActive: boolean;
}

export const SpectrumVisualizer: React.FC<SpectrumVisualizerProps> = ({
  analyser,
  metrics,
  isEngineActive,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [visMode, setVisMode] = useState<'fft' | 'oscilloscope' | 'waterfall'>('fft');

  // Peak hold array for FFT
  const peakHoldRef = useRef<number[]>([]);
  const peakHoldDecayRef = useRef<number[]>([]);
  // Offscreen canvas for waterfall
  const waterfallCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const fftSize = analyser ? analyser.frequencyBinCount : 512;
    const freqData = new Uint8Array(fftSize);
    const timeData = new Uint8Array(fftSize);

    // Initialize waterfall offscreen canvas
    if (!waterfallCanvasRef.current) {
      waterfallCanvasRef.current = document.createElement('canvas');
      waterfallCanvasRef.current.width = 800;
      waterfallCanvasRef.current.height = 180;
    }

    const render = () => {
      animId = requestAnimationFrame(render);

      // Handle retina resolution
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      if (analyser && isEngineActive) {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);
      } else {
        freqData.fill(0);
        timeData.fill(128);
      }

      ctx.fillStyle = '#070A0F';
      ctx.fillRect(0, 0, width, height);

      // Draw subtle grid
      ctx.strokeStyle = '#141C28';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 30; y < height; y += 30) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      for (let x = 60; x < width; x += 80) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      ctx.stroke();

      if (visMode === 'fft') {
        // Frequency bands with Logarithmic distribution
        const barCount = 64;
        const barWidth = Math.max(2, (width / barCount) - 2);

        // Zone highlights
        // Voice speech band: approx 300Hz - 3.4kHz (bars 8 to 28)
        const voiceStart = Math.floor(barCount * 0.12);
        const voiceEnd = Math.floor(barCount * 0.42);
        ctx.fillStyle = 'rgba(6, 182, 212, 0.05)';
        ctx.fillRect(voiceStart * (barWidth + 2), 0, (voiceEnd - voiceStart) * (barWidth + 2), height);

        // Ultrasonic jamming band: >14kHz (bars 48 to 64)
        const ultraStart = Math.floor(barCount * 0.72);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
        ctx.fillRect(ultraStart * (barWidth + 2), 0, (barCount - ultraStart) * (barWidth + 2), height);

        // Init peak holds if needed
        if (peakHoldRef.current.length !== barCount) {
          peakHoldRef.current = new Array(barCount).fill(0);
          peakHoldDecayRef.current = new Array(barCount).fill(0);
        }

        for (let i = 0; i < barCount; i++) {
          // Logarithmic bin sampling
          const binIndex = Math.min(
            fftSize - 1,
            Math.floor(Math.pow(i / barCount, 2.2) * (fftSize - 1))
          );
          const val = freqData[binIndex] || 0;
          const barHeight = Math.max(2, (val / 255) * (height - 24));
          const x = i * (barWidth + 2) + 2;
          const y = height - barHeight;

          // Color gradient depending on spectrum zone
          let color = '#06B6D4'; // Cyan default
          if (i >= ultraStart) {
            color = '#F59E0B'; // Amber for ultrasonic
          } else if (i >= voiceStart && i <= voiceEnd) {
            color = '#38BDF8'; // Sky blue for voice range
          }

          // Main Bar
          ctx.fillStyle = color;
          ctx.fillRect(x, y, barWidth, barHeight);

          // Peak Hold
          if (val > (peakHoldRef.current[i] || 0)) {
            peakHoldRef.current[i] = val;
            peakHoldDecayRef.current[i] = 15; // hold frames
          } else {
            if (peakHoldDecayRef.current[i] > 0) {
              peakHoldDecayRef.current[i]--;
            } else {
              peakHoldRef.current[i] = Math.max(0, peakHoldRef.current[i] - 1.5);
            }
          }

          const peakY = height - Math.max(2, (peakHoldRef.current[i] / 255) * (height - 24));
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(x, peakY - 1, barWidth, 1.5);
        }

        // Zone text labels at top of canvas
        ctx.font = '9px monospace';
        ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.fillText('SPEECH MASK BAND [300Hz - 3.4kHz]', voiceStart * (barWidth + 2), 14);
        ctx.fillStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.fillText('ULTRASONIC MEMS [14kHz - 22kHz]', ultraStart * (barWidth + 2), 14);

      } else if (visMode === 'oscilloscope') {
        // CRT Phosphor Oscilloscope trace
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#06B6D4';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#06B6D4';

        ctx.beginPath();
        const sliceWidth = width / fftSize;
        let x = 0;

        for (let i = 0; i < fftSize; i++) {
          const v = timeData[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Center line
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);

      } else if (visMode === 'waterfall') {
        const off = waterfallCanvasRef.current;
        if (off) {
          const offCtx = off.getContext('2d');
          if (offCtx) {
            // Scroll down
            offCtx.drawImage(off, 0, 1, off.width, off.height - 1, 0, 0, off.width, off.height - 1);

            // Draw new top line
            const lineImg = offCtx.createImageData(off.width, 1);
            for (let x = 0; x < off.width; x++) {
              const bin = Math.floor(Math.pow(x / off.width, 1.8) * (fftSize - 1));
              const intensity = freqData[bin] || 0;
              const idx = x * 4;
              // Heatmap: dark blue -> cyan -> yellow -> white
              lineImg.data[idx] = Math.min(255, intensity * 1.4); // R
              lineImg.data[idx + 1] = Math.min(255, intensity * 1.8); // G
              lineImg.data[idx + 2] = Math.min(255, intensity * 2.2 + 40); // B
              lineImg.data[idx + 3] = 255;
            }
            offCtx.putImageData(lineImg, 0, off.height - 1);

            // Render to main canvas
            ctx.drawImage(off, 0, 0, width, height);
          }
        }
      }
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
    };
  }, [analyser, isEngineActive, visMode]);

  return (
    <div className="w-full bg-[#070A0F] border border-slate-800 rounded-lg overflow-hidden flex flex-col">
      {/* HUD Telemetry Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2 border-b border-slate-800/80 bg-[#0A0E17] text-xs font-mono">
        <div className="flex items-center gap-4 text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] uppercase">Peak Out:</span>
            <span className={`font-semibold tabular-nums ${metrics.isClipping ? 'text-rose-400' : 'text-cyan-400'}`}>
              {metrics.masterPeakDbfs > -90 ? `${metrics.masterPeakDbfs.toFixed(1)} dBFS` : '-inf dB'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] uppercase">Dominant:</span>
            <span className="font-semibold text-amber-400 tabular-nums">
              {metrics.dominantFreqHz > 0 ? `${metrics.dominantFreqHz} Hz` : '0 Hz'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-[11px] uppercase">Mic Gate:</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded ${
                metrics.isGateOpen
                  ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-500 border border-slate-800'
              }`}
            >
              {metrics.isGateOpen ? 'ACTIVE' : 'DUCKED'}
            </span>
          </div>
        </div>

        {/* Visualizer Mode Selector */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded border border-slate-800">
          <button
            onClick={() => setVisMode('fft')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              visMode === 'fft' ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            <span>FFT Spectrum</span>
          </button>
          <button
            onClick={() => setVisMode('oscilloscope')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              visMode === 'oscilloscope' ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>Oscilloscope</span>
          </button>
          <button
            onClick={() => setVisMode('waterfall')}
            className={`flex items-center gap-1 px-2.5 py-1 text-[11px] rounded transition-colors cursor-pointer ${
              visMode === 'waterfall' ? 'bg-cyan-950/70 text-cyan-300 border border-cyan-500/30 font-medium' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Waves className="w-3 h-3" />
            <span>Waterfall</span>
          </button>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="relative w-full h-48 sm:h-56 bg-[#070A0F]">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>
    </div>
  );
};
