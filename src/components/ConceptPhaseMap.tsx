import { useState, useEffect } from 'react';
import { GitBranch, TrendingUp, Award, Target } from 'lucide-react';
import {
  MATH_CONCEPT_GENEALOGY,
  getRelatedConcepts,
  getConceptPath,
  ConceptNode
} from '../data/conceptGenealogy';

interface ConceptPhaseMapProps {
  currentTopic: string;
  onConceptClick?: (conceptId: string) => void;
}

export default function ConceptPhaseMap({ currentTopic, onConceptClick }: ConceptPhaseMapProps) {
  const [selectedConcept, setSelectedConcept] = useState<ConceptNode | null>(null);
  const [pathToGoal, setPathToGoal] = useState<ConceptNode[]>([]);

  const topicToConceptMap: Record<string, string> = {
    '이차함수': 'quadratic_function',
    '삼각함수': 'trigonometry',
    '미분': 'derivative',
    '적분': 'integral',
    '수열': 'sequence',
    '확률과 통계': 'probability'
  };

  useEffect(() => {
    const conceptId = topicToConceptMap[currentTopic];
    if (conceptId && MATH_CONCEPT_GENEALOGY[conceptId]) {
      setSelectedConcept(MATH_CONCEPT_GENEALOGY[conceptId]);

      const path = getConceptPath(conceptId, 'optimization');
      setPathToGoal(path);
    }
  }, [currentTopic]);

  if (!selectedConcept) return null;

  const { prerequisites, extensions } = getRelatedConcepts(selectedConcept.id);

  return (
    <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-2xl p-6 border border-blue-500/30">
      <div className="flex items-center gap-3 mb-6">
        <GitBranch className="w-6 h-6 text-blue-400" />
        <div>
          <h3 className="text-lg font-bold text-white">개념 위상 지도</h3>
          <p className="text-xs text-gray-400">MKM12 Knowledge Phase Map</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="text-xs text-blue-400 font-bold mb-1">현재 위치</div>
              <div className="text-xl font-bold text-white">{selectedConcept.name}</div>
              <div className="text-sm text-gray-400 mt-1">{selectedConcept.grade}</div>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 text-yellow-400 mb-1">
                <Award className="w-4 h-4" />
                <span className="text-sm font-bold">중요도</span>
              </div>
              <div className="text-2xl font-bold text-yellow-400">{selectedConcept.importance}</div>
            </div>
          </div>

          <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1">
              💡 {selectedConcept.description}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs">
            <div className="text-gray-400">
              EBS 출제 빈도: <span className="text-blue-400 font-bold">{selectedConcept.ebs_frequency}회</span>
            </div>
          </div>
        </div>

        {prerequisites.length > 0 && (
          <div className="bg-gray-900/50 rounded-xl p-4">
            <div className="text-xs text-gray-400 font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              선행 개념 (이미 배운 것)
            </div>
            <div className="space-y-2">
              {prerequisites.map(concept => (
                <button
                  key={concept.id}
                  onClick={() => onConceptClick?.(concept.id)}
                  className="w-full bg-green-500/10 hover:bg-green-500/20 rounded-lg p-3 text-left transition-colors border border-green-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{concept.name}</div>
                      <div className="text-xs text-gray-400">{concept.grade}</div>
                    </div>
                    <div className="text-xs text-green-400">✓</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {extensions.length > 0 && (
          <div className="bg-gray-900/50 rounded-xl p-4">
            <div className="text-xs text-purple-400 font-bold mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              확장 개념 (앞으로 배울 것)
            </div>
            <div className="space-y-2">
              {extensions.map(concept => (
                <button
                  key={concept.id}
                  onClick={() => onConceptClick?.(concept.id)}
                  className="w-full bg-purple-500/10 hover:bg-purple-500/20 rounded-lg p-3 text-left transition-colors border border-purple-500/30"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-bold text-white">{concept.name}</div>
                      <div className="text-xs text-gray-400">{concept.grade}</div>
                    </div>
                    <div className="text-xs text-purple-400">→</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {pathToGoal.length > 0 && (
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 rounded-xl p-4 border border-yellow-500/30">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-yellow-400" />
              <div className="text-xs font-bold text-yellow-400">서울대 킬러 문항까지의 경로</div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {pathToGoal.map((concept, idx) => (
                <div key={concept.id} className="flex items-center gap-2 flex-shrink-0">
                  <div className="bg-yellow-500/20 rounded-lg px-3 py-2 border border-yellow-500/30">
                    <div className="text-xs font-bold text-white whitespace-nowrap">{concept.name}</div>
                    <div className="text-xs text-gray-400">{concept.grade}</div>
                  </div>
                  {idx < pathToGoal.length - 1 && (
                    <div className="text-yellow-400">→</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-gray-400">
              ⚡ 이 문제의 개념이 최적화 문제로 발전합니다!
            </div>
          </div>
        )}

        <div className="bg-blue-500/5 rounded-lg p-3 border border-blue-500/20">
          <div className="text-xs text-blue-300">
            💡 <strong>지금 배우는 이 개념이 수능 30번 문제의 씨앗입니다.</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
