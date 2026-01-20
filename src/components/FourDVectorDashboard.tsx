import { useEffect, useState } from 'react';
import { Vector4D } from '../utils/types';
import { Sparkles, Activity, Heart, Clock } from 'lucide-react';

interface FourDVectorDashboardProps {
  currentState: Vector4D;
  healthScore?: number;
  dcv?: number;
  riskLevel?: number;
  expectedTime?: number;
}

export default function FourDVectorDashboard({
  currentState,
  healthScore = 85,
  dcv = 94.4,
  riskLevel = 30,
  expectedTime = 1440
}: FourDVectorDashboardProps) {
  const [animatedState, setAnimatedState] = useState(currentState);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAnimatedState(currentState);
    }, 100);

    return () => clearTimeout(timeout);
  }, [currentState]);

  const size = 240;
  const center = size / 2;
  const radius = 90;

  const getPoint = (angle: number, value: number) => {
    const rad = (angle * Math.PI) / 180;
    const x = center + radius * value * Math.cos(rad);
    const y = center + radius * value * Math.sin(rad);
    return { x, y };
  };

  const topPoint = getPoint(-90, animatedState.S);
  const rightPoint = getPoint(0, animatedState.L);
  const bottomPoint = getPoint(90, animatedState.M);
  const leftPoint = getPoint(180, animatedState.K);

  const pathData = `M ${topPoint.x},${topPoint.y} L ${rightPoint.x},${rightPoint.y} L ${bottomPoint.x},${bottomPoint.y} L ${leftPoint.x},${leftPoint.y} Z`;

  const maxPathData = `M ${getPoint(-90, 1).x},${getPoint(-90, 1).y} L ${getPoint(0, 1).x},${getPoint(0, 1).y} L ${getPoint(90, 1).x},${getPoint(90, 1).y} L ${getPoint(180, 1).x},${getPoint(180, 1).y} Z`;

  const avg = (animatedState.S + animatedState.L + animatedState.K + animatedState.M) / 4;
  const balance = 100 - (Math.abs(animatedState.S - avg) + Math.abs(animatedState.L - avg) + Math.abs(animatedState.K - avg) + Math.abs(animatedState.M - avg)) * 50;

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 rounded-3xl p-6 border border-gray-800/50 shadow-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-bold text-white">MKM12 Brain Engine</h3>
      </div>

      <div className="flex items-start gap-6">
        <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
          <svg width={size} height={size} className="absolute inset-0">
            <defs>
              <linearGradient id="diamondGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.6" />
                <stop offset="25%" stopColor="#3B82F6" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#10B981" stopOpacity="0.6" />
                <stop offset="75%" stopColor="#F59E0B" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.6" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <path
              d={maxPathData}
              fill="none"
              stroke="#374151"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.3"
            />

            <path
              d={pathData}
              fill="url(#diamondGradient)"
              stroke="url(#diamondGradient)"
              strokeWidth="2"
              filter="url(#glow)"
              className="transition-all duration-500"
            />

            <circle cx={topPoint.x} cy={topPoint.y} r="5" fill="#8B5CF6" className="animate-pulse" />
            <circle cx={rightPoint.x} cy={rightPoint.y} r="5" fill="#3B82F6" className="animate-pulse" />
            <circle cx={bottomPoint.x} cy={bottomPoint.y} r="5" fill="#F59E0B" className="animate-pulse" />
            <circle cx={leftPoint.x} cy={leftPoint.y} r="5" fill="#10B981" className="animate-pulse" />

            <circle cx={center} cy={center} r="16" fill="#F59E0B" opacity="0.4" />
          </svg>

          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6">
            <div className="text-center">
              <div className="text-purple-400 text-sm font-bold">S</div>
              <div className="text-white text-xs">{Math.round(animatedState.S * 100)}%</div>
            </div>
          </div>

          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-6">
            <div className="text-center">
              <div className="text-blue-400 text-sm font-bold">L</div>
              <div className="text-white text-xs">{Math.round(animatedState.L * 100)}%</div>
            </div>
          </div>

          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-6">
            <div className="text-center">
              <div className="text-yellow-500 text-sm font-bold">M</div>
              <div className="text-white text-xs">{Math.round(animatedState.M * 100)}%</div>
            </div>
          </div>

          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-6">
            <div className="text-center">
              <div className="text-green-400 text-sm font-bold">K</div>
              <div className="text-white text-xs">{Math.round(animatedState.K * 100)}%</div>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-green-400" />
                <div className="text-gray-400 text-xs">건강 점수</div>
              </div>
              <div className="text-2xl font-bold text-green-400">{healthScore}</div>
            </div>

            <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Heart className="w-3 h-3 text-blue-400" />
                <div className="text-gray-400 text-xs">혈압성 (DCV)</div>
              </div>
              <div className="text-2xl font-bold text-blue-400">{dcv.toFixed(1)}<span className="text-sm">%</span></div>
            </div>

            <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-3 h-3 text-yellow-400" />
                <div className="text-gray-400 text-xs">봉합 위험도</div>
              </div>
              <div className="text-2xl font-bold text-green-400">{riskLevel}<span className="text-sm">%</span></div>
            </div>

            <div className="backdrop-blur-sm bg-gray-800/50 rounded-xl p-3 border border-gray-700/50">
              <div className="flex items-center gap-2 mb-1">
                <Clock className="w-3 h-3 text-purple-400" />
                <div className="text-gray-400 text-xs">예상 유지 시간</div>
              </div>
              <div className="text-2xl font-bold text-purple-400">{expectedTime}<span className="text-sm">분</span></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-400 text-sm">평형 상태</span>
              <span className={`text-sm font-bold ${
                balance >= 80 ? 'text-green-400' : 'text-yellow-400'
              }`}>
                {balance >= 80 ? '양호' : '주의'}
              </span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                style={{ width: `${balance}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
