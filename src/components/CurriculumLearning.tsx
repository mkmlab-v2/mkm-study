import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Lock, Play, ArrowRight, GraduationCap, Target, AlertCircle } from 'lucide-react';
import { generateMathProblem, explainMathConcept } from '../utils/api';
import { answerQuestion } from '../utils/api';
import { adjustLearningDifficulty, isOptimalForLearning, convertRPPGResultToState } from '../utils/adaptiveLearningScheduler';
import type { RPPGResult } from '../utils/rppgProcessor';

interface CurriculumUnit {
  unit: string;
  topics: string[];
}

interface CurriculumData {
  [grade: string]: CurriculumUnit[];
}

interface UnitProgress {
  unit: string;
  completed: boolean;
  currentTopic: number;
  topicsProgress: boolean[];
}

interface GradeProgress {
  grade: string;
  units: UnitProgress[];
  overallProgress: number;
}

// 표준 교육과정 (커리큘럼 맵에서 로드하거나 기본값 사용)
const DEFAULT_CURRICULUM: CurriculumData = {
  '초6': [
    { unit: '분수의 나눗셈', topics: ['분수 나눗셈', '분수와 자연수의 나눗셈', '분수 나눗셈의 활용'] },
    { unit: '소수의 나눗셈', topics: ['소수 나눗셈', '소수와 자연수의 나눗셈', '소수 나눗셈의 활용'] },
    { unit: '비와 비율', topics: ['비', '비율', '비율의 활용'] },
    { unit: '원의 넓이', topics: ['원의 넓이 구하기', '원의 넓이와 원주율', '원의 넓이 활용'] },
    { unit: '직육면체의 부피와 겉넓이', topics: ['직육면체의 부피', '직육면체의 겉넓이', '부피와 겉넓이의 관계'] },
    { unit: '비례식과 비례배분', topics: ['비례식', '비례배분', '비례식의 활용'] },
    { unit: '원기둥, 원뿔, 구', topics: ['원기둥', '원뿔', '구'] },
    { unit: '자료의 정리', topics: ['도수분포표', '히스토그램', '자료 해석'] }
  ],
  '중1': [
    { unit: '소인수분해', topics: ['소수와 합성수', '소인수분해', '최대공약수와 최소공배수'] },
    { unit: '정수와 유리수', topics: ['정수', '유리수', '유리수의 사칙연산'] },
    { unit: '일차방정식', topics: ['일차방정식', '일차방정식의 활용'] },
    { unit: '좌표평면과 그래프', topics: ['좌표평면', '정비례와 반비례'] },
    { unit: '도형의 기초', topics: ['기본 도형', '작도와 합동'] },
    { unit: '평면도형', topics: ['다각형', '원과 부채꼴'] },
    { unit: '입체도형', topics: ['입체도형', '입체도형의 겉넓이와 부피'] },
    { unit: '통계', topics: ['자료의 정리와 해석'] }
  ],
  '중2': [
    { unit: '유리수와 순환소수', topics: ['유리수와 순환소수', '순환소수를 분수로 나타내기'] },
    { unit: '식의 계산', topics: ['다항식의 계산', '곱셈 공식', '인수분해'] },
    { unit: '일차부등식', topics: ['일차부등식', '연립일차부등식'] },
    { unit: '연립방정식', topics: ['연립방정식', '연립방정식의 활용'] },
    { unit: '일차함수', topics: ['일차함수', '일차함수의 그래프', '일차함수의 활용'] },
    { unit: '이등변삼각형과 직각삼각형', topics: ['이등변삼각형', '직각삼각형'] },
    { unit: '평행사변형', topics: ['평행사변형', '여러 가지 사각형'] },
    { unit: '닮음', topics: ['닮은 도형', '삼각형의 닮음', '닮음의 활용'] },
    { unit: '확률', topics: ['확률', '확률의 계산'] }
  ],
  '중3': [
    { unit: '제곱근과 실수', topics: ['제곱근', '무리수와 실수'] },
    { unit: '인수분해와 이차방정식', topics: ['인수분해', '이차방정식', '이차방정식의 활용'] },
    { unit: '이차함수', topics: ['이차함수', '이차함수의 그래프', '이차함수의 활용'] },
    { unit: '원의 성질', topics: ['원과 직선', '원주각'] },
    { unit: '삼각비', topics: ['삼각비', '삼각비의 활용'] },
    { unit: '통계', topics: ['대푯값과 산포도', '상관관계'] }
  ]
};

const ENGLISH_CURRICULUM: CurriculumData = {
  '초6': [
    { unit: '인사와 자기소개', topics: ['Hello, Hi', 'My name is...', 'Nice to meet you'] },
    { unit: '숫자와 색깔', topics: ['Numbers 1-100', 'Colors', 'Counting'] },
    { unit: '가족과 친구', topics: ['Family members', 'This is my...', 'Who is this?'] },
    { unit: '학교생활', topics: ['School subjects', 'Classroom English', 'School activities'] },
    { unit: '하루 일과', topics: ['Daily routines', 'What time is it?', 'I get up at...'] },
    { unit: '음식과 음료', topics: ['Food and drinks', 'I like...', 'What do you want?'] },
    { unit: '동물과 자연', topics: ['Animals', 'Nature', 'I can see...'] },
    { unit: '과거 이야기', topics: ['Past tense', 'Yesterday', 'What did you do?'] }
  ],
  '중1': [
    { unit: '인사와 자기소개', topics: ['인사 표현', '자기소개', '기본 대화'] },
    { unit: '학교생활', topics: ['교실 영어', '과목 표현', '학교 시설'] },
    { unit: '가족과 친구', topics: ['가족 관계', '친구 소개', '관계 표현'] },
    { unit: '일상생활', topics: ['시간 표현', '날짜 표현', '일상 활동'] },
    { unit: '음식과 음료', topics: ['음식 이름', '주문하기', '취향 표현'] },
    { unit: '취미와 관심사', topics: ['취미 표현', '좋아하는 것', '여가 활동'] }
  ],
  '중2': [
    { unit: '과거 이야기', topics: ['과거형', '과거 경험', '과거 습관'] },
    { unit: '미래 계획', topics: ['미래형', '계획 표현', '의도 표현'] },
    { unit: '능력과 가능성', topics: ['can/could', '가능성 표현', '능력 표현'] },
    { unit: '의무와 필요', topics: ['must/should', '의무 표현', '조언 표현'] },
    { unit: '비교와 최상급', topics: ['비교급', '최상급', '비교 표현'] },
    { unit: '수동태', topics: ['수동태 기본', '수동태 활용', '수동태 변환'] }
  ],
  '중3': [
    { unit: '현재완료', topics: ['현재완료 기본', '경험 표현', '완료 표현'] },
    { unit: '관계대명사', topics: ['who/which/that', '관계대명사 활용', '복문 만들기'] },
    { unit: '간접의문문', topics: ['간접의문문 기본', '의문사 활용', '간접화법'] },
    { unit: '가정법', topics: ['if 조건문', '가정법 과거', '가정법 과거완료'] },
    { unit: '분사와 분사구문', topics: ['현재분사', '과거분사', '분사구문'] },
    { unit: '독해와 작문', topics: ['문단 이해', '요약하기', '에세이 쓰기'] }
  ]
};

interface CurriculumLearningProps {
  subject: 'math' | 'english';
  currentState: { S: number; L: number; K: number; M: number };
  rppgState?: RPPGResult; // RPPG 상태 (선택적)
}

export default function CurriculumLearning({ subject, currentState, rppgState }: CurriculumLearningProps) {
  // 사용자 프로필에서 학년 정보 로드
  const getUserGrade = (): '초6' | '중1' | '중2' | '중3' => {
    try {
      const profileData = localStorage.getItem('user-profile');
      if (profileData) {
        const profile = JSON.parse(profileData);
        if (profile.currentGrade && ['초6', '중1', '중2', '중3'].includes(profile.currentGrade)) {
          return profile.currentGrade;
        }
      }
    } catch (e) {
      console.warn('[학년 정보 로드 실패]', e);
    }
      return '초6'; // 기본값 (초등학교 6학년)
  };

  const [selectedGrade, setSelectedGrade] = useState<'중1' | '중2' | '중3'>(getUserGrade());
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [progress, setProgress] = useState<Record<string, GradeProgress>>({});
  const [currentProblem, setCurrentProblem] = useState<string | null>(null);
  const [currentExplanation, setCurrentExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [learningSchedule, setLearningSchedule] = useState<ReturnType<typeof adjustLearningDifficulty> | null>(null);
  const [optimalCheck, setOptimalCheck] = useState<ReturnType<typeof isOptimalForLearning> | null>(null);

  const curriculum = subject === 'math' ? DEFAULT_CURRICULUM : ENGLISH_CURRICULUM;
  const currentGradeUnits = curriculum[selectedGrade] || [];

  // 진행 상황 로드
  useEffect(() => {
    const saved = localStorage.getItem(`curriculum-progress-${subject}`);
    if (saved) {
      try {
        setProgress(JSON.parse(saved));
      } catch (e) {
        console.error('[진행 상황 로드 실패]', e);
      }
    }
  }, [subject]);

  // RPPG 상태 기반 학습 스케줄링 업데이트
  useEffect(() => {
    if (rppgState) {
      // RPPGResult를 RPPGState로 변환
      const rppgStateForScheduler = convertRPPGResultToState(rppgState);
      
      // 학습 최적 상태 확인
      const optimal = isOptimalForLearning(rppgStateForScheduler);
      setOptimalCheck(optimal);
      
      // 현재 난이도 가정 (medium)
      const schedule = adjustLearningDifficulty(rppgStateForScheduler, 'medium', subject);
      setLearningSchedule(schedule);
    }
  }, [rppgState, subject]);

  // 진행 상황 저장
  const saveProgress = (grade: string, unit: string, topicIndex: number) => {
    const newProgress = { ...progress };
    if (!newProgress[grade]) {
      newProgress[grade] = {
        grade,
        units: currentGradeUnits.map(u => ({
          unit: u.unit,
          completed: false,
          currentTopic: 0,
          topicsProgress: new Array(u.topics.length).fill(false)
        })),
        overallProgress: 0
      };
    }

    const unitIndex = currentGradeUnits.findIndex(u => u.unit === unit);
    if (unitIndex >= 0) {
      const unitProgress = newProgress[grade].units[unitIndex];
      unitProgress.topicsProgress[topicIndex] = true;
      
      // 다음 토픽으로 이동
      if (topicIndex < unitProgress.topicsProgress.length - 1) {
        unitProgress.currentTopic = topicIndex + 1;
      } else {
        // 단원 완료
        unitProgress.completed = true;
        unitProgress.currentTopic = 0;
      }

      // 전체 진행률 계산
      const totalTopics = newProgress[grade].units.reduce((sum, u) => sum + u.topicsProgress.length, 0);
      const completedTopics = newProgress[grade].units.reduce(
        (sum, u) => sum + u.topicsProgress.filter(t => t).length,
        0
      );
      newProgress[grade].overallProgress = Math.round((completedTopics / totalTopics) * 100);
    }

    setProgress(newProgress);
    localStorage.setItem(`curriculum-progress-${subject}`, JSON.stringify(newProgress));
  };

  const handleTopicSelect = async (unit: string, topic: string, topicIndex: number) => {
    setSelectedUnit(unit);
    setSelectedTopic(topic);
    setCurrentProblem(null);
    setCurrentExplanation(null);
    setIsLoading(true);

    try {
      if (subject === 'math') {
        // 수학: 문제 생성 및 개념 설명
        const [problem, explanation] = await Promise.all([
          generateMathProblem(selectedGrade, topic),
          explainMathConcept(topic, selectedGrade)
        ]);
        setCurrentProblem(problem);
        setCurrentExplanation(explanation);
      } else {
        // 영어: 문장 생성 및 설명
        const prompt = `${selectedGrade} ${unit} 단원의 "${topic}" 주제에 대한 학습 문장을 생성해주세요.
        
다음 형식으로 제공해주세요:
1. 영어 문장 (EBS 수능특강 수준)
2. 한국어 번역
3. 핵심 문법 설명
4. 중요 어휘 (3-5개)
5. 활용 예시`;

        const response = await answerQuestion(prompt, currentState, 'english');
        setCurrentProblem(response);
      }
    } catch (error) {
      console.error('[학습 자료 생성 실패]', error);
      setCurrentProblem('죄송합니다. 학습 자료를 생성하는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = (unit: string, topicIndex: number) => {
    saveProgress(selectedGrade, unit, topicIndex);
    setCurrentProblem(null);
    setCurrentExplanation(null);
  };

  const getUnitProgress = (unit: string): UnitProgress | null => {
    const gradeProgress = progress[selectedGrade];
    if (!gradeProgress) return null;
    return gradeProgress.units.find(u => u.unit === unit) || null;
  };

  const isTopicCompleted = (unit: string, topicIndex: number): boolean => {
    const unitProgress = getUnitProgress(unit);
    return unitProgress?.topicsProgress[topicIndex] || false;
  };

  const isTopicLocked = (unit: string, topicIndex: number): boolean => {
    const unitProgress = getUnitProgress(unit);
    if (!unitProgress) return topicIndex > 0; // 첫 번째 토픽만 열림
    return topicIndex > unitProgress.currentTopic;
  };

  const gradeProgress = progress[selectedGrade]?.overallProgress || 0;

  return (
    <div className="space-y-4">
      {/* 학년 선택 */}
      <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-500/30">
        <div className="flex items-center gap-3 mb-4">
          <GraduationCap className="w-8 h-8 text-blue-400" />
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">
              {subject === 'math' ? '수학' : '영어'} 커리큘럼 학습
            </h2>
            <p className="text-sm text-gray-400">중학교 1-3학년 단계별 학습</p>
          </div>
        </div>

        {/* RPPG 기반 학습 스케줄링 알림 */}
        {learningSchedule && optimalCheck && (
          <div className={`mb-4 rounded-2xl p-4 border-2 ${
            optimalCheck.optimal 
              ? 'bg-green-500/10 border-green-500/50' 
              : 'bg-yellow-500/10 border-yellow-500/50'
          }`}>
            <div className="flex items-start gap-3">
              <AlertCircle className={`w-5 h-5 mt-0.5 ${
                optimalCheck.optimal ? 'text-green-400' : 'text-yellow-400'
              }`} />
              <div className="flex-1">
                <div className="text-sm font-bold text-white mb-1">
                  {optimalCheck.optimal ? '✅ 최적 학습 상태' : '⚠️ 학습 상태 주의'}
                </div>
                <div className="text-xs text-gray-300 mb-2">
                  {optimalCheck.reason}
                </div>
                <div className="text-xs text-blue-300 mb-1">
                  💡 권장 난이도: <span className="font-bold">{learningSchedule.difficulty === 'easy' ? '쉬움' : learningSchedule.difficulty === 'medium' ? '중간' : '어려움'}</span>
                </div>
                <div className="text-xs text-gray-400">
                  {learningSchedule.reason}
                </div>
                <div className="text-xs text-purple-300 mt-2">
                  📚 권장 활동: {learningSchedule.recommendedActivity}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 학년 선택 버튼 */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['중1', '중2', '중3'] as const).map(grade => (
            <button
              key={grade}
              onClick={() => {
                setSelectedGrade(grade);
                setSelectedUnit(null);
                setSelectedTopic(null);
                setCurrentProblem(null);
              }}
              className={`py-3 px-4 rounded-xl font-bold transition-all ${
                selectedGrade === grade
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {grade}
              {progress[grade] && (
                <div className="text-xs mt-1 opacity-75">
                  {progress[grade].overallProgress}% 완료
                </div>
              )}
            </button>
          ))}
        </div>

        {/* 전체 진행률 */}
        {gradeProgress > 0 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
              <span>전체 진행률</span>
              <span className="font-bold text-blue-400">{gradeProgress}%</span>
            </div>
            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${gradeProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 단원 목록 */}
      <div className="space-y-3">
        {currentGradeUnits.map((unitData, unitIndex) => {
          const unitProgress = getUnitProgress(unitData.unit);
          const isUnitExpanded = selectedUnit === unitData.unit;
          const unitCompleted = unitProgress?.completed || false;

          return (
            <div
              key={unitData.unit}
              className={`bg-gray-900 rounded-2xl border-2 transition-all ${
                isUnitExpanded
                  ? 'border-blue-500/50 bg-blue-500/10'
                  : 'border-gray-700/50 bg-gray-900/40'
              }`}
            >
              {/* 단원 헤더 */}
              <button
                onClick={() => {
                  setSelectedUnit(isUnitExpanded ? null : unitData.unit);
                  setSelectedTopic(null);
                  setCurrentProblem(null);
                }}
                className="w-full p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {unitCompleted ? (
                    <CheckCircle className="w-6 h-6 text-green-400" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-blue-400" />
                  )}
                  <div className="text-left">
                    <h3 className="text-lg font-bold text-white">
                      {unitIndex + 1}. {unitData.unit}
                    </h3>
                    {unitProgress && (
                      <p className="text-xs text-gray-400">
                        {unitProgress.topicsProgress.filter(t => t).length} / {unitProgress.topicsProgress.length} 완료
                      </p>
                    )}
                  </div>
                </div>
                <ArrowRight
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isUnitExpanded ? 'rotate-90' : ''
                  }`}
                />
              </button>

              {/* 토픽 목록 */}
              {isUnitExpanded && (
                <div className="px-4 pb-4 space-y-2">
                  {unitData.topics.map((topic, topicIndex) => {
                    const completed = isTopicCompleted(unitData.unit, topicIndex);
                    const locked = isTopicLocked(unitData.unit, topicIndex);
                    const isSelected = selectedTopic === topic;

                    return (
                      <button
                        key={topic}
                        onClick={() => !locked && handleTopicSelect(unitData.unit, topic, topicIndex)}
                        disabled={locked || isLoading}
                        className={`w-full p-3 rounded-xl text-left transition-all ${
                          locked
                            ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed'
                            : completed
                            ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20 border border-green-500/30'
                            : isSelected
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50'
                            : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {locked ? (
                              <Lock className="w-4 h-4" />
                            ) : completed ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                            <span className="font-medium">{topic}</span>
                          </div>
                          {completed && (
                            <span className="text-xs text-green-400">✓ 완료</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 학습 내용 */}
      {selectedTopic && (
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">
              {selectedUnit} - {selectedTopic}
            </h3>
          </div>

          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
              <p className="text-gray-400 mt-4">학습 자료 생성 중...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {currentProblem && (
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700">
                  <div className="text-white whitespace-pre-line leading-relaxed">
                    {currentProblem}
                  </div>
                </div>
              )}

              {currentExplanation && subject === 'math' && (
                <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
                  <h4 className="text-blue-400 font-bold mb-2">📚 개념 설명</h4>
                  <div className="text-gray-300 whitespace-pre-line leading-relaxed">
                    {currentExplanation}
                  </div>
                </div>
              )}

              {selectedTopic && !isLoading && (
                <button
                  onClick={() => {
                    const topicIndex = currentGradeUnits
                      .find(u => u.unit === selectedUnit)!
                      .topics.indexOf(selectedTopic);
                    handleComplete(selectedUnit!, topicIndex);
                  }}
                  className="w-full bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  이 토픽 완료하기
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

