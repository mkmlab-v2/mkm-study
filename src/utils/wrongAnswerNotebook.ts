/**
 * 🏛️ 4D 증류 오답 노트 시스템
 * 
 * 오답 문제를 4D 벡터로 분석하여 저장하고, 벡터 유사도 기반으로 복습 효율을 극대화합니다.
 * 
 * 작성일: 2026-01-22
 * 상태: ✅ Phase 2 구현 중
 */

import type { Vector4D } from './types';
import { vectorizeText } from './api';

export interface WrongAnswer {
  id: string;
  problem: string; // 문제 텍스트
  subject: 'math' | 'english';
  topic: string; // 주제 (예: "이차방정식", "관계대명사")
  unit: string; // 단원 (예: "중2 일차방정식")
  userAnswer: string; // 사용자가 입력한 답
  correctAnswer: string; // 정답
  explanation?: string; // 해설
  vector_4d: Vector4D; // 4D 벡터 (S-L-K-M)
  timestamp: number; // 오답 발생 시간
  reviewCount: number; // 복습 횟수
  lastReviewTime: number; // 마지막 복습 시간
  masteryLevel: number; // 숙련도 (0-1, 1이면 완전히 이해함)
  mistakePattern?: string; // 실수 패턴 (예: "계산 실수", "개념 오해")
}

const STORAGE_KEY = 'wrong-answer-notebook';

/**
 * 오답 노트 로드
 */
export function loadWrongAnswers(): WrongAnswer[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[오답 노트] 로드 실패:', e);
  }
  return [];
}

/**
 * 오답 노트 저장
 */
export function saveWrongAnswers(answers: WrongAnswer[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch (e) {
    console.error('[오답 노트] 저장 실패:', e);
  }
}

/**
 * 오답 추가 (4D 벡터 분석 포함)
 */
export async function addWrongAnswer(
  problem: string,
  userAnswer: string,
  correctAnswer: string,
  subject: 'math' | 'english',
  topic: string,
  unit: string,
  explanation?: string
): Promise<WrongAnswer> {
  // 문제 텍스트를 4D 벡터로 분석
  const vector_4d = await vectorizeText(problem);
  
  // 실수 패턴 분석 (간단한 키워드 기반)
  const mistakePattern = analyzeMistakePattern(problem, userAnswer, correctAnswer);
  
  const wrongAnswer: WrongAnswer = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    problem,
    subject,
    topic,
    unit,
    userAnswer,
    correctAnswer,
    explanation,
    vector_4d,
    timestamp: Date.now(),
    reviewCount: 0,
    lastReviewTime: 0,
    masteryLevel: 0,
    mistakePattern
  };
  
  // 오답 노트에 추가
  const answers = loadWrongAnswers();
  answers.push(wrongAnswer);
  saveWrongAnswers(answers);
  
  console.log('[오답 노트] 오답 추가:', { id: wrongAnswer.id, topic, vector_4d });
  
  return wrongAnswer;
}

/**
 * 실수 패턴 분석
 */
function analyzeMistakePattern(problem: string, userAnswer: string, correctAnswer: string): string {
  // 간단한 키워드 기반 패턴 분석
  if (problem.includes('계산') || problem.includes('연산')) {
    return '계산 실수';
  } else if (problem.includes('개념') || problem.includes('이해')) {
    return '개념 오해';
  } else if (problem.includes('공식') || problem.includes('법칙')) {
    return '공식 오용';
  } else if (problem.includes('문법') || problem.includes('문법')) {
    return '문법 오류';
  } else if (problem.includes('독해') || problem.includes('이해')) {
    return '독해 오류';
  }
  return '일반 오류';
}

/**
 * 벡터 유사도 계산 (코사인 유사도)
 */
function cosineSimilarity(v1: Vector4D, v2: Vector4D): number {
  const dotProduct = v1.S * v2.S + v1.L * v2.L + v1.K * v2.K + v1.M * v2.M;
  const magnitude1 = Math.sqrt(v1.S ** 2 + v1.L ** 2 + v1.K ** 2 + v1.M ** 2);
  const magnitude2 = Math.sqrt(v2.S ** 2 + v2.L ** 2 + v2.K ** 2 + v2.M ** 2);
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * 유사한 오답 검색 (벡터 유사도 기반)
 */
export function findSimilarWrongAnswers(
  problem: string,
  vector_4d: Vector4D,
  subject?: 'math' | 'english',
  threshold: number = 0.7
): WrongAnswer[] {
  const answers = loadWrongAnswers();
  
  // 과목 필터링
  const filtered = subject 
    ? answers.filter(a => a.subject === subject)
    : answers;
  
  // 벡터 유사도 계산 및 정렬
  const withSimilarity = filtered.map(answer => ({
    answer,
    similarity: cosineSimilarity(vector_4d, answer.vector_4d)
  }));
  
  // 유사도가 임계값 이상인 것만 반환
  return withSimilarity
    .filter(item => item.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity)
    .map(item => item.answer);
}

/**
 * 복습할 오답 추천 (숙련도 및 시간 기반)
 */
export function getReviewRecommendations(
  subject?: 'math' | 'english',
  limit: number = 10
): WrongAnswer[] {
  const answers = loadWrongAnswers();
  
  // 과목 필터링
  const filtered = subject 
    ? answers.filter(a => a.subject === subject)
    : answers;
  
  // 복습 점수 계산 (숙련도 낮을수록, 오래 안 본 것일수록 높은 점수)
  const now = Date.now();
  const withScore = filtered.map(answer => {
    const daysSinceLastReview = answer.lastReviewTime > 0
      ? (now - answer.lastReviewTime) / (1000 * 60 * 60 * 24)
      : (now - answer.timestamp) / (1000 * 60 * 60 * 24);
    
    // 복습 점수 = (1 - 숙련도) * 0.6 + (일수 / 30) * 0.4
    const masteryScore = (1 - answer.masteryLevel) * 0.6;
    const timeScore = Math.min(daysSinceLastReview / 30, 1) * 0.4;
    const reviewScore = masteryScore + timeScore;
    
    return { answer, reviewScore };
  });
  
  // 점수 순으로 정렬하여 상위 N개 반환
  return withScore
    .sort((a, b) => b.reviewScore - a.reviewScore)
    .slice(0, limit)
    .map(item => item.answer);
}

/**
 * 오답 복습 완료 처리
 */
export function markAsReviewed(
  answerId: string,
  isCorrect: boolean
): void {
  const answers = loadWrongAnswers();
  const answer = answers.find(a => a.id === answerId);
  
  if (!answer) {
    console.warn('[오답 노트] 오답을 찾을 수 없습니다:', answerId);
    return;
  }
  
  // 복습 횟수 증가
  answer.reviewCount += 1;
  answer.lastReviewTime = Date.now();
  
  // 숙련도 업데이트 (정답이면 증가, 오답이면 감소)
  if (isCorrect) {
    // 정답: 숙련도 증가 (복습 횟수에 따라 증가량 감소)
    const increase = 0.2 / (1 + answer.reviewCount * 0.1);
    answer.masteryLevel = Math.min(1, answer.masteryLevel + increase);
  } else {
    // 오답: 숙련도 감소
    answer.masteryLevel = Math.max(0, answer.masteryLevel - 0.1);
  }
  
  saveWrongAnswers(answers);
  console.log('[오답 노트] 복습 완료:', { id: answerId, isCorrect, masteryLevel: answer.masteryLevel });
}

/**
 * 오답 통계 조회
 */
export function getWrongAnswerStats(subject?: 'math' | 'english'): {
  total: number;
  bySubject: { math: number; english: number };
  byTopic: Record<string, number>;
  averageMasteryLevel: number;
  needReviewCount: number; // 숙련도 < 0.7인 오답 개수
} {
  const answers = loadWrongAnswers();
  
  const filtered = subject 
    ? answers.filter(a => a.subject === subject)
    : answers;
  
  const bySubject = {
    math: answers.filter(a => a.subject === 'math').length,
    english: answers.filter(a => a.subject === 'english').length
  };
  
  const byTopic: Record<string, number> = {};
  filtered.forEach(answer => {
    byTopic[answer.topic] = (byTopic[answer.topic] || 0) + 1;
  });
  
  const averageMasteryLevel = filtered.length > 0
    ? filtered.reduce((sum, a) => sum + a.masteryLevel, 0) / filtered.length
    : 0;
  
  const needReviewCount = filtered.filter(a => a.masteryLevel < 0.7).length;
  
  return {
    total: filtered.length,
    bySubject,
    byTopic,
    averageMasteryLevel,
    needReviewCount
  };
}

/**
 * 오답 삭제 (완전히 숙련된 경우)
 */
export function removeWrongAnswer(answerId: string): void {
  const answers = loadWrongAnswers();
  const filtered = answers.filter(a => a.id !== answerId);
  saveWrongAnswers(filtered);
  console.log('[오답 노트] 오답 삭제:', answerId);
}

