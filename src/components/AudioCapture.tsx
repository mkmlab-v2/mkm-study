import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';

interface AudioCaptureProps {
  isActive: boolean;
  onAudioData?: (data: AudioMetrics) => void;
  onError?: (error: string) => void;
}

export interface AudioMetrics {
  volume: number;
  frequency: number;
  pitch: number;
  clarity: number;
}

export default function AudioCapture({ isActive, onAudioData, onError }: AudioCaptureProps) {
  const [hasPermission, setHasPermission] = useState(false);
  const [volume, setVolume] = useState(0);
  const [isListening, setIsListening] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      stopAudio();
      return;
    }

    startAudio();

    return () => {
      stopAudio();
    };
  }, [isActive]);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      const microphone = audioContext.createMediaStreamSource(stream);
      microphoneRef.current = microphone;
      microphone.connect(analyser);

      setHasPermission(true);
      setIsListening(true);
      visualize();
      analyzeAudio();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to access microphone';
      onError?.(errorMessage);
      setHasPermission(false);
    }
  };

  const stopAudio = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (microphoneRef.current) {
      microphoneRef.current.disconnect();
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    setIsListening(false);
    setHasPermission(false);
    setVolume(0);
  };

  const visualize = () => {
    if (!analyserRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    if (!canvasCtx) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      animationRef.current = requestAnimationFrame(draw);

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = 'rgb(17, 24, 39)';
      canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = 'rgb(59, 130, 246)';
      canvasCtx.beginPath();

      const sliceWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0;
        const y = (v * canvas.height) / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();
  };

  const analyzeAudio = () => {
    if (!analyserRef.current) return;

    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const frequencyArray = new Uint8Array(bufferLength);

    const analyze = () => {
      if (!isActive) return;

      analyser.getByteTimeDomainData(dataArray);
      analyser.getByteFrequencyData(frequencyArray);

      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        const normalized = (dataArray[i] - 128) / 128;
        sum += normalized * normalized;
      }
      const rms = Math.sqrt(sum / bufferLength);
      const currentVolume = Math.min(100, rms * 200);
      setVolume(currentVolume);

      let maxFreqIndex = 0;
      let maxFreqValue = 0;
      for (let i = 0; i < frequencyArray.length; i++) {
        if (frequencyArray[i] > maxFreqValue) {
          maxFreqValue = frequencyArray[i];
          maxFreqIndex = i;
        }
      }
      const frequency = (maxFreqIndex * audioContextRef.current!.sampleRate) / (2 * bufferLength);

      const pitch = frequency > 0 ? Math.min(100, (frequency / 500) * 100) : 0;

      let clarity = 0;
      if (maxFreqValue > 50) {
        clarity = Math.min(100, (maxFreqValue / 255) * 100);
      }

      if (onAudioData) {
        onAudioData({
          volume: currentVolume,
          frequency,
          pitch,
          clarity
        });
      }

      setTimeout(analyze, 100);
    };

    analyze();
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 rounded-3xl p-6 border border-gray-800/50 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isListening ? (
            <Mic className="w-5 h-5 text-blue-400 animate-pulse" />
          ) : (
            <MicOff className="w-5 h-5 text-gray-500" />
          )}
          <h3 className="text-lg font-bold text-white">음성 모니터</h3>
        </div>

        {isListening && (
          <div className="flex items-center gap-2 bg-green-500/20 px-3 py-1 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-medium">Listening</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            width={500}
            height={100}
            className="w-full rounded-xl bg-gray-900/50 border border-gray-700/50"
          />
          {!hasPermission && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/50 rounded-xl backdrop-blur-sm">
              <div className="text-center">
                <MicOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">마이크 비활성화</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-4 h-4 text-blue-400" />
              <span className="text-gray-400 text-xs">음량</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-200"
                  style={{ width: `${volume}%` }}
                />
              </div>
              <span className="text-white text-sm font-mono w-10 text-right">
                {Math.round(volume)}
              </span>
            </div>
          </div>

          <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
            <div className="text-gray-400 text-xs mb-2">상태</div>
            <div className="text-white text-sm font-medium">
              {volume > 30 ? '말하는 중' : volume > 10 ? '조용함' : '침묵'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
