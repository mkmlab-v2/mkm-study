export interface Vector4D {
  S: number;
  L: number;
  K: number;
  M: number;
}

export interface ZodiacAnimal {
  id: string;
  name: string;
  emoji: string;
  element: string;
  traits: string[];
  color: string;
}

export interface CharacterTrait {
  id: string;
  name: string;
  description: string;
  traits: string[];
}

export interface EvolutionStage {
  level: number;
  title: string;
  emoji: string;
  scale: number;
  effect: 'bounce' | 'pulse' | 'glow' | 'none';
}

export interface ZodiacEvolutionData {
  userCode: string;
  zodiacId: string;
  level: number;
  xp: number;
  totalStudyTime: number;
  focusScore: number;
  evolutionStage: EvolutionStage;
  accessories: string[];
  lastFedAt: number;
  tutorModeUnlocked: boolean;
}

export interface CoinTransaction {
  id: string;
  type: 'earn' | 'spend' | 'bonus';
  amount: number;
  reason: string;
  timestamp: number;
}

export interface CoinBalance {
  total: number;
  earned: number;
  spent: number;
  transactions: CoinTransaction[];
  lastUpdated: number;
}

export interface RewardItem {
  id: string;
  name: string;
  description: string;
  cost: number;
  category: 'avatar' | 'real' | 'privilege';
  icon: string;
}

export interface StudySession {
  isActive: boolean;
  startTime: number | null;
  currentState: Vector4D;
  heartRate: number;
  alertLevel: 'normal' | 'warning' | 'danger';
}

export interface VectorizeResponse {
  vector_4d: Vector4D;
  dcv?: number;
  lambda?: number;
}

export interface ICDAnalysisResponse {
  pathology_level: 'SL' | 'IL' | 'DL';
  pattern_type: string;
  dcv: number;
  lambda: number;
  critical_leverage_point?: string;
}

export interface DynamicsPrediction {
  predictions: Vector4D[];
  collapse_risk: number;
  optimal_timing?: number;
}