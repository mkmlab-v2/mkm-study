import { useEffect, useState } from 'react';
import { Heart, Clock, AlertTriangle } from 'lucide-react';

interface StudyMonitorProps {
  isActive: boolean;
  startTime: number | null;
}

export default function StudyMonitor({ isActive, startTime }: StudyMonitorProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [heartRate, setHeartRate] = useState(72);

  useEffect(() => {
    if (!isActive || !startTime) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, startTime]);

  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      setHeartRate(prev => {
        const change = Math.random() * 4 - 2;
        return Math.max(60, Math.min(100, prev + change));
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [isActive]);

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Heart className="w-6 h-6 text-red-500" />
          <h3 className="text-lg font-semibold text-white">Heart Rate</h3>
        </div>
        <div className="flex items-end gap-2">
          <span className="text-5xl font-bold text-white">
            {isActive ? Math.round(heartRate) : '--'}
          </span>
          <span className="text-2xl text-gray-400 mb-2">BPM</span>
        </div>
        {isActive && (
          <div className="mt-4 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-red-500 transition-all duration-1000"
              style={{ width: `${(heartRate - 60) / 40 * 100}%` }}
            />
          </div>
        )}
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-blue-500" />
          <h3 className="text-lg font-semibold text-white">Study Time</h3>
        </div>
        <div className="text-4xl font-mono font-bold text-white">
          {isActive ? formatTime(elapsedTime) : '00:00:00'}
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-lg font-semibold text-white">Status</h3>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Focus Level</span>
            <span className="text-white font-semibold">
              {isActive ? 'Normal' : 'Inactive'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Drowsiness</span>
            <span className="text-green-500 font-semibold">
              {isActive ? 'Low' : '--'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
