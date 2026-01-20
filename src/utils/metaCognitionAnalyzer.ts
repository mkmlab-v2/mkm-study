/**
 * 🏛️ 음성 기반 메타인지 확신도 분석 (Voice-Confidence Check)
 * 
 * 음성 파형 분석을 통해 학생이 정말로 이해했는지 판별합니다.
 * 
 * 작성일: 2026-01-20
 * 상태: ✅ Phase 3 구현 중
 */

export interface ConfidenceAnalysis {
  confidence: number; // 0-1 (높을수록 확신 있음)
  uncertainty: number; // 0-1 (높을수록 불안정)
  recommendation: string; // "방금 부분은 조금 불안한데? 다시 한번 짚어볼까?"
  indicators: {
    jitter: number; // 목소리 떨림 (0-1)
    shimmer: number; // 음성 진폭 변동 (0-1)
    pitchVariability: number; // 음높이 변동 (0-1)
    pauseCount: number; // 머뭇거림 횟수
    speechRate: number; // 말하는 속도 (단어/초)
  };
}

/**
 * 음성 분석 결과를 메타인지 확신도로 변환
 * 
 * 논문 기반 임계값:
 * - jitter > 0.05: 확신도 낮음
 * - shimmer > 0.1: 불안정
 * - pitchVariability 높음: 불안정
 * - pauseCount 많음: 머뭇거림
 */
export function analyzeConfidence(
  jitter: number,
  shimmer: number,
  pitchVariability: number,
  pauseCount: number,
  speechRate: number
): ConfidenceAnalysis {
  // 각 지표를 확신도 점수로 변환 (0-1)
  const jitterScore = Math.max(0, 1 - (jitter / 0.05)); // jitter < 0.05면 높은 확신
  const shimmerScore = Math.max(0, 1 - (shimmer / 0.1)); // shimmer < 0.1면 높은 확신
  const pitchScore = Math.max(0, 1 - pitchVariability); // pitchVariability 낮을수록 높은 확신
  const pauseScore = Math.max(0, 1 - (pauseCount / 5)); // pauseCount < 5면 높은 확신
  const rateScore = speechRate >= 2 && speechRate <= 4 ? 1 : 
                    speechRate < 2 ? speechRate / 2 : 
                    Math.max(0, 1 - (speechRate - 4) / 2); // 2-4 단어/초가 최적
  
  // 가중 평균으로 전체 확신도 계산
  const confidence = (
    jitterScore * 0.3 +
    shimmerScore * 0.25 +
    pitchScore * 0.2 +
    pauseScore * 0.15 +
    rateScore * 0.1
  );
  
  // 불확실성 계산 (확신도의 반대)
  const uncertainty = 1 - confidence;
  
  // 권장사항 생성
  const recommendation = generateRecommendation(confidence, uncertainty, {
    jitter,
    shimmer,
    pitchVariability,
    pauseCount,
    speechRate
  });
  
  return {
    confidence,
    uncertainty,
    recommendation,
    indicators: {
      jitter,
      shimmer,
      pitchVariability,
      pauseCount,
      speechRate
    }
  };
}

/**
 * 확신도 기반 권장사항 생성
 */
function generateRecommendation(
  confidence: number,
  uncertainty: number,
  indicators: ConfidenceAnalysis['indicators']
): string {
  if (confidence >= 0.7) {
    return '✅ 확신 있게 설명하고 있습니다. 잘 이해한 것 같아요!';
  } else if (confidence >= 0.5) {
    return '👍 대체로 이해한 것 같습니다. 조금 더 연습하면 완벽해질 거예요!';
  } else if (confidence >= 0.3) {
    // 불안정한 부분 감지
    const issues: string[] = [];
    if (indicators.jitter > 0.05) {
      issues.push('목소리가 떨리는 것 같아요');
    }
    if (indicators.shimmer > 0.1) {
      issues.push('말하는 톤이 불안정해요');
    }
    if (indicators.pauseCount > 3) {
      issues.push('머뭇거리는 부분이 있어요');
    }
    
    if (issues.length > 0) {
      return `⚠️ 방금 부분은 조금 불안한데? (${issues.join(', ')}) 다시 한번 짚어볼까?`;
    }
    return '⚠️ 방금 부분은 조금 불안한데? 다시 한번 짚어볼까?';
  } else {
    return '❌ 이해가 부족한 것 같아요. 기본 개념부터 다시 설명해드릴까요?';
  }
}

/**
 * Web Speech API 결과를 음성 지표로 변환
 * 
 * 실제 구현에서는 Web Audio API를 사용하여 jitter, shimmer 등을 계산해야 하지만,
 * 여기서는 간단한 휴리스틱을 사용합니다.
 */
export function extractVoiceIndicatorsFromTranscript(
  transcript: string,
  duration: number, // 초 단위
  interimResults?: string[] // 중간 결과 (머뭇거림 감지용)
): {
  jitter: number;
  shimmer: number;
  pitchVariability: number;
  pauseCount: number;
  speechRate: number;
} {
  // 단어 수 계산
  const words = transcript.trim().split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // 말하는 속도 (단어/초)
  const speechRate = duration > 0 ? wordCount / duration : 0;
  
  // 머뭇거림 감지 (중간 결과가 많으면 머뭇거림)
  const pauseCount = interimResults ? Math.max(0, interimResults.length - 1) : 0;
  
  // 간단한 휴리스틱 (실제로는 Web Audio API 필요)
  // jitter: 문장 길이 변동성 기반 추정
  const sentenceLengths = transcript.split(/[.!?]/).map(s => s.trim().split(/\s+/).length);
  const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const lengthVariance = sentenceLengths.reduce((sum, len) => sum + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
  const jitter = Math.min(1, lengthVariance / 10); // 정규화
  
  // shimmer: 단어 길이 변동성 기반 추정
  const wordLengths = words.map(w => w.length);
  const avgWordLength = wordLengths.reduce((a, b) => a + b, 0) / wordLengths.length;
  const wordLengthVariance = wordLengths.reduce((sum, len) => sum + Math.pow(len - avgWordLength, 2), 0) / wordLengths.length;
  const shimmer = Math.min(1, wordLengthVariance / 5); // 정규화
  
  // pitchVariability: 대문자/소문자 비율 기반 추정 (간단한 휴리스틱)
  const upperCaseRatio = transcript.split('').filter(c => c >= 'A' && c <= 'Z').length / transcript.length;
  const pitchVariability = Math.abs(upperCaseRatio - 0.1); // 대문자 비율이 정상보다 높거나 낮으면 변동성 높음
  
  return {
    jitter,
    shimmer,
    pitchVariability,
    pauseCount,
    speechRate
  };
}

