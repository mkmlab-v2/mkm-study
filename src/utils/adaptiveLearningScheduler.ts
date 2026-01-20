/**
 * 🏛️ RPPG 기반 동적 학습 스케줄링 (Biological-Sync)
 * 
 * 생체 리듬(HRV, 스트레스)을 기반으로 학습 난이도를 자동 조절합니다.
 * 
 * 작성일: 2026-01-20
 * 상태: ✅ Phase 2 구현 중
 */

export interface LearningSchedule {
  difficulty: 'easy' | 'medium' | 'hard';
  subject: 'math' | 'english';
  reason: string; // "HRV 낮음, 스트레스 높음 → 쉬운 문제 권장"
  recommendedActivity: string; // "영어 단어 암기", "가벼운 개념 읽기" 등
}

export interface RPPGState {
  heartRate: number; // BPM
  hrv: number; // Heart Rate Variability (ms)
  stressLevel: 'low' | 'normal' | 'high';
  stressScore: number; // 0-1
  drowsiness: number; // 0-100
}

/**
 * RPPGResult를 RPPGState로 변환
 */
export function convertRPPGResultToState(result: { heartRate: number; hrv?: number; drowsiness?: number }): RPPGState {
  const hrv = result.hrv || 50; // 기본값 50ms
  const drowsiness = result.drowsiness || 0;
  
  // HRV 기반 스트레스 레벨 계산
  let stressLevel: 'low' | 'normal' | 'high' = 'normal';
  let stressScore = 0.5;
  
  if (hrv < 30) {
    stressLevel = 'high';
    stressScore = 0.8;
  } else if (hrv > 50) {
    stressLevel = 'low';
    stressScore = 0.2;
  } else {
    stressLevel = 'normal';
    stressScore = 0.5;
  }
  
  return {
    heartRate: result.heartRate,
    hrv,
    stressLevel,
    stressScore,
    drowsiness
  };
}

/**
 * HRV 및 스트레스 기반 학습 난이도 조절
 * 
 * 논문 기반 수식:
 * - HRV < 30ms: 스트레스 높음 → 쉬운 문제
 * - HRV 30-50ms: 정상 → 중간 문제
 * - HRV > 50ms: 스트레스 낮음 → 어려운 문제
 */
export function adjustLearningDifficulty(
  rppgState: RPPGState,
  currentDifficulty: 'easy' | 'medium' | 'hard',
  subject: 'math' | 'english'
): LearningSchedule {
  const { hrv, stressLevel, stressScore, drowsiness, heartRate } = rppgState;
  
  // 졸음 수치가 높으면 쉬운 문제로 전환
  if (drowsiness > 80) {
    return {
      difficulty: 'easy',
      subject,
      reason: `졸음 수치가 높습니다 (${drowsiness}%). 쉬운 문제로 전환합니다.`,
      recommendedActivity: subject === 'math' 
        ? '기본 개념 읽기 또는 쉬운 계산 문제'
        : '영어 단어 암기 또는 쉬운 문장 읽기'
    };
  }
  
  // HRV 기반 난이도 조절
  let recommendedDifficulty: 'easy' | 'medium' | 'hard' = currentDifficulty;
  let reason = '';
  
  if (hrv < 30) {
    // HRV 낮음: 스트레스 높음 → 쉬운 문제
    recommendedDifficulty = 'easy';
    reason = `HRV가 낮습니다 (${hrv}ms). 스트레스가 높아 쉬운 문제를 권장합니다.`;
  } else if (hrv >= 30 && hrv <= 50) {
    // HRV 정상: 중간 문제
    recommendedDifficulty = 'medium';
    reason = `HRV가 정상 범위입니다 (${hrv}ms). 중간 난이도 문제를 권장합니다.`;
  } else {
    // HRV 높음: 스트레스 낮음 → 어려운 문제
    recommendedDifficulty = 'hard';
    reason = `HRV가 높습니다 (${hrv}ms). 최적 상태로 어려운 문제를 권장합니다.`;
  }
  
  // 스트레스 점수 보정
  if (stressScore > 0.7) {
    // 스트레스 높음: 난이도 1단계 낮춤
    if (recommendedDifficulty === 'hard') {
      recommendedDifficulty = 'medium';
      reason += ' 스트레스 점수가 높아 난이도를 조정했습니다.';
    } else if (recommendedDifficulty === 'medium') {
      recommendedDifficulty = 'easy';
      reason += ' 스트레스 점수가 높아 쉬운 문제로 전환했습니다.';
    }
  } else if (stressScore < 0.3 && hrv > 50) {
    // 스트레스 낮음 + HRV 높음: 난이도 1단계 높임
    if (recommendedDifficulty === 'easy') {
      recommendedDifficulty = 'medium';
      reason += ' 최적 상태로 난이도를 높였습니다.';
    } else if (recommendedDifficulty === 'medium') {
      recommendedDifficulty = 'hard';
      reason += ' 최적 상태로 어려운 문제를 권장합니다.';
    }
  }
  
  // 심박수 보정 (과도하게 높으면 쉬운 문제)
  if (heartRate > 100) {
    recommendedDifficulty = 'easy';
    reason = `심박수가 높습니다 (${heartRate}BPM). 쉬운 문제로 전환합니다.`;
  } else if (heartRate < 60 && drowsiness < 50) {
    // 심박수 낮고 졸음 없음: 최적 상태
    if (recommendedDifficulty === 'easy') {
      recommendedDifficulty = 'medium';
    }
  }
  
  // 권장 활동 결정
  const recommendedActivity = getRecommendedActivity(recommendedDifficulty, subject, rppgState);
  
  return {
    difficulty: recommendedDifficulty,
    subject,
    reason,
    recommendedActivity
  };
}

/**
 * 난이도별 권장 활동
 */
function getRecommendedActivity(
  difficulty: 'easy' | 'medium' | 'hard',
  subject: 'math' | 'english',
  rppgState: RPPGState
): string {
  const { stressLevel, drowsiness } = rppgState;
  
  if (subject === 'math') {
    if (difficulty === 'easy') {
      if (drowsiness > 70) {
        return '기본 개념 읽기 (5분 휴식 권장)';
      }
      return '기본 계산 문제 또는 개념 정리';
    } else if (difficulty === 'medium') {
      return '중간 난이도 문제 풀이';
    } else {
      return '고난도 킬러 문항 또는 논리적 사고 문제';
    }
  } else {
    // english
    if (difficulty === 'easy') {
      if (drowsiness > 70) {
        return '영어 단어 암기 (5분 휴식 권장)';
      }
      return '영어 단어 암기 또는 쉬운 문장 읽기';
    } else if (difficulty === 'medium') {
      return '중간 난이도 문법 문제 또는 독해';
    } else {
      return '고난도 독해 또는 작문 연습';
    }
  }
}

/**
 * 현재 상태가 학습하기 적합한지 판단
 */
export function isOptimalForLearning(rppgState: RPPGState): {
  optimal: boolean;
  reason: string;
  recommendation: string;
} {
  const { hrv, stressScore, drowsiness, heartRate } = rppgState;
  
  // 졸음 수치가 너무 높으면 학습 비권장
  if (drowsiness > 90) {
    return {
      optimal: false,
      reason: '졸음 수치가 매우 높습니다.',
      recommendation: '5-10분 휴식을 권장합니다. 스트레칭이나 가벼운 운동을 해보세요.'
    };
  }
  
  // 스트레스가 너무 높으면 학습 비권장
  if (stressScore > 0.8) {
    return {
      optimal: false,
      reason: '스트레스 수치가 매우 높습니다.',
      recommendation: '5분 휴식을 권장합니다. 심호흡이나 명상을 해보세요.'
    };
  }
  
  // 심박수가 너무 높으면 학습 비권장
  if (heartRate > 120) {
    return {
      optimal: false,
      reason: '심박수가 매우 높습니다.',
      recommendation: '5분 휴식을 권장합니다. 안정을 취해주세요.'
    };
  }
  
  // 최적 상태: HRV 40-60ms, 스트레스 0.2-0.5, 졸음 < 50
  if (hrv >= 40 && hrv <= 60 && stressScore >= 0.2 && stressScore <= 0.5 && drowsiness < 50) {
    return {
      optimal: true,
      reason: '최적의 학습 상태입니다!',
      recommendation: '어려운 문제나 복잡한 개념 학습을 권장합니다.'
    };
  }
  
  // 보통 상태: 학습 가능하지만 쉬운 문제 권장
  return {
    optimal: true,
    reason: '학습 가능한 상태입니다.',
    recommendation: '쉬운 문제나 기본 개념 학습을 권장합니다.'
  };
}

