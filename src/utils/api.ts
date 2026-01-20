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

const GEMMA3_URL = 'http://148.230.97.246:11434';

interface Gemma3Request {
  model: string;
  prompt: string;
  stream?: boolean;
  context?: string;
}

interface Gemma3Response {
  response: string;
  done: boolean;
}

export async function askGemma3(prompt: string, context?: string): Promise<string> {
  try {
    const requestBody: Gemma3Request = {
      model: 'gemma3',
      prompt: context ? `${context}\n\n${prompt}` : prompt,
      stream: false
    };

    const response = await fetch(`${GEMMA3_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data: Gemma3Response = await response.json();
    return data.response;
  } catch (error) {
    console.error('Gemma3 API Error:', error);
    return '죄송합니다. 현재 AI 서버에 연결할 수 없습니다. 나중에 다시 시도해주세요.';
  }
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
