import { ZodiacEvolutionData, EvolutionStage } from './types';
import { EVOLUTION_STAGES } from './zodiacData';

export function calculateLevel(xp: number): number {
  return Math.min(Math.floor(xp / 100) + 1, 30);
}

export function getEvolutionStage(level: number): EvolutionStage {
  const stages = [...EVOLUTION_STAGES].reverse();
  return stages.find(stage => level >= stage.level) || EVOLUTION_STAGES[0];
}

export function calculateXPGain(studyTimeSeconds: number, accuracy?: number, posture?: number): number {
  let xp = Math.floor(studyTimeSeconds / 60);

  if (accuracy && accuracy >= 80) {
    xp += 5;
  }

  if (posture && posture >= 80) {
    xp += 10;
  }

  return xp;
}

export function canFeed(lastFedAt: number): boolean {
  const oneHour = 60 * 60 * 1000;
  return Date.now() - lastFedAt >= oneHour;
}

export function saveEvolutionData(data: ZodiacEvolutionData): void {
  localStorage.setItem('zodiac-evolution', JSON.stringify(data));
}

export function loadEvolutionData(): ZodiacEvolutionData | null {
  const saved = localStorage.getItem('zodiac-evolution');
  if (saved) {
    return JSON.parse(saved);
  }
  return null;
}

export function createInitialEvolutionData(userCode: string, zodiacId: string): ZodiacEvolutionData {
  return {
    userCode,
    zodiacId,
    level: 1,
    xp: 0,
    totalStudyTime: 0,
    focusScore: 0,
    evolutionStage: EVOLUTION_STAGES[0],
    accessories: [],
    lastFedAt: 0,
    tutorModeUnlocked: false
  };
}
