import { useState, useEffect } from 'react';
import { Play, RotateCcw, Coffee } from 'lucide-react';

interface DigitalTimerWidgetProps {
  isActive: boolean;
  startTime: number | null;
  onStart: () => void;
  onStop: () => void;
}

export default function DigitalTimerWidget({
  isActive,
  startTime,
  onStart,
  onStop
}: DigitalTimerWidgetProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsed(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <div className="relative flex items-center justify-center">
      <div className="text-center">
        <div className="text-gray-400 text-sm mb-4">학습 시간</div>

        <div className="relative inline-block">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              stroke="#1F2937"
              strokeWidth="8"
            />
            <circle
              cx="128"
              cy="128"
              r="110"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(elapsed % 60) * (2 * Math.PI * 110 / 60)} ${2 * Math.PI * 110}`}
              className="transition-all duration-1000 ease-linear"
            />
          </svg>

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl font-bold text-white tabular-nums tracking-tight">
                {formatTime(elapsed)}
              </div>
              <div className="text-sm text-gray-500 mt-2">
                {elapsed === 0 ? '0분 학습' : `${Math.floor(elapsed / 60)}분 학습`}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={onStop}
            disabled={!isActive}
            className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <RotateCcw className="w-5 h-5 text-white" />
          </button>

          <button
            onClick={isActive ? onStop : onStart}
            className="p-6 rounded-full bg-gradient-to-br from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg shadow-yellow-500/30 transition-all transform hover:scale-105"
          >
            <Play className="w-8 h-8 text-white" />
          </button>

          <button
            disabled={!isActive}
            className="p-4 rounded-full bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <Coffee className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
