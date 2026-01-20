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
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:160',message:'askGemma3 함수 진입',data:{promptLength:prompt.length,contextLength:context?.length,model,gemma3Url:GEMMA3_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:174',message:'모델 선택 완료',data:{userModel,preferredModel,fallbackModel,currentModel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
  // #endregion
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retryCount; attempt++) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:180',message:'API 요청 시도 시작',data:{attempt:attempt+1,retryCount,currentModel,url:`${GEMMA3_URL}/api/generate`},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
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

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:207',message:'API 응답 수신',data:{status:response.status,ok:response.ok,currentModel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error(`[Gemma3] HTTP 에러 ${response.status}:`, errorText);
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:210',message:'HTTP 에러 발생',data:{status:response.status,errorText:errorText.substring(0,200),hasTriedFallback,currentModel,preferredModel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
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
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:225',message:'응답 파싱 완료',data:{hasResponse:!!data.response,responseLength:data.response?.length,responsePreview:data.response?.substring(0,100),latency,currentModel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      console.log(`[Gemma3] 응답 수신 (${latency}ms):`, data.response?.substring(0, 100) + '...');
      
      return data.response || '';
    } catch (error: any) {
      lastError = error;
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:228',message:'API 요청 실패',data:{attempt:attempt+1,errorMessage:error.message,errorName:error.name,isAbort:error.name==='AbortError',currentModel},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      // #endregion
      
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
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:243',message:'모든 시도 실패',data:{lastError:lastError?.message,retryCount},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // 모든 시도 실패
  console.error('[Gemma3] 모든 시도 실패:', lastError);
  return '죄송합니다. 현재 AI 서버에 연결할 수 없습니다. 나중에 다시 시도해주세요.';
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

export async function answerQuestion(question: string, vectorState: Vector4D, subject?: 'math' | 'english'): Promise<string> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:358',message:'answerQuestion 함수 진입',data:{question:question.substring(0,50),subject,vectorState},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // 대화 히스토리 로드
  const history = loadConversationHistory();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:362',message:'대화 히스토리 로드 완료',data:{historyLength:history.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  
  // 학습 정보 시스템에서 관련 콘텐츠 검색 (선택적)
  let learningContext = '';
  let constitution: '태양인' | '태음인' | '소양인' | '소음인' | undefined = undefined;
  
  try {
    // 체질 정보 로드 (localStorage에서)
    const evolutionData = localStorage.getItem('zodiac-evolution');
    if (evolutionData) {
      const parsed = JSON.parse(evolutionData);
      // 12지지 동물을 체질로 매핑 (간단한 매핑)
      const zodiacToConstitution: Record<string, '태양인' | '태음인' | '소양인' | '소음인'> = {
        'rat': '소양인', 'ox': '태음인', 'tiger': '태양인', 'rabbit': '소음인',
        'dragon': '태양인', 'snake': '소음인', 'horse': '소양인', 'goat': '태음인',
        'monkey': '소양인', 'rooster': '태음인', 'dog': '태양인', 'pig': '소음인'
      };
      constitution = zodiacToConstitution[parsed.zodiacId] || undefined;
    }
  } catch (e) {
    console.warn('[학습 정보] 체질 정보 로드 실패:', e);
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
- M(신체): ${(vectorState.M * 100).toFixed(0)}%${constitution ? `\n- 체질: ${constitution}` : ''}${learningContext}${historyPrompt}

위 상태와 학습 자료를 고려하여 답변해주세요.`;

  // 과목별 특화 모델 선택 (System Prompt 기반)
  // 주의: VPS에 mkm-math, mkm-english 모델이 생성되어 있어야 함
  const model = subject === 'math' ? 'mkm-math' : 
                subject === 'english' ? 'mkm-english' : 
                undefined; // 기본 모델 (llama3.2:3b 또는 gemma3:4b)

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:384',message:'askGemma3 호출 전',data:{model,contextLength:context.length,questionLength:question.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
  // 답변 요청
  const answer = await askGemma3(question, context, model);
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:386',message:'askGemma3 응답 수신',data:{answerLength:answer?.length,answerPreview:answer?.substring(0,100),isEmpty:!answer},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  
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
