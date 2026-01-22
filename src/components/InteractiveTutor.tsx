/**
 * 🧠 대화형 튜터 컴포넌트
 * 
 * 사용자와의 대화를 통해 학습 상태를 파악하고 맞춤형 학습을 제안합니다.
 * 
 * 작성일: 2026-01-22
 */

import { useState } from 'react';
import { MessageCircle, Brain, TrendingUp, Clock } from 'lucide-react';
import type { Vector4D } from '../utils/types';

interface InteractiveTutorProps {
  currentState: Vector4D;
  tutorPersona?: {
    name: string;
    personality: string;
  } | null;
  onStartLearning?: (subject: 'math' | 'english', topic?: string) => void;
}

export default function InteractiveTutor({ 
  currentState, 
  tutorPersona,
  onStartLearning 
}: InteractiveTutorProps) {
  const [userResponse, setUserResponse] = useState<string>('');
  const [tutorMessage, setTutorMessage] = useState<string>('');
  const [showInput, setShowInput] = useState(true);

  // 인지 상태 분석 (공학적 언어)
  const analyzeCognitiveState = (): {
    dominantType: string;
    recommendation: string;
    optimalTime: string;
    suggestedSubject: 'math' | 'english' | null;
  } => {
    const { S, L, K, M } = currentState;
    
    // 가장 높은 차원 찾기
    const maxValue = Math.max(S, L, K, M);
    let dominantType = '';
    let suggestedSubject: 'math' | 'english' | null = null;
    
    if (S === maxValue) {
      dominantType = '메타인지 및 몰입 상태 (Metacognition & Flow State)';
      suggestedSubject = 'english'; // 언어적 직관이 높을 때
    } else if (L === maxValue) {
      dominantType = '논리적 사고 (Logical Reasoning)';
      suggestedSubject = 'math'; // 논리적 사고가 높을 때
    } else if (K === maxValue) {
      dominantType = '지식 축적 (Knowledge Accumulation)';
      suggestedSubject = null; // 복합 학습
    } else {
      dominantType = '신체적 활력 (Physical Vitality)';
      suggestedSubject = null; // 활동적 학습
    }

    // 골든 타임 계산 (M 차원 기반)
    const currentHour = new Date().getHours();
    let optimalTime = '';
    if (currentHour >= 6 && currentHour < 10) {
      optimalTime = '아침 시간대 (6-10시)는 집중력이 높은 골든 타임입니다.';
    } else if (currentHour >= 10 && currentHour < 14) {
      optimalTime = '오전 시간대 (10-14시)는 인지 처리 속도가 최고조입니다.';
    } else if (currentHour >= 14 && currentHour < 18) {
      optimalTime = '오후 시간대 (14-18시)는 복합 학습에 적합합니다.';
    } else {
      optimalTime = '저녁 시간대는 복습과 정리에 적합합니다.';
    }

    // 추천 메시지 생성
    let recommendation = '';
    if (suggestedSubject === 'math') {
      recommendation = '현재 논리적 사고 능력이 높은 상태입니다. 수학 문제 해결에 최적의 시점입니다.';
    } else if (suggestedSubject === 'english') {
      recommendation = '현재 언어적 직관이 활성화되어 있습니다. 영어 학습에 집중하면 효율이 높습니다.';
    } else {
      recommendation = '현재 균형잡힌 인지 상태입니다. 복합 학습을 권장합니다.';
    }

    return {
      dominantType,
      recommendation,
      optimalTime,
      suggestedSubject
    };
  };

  const analysis = analyzeCognitiveState();

  const handleResponse = () => {
    if (!userResponse.trim()) return;

    // 사용자 응답 분석 (간단한 키워드 매칭)
    const response = userResponse.toLowerCase();
    let tutorReply = '';

    if (response.includes('피곤') || response.includes('졸려') || response.includes('힘들')) {
      tutorReply = `생체 역학적 스케줄링 분석 결과, 현재는 휴식이 필요한 시점입니다. 5분간 스트레칭을 권장합니다. 휴식 후 학습 효율이 ${Math.round((1 - M) * 50 + 50)}% 향상될 것으로 예측됩니다.`;
    } else if (response.includes('좋아') || response.includes('괜찮') || response.includes('컨디션 좋')) {
      tutorReply = `훌륭합니다! 현재 인지 상태 분석 결과, ${analysis.dominantType}가 활성화되어 있습니다. ${analysis.recommendation} ${analysis.optimalTime}`;
    } else if (response.includes('수학') || response.includes('math')) {
      tutorReply = `수학 학습을 시작하시겠습니까? 현재 논리적 사고 능력(L: ${(L * 100).toFixed(0)}%)이 높아 수학 문제 해결에 최적의 상태입니다.`;
      if (onStartLearning) {
        setTimeout(() => onStartLearning('math'), 2000);
      }
    } else if (response.includes('영어') || response.includes('english')) {
      tutorReply = `영어 학습을 시작하시겠습니까? 현재 언어적 직관(S: ${(S * 100).toFixed(0)}%)이 활성화되어 있어 영어 학습에 적합합니다.`;
      if (onStartLearning) {
        setTimeout(() => onStartLearning('english'), 2000);
      }
    } else {
      tutorReply = `이해했습니다. ${analysis.recommendation} ${analysis.optimalTime} 어떤 학습을 시작하시겠습니까?`;
    }

    setTutorMessage(tutorReply);
    setShowInput(false);
  };

  const handleReset = () => {
    setUserResponse('');
    setTutorMessage('');
    setShowInput(true);
  };

  return (
    <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-blue-500/30 mb-4">
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-blue-500/20 p-3 rounded-xl">
          <Brain className="w-6 h-6 text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">대화형 튜터</h3>
          {tutorPersona && (
            <p className="text-xs text-gray-400 mb-2">
              {tutorPersona.name} - {tutorPersona.personality}
            </p>
          )}
        </div>
      </div>

      {/* 튜터 메시지 */}
      {!tutorMessage ? (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white text-base leading-relaxed">
              오늘 컨디션은 어때요? (수면 시간, 스트레스 체크)
            </p>
          </div>
          
          {/* 인지 상태 분석 (공학적 언어) */}
          <div className="bg-blue-500/10 rounded-xl p-4 border border-blue-500/30">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-semibold text-blue-300">인지 상태 분석</span>
            </div>
            <p className="text-xs text-gray-300 mb-2">
              <strong>활성화된 인지 유형:</strong> {analysis.dominantType}
            </p>
            <p className="text-xs text-gray-300">
              <strong>추천:</strong> {analysis.recommendation}
            </p>
          </div>

          {/* 골든 타임 정보 */}
          <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-purple-300">생체 역학적 스케줄링</span>
            </div>
            <p className="text-xs text-gray-300">{analysis.optimalTime}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <p className="text-white text-sm leading-relaxed">{tutorMessage}</p>
          </div>
          <button
            onClick={handleReset}
            className="text-xs text-blue-400 hover:text-blue-300 underline"
          >
            다시 질문하기
          </button>
        </div>
      )}

      {/* 사용자 입력 */}
      {showInput && !tutorMessage && (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            value={userResponse}
            onChange={(e) => setUserResponse(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleResponse()}
            placeholder="예: 오늘 컨디션 좋아요, 수학 공부하고 싶어요..."
            className="w-full bg-gray-800/50 border border-gray-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleResponse}
            disabled={!userResponse.trim()}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            답변하기
          </button>
        </div>
      )}

      {/* 빠른 액션 버튼 */}
      {!tutorMessage && (
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setUserResponse('수학 공부하고 싶어요');
              handleResponse();
            }}
            className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 px-3 py-2 rounded-xl text-xs font-medium transition-colors border border-blue-500/30"
          >
            수학 시작
          </button>
          <button
            onClick={() => {
              setUserResponse('영어 공부하고 싶어요');
              handleResponse();
            }}
            className="bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-3 py-2 rounded-xl text-xs font-medium transition-colors border border-purple-500/30"
          >
            영어 시작
          </button>
        </div>
      )}
    </div>
  );
}

