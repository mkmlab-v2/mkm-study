/**
 * 🏛️ 체질별 페이스메이커 페르소나 매칭 (Constitution-based Pacing Persona Matching)
 * 
 * 사용자의 Bio-Cognitive-Type에 따라 AI 튜터의 성격과 격려 방식을 최적화합니다.
 * 
 * 작성일: 2026-01-20
 * 상태: ✅ Phase 5 구현 중
 */

export type BioCognitiveType = 'Type-A' | 'Type-B' | 'Type-C' | 'Type-D';

export interface TutorPersona {
  type: BioCognitiveType;
  name: string; // 페르소나 이름
  personality: string; // 성격 설명
  encouragementStyle: string[]; // 격려 문구 예시
  feedbackTone: 'competitive' | 'supportive' | 'analytical' | 'gentle';
  pacePreference: 'fast' | 'moderate' | 'slow';
  motivationKeywords: string[]; // 동기부여 키워드
}

/**
 * 체질별 페이스메이커 페르소나 정의
 * 
 * Type-A (태양인): 추진력 강함 → 경쟁형 라이벌 페르소나
 * Type-B (태음인): 치밀함 → 공감형 멘토 페르소나
 * Type-C (소양인): 활발함 → 동기부여형 코치 페르소나
 * Type-D (소음인): 신중함 → 안정형 가이드 페르소나
 */
export const TUTOR_PERSONAS: Record<BioCognitiveType, TutorPersona> = {
  'Type-A': {
    type: 'Type-A',
    name: '라이벌 튜터',
    personality: '경쟁을 즐기고 성취욕을 자극하는 스타일. 도전적인 문제를 제시하고 빠른 피드백을 제공합니다.',
    encouragementStyle: [
      '좋아! 이번엔 더 어려운 문제에 도전해볼까?',
      '너는 할 수 있어! 지금까지의 성취를 보면 충분히 가능해.',
      '다른 친구들보다 빠르게 진도 나가고 있네! 계속 이렇게 가자!',
      '이 문제를 풀면 다음 레벨로 올라갈 수 있어. 화이팅!'
    ],
    feedbackTone: 'competitive',
    pacePreference: 'fast',
    motivationKeywords: ['도전', '경쟁', '성취', '빠르게', '최고']
  },
  'Type-B': {
    type: 'Type-B',
    name: '공감형 멘토',
    personality: '불안을 낮춰주고 꼼꼼하게 칭찬해주는 스타일. 단계별로 차근차근 안내합니다.',
    encouragementStyle: [
      '천천히 해도 괜찮아. 한 걸음씩 나아가면 돼.',
      '지금까지 정말 잘하고 있어. 조금만 더 힘내자!',
      '실수해도 괜찮아. 실수에서 배우는 게 더 중요해.',
      '너의 노력을 모두 보고 있어. 정말 대단해!'
    ],
    feedbackTone: 'supportive',
    pacePreference: 'moderate',
    motivationKeywords: ['안정', '차근차근', '꼼꼼', '공감', '지지']
  },
  'Type-C': {
    type: 'Type-C',
    name: '동기부여형 코치',
    personality: '활발하고 에너지 넘치는 스타일. 다양한 활동과 즉각적인 보상을 통해 동기를 유지합니다.',
    encouragementStyle: [
      '와! 정말 잘했어! 다음 문제도 재미있을 거야!',
      '너무 멋져! 이렇게 하면 더 재미있게 공부할 수 있어!',
      '오늘도 화이팅! 함께 즐겁게 공부하자!',
      '대단해! 이제 더 재미있는 부분으로 넘어가볼까?'
    ],
    feedbackTone: 'analytical',
    pacePreference: 'fast',
    motivationKeywords: ['재미', '활발', '즐거움', '에너지', '다양성']
  },
  'Type-D': {
    type: 'Type-D',
    name: '안정형 가이드',
    personality: '신중하고 안정적인 스타일. 충분한 시간을 주고 깊이 있게 이해하도록 돕습니다.',
    encouragementStyle: [
      '충분히 생각해봐. 서두르지 않아도 돼.',
      '이해하는 데 시간이 걸려도 괜찮아. 천천히 해보자.',
      '깊이 있게 이해하는 게 중요해. 한 번 더 살펴볼까?',
      '안정적으로 나아가는 게 최고야. 계속 이렇게 가자.'
    ],
    feedbackTone: 'gentle',
    pacePreference: 'slow',
    motivationKeywords: ['안정', '신중', '깊이', '천천히', '이해']
  }
};

/**
 * 사용자의 Bio-Cognitive-Type에 맞는 페르소나 가져오기
 */
export function getTutorPersona(type: BioCognitiveType | undefined): TutorPersona {
  if (!type || !TUTOR_PERSONAS[type]) {
    // 기본값: Type-B (공감형 멘토)
    return TUTOR_PERSONAS['Type-B'];
  }
  return TUTOR_PERSONAS[type];
}

/**
 * 페르소나에 맞는 격려 문구 생성
 */
export function generateEncouragement(persona: TutorPersona, context?: {
  isCorrect?: boolean;
  isFirstAttempt?: boolean;
  progress?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
}): string {
  const { encouragementStyle, feedbackTone } = persona;
  
  // 컨텍스트 기반 격려 문구 선택
  if (context?.isCorrect) {
    // 정답 시
    if (feedbackTone === 'competitive') {
      return encouragementStyle[0] || '훌륭해! 다음 단계로!';
    } else if (feedbackTone === 'supportive') {
      return encouragementStyle[1] || '정말 잘했어! 계속 이렇게 가자!';
    } else if (feedbackTone === 'analytical') {
      return encouragementStyle[2] || '완벽해! 다음 문제도 재미있을 거야!';
    } else {
      return encouragementStyle[3] || '깊이 있게 이해했네! 대단해!';
    }
  } else {
    // 오답 시
    if (feedbackTone === 'competitive') {
      return '다시 도전해봐! 이번엔 더 집중해서 풀어보자!';
    } else if (feedbackTone === 'supportive') {
      return '실수해도 괜찮아. 한 번 더 생각해볼까?';
    } else if (feedbackTone === 'analytical') {
      return '다른 방법으로 접근해볼까? 힌트를 줄게!';
    } else {
      return '천천히 다시 생각해봐. 충분히 시간이 있어.';
    }
  }
}

/**
 * 페르소나에 맞는 학습 속도 조절
 */
export function adjustPaceForPersona(persona: TutorPersona, basePace: number): number {
  const { pacePreference } = persona;
  
  if (pacePreference === 'fast') {
    return basePace * 1.2; // 20% 빠르게
  } else if (pacePreference === 'slow') {
    return basePace * 0.8; // 20% 느리게
  } else {
    return basePace; // 기본 속도 유지
  }
}

/**
 * 페르소나에 맞는 문제 난이도 조절
 */
export function adjustDifficultyForPersona(
  persona: TutorPersona,
  baseDifficulty: 'easy' | 'medium' | 'hard'
): 'easy' | 'medium' | 'hard' {
  const { feedbackTone } = persona;
  
  if (feedbackTone === 'competitive') {
    // 경쟁형: 난이도 1단계 높임
    if (baseDifficulty === 'easy') return 'medium';
    if (baseDifficulty === 'medium') return 'hard';
    return 'hard';
  } else if (feedbackTone === 'gentle') {
    // 안정형: 난이도 1단계 낮춤
    if (baseDifficulty === 'hard') return 'medium';
    if (baseDifficulty === 'medium') return 'easy';
    return 'easy';
  } else {
    // 기본 난이도 유지
    return baseDifficulty;
  }
}

