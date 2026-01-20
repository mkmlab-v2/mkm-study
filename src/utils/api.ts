import type { Vector4D, VectorizeResponse, ICDAnalysisResponse, DynamicsPrediction } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';

export async function vectorizeText(text: string): Promise<Vector4D> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/vectorize/hybrid`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data: VectorizeResponse = await response.json();
    return data.vector_4d || { S: 0.25, L: 0.25, K: 0.25, M: 0.25 };
  } catch (error) {
    console.error('Vectorization failed:', error);
    return { S: 0.25, L: 0.25, K: 0.25, M: 0.25 };
  }
}

export async function analyzeICD(vector4d: Vector4D, context: string): Promise<ICDAnalysisResponse | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/icd/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ vector_4d: vector4d, context })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ICD Analysis failed:', error);
    return null;
  }
}

export async function predictDynamics(currentState: Vector4D, horizon: number = 60): Promise<DynamicsPrediction | null> {
  try {
    const response = await fetch(`${API_BASE}/api/v1/mkm12/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_state: currentState, horizon })
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Dynamics Prediction failed:', error);
    return null;
  }
}

export function getMockVector4D(): Vector4D {
  return {
    S: 0.25 + Math.random() * 0.5,
    L: 0.25 + Math.random() * 0.5,
    K: 0.25 + Math.random() * 0.5,
    M: 0.25 + Math.random() * 0.5
  };
}

export function getMockPrediction(currentState: Vector4D, steps: number = 10): Vector4D[] {
  const predictions: Vector4D[] = [currentState];

  for (let i = 1; i < steps; i++) {
    const prev = predictions[i - 1];
    predictions.push({
      S: Math.max(0, Math.min(1, prev.S + (Math.random() - 0.5) * 0.1)),
      L: Math.max(0, Math.min(1, prev.L + (Math.random() - 0.5) * 0.1)),
      K: Math.max(0, Math.min(1, prev.K + (Math.random() - 0.5) * 0.1)),
      M: Math.max(0, Math.min(1, prev.M + (Math.random() - 0.5) * 0.1))
    });
  }

  return predictions;
}

// VPS Gemma3 API 연결 (환경 변수 우선 사용)
const GEMMA3_URL = import.meta.env.VITE_VPS_GEMMA3_URL || 'http://148.230.97.246:11434';

console.log('[API] VPS Gemma3 URL:', GEMMA3_URL);

interface Gemma3Request {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: string;
  options?: {
    temperature?: number;
    num_predict?: number;
  };
}

interface Gemma3Response {
  response: string;
  done: boolean;
  eval_count?: number;
}

/**
 * VPS Gemma3 연결 확인
 */
export async function connectToVPSGemma3(): Promise<{ connected: boolean; model?: string; error?: string }> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${GEMMA3_URL}/api/tags`, {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      return {
        connected: false,
        error: `HTTP ${response.status}: ${response.statusText}`
      };
    }
    
    const data = await response.json();
    const models = data.models || [];
    const gemma3Model = models.find((m: any) => 
      m.name.includes('gemma3') || m.name.includes('gemma-3') || m.name.includes('gemma:3')
    );
    
    if (gemma3Model) {
      return {
        connected: true,
        model: gemma3Model.name
      };
    } else {
      return {
        connected: false,
        error: 'Gemma3 모델이 VPS에 설치되지 않았습니다'
      };
    }
  } catch (error: any) {
    return {
      connected: false,
      error: error.message || 'VPS Gemma3 연결 실패'
    };
  }
}

/**
 * VPS Gemma3에 질문하기 (재시도 로직 포함)
 */
export async function askGemma3(prompt: string, context?: string): Promise<string> {
  const startTime = Date.now();
  const retryCount = 3;
  
  const fullPrompt = context
    ? `${context}\n\n사용자 질문: ${prompt}\n\n답변:`
    : prompt;
  
  console.log('[Gemma3] 요청 시작:', { prompt: prompt.substring(0, 50) + '...', url: GEMMA3_URL });
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 타임아웃 30초로 증가
      
      const requestBody: Gemma3Request = {
        model: 'gemma3:4b',
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      };

      console.log(`[Gemma3] 시도 ${attempt + 1}/${retryCount}`, { url: `${GEMMA3_URL}/api/generate` });

      const response = await fetch(`${GEMMA3_URL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[Gemma3] HTTP 에러 ${response.status}:`, errorText);
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: Gemma3Response = await response.json();
      const latency = Date.now() - startTime;
      
      console.log(`[Gemma3] 응답 수신 (${latency}ms):`, data.response?.substring(0, 100) + '...');
      
      return data.response || '';
    } catch (error: any) {
      lastError = error;
      console.error(`[Gemma3] 시도 ${attempt + 1} 실패:`, error.message || error);
      
      // 마지막 시도가 아니면 잠시 대기 후 재시도
      if (attempt < retryCount - 1) {
        const waitTime = 1000 * (attempt + 1);
        console.log(`[Gemma3] ${waitTime}ms 후 재시도...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }
    }
  }
  
  // 모든 시도 실패
  console.error('[Gemma3] 모든 시도 실패:', lastError);
  return '죄송합니다. 현재 AI 서버에 연결할 수 없습니다. 나중에 다시 시도해주세요.';
}

export async function generateMathProblem(level: string, topic: string): Promise<string> {
  const prompt = `EBS 교과과정 기반으로 ${level} ${topic}에 대한 문제를 생성해주세요.
문제는 다음 형식으로 작성해주세요:
1. 문제 설명
2. 핵심 개념
3. 힌트
4. 정답

난이도는 중간 수준으로 해주세요.`;

  return await askGemma3(prompt, 'MKM12 이론에 근거하여 학생의 4차원 균형을 고려한 문제를 제시하세요.');
}

export async function explainMathConcept(concept: string, studentLevel: string): Promise<string> {
  const prompt = `${studentLevel} 학생이 이해할 수 있도록 "${concept}"의 개념을 설명해주세요.
개념의 계보(이 개념이 어디서 발전했는지)도 함께 설명해주세요.`;

  return await askGemma3(prompt, 'MKM12 이론에 근거하여 단계적으로 설명하세요.');
}

export async function generateEnglishSentence(difficulty: 'easy' | 'medium' | 'hard'): Promise<{
  sentence: string;
  translation: string;
  vocabulary: string[];
}> {
  const prompt = `EBS 수능 특강 수준의 ${difficulty} 난이도 영어 문장 1개를 생성해주세요.
다음 JSON 형식으로 응답해주세요:
{
  "sentence": "영어 문장",
  "translation": "한글 번역",
  "vocabulary": ["핵심단어1", "핵심단어2", "핵심단어3"]
}`;

  const response = await askGemma3(prompt);

  try {
    return JSON.parse(response);
  } catch {
    return {
      sentence: "The pursuit of knowledge is a lifelong journey.",
      translation: "지식 추구는 평생의 여정입니다.",
      vocabulary: ["pursuit", "knowledge", "lifelong", "journey"]
    };
  }
}

export async function answerQuestion(question: string, vectorState: Vector4D): Promise<string> {
  const context = `현재 학생의 4D 벡터 상태:
- S(정서): ${(vectorState.S * 100).toFixed(0)}%
- L(논리): ${(vectorState.L * 100).toFixed(0)}%
- K(지식): ${(vectorState.K * 100).toFixed(0)}%
- M(신체): ${(vectorState.M * 100).toFixed(0)}%

위 상태를 고려하여 답변해주세요.`;

  return await askGemma3(question, context);
}
