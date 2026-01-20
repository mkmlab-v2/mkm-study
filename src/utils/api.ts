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
export async function askGemma3(prompt: string, context?: string, model?: string): Promise<string> {
  const startTime = Date.now();
  const retryCount = 3;
  
  const fullPrompt = context
    ? `${context}\n\n사용자 질문: ${prompt}\n\n답변:`
    : prompt;
  
  console.log('[Gemma3] 요청 시작:', { prompt: prompt.substring(0, 50) + '...', url: GEMMA3_URL });
  
  // 모델 선택: 사용자 지정 모델 우선, 없으면 llama3.2:3b, 최종 폴백 gemma3:4b
  const userModel = model; // 사용자가 지정한 모델 (mkm-math, mkm-english 등)
  const preferredModel = 'llama3.2:3b';
  const fallbackModel = 'gemma3:4b';
  let currentModel = userModel || preferredModel; // 사용자 모델 우선
  let hasTriedFallback = false;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 타임아웃 30초로 증가
      
      const requestBody: Gemma3Request = {
        model: currentModel,  // 🚀 가장 빠르고 대화 지속성 우수한 모델 (자동 폴백)
        prompt: fullPrompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 500
        }
      };

      console.log(`[Gemma3] 시도 ${attempt + 1}/${retryCount} (모델: ${currentModel})`, { url: `${GEMMA3_URL}/api/generate` });

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
        
        // 모델이 없으면 폴백 모델로 재시도 (한 번만)
        if (!hasTriedFallback && errorText.includes('not found') && currentModel === preferredModel) {
          console.log(`[Gemma3] ${preferredModel} 모델 없음, ${fallbackModel}로 폴백 시도...`);
          currentModel = fallbackModel;
          hasTriedFallback = true;
          continue; // 폴백 모델로 재시도
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: Gemma3Response = await response.json();
      const latency = Date.now() - startTime;
      
      console.log(`[Gemma3] 응답 수신 (${latency}ms):`, data.response?.substring(0, 100) + '...');
      
      if (!data.response || data.response.trim().length === 0) {
        throw new Error('빈 응답 수신');
      }
      
      return data.response || '';
    } catch (error: any) {
      lastError = error;
      console.error(`[Gemma3] 시도 ${attempt + 1} 실패:`, {
        error: error.message || error,
        name: error.name,
        isAbort: error.name === 'AbortError',
        currentModel,
        url: `${GEMMA3_URL}/api/generate`
      });
      
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
  console.error('[Gemma3] 모든 시도 실패:', {
    lastError: lastError?.message,
    retryCount,
    url: GEMMA3_URL
  });
  
  return `죄송합니다. AI 서버에 연결할 수 없습니다. (에러: ${lastError?.message || '알 수 없는 오류'})
  
확인 사항:
1. VPS Gemma3 서버가 실행 중인지 확인: ${GEMMA3_URL}
2. 네트워크 연결 상태 확인
3. 브라우저 콘솔에서 자세한 에러 메시지 확인`;
}

// 대화 히스토리 저장 (IndexedDB 또는 localStorage)
const CONVERSATION_HISTORY_KEY = 'mkm-study-conversation-history';
const MAX_HISTORY_LENGTH = 10; // 최근 10개 대화만 유지

/**
 * 대화 히스토리 로드
 */
function loadConversationHistory(): Array<{role: string, content: string}> {
  try {
    const stored = localStorage.getItem(CONVERSATION_HISTORY_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('[대화 히스토리 로드 실패]', e);
  }
  return [];
}

/**
 * 대화 히스토리 저장
 */
function saveConversationHistory(history: Array<{role: string, content: string}>): void {
  try {
    // 최근 10개만 유지
    const trimmed = history.slice(-MAX_HISTORY_LENGTH);
    localStorage.setItem(CONVERSATION_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (e) {
    console.error('[대화 히스토리 저장 실패]', e);
  }
}

/**
 * VPS Gemma3에 질문하기 (대화 히스토리, 학습 정보, 체질 정보 통합)
 */

export async function generateMathProblem(level: string, topic: string): Promise<string> {
  const prompt = `EBS 교과과정 기반으로 ${level} ${topic}에 대한 문제를 생성해주세요.
문제는 다음 형식으로 작성해주세요:
1. 문제 설명
2. 핵심 개념
3. 힌트
4. 정답

난이도는 중간 수준으로 해주세요.`;

  return await askGemma3(prompt, '학생의 4차원 상태 벡터를 고려하여 개인 맞춤형 문제를 제시하세요.');
}

export async function explainMathConcept(concept: string, studentLevel: string): Promise<string> {
  const prompt = `${studentLevel} 학생이 이해할 수 있도록 "${concept}"의 개념을 설명해주세요.
개념의 계보(이 개념이 어디서 발전했는지)도 함께 설명해주세요.`;

  return await askGemma3(prompt, '학생 수준에 맞춰 단계적으로 설명하세요.');
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

export async function answerQuestion(question: string, vectorState: Vector4D, subject?: 'math' | 'english'): Promise<string> {
  console.log('[answerQuestion] 시작:', { question: question.substring(0, 50), subject, vectorState });
  
  // 대화 히스토리 로드
  const history = loadConversationHistory();
  
  // 학습 정보 시스템에서 관련 콘텐츠 검색 (선택적)
  let learningContext = '';
  let constitution: 'Type-A' | 'Type-B' | 'Type-C' | 'Type-D' | undefined = undefined;
  let userProfileInfo = '';
  
  try {
    // 사용자 프로필 정보 로드 (localStorage에서)
    const profileData = localStorage.getItem('user-profile');
    if (profileData) {
      const profile = JSON.parse(profileData);
      constitution = profile.constitution || undefined;
      
      // 사용자 프로필 정보를 컨텍스트에 포함
      userProfileInfo = `
사용자 프로필:
- 생년월일시: ${profile.birthYear}년 ${profile.birthMonth}월 ${profile.birthDay}일 ${profile.birthHour}시 ${profile.birthMinute}분
- 학습 스타일: ${constitution || '미진단'}
- 건강정보: 키 ${profile.height}cm, 몸무게 ${profile.weight}kg, 혈액형 ${profile.bloodType}형
${profile.chronicDiseases?.length > 0 ? `- 만성질환: ${profile.chronicDiseases.join(', ')}` : ''}
${profile.medications?.length > 0 ? `- 복용약물: ${profile.medications.join(', ')}` : ''}`;
    } else {
      // 프로필이 없으면 학습 스타일 정보만 확인 (하위 호환성)
      const evolutionData = localStorage.getItem('zodiac-evolution');
      if (evolutionData) {
        const parsed = JSON.parse(evolutionData);
        // 12지지 동물을 학습 스타일로 매핑 (간단한 매핑)
        const zodiacToConstitution: Record<string, 'Type-A' | 'Type-B' | 'Type-C' | 'Type-D'> = {
          'rat': 'Type-C', 'ox': 'Type-B', 'tiger': 'Type-A', 'rabbit': 'Type-D',
          'dragon': 'Type-A', 'snake': 'Type-D', 'horse': 'Type-C', 'goat': 'Type-B',
          'monkey': 'Type-C', 'rooster': 'Type-B', 'dog': 'Type-A', 'pig': 'Type-D'
        };
        constitution = zodiacToConstitution[parsed.zodiacId] || undefined;
      }
    }
  } catch (e) {
    console.warn('[학습 정보] 사용자 정보 로드 실패:', e);
  }

  try {
    const { searchLearningContent } = await import('./learningContentApi');
    const contents = await searchLearningContent(question, subject, constitution, vectorState);
    if (contents.length > 0) {
      learningContext = `\n\n관련 학습 자료:\n${contents.slice(0, 3).map(c => `- ${c.topic}: ${c.content.substring(0, 100)}...`).join('\n')}`;
    }
  } catch (error) {
    console.warn('[학습 정보] 검색 실패, 학습 정보 없이 진행:', error);
  }

  // 전체 대화 히스토리를 프롬프트로 변환
  const historyPrompt = history.length > 0
    ? `\n\n이전 대화:\n${history.map(msg => `${msg.role === 'user' ? '사용자' : 'AI'}: ${msg.content}`).join('\n')}`
    : '';

  const context = `현재 학생의 4D 벡터 상태:
- S(정서): ${(vectorState.S * 100).toFixed(0)}%
- L(논리): ${(vectorState.L * 100).toFixed(0)}%
- K(지식): ${(vectorState.K * 100).toFixed(0)}%
- M(신체): ${(vectorState.M * 100).toFixed(0)}%${userProfileInfo}${learningContext}${historyPrompt}

위 상태와 학습 자료를 고려하여 답변해주세요.`;

  // 과목별 특화 모델 선택 (System Prompt 기반)
  // 주의: VPS에 mkm-math, mkm-english 모델이 생성되어 있어야 함
  const model = subject === 'math' ? 'mkm-math' : 
                subject === 'english' ? 'mkm-english' : 
                undefined; // 기본 모델 (llama3.2:3b 또는 gemma3:4b)

  // 답변 요청
  const answer = await askGemma3(question, context, model);
  
  // 대화 히스토리에 추가
  const updatedHistory = [
    ...history,
    { role: 'user', content: question },
    { role: 'assistant', content: answer }
  ];
  
  // 대화 히스토리 저장
  saveConversationHistory(updatedHistory);
  
  return answer;
}
