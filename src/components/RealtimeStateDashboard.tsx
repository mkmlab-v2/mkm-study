import { useEffect, useState } from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import type { Vector4D } from '../utils/types';
import { getMockPrediction } from '../utils/api';

interface RealtimeStateDashboardProps {
  currentState: Vector4D;
  isActive: boolean;
}

export default function RealtimeStateDashboard({ currentState, isActive }: RealtimeStateDashboardProps) {
  const [predictionData, setPredictionData] = useState<Array<{
    time: number;
    S: number;
    L: number;
    K: number;
    M: number;
  }>>([]);

  useEffect(() => {
    if (!isActive) {
      setPredictionData([]);
      return;
    }

    const predictions = getMockPrediction(currentState, 10);
    const formattedData = predictions.map((state, index) => ({
      time: index * 6,
      S: state.S * 100,
      L: state.L * 100,
      K: state.K * 100,
      M: state.M * 100
    }));

    setPredictionData(formattedData);

    const interval = setInterval(() => {
      const newPredictions = getMockPrediction(currentState, 10);
      const newFormattedData = newPredictions.map((state, index) => ({
        time: index * 6,
        S: state.S * 100,
        L: state.L * 100,
        K: state.K * 100,
        M: state.M * 100
      }));
      setPredictionData(newFormattedData);
    }, 5000);

    return () => clearInterval(interval);
  }, [currentState, isActive]);

  const radarData = [
    { dimension: 'Spirit', value: currentState.S * 100, fullMark: 100 },
    { dimension: 'Logic', value: currentState.L * 100, fullMark: 100 },
    { dimension: 'Knowledge', value: currentState.K * 100, fullMark: 100 },
    { dimension: 'Material', value: currentState.M * 100, fullMark: 100 }
  ];

  const collapseRisk = predictionData.length > 0
    ? Math.max(...predictionData.map(d => Math.abs(d.S - 25) + Math.abs(d.L - 25) + Math.abs(d.K - 25) + Math.abs(d.M - 25))) / 100
    : 0;

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-bold text-white mb-6">4D State Vector</h3>
        <ResponsiveContainer width="100%" height={300}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
            />
            <Radar
              name="Current State"
              dataKey="value"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
            />
          </RadarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="bg-gray-900 rounded p-3">
            <div className="text-gray-400 text-sm">Spirit (S)</div>
            <div className="text-2xl font-bold text-white">
              {(currentState.S * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <div className="text-gray-400 text-sm">Logic (L)</div>
            <div className="text-2xl font-bold text-white">
              {(currentState.L * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <div className="text-gray-400 text-sm">Knowledge (K)</div>
            <div className="text-2xl font-bold text-white">
              {(currentState.K * 100).toFixed(1)}%
            </div>
          </div>
          <div className="bg-gray-900 rounded p-3">
            <div className="text-gray-400 text-sm">Material (M)</div>
            <div className="text-2xl font-bold text-white">
              {(currentState.M * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {isActive && predictionData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="w-6 h-6 text-blue-500" />
            <h3 className="text-xl font-bold text-white">Dynamics Prediction</h3>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={predictionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="time"
                stroke="#9CA3AF"
                label={{ value: 'Time (minutes)', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }}
              />
              <YAxis
                stroke="#9CA3AF"
                label={{ value: 'Value (%)', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="S" stroke="#EF4444" name="Spirit" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="L" stroke="#3B82F6" name="Logic" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="K" stroke="#10B981" name="Knowledge" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="M" stroke="#F59E0B" name="Material" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-6 p-4 bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Collapse Risk</span>
              <span className={`text-lg font-bold ${
                collapseRisk < 0.3 ? 'text-green-500' :
                collapseRisk < 0.6 ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {(collapseRisk * 100).toFixed(1)}%
              </span>
            </div>
            <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  collapseRisk < 0.3 ? 'bg-green-500' :
                  collapseRisk < 0.6 ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: `${Math.min(100, collapseRisk * 100)}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
