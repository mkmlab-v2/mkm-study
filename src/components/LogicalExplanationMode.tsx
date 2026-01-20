import { useState } from 'react';
import { MessageSquare, CheckCircle, XCircle, Sparkles, Award } from 'lucide-react';
import { MathProblem } from '../data/mathContent';

interface LogicalExplanationModeProps {
  problem: MathProblem;
  onComplete: (score: number) => void;
}

export default function LogicalExplanationMode({ problem, onComplete }: LogicalExplanationModeProps) {
  const [explanation, setExplanation] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<{
    score: number;
    feedback: string[];
    logicGaps: string[];
  } | null>(null);

  const evaluateExplanation = async () => {
    if (explanation.trim().length < 20) {
      alert('설명이 너무 짧습니다. 최소 20자 이상 작성해주세요.');
      return;
    }

    setIsEvaluating(true);

    await new Promise(resolve => setTimeout(resolve, 2000));

    const hasKeywords = ['왜냐하면', '따라서', '그러므로', '이유는', '때문에'].some(
      keyword => explanation.includes(keyword)
    );

    const hasSteps = explanation.split('\n').length >= 2 ||
                     explanation.includes('1단계') ||
                     explanation.includes('첫째') ||
                     explanation.includes('먼저');

    const hasConcept = explanation.includes(problem.concept.substring(0, 5));

    let score = 0;
    const feedback: string[] = [];
    const logicGaps: string[] = [];

    if (hasKeywords) {
      score += 30;
      feedback.push('✓ 논리적 연결어를 잘 사용했습니다.');
    } else {
      logicGaps.push('논리적 연결어(왜냐하면, 따라서 등)가 부족합니다.');
    }

    if (hasSteps) {
      score += 35;
      feedback.push('✓ 단계별로 설명을 잘 구성했습니다.');
    } else {
      logicGaps.push('설명을 단계별로 나누어 작성하면 더 좋습니다.');
    }

    if (hasConcept) {
      score += 35;
      feedback.push('✓ 핵심 개념을 언급했습니다.');
    } else {
      logicGaps.push(`핵심 개념 "${problem.concept}"을 언급하지 않았습니다.`);
    }

    if (explanation.length > 50) {
      feedback.push('✓ 충분히 자세하게 설명했습니다.');
    }

    setEvaluation({ score, feedback, logicGaps });
    setIsEvaluating(false);

    if (score >= 70) {
      onComplete(score);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-8 h-8 text-purple-400" />
          <div>
            <h3 className="text-xl font-bold text-white">논리적 설명 모드</h3>
            <p className="text-sm text-gray-400">서울대식 사고력 훈련</p>
          </div>
        </div>

        <div className="bg-purple-500/10 rounded-xl p-4 mb-4 border border-purple-500/30">
          <div className="text-sm text-purple-300 mb-2 font-bold">🎯 미션</div>
          <div className="text-white">
            <strong>정답:</strong> {problem.answer}
          </div>
          <div className="text-gray-300 mt-3">
            이 답이 <strong>왜</strong> 정답인지 논리적 근거를 3단계로 설명하세요.
          </div>
        </div>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-2 block">
            💭 나의 논리적 설명 (최소 20자)
          </label>
          <textarea
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            placeholder="예시:
1단계: 문제 조건 분석
- 주어진 조건 A에서...
2단계: 개념 적용
- 이차함수의 성질에 의해...
3단계: 결론 도출
- 따라서 답은..."
            className="w-full bg-gray-900 text-white rounded-xl p-4 min-h-[200px] border border-gray-700 focus:border-purple-500 focus:outline-none resize-none"
            disabled={evaluation !== null}
          />
          <div className="text-xs text-gray-500 mt-1">
            {explanation.length} / 20자
          </div>
        </div>

        {!evaluation ? (
          <button
            onClick={evaluateExplanation}
            disabled={isEvaluating}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-bold hover:from-purple-600 hover:to-pink-600 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isEvaluating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                AI가 평가 중...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                논리력 평가 받기
              </>
            )}
          </button>
        ) : (
          <div className="space-y-4">
            <div className={`rounded-xl p-6 ${
              evaluation.score >= 70
                ? 'bg-green-500/20 border border-green-500/50'
                : 'bg-yellow-500/20 border border-yellow-500/50'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {evaluation.score >= 70 ? (
                    <CheckCircle className="w-8 h-8 text-green-400" />
                  ) : (
                    <XCircle className="w-8 h-8 text-yellow-400" />
                  )}
                  <div>
                    <div className="text-xl font-bold text-white">
                      {evaluation.score >= 70 ? '논리력 인정!' : '논리 보완 필요'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {evaluation.score >= 70
                        ? '서울대 수준의 논리적 사고를 보여줬습니다.'
                        : '조금 더 체계적으로 설명해보세요.'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1">
                    <Award className="w-5 h-5 text-yellow-400" />
                    <span className="text-sm text-gray-400">논리 점수</span>
                  </div>
                  <div className="text-3xl font-bold text-yellow-400">{evaluation.score}</div>
                </div>
              </div>

              <div className="space-y-3">
                {evaluation.feedback.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-green-400 mb-2">👍 잘한 점</div>
                    <div className="space-y-1">
                      {evaluation.feedback.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-300 bg-gray-900/50 rounded px-3 py-2">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {evaluation.logicGaps.length > 0 && (
                  <div>
                    <div className="text-sm font-bold text-yellow-400 mb-2">💡 개선할 점</div>
                    <div className="space-y-1">
                      {evaluation.logicGaps.map((item, idx) => (
                        <div key={idx} className="text-sm text-gray-300 bg-gray-900/50 rounded px-3 py-2">
                          • {item}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {evaluation.score < 70 && (
              <button
                onClick={() => {
                  setEvaluation(null);
                  setExplanation('');
                }}
                className="w-full bg-yellow-500/20 text-yellow-400 py-3 rounded-xl font-bold hover:bg-yellow-500/30 transition-colors"
              >
                다시 설명하기
              </button>
            )}
          </div>
        )}

        <div className="mt-4 bg-blue-500/10 rounded-lg p-3 border border-blue-500/20">
          <div className="text-xs text-blue-300">
            💡 <strong>Tip:</strong> 단순히 답만 맞히는 것이 아니라, <strong>왜 그런지 설명할 수 있어야</strong> 진짜 실력입니다.
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
        <div className="text-sm text-gray-400 mb-2 font-bold">📖 모범 설명 예시</div>
        <div className="text-sm text-gray-300 whitespace-pre-line bg-gray-800 rounded-lg p-3">
          {problem.explanation}
        </div>
      </div>
    </div>
  );
}
