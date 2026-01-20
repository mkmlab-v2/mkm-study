import type { Vector4D } from './types';
import type { AudioMetrics } from '../components/AudioCapture';
import type { SpeechAnalysis } from '../components/SpeechRecognition';
// import type { RPPGResult } from './rppgProcessor'; // 사용하지 않음

export interface BiometricData {
  heartRate?: number;
  audioMetrics?: AudioMetrics;
  speechAnalysis?: SpeechAnalysis;
}

export class BiometricToVectorMapper {
  private baselineHeartRate = 72;
  private optimalHeartRateRange = { min: 60, max: 80 };

  mapToVector4D(biometrics: BiometricData): Vector4D {
    const S = this.calculateSpirit(biometrics);
    const L = this.calculateLogic(biometrics);
    const K = this.calculateKnowledge(biometrics);
    const M = this.calculateMaterial(biometrics);

    return { S, L, K, M };
  }

  private calculateSpirit(biometrics: BiometricData): number {
    let score = 0.5;

    if (biometrics.audioMetrics) {
      const pitchFactor = Math.min(1, biometrics.audioMetrics.pitch / 100);
      score += pitchFactor * 0.2;

      if (biometrics.audioMetrics.volume > 30 && biometrics.audioMetrics.volume < 70) {
        score += 0.1;
      }
    }

    if (biometrics.speechAnalysis) {
      if (biometrics.speechAnalysis.sentiment === 'positive') {
        score += 0.2;
      } else if (biometrics.speechAnalysis.sentiment === 'negative') {
        score -= 0.15;
      }

      const emotionalRatio = biometrics.speechAnalysis.emotionalWords /
                            Math.max(1, biometrics.speechAnalysis.wordCount);
      score += emotionalRatio * 0.3;
    }

    if (biometrics.heartRate) {
      const hrVariability = Math.abs(biometrics.heartRate - this.baselineHeartRate);
      if (hrVariability < 10) {
        score += 0.1;
      } else if (hrVariability > 20) {
        score -= 0.1;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateLogic(biometrics: BiometricData): number {
    let score = 0.5;

    if (biometrics.speechAnalysis) {
      const logicalRatio = biometrics.speechAnalysis.logicalWords /
                          Math.max(1, biometrics.speechAnalysis.wordCount);
      score += logicalRatio * 0.5;

      if (biometrics.speechAnalysis.wordCount > 20) {
        score += 0.1;
      }

      if (biometrics.speechAnalysis.logicalWords >= 3) {
        score += 0.15;
      }
    }

    if (biometrics.audioMetrics) {
      if (biometrics.audioMetrics.clarity > 60) {
        score += 0.15;
      }

      const steadyVolume = biometrics.audioMetrics.volume > 20 &&
                          biometrics.audioMetrics.volume < 80;
      if (steadyVolume) {
        score += 0.1;
      }
    }

    if (biometrics.heartRate) {
      const isCalm = biometrics.heartRate >= this.optimalHeartRateRange.min &&
                     biometrics.heartRate <= this.optimalHeartRateRange.max;
      if (isCalm) {
        score += 0.1;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateKnowledge(biometrics: BiometricData): number {
    let score = 0.5;

    if (biometrics.speechAnalysis) {
      const technicalRatio = biometrics.speechAnalysis.technicalWords /
                            Math.max(1, biometrics.speechAnalysis.wordCount);
      score += technicalRatio * 0.6;

      if (biometrics.speechAnalysis.technicalWords >= 2) {
        score += 0.2;
      }

      if (biometrics.speechAnalysis.wordCount > 30) {
        score += 0.15;
      }
    }

    if (biometrics.audioMetrics) {
      if (biometrics.audioMetrics.frequency > 200 && biometrics.audioMetrics.frequency < 400) {
        score += 0.05;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  private calculateMaterial(biometrics: BiometricData): number {
    let score = 0.5;

    if (biometrics.heartRate) {
      const isOptimal = biometrics.heartRate >= this.optimalHeartRateRange.min &&
                       biometrics.heartRate <= this.optimalHeartRateRange.max;

      if (isOptimal) {
        score += 0.3;
      } else if (biometrics.heartRate > 100) {
        score -= 0.2;
      } else if (biometrics.heartRate < 55) {
        score -= 0.1;
      }

      const deviation = Math.abs(biometrics.heartRate - this.baselineHeartRate);
      score -= (deviation / 100) * 0.2;
    }

    if (biometrics.audioMetrics) {
      const steadyVoice = biometrics.audioMetrics.clarity > 50;
      if (steadyVoice) {
        score += 0.15;
      }

      const energyLevel = Math.min(1, biometrics.audioMetrics.volume / 100);
      score += energyLevel * 0.1;
    }

    if (biometrics.speechAnalysis) {
      if (biometrics.speechAnalysis.sentiment === 'positive') {
        score += 0.05;
      }
    }

    return Math.max(0, Math.min(1, score));
  }

  assessOverallHealth(vector: Vector4D): {
    score: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    recommendations: string[];
  } {
    const balance = this.calculateBalance(vector);
    const average = (vector.S + vector.L + vector.K + vector.M) / 4;

    const score = (balance * 0.4 + average * 0.6) * 100;

    let status: 'excellent' | 'good' | 'fair' | 'poor';
    if (score >= 80) status = 'excellent';
    else if (score >= 65) status = 'good';
    else if (score >= 50) status = 'fair';
    else status = 'poor';

    const recommendations: string[] = [];

    if (vector.S < 0.4) {
      recommendations.push('정서(S)가 낮습니다. 휴식을 취하거나 좋아하는 활동을 해보세요.');
    }
    if (vector.L < 0.4) {
      recommendations.push('논리(L)가 낮습니다. 개념을 단계적으로 정리해보세요.');
    }
    if (vector.K < 0.4) {
      recommendations.push('지식(K)이 부족합니다. 기본 개념을 복습해보세요.');
    }
    if (vector.M < 0.4) {
      recommendations.push('신체(M) 컨디션이 좋지 않습니다. 스트레칭이나 가벼운 운동을 권장합니다.');
    }

    if (balance < 0.6) {
      recommendations.push('4차원 균형이 맞지 않습니다. 부족한 영역에 집중해주세요.');
    }

    return { score, status, recommendations };
  }

  private calculateBalance(vector: Vector4D): number {
    const avg = (vector.S + vector.L + vector.K + vector.M) / 4;
    const variance =
      Math.pow(vector.S - avg, 2) +
      Math.pow(vector.L - avg, 2) +
      Math.pow(vector.K - avg, 2) +
      Math.pow(vector.M - avg, 2);

    const balance = 1 - Math.sqrt(variance / 4);
    return Math.max(0, Math.min(1, balance));
  }
}

export const biometricMapper = new BiometricToVectorMapper();
