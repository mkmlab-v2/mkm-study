/**
 * 🔐 Zero-Knowledge API 클라이언트
 * 
 * 목적: 클라이언트는 인덱스만 전송, 서버는 서버 전용 매핑 파일에서 복원
 * - 클라이언트: 원본 텍스트 → 인덱스 변환 (로컬 또는 API 호출)
 * - 서버: 인덱스 → 원본 텍스트 복원 (서버 전용 매핑 파일 사용)
 * - 서버: 복원된 텍스트로 처리 후 결과 반환
 * 
 * 작성일: 2026-01-22
 * 상태: ✅ Priority 6 클라이언트 통합 구현
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';
const ZERO_KNOWLEDGE_BASE = `${API_BASE}/zero-knowledge`;

// ============================================
// 타입 정의
// ============================================

export type Domain = 'S' | 'L' | 'K' | 'M' | 'T';
export type Operation = 'analyze' | 'process' | 'search';

export interface IndexRequest {
  indices: number[];
  domain: Domain;
  operation: Operation;
  context?: Record<string, any>;
}

export interface IndexResponse {
  success: boolean;
  result: any;
  restored_texts?: string[]; // 디버깅용 (프로덕션에서는 제외)
  domain: string;
  indices_count: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  domains_loaded: Record<string, boolean>;
  cache_stats?: {
    cache_size: number;
    cache_maxsize: number;
    cache_ttl: number;
  };
}

export interface CacheStatsResponse {
  cache_size: number;
  cache_maxsize: number;
  cache_ttl: number;
  hit_rate?: number;
}

export interface EncodeRequest {
  text: string;
  domain?: Domain; // 선택적, 자동 감지 가능
}

export interface EncodeResponse {
  success: boolean;
  index: number;
  domain: Domain;
  phase_4d?: {
    S: number;
    L: number;
    K: number;
    M: number;
  };
  original_length: number;
}

// ============================================
// Zero-Knowledge API 클라이언트 클래스
// ============================================

export class ZeroKnowledgeClient {
  private apiBase: string;

  constructor(apiBase?: string) {
    this.apiBase = apiBase || ZERO_KNOWLEDGE_BASE;
  }

  /**
   * 헬스 체크
   */
  async healthCheck(): Promise<HealthResponse> {
    try {
      const response = await fetch(`${this.apiBase}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zero-Knowledge API health check failed:', error);
      throw error;
    }
  }

  /**
   * 텍스트를 인덱스로 변환 (클라이언트 측 인코딩)
   * 
   * 참고: 실제 구현은 서버 측 NeuralTelepathy.encode_thought()를 호출합니다.
   * 향후 클라이언트 측 JavaScript/TypeScript 구현 가능.
   */
  async encodeText(request: EncodeRequest): Promise<EncodeResponse> {
    try {
      const response = await fetch(`${this.apiBase}/encode`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Encode failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zero-Knowledge API encode failed:', error);
      throw error;
    }
  }

  /**
   * 여러 텍스트를 인덱스 배열로 변환 (배치 인코딩)
   */
  async encodeTexts(texts: string[], domain?: Domain): Promise<number[]> {
    try {
      const encodePromises = texts.map(text => 
        this.encodeText({ text, domain })
      );
      const results = await Promise.all(encodePromises);
      return results.map(r => r.index);
    } catch (error) {
      console.error('Zero-Knowledge API batch encode failed:', error);
      throw error;
    }
  }

  /**
   * 인덱스 기반 처리 (Zero-Knowledge)
   */
  async processIndices(request: IndexRequest): Promise<IndexResponse> {
    try {
      const response = await fetch(`${this.apiBase}/process`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Process failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zero-Knowledge API process failed:', error);
      throw error;
    }
  }

  /**
   * 인덱스 기반 분석 (Zero-Knowledge)
   */
  async analyzeIndices(
    indices: number[],
    domain: Domain,
    context?: Record<string, any>
  ): Promise<IndexResponse> {
    return this.processIndices({
      indices,
      domain,
      operation: 'analyze',
      context
    });
  }

  /**
   * 인덱스 기반 검색 (Zero-Knowledge)
   */
  async searchIndices(
    indices: number[],
    domain: Domain,
    context?: Record<string, any>
  ): Promise<IndexResponse> {
    return this.processIndices({
      indices,
      domain,
      operation: 'search',
      context
    });
  }

  /**
   * 캐시 통계 조회
   */
  async getCacheStats(): Promise<CacheStatsResponse> {
    try {
      const response = await fetch(`${this.apiBase}/cache/stats`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Cache stats failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zero-Knowledge API cache stats failed:', error);
      throw error;
    }
  }

  /**
   * 캐시 초기화
   */
  async clearCache(): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${this.apiBase}/cache/clear`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        throw new Error(`Clear cache failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Zero-Knowledge API clear cache failed:', error);
      throw error;
    }
  }

  /**
   * 고수준 API: 텍스트를 분석 (자동 인코딩 + 분석)
   */
  async analyzeText(
    text: string,
    domain?: Domain,
    context?: Record<string, any>
  ): Promise<IndexResponse> {
    // 1. 텍스트를 인덱스로 변환
    const encodeResult = await this.encodeText({ text, domain });
    
    // 2. 인덱스로 분석 요청
    return this.analyzeIndices(
      [encodeResult.index],
      encodeResult.domain,
      context
    );
  }

  /**
   * 고수준 API: 여러 텍스트를 배치 분석
   */
  async analyzeTexts(
    texts: string[],
    domain?: Domain,
    context?: Record<string, any>
  ): Promise<IndexResponse> {
    // 1. 모든 텍스트를 인덱스로 변환
    const indices = await this.encodeTexts(texts, domain);
    
    // 2. 첫 번째 텍스트의 도메인 사용 (모든 텍스트가 동일 도메인이라고 가정)
    const firstEncodeResult = await this.encodeText({ text: texts[0], domain });
    
    // 3. 인덱스 배열로 분석 요청
    return this.analyzeIndices(
      indices,
      firstEncodeResult.domain,
      context
    );
  }
}

// ============================================
// 싱글톤 인스턴스 (선택적)
// ============================================

let defaultClient: ZeroKnowledgeClient | null = null;

export function getZeroKnowledgeClient(): ZeroKnowledgeClient {
  if (!defaultClient) {
    defaultClient = new ZeroKnowledgeClient();
  }
  return defaultClient;
}

// ============================================
// 편의 함수 (함수형 API)
// ============================================

/**
 * 텍스트를 인덱스로 변환
 */
export async function encodeTextToIndex(
  text: string,
  domain?: Domain
): Promise<number> {
  const client = getZeroKnowledgeClient();
  const result = await client.encodeText({ text, domain });
  return result.index;
}

/**
 * 텍스트 분석 (Zero-Knowledge)
 */
export async function analyzeTextZeroKnowledge(
  text: string,
  domain?: Domain,
  context?: Record<string, any>
): Promise<IndexResponse> {
  const client = getZeroKnowledgeClient();
  return client.analyzeText(text, domain, context);
}

/**
 * 여러 텍스트 배치 분석 (Zero-Knowledge)
 */
export async function analyzeTextsZeroKnowledge(
  texts: string[],
  domain?: Domain,
  context?: Record<string, any>
): Promise<IndexResponse> {
  const client = getZeroKnowledgeClient();
  return client.analyzeTexts(texts, domain, context);
}

