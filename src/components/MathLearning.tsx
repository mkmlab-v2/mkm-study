import { useState } from 'react';
import { Brain, Lightbulb, CheckCircle, Sparkles, Map } from 'lucide-react';
import { getRandomMathProblem, getMathConcept, MathProblem, MathConcept } from '../data/mathContent';
import ConceptPhaseMap from './ConceptPhaseMap';
import LogicalExplanationMode from './LogicalExplanationMode';
import AdaptiveStudyMode from './AdaptiveStudyMode';
import { recommendStudyMode } from '../data/conceptGenealogy';

const TOPICS = [
  '이차함수', '삼각함수', '미분', '적분', '수열', '확률과 통계'
];

export default function MathLearning() {
  const [selectedTopic, setSelectedTopic] = useState('이차함수');
  const [currentProblem, setCurrentProblem] = useState<MathProblem | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [currentConcept, setCurrentConcept] = useState<MathConcept | null>(null);
  const [showPhaseMap, setShowPhaseMap] = useState(false);
  const [showExplanationMode, setShowExplanationMode] = useState(false);
  const [showAdaptiveMode, setShowAdaptiveMode] = useState(true);

  const currentVector = {
    S: 0.5,
    L: 0.6,
    K: 0.55,
    M: 0.65
  };

  const recommendedMode = recommendStudyMode(currentVector, '소양인');

  const loadProblem = () => {
    setShowHint(false);
    setShowAnswer(false);
    const problem = getRandomMathProblem(selectedTopic);
    setCurrentProblem(problem);
  };

  const loadConceptExplanation = () => {
    const concept = getMathConcept(selectedTopic);
    setCurrentConcept(concept);
  };

  return (
    <div className="space-y-4">
      {showAdaptiveMode && (
        <AdaptiveStudyMode
          recommendedMode={recommendedMode}
          currentVector={currentVector}
          onModeSelect={() => setShowAdaptiveMode(false)}
        />
      )}

      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Brain className="w-8 h-8 text-blue-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">수학 학습</h2>
            <p className="text-sm text-gray-400">EBS 교과과정 기반</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">학습 주제 선택</label>
          <div className="grid grid-cols-2 gap-2">
            {TOPICS.map(topic => (
              <button
                key={topic}
                onClick={() => setSelectedTopic(topic)}
                className={`py-2 px-4 rounded-xl font-bold text-sm transition-all ${
                  selectedTopic === topic
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadProblem}
            className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-5 h-5" />
            문제 불러오기
          </button>
          <button
            onClick={loadConceptExplanation}
            className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2"
          >
            <Lightbulb className="w-5 h-5" />
            개념 설명
          </button>
          <button
            onClick={() => setShowPhaseMap(!showPhaseMap)}
            className="bg-gradient-to-r from-green-500 to-teal-500 text-white px-4 py-3 rounded-xl font-bold hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <Map className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showPhaseMap && (
        <ConceptPhaseMap currentTopic={selectedTopic} />
      )}

      {currentProblem && (
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full text-sm font-bold mb-3">
              <Brain className="w-4 h-4" />
              {currentProblem.topic}
            </div>
            <h3 className="text-xl font-bold text-white mb-3">{currentProblem.title}</h3>
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <div className="text-white leading-relaxed">{currentProblem.problem}</div>
            </div>

            <div className="bg-blue-500/10 rounded-lg p-3 mb-4">
              <div className="text-sm text-blue-300 font-bold mb-1">📚 핵심 개념</div>
              <div className="text-sm text-gray-300">{currentProblem.concept}</div>
            </div>

            {showHint && (
              <div className="bg-yellow-500/10 rounded-lg p-3 mb-4 border border-yellow-500/30">
                <div className="text-sm text-yellow-400 font-bold mb-1">💡 힌트</div>
                <div className="text-sm text-gray-300">{currentProblem.hint}</div>
              </div>
            )}

            {showAnswer && (
              <div className="bg-green-500/10 rounded-lg p-3 mb-4 border border-green-500/30">
                <div className="text-sm text-green-400 font-bold mb-1">✅ 정답</div>
                <div className="text-lg text-white font-bold mb-2">{currentProblem.answer}</div>
                <div className="text-sm text-gray-300 whitespace-pre-line">{currentProblem.explanation}</div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex-1 bg-yellow-500/20 text-yellow-400 py-2 px-4 rounded-lg font-bold hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {showHint ? '힌트 숨기기' : '힌트 보기'}
            </button>
            <button
              onClick={() => setShowAnswer(!showAnswer)}
              className="flex-1 bg-green-500/20 text-green-400 py-2 px-4 rounded-lg font-bold hover:bg-green-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-4 h-4" />
              {showAnswer ? '답 숨기기' : '답 보기'}
            </button>
          </div>

          {showAnswer && (
            <button
              onClick={() => setShowExplanationMode(!showExplanationMode)}
              className="w-full mt-3 bg-purple-500/20 text-purple-400 py-2 px-4 rounded-lg font-bold hover:bg-purple-500/30 transition-colors"
            >
              {showExplanationMode ? '기본 모드로' : '🎓 논리적 설명 모드 (서울대식)'}
            </button>
          )}
        </div>
      )}

      {showExplanationMode && currentProblem && (
        <LogicalExplanationMode
          problem={currentProblem}
          onComplete={(score) => {
            alert(`논리력 점수: ${score}점! L 벡터가 상승합니다.`);
            setShowExplanationMode(false);
          }}
        />
      )}

      {currentConcept && (
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="w-6 h-6 text-purple-400" />
            <h3 className="text-lg font-bold text-white">{currentConcept.title}</h3>
          </div>

          <div className="space-y-4">
            <div>
              <div className="text-gray-300 whitespace-pre-line leading-relaxed mb-4">
                {currentConcept.description}
              </div>
            </div>

            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30">
              <div className="text-sm text-purple-400 font-bold mb-2">🌳 개념의 계보</div>
              <div className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                {currentConcept.genealogy}
              </div>
            </div>

            {currentConcept.examples.length > 0 && (
              <div>
                <div className="text-sm text-blue-400 font-bold mb-2">📝 예시</div>
                <div className="space-y-1">
                  {currentConcept.examples.map((ex, idx) => (
                    <div key={idx} className="text-sm text-gray-300 bg-gray-800 rounded px-3 py-2">
                      • {ex}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentConcept.applications.length > 0 && (
              <div>
                <div className="text-sm text-green-400 font-bold mb-2">🎯 실생활 응용</div>
                <div className="space-y-1">
                  {currentConcept.applications.map((app, idx) => (
                    <div key={idx} className="text-sm text-gray-300 bg-gray-800 rounded px-3 py-2">
                      • {app}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
        <div className="text-sm text-blue-300">
          💡 <strong>Tip:</strong> 문제를 풀기 전에 개념 설명을 먼저 읽어보세요!
        </div>
      </div>
    </div>
  );
}
