/**
 * VPS 기반 학습 정보 시스템 API 클라이언트
 * 
 * 체질별 학습 스타일, 최신 두뇌 과학, 암기 기법, 기억법 통합
 */

import type { Vector4D } from './types';

// 포트 충돌 방지: Sentinel API(8003)와 분리하여 학습 콘텐츠 API는 8004 포트 사용
const API_BASE = import.meta.env.VITE_LEARNING_API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://148.230.97.246:8004';

export interface LearningContent {
  id: string;
  subject: 'math' | 'english';
  topic: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  constitution?: '태양인' | '태음인' | '소양인' | '소음인';
  memoryTechnique?: string; // 'spaced_repetition', 'chunking', 'mnemonic' 등
  brainScience?: string; // 최신 두뇌 과학 기법
  ebsCurriculum?: string; // EBS 교과과정 연계
  createdAt: string;
  updatedAt: string;
}

export interface ConstitutionLearningStyle {
  constitution: '태양인' | '태음인' | '소양인' | '소음인';
  preferredMethod: string;
  studyTime: string;
  focusPattern: string;
  memoryTechnique: string;
  examples: string[];
}

export interface MemoryTechnique {
  name: string;
  description: string;
  steps: string[];
  examples: string[];
  effectiveness: number; // 0-1
}

/**
 * 체질별 학습 스타일 조회
 */
export async function getConstitutionLearningStyle(
  constitution: '태양인' | '태음인' | '소양인' | '소음인'
): Promise<ConstitutionLearningStyle | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/learning/constitution/${constitution}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`[학습 정보] 체질별 스타일 조회 실패: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('[학습 정보] 체질별 스타일 조회 오류:', error);
    return null;
  }
}

/**
 * 학습 콘텐츠 검색 (체질별 맞춤)
 */
export async function searchLearningContent(
  query: string,
  subject?: 'math' | 'english',
  constitution?: '태양인' | '태음인' | '소양인' | '소음인',
  vectorState?: Vector4D
): Promise<LearningContent[]> {
  try {
    const requestBody: any = {
      query,
      limit: 10
    };

    if (subject) requestBody.subject = subject;
    if (constitution) requestBody.constitution = constitution;
    if (vectorState) requestBody.vector_4d = vectorState;

    const response = await fetch(`${API_BASE}/api/v1/learning/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      console.warn(`[학습 정보] 검색 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('[학습 정보] 검색 오류:', error);
    return [];
  }
}

/**
 * 최신 암기 기법 조회
 */
export async function getMemoryTechniques(
  subject?: 'math' | 'english'
): Promise<MemoryTechnique[]> {
  try {
    const url = subject 
      ? `${API_BASE}/api/v1/learning/memory-techniques?subject=${subject}`
      : `${API_BASE}/api/v1/learning/memory-techniques`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`[학습 정보] 암기 기법 조회 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.techniques || [];
  } catch (error) {
    console.error('[학습 정보] 암기 기법 조회 오류:', error);
    return [];
  }
}

/**
 * EBS 교과과정 기반 학습 콘텐츠 조회
 */
export async function getEBSContent(
  grade: number,
  subject: 'math' | 'english',
  chapter?: string
): Promise<LearningContent[]> {
  try {
    const url = chapter
      ? `${API_BASE}/api/v1/learning/ebs?grade=${grade}&subject=${subject}&chapter=${encodeURIComponent(chapter)}`
      : `${API_BASE}/api/v1/learning/ebs?grade=${grade}&subject=${subject}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!response.ok) {
      console.warn(`[학습 정보] EBS 콘텐츠 조회 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.contents || [];
  } catch (error) {
    console.error('[학습 정보] EBS 콘텐츠 조회 오류:', error);
    return [];
  }
}

/**
 * 체질별 맞춤 학습 추천
 */
export async function getPersonalizedRecommendation(
  constitution: '태양인' | '태음인' | '소양인' | '소음인',
  vectorState: Vector4D,
  subject: 'math' | 'english'
): Promise<LearningContent[]> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/learning/personalized`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        constitution,
        vector_4d: vectorState,
        subject
      })
    });

    if (!response.ok) {
      console.warn(`[학습 정보] 맞춤 추천 실패: ${response.status}`);
      return [];
    }

    const data = await response.json();
    return data.recommendations || [];
  } catch (error) {
    console.error('[학습 정보] 맞춤 추천 오류:', error);
    return [];
  }
}

