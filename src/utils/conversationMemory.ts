/**
 * 🏛️ 온디바이스 4D 증류 대화 메모리 시스템
 * 
 * 사용자와의 대화를 4D 벡터로 증류하여 온디바이스에 저장하고,
 * 향후 반려 AI로 진화할 수 있도록 의미 기반 메모리를 구축합니다.
 * 
 * 작성일: 2026-01-22
 * 상태: ✅ Phase 1 구현 완료
 */

import type { Vector4D } from './types';
import { vectorizeText } from './api';

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  vector_4d: Vector4D; // 4D 벡터 (증류된 의미)
  timestamp: number;
  context?: {
    tab?: string; // 'question', 'math', 'english' 등
    subject?: 'math' | 'english';
    topic?: string;
    emotion?: string; // 감정 상태 (향후 반려 AI용)
    confidence?: number; // 사용자 확신도 (0-1)
  };
  metadata?: {
    rppgState?: any; // 생체 신호 상태
    currentState?: Vector4D; // 현재 4D 상태
    tutorPersona?: any; // 튜터 페르소나
  };
}

export interface ConversationSession {
  id: string;
  title: string; // 대화 요약 (자동 생성)
  messages: ConversationMessage[];
  startTime: number;
  endTime?: number;
  summary_vector_4d?: Vector4D; // 전체 대화 요약 벡터
  emotion_trajectory?: Vector4D[]; // 감정 궤적 (향후 반려 AI용)
  topics?: string[]; // 대화 주제 목록
}

const STORAGE_KEY = 'conversation-memory';
const MAX_SESSIONS = 100; // 최대 세션 수 (메모리 관리)

/**
 * 대화 메모리 로드
 */
export function loadConversationMemory(): ConversationSession[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('[대화 메모리] 로드 실패:', e);
  }
  return [];
}

/**
 * 대화 메모리 저장
 */
export function saveConversationMemory(sessions: ConversationSession[]): void {
  try {
    // 최대 세션 수 제한 (오래된 세션부터 삭제)
    const sortedSessions = sessions.sort((a, b) => (b.startTime || 0) - (a.startTime || 0));
    const limitedSessions = sortedSessions.slice(0, MAX_SESSIONS);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedSessions));
    console.log('[대화 메모리] 저장 완료:', limitedSessions.length, '개 세션');
  } catch (e) {
    console.error('[대화 메모리] 저장 실패:', e);
    // localStorage 용량 초과 시 오래된 세션 삭제 후 재시도
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('[대화 메모리] 저장 공간 부족, 오래된 세션 삭제 중...');
      const reducedSessions = sessions.slice(0, Math.floor(MAX_SESSIONS / 2));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(reducedSessions));
        console.log('[대화 메모리] 저장 공간 확보 완료:', reducedSessions.length, '개 세션');
      } catch (e2) {
        console.error('[대화 메모리] 저장 공간 확보 실패:', e2);
      }
    }
  }
}

/**
 * 대화 메시지 추가 (4D 증류 포함)
 */
export async function addConversationMessage(
  role: 'user' | 'assistant',
  content: string,
  context?: ConversationMessage['context'],
  metadata?: ConversationMessage['metadata']
): Promise<ConversationMessage> {
  // 메시지를 4D 벡터로 증류
  const vector_4d = await vectorizeText(content);
  
  const message: ConversationMessage = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    role,
    content,
    vector_4d,
    timestamp: Date.now(),
    context,
    metadata
  };
  
  // 현재 세션에 추가 (또는 새 세션 생성)
  const sessions = loadConversationMemory();
  let currentSession = sessions.find(s => !s.endTime); // 진행 중인 세션
  
  if (!currentSession) {
    // 새 세션 생성
    currentSession = {
      id: `session-${Date.now()}`,
      title: content.substring(0, 30) + (content.length > 30 ? '...' : ''),
      messages: [],
      startTime: Date.now()
    };
    sessions.push(currentSession);
  }
  
  currentSession.messages.push(message);
  
  // 세션 제목 자동 업데이트 (첫 메시지 기반)
  if (currentSession.messages.length === 1) {
    currentSession.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
  }
  
  // 주제 추출 (키워드 기반, 향후 개선 가능)
  if (!currentSession.topics) {
    currentSession.topics = [];
  }
  const extractedTopics = extractTopics(content);
  extractedTopics.forEach(topic => {
    if (!currentSession.topics!.includes(topic)) {
      currentSession.topics!.push(topic);
    }
  });
  
  saveConversationMemory(sessions);
  
  console.log('[대화 메모리] 메시지 추가:', { 
    id: message.id, 
    role, 
    vector_4d,
    sessionId: currentSession.id 
  });
  
  return message;
}

/**
 * 대화 세션 종료 및 요약 벡터 생성
 */
export async function endConversationSession(sessionId: string): Promise<void> {
  const sessions = loadConversationMemory();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session || session.endTime) {
    return;
  }
  
  session.endTime = Date.now();
  
  // 전체 대화를 하나의 텍스트로 합쳐서 요약 벡터 생성
  const allMessages = session.messages.map(m => m.content).join('\n');
  if (allMessages) {
    session.summary_vector_4d = await vectorizeText(allMessages);
  }
  
  saveConversationMemory(sessions);
  
  console.log('[대화 메모리] 세션 종료:', { 
    sessionId, 
    messageCount: session.messages.length,
    summary_vector_4d: session.summary_vector_4d 
  });
}

/**
 * 벡터 유사도 기반 대화 검색 (향후 반려 AI용)
 */
export function searchConversations(
  query: string,
  queryVector: Vector4D,
  limit: number = 10
): ConversationMessage[] {
  const sessions = loadConversationMemory();
  const allMessages: ConversationMessage[] = [];
  
  // 모든 세션의 메시지 수집
  sessions.forEach(session => {
    allMessages.push(...session.messages);
  });
  
  // 벡터 유사도 계산
  const scoredMessages = allMessages.map(message => {
    const similarity = calculateCosineSimilarity(queryVector, message.vector_4d);
    return { message, similarity };
  });
  
  // 유사도 높은 순으로 정렬
  scoredMessages.sort((a, b) => b.similarity - a.similarity);
  
  // 상위 N개 반환
  return scoredMessages.slice(0, limit).map(item => item.message);
}

/**
 * 코사인 유사도 계산
 */
function calculateCosineSimilarity(v1: Vector4D, v2: Vector4D): number {
  const dotProduct = v1.S * v2.S + v1.L * v2.L + v1.K * v2.K + v1.M * v2.M;
  const magnitude1 = Math.sqrt(v1.S ** 2 + v1.L ** 2 + v1.K ** 2 + v1.M ** 2);
  const magnitude2 = Math.sqrt(v2.S ** 2 + v2.L ** 2 + v2.K ** 2 + v2.M ** 2);
  
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * 주제 추출 (간단한 키워드 기반, 향후 개선 가능)
 */
function extractTopics(content: string): string[] {
  const topics: string[] = [];
  
  // 수학 관련 키워드
  const mathKeywords = ['수학', '방정식', '함수', '미적분', '기하', '확률', '통계'];
  if (mathKeywords.some(keyword => content.includes(keyword))) {
    topics.push('수학');
  }
  
  // 영어 관련 키워드
  const englishKeywords = ['영어', '문법', '단어', '독해', '작문', '회화'];
  if (englishKeywords.some(keyword => content.includes(keyword))) {
    topics.push('영어');
  }
  
  // 학습 관련 키워드
  const studyKeywords = ['공부', '학습', '복습', '시험', '문제', '풀이'];
  if (studyKeywords.some(keyword => content.includes(keyword))) {
    topics.push('학습');
  }
  
  return topics;
}

/**
 * 대화 통계 조회
 */
export function getConversationStats(): {
  totalSessions: number;
  totalMessages: number;
  averageMessagesPerSession: number;
  recentSessions: ConversationSession[];
} {
  const sessions = loadConversationMemory();
  const totalMessages = sessions.reduce((sum, s) => sum + s.messages.length, 0);
  const averageMessagesPerSession = sessions.length > 0 
    ? totalMessages / sessions.length 
    : 0;
  
  // 최근 세션 (최근 10개)
  const recentSessions = sessions
    .sort((a, b) => (b.startTime || 0) - (a.startTime || 0))
    .slice(0, 10);
  
  return {
    totalSessions: sessions.length,
    totalMessages,
    averageMessagesPerSession,
    recentSessions
  };
}

/**
 * 특정 세션의 대화 히스토리 조회
 */
export function getConversationHistory(sessionId: string): ConversationMessage[] {
  const sessions = loadConversationMemory();
  const session = sessions.find(s => s.id === sessionId);
  return session ? session.messages : [];
}

