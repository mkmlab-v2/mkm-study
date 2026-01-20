import { Target, Zap, Droplet, BookOpen } from 'lucide-react';
import { StudyModeConfig, STUDY_MODE_DESCRIPTIONS } from '../data/conceptGenealogy';

interface AdaptiveStudyModeProps {
  recommendedMode: StudyModeConfig;
  currentVector: {
    S: number;
    L: number;
    K: number;
    M: number;
  };
  onModeSelect: (mode: StudyModeConfig) => void;
}

export default function AdaptiveStudyMode({
  recommendedMode,
  currentVector,
  onModeSelect
}: AdaptiveStudyModeProps) {
  const modeInfo = STUDY_MODE_DESCRIPTIONS[recommendedMode.mode];

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case 'speed_quiz':
        return <Zap className="w-8 h-8" />;
      case 'deep_dive':
        return <Droplet className="w-8 h-8" />;
      case 'concept_review':
        return <BookOpen className="w-8 h-8" />;
      case 'killer_training':
        return <Target className="w-8 h-8" />;
      default:
        return <BookOpen className="w-8 h-8" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'speed_quiz':
        return 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30 text-yellow-400';
      case 'deep_dive':
        return 'from-blue-500/20 to-cyan-500/20 border-blue-500/30 text-blue-400';
      case 'concept_review':
        return 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400';
      case 'killer_training':
        return 'from-red-500/20 to-orange-500/20 border-red-500/30 text-red-400';
      default:
        return 'from-gray-500/20 to-gray-600/20 border-gray-500/30 text-gray-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className={`bg-gradient-to-br ${getModeColor(recommendedMode.mode)} rounded-2xl p-6 border`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-black/30 rounded-xl">
              {getModeIcon(recommendedMode.mode)}
            </div>
            <div>
              <div className="text-xs text-gray-400 mb-1">AI 추천 학습 모드</div>
              <h3 className="text-2xl font-bold text-white">
                {modeInfo.icon} {modeInfo.title}
              </h3>
            </div>
          </div>
          <button
            onClick={() => onModeSelect(recommendedMode)}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-white transition-all border border-white/20"
          >
            시작하기
          </button>
        </div>

        <div className="space-y-3">
          <div className="bg-black/30 rounded-lg p-4">
            <div className="text-sm text-white mb-2">{modeInfo.description}</div>
            <div className="text-xs text-gray-400">{modeInfo.target}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">학습 시간</div>
              <div className="text-lg font-bold text-white">{recommendedMode.duration}분</div>
            </div>
            <div className="bg-black/20 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">문제 수</div>
              <div className="text-lg font-bold text-white">{recommendedMode.problemCount}개</div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {recommendedMode.timerEnabled && (
              <div className="bg-blue-500/20 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-500/30">
                ⏱️ 타이머 ON
              </div>
            )}
            {!recommendedMode.allowHints && (
              <div className="bg-red-500/20 text-red-300 text-xs px-3 py-1 rounded-full border border-red-500/30">
                ⚠️ 힌트 없음
              </div>
            )}
            {recommendedMode.explanation_required && (
              <div className="bg-purple-500/20 text-purple-300 text-xs px-3 py-1 rounded-full border border-purple-500/30">
                📝 설명 필수
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm text-gray-400 font-bold mb-3">현재 4D 벡터 상태 분석</div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">S (정서)</span>
              <span className={`text-sm font-bold ${
                currentVector.S > 0.7 ? 'text-green-400' :
                currentVector.S < 0.4 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {Math.round(currentVector.S * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentVector.S > 0.7 ? 'bg-green-500' :
                  currentVector.S < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${currentVector.S * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">L (논리)</span>
              <span className={`text-sm font-bold ${
                currentVector.L > 0.7 ? 'text-green-400' :
                currentVector.L < 0.4 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {Math.round(currentVector.L * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentVector.L > 0.7 ? 'bg-green-500' :
                  currentVector.L < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${currentVector.L * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">K (지식)</span>
              <span className={`text-sm font-bold ${
                currentVector.K > 0.7 ? 'text-green-400' :
                currentVector.K < 0.4 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {Math.round(currentVector.K * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentVector.K > 0.7 ? 'bg-green-500' :
                  currentVector.K < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${currentVector.K * 100}%` }}
              />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-400">M (신체)</span>
              <span className={`text-sm font-bold ${
                currentVector.M > 0.7 ? 'text-green-400' :
                currentVector.M < 0.4 ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {Math.round(currentVector.M * 100)}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${
                  currentVector.M > 0.7 ? 'bg-green-500' :
                  currentVector.M < 0.4 ? 'bg-red-500' : 'bg-yellow-500'
                }`}
                style={{ width: `${currentVector.M * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 text-xs text-gray-400">
          {currentVector.L < 0.4 && '⚠️ 논리력이 낮아 개념 복습이 필요합니다.'}
          {currentVector.S > 0.7 && currentVector.M > 0.6 && '⚡ 에너지가 높아 스피드 학습에 적합합니다.'}
          {currentVector.L > 0.7 && currentVector.K > 0.7 && '🎯 실력이 높아 킬러 문항에 도전하세요!'}
        </div>
      </div>

      <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
        <div className="text-xs text-blue-300">
          💡 <strong>MKM12 적응형 학습:</strong> 현재 몸과 마음의 상태에 맞춰 최적의 학습 방법을 추천합니다.
        </div>
      </div>
    </div>
  );
}
