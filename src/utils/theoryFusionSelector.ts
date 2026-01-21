/**
 * 🎼 TheoryFusionSelector - 학습 도메인별 이론 선택 시스템
 * 
 * 학습 난이도/과목별로 최적 이론을 선택하여 학습 효율을 극대화합니다.
 * 
 * 작성일: 2026-01-22
 * 상태: ✅ Phase 3 구현 중
 */

export type TheoryType = 
  | 'continuous_dynamics'  // 연속 동역학 (MKM12)
  | 'bayesian_update'      // 베이즈 업데이트
  | 'markov_chain'         // 마르코프 체인
  | 'hmm'                  // HMM (Hidden Markov Model)
  | 'mcmc'                 // MCMC
  | 'bayesian_network'     // 베이즈 네트워크
  | 'reinforcement_learning' // 강화학습
  | 'ensemble'             // 앙상블
  | 'hybrid_fusion'        // 하이브리드 융합
  | 'bayesian_markov';     // 베이즈-마르코프

export interface TheoryConfig {
  theoryType: TheoryType;
  weight: number; // 가중치 (0-1)
  enabled: boolean;
  description: string;
}

export interface DomainTheoryMapping {
  domain: string;
  theoryConfigs: TheoryConfig[];
  description: string;
}

/**
 * 학습 도메인 타입
 */
export type LearningDomain = 
  | 'math_easy'      // 수학 쉬움
  | 'math_medium'    // 수학 중간
  | 'math_hard'      // 수학 어려움
  | 'english_easy'   // 영어 쉬움
  | 'english_medium' // 영어 중간
  | 'english_hard';  // 영어 어려움

/**
 * TheoryFusionSelector 클래스
 * 
 * 학습 난이도/과목별로 최적 이론 조합을 자동 선택합니다.
 */
export class TheoryFusionSelector {
  private domainTheoryMappings: Map<LearningDomain, DomainTheoryMapping>;

  constructor() {
    this.domainTheoryMappings = this.initializeDomainMappings();
  }

  /**
   * 도메인별 이론 매핑 초기화
   */
  private initializeDomainMappings(): Map<LearningDomain, DomainTheoryMapping> {
    const mappings = new Map<LearningDomain, DomainTheoryMapping>();

    // 수학 쉬움: 기본 개념 학습
    mappings.set('math_easy', {
      domain: 'math_easy',
      theoryConfigs: [
        { theoryType: 'continuous_dynamics', weight: 0.3, enabled: true, description: 'MKM12 동역학 기반 개념 이해' },
        { theoryType: 'bayesian_update', weight: 0.4, enabled: true, description: '베이즈 업데이트로 점진적 학습' },
        { theoryType: 'markov_chain', weight: 0.2, enabled: true, description: '마르코프 체인으로 단계별 학습' },
        { theoryType: 'ensemble', weight: 0.1, enabled: true, description: '앙상블로 다양한 접근법 통합' }
      ],
      description: '수학 기본 개념 학습 (쉬움)'
    });

    // 수학 중간: 문제 해결 능력 향상
    mappings.set('math_medium', {
      domain: 'math_medium',
      theoryConfigs: [
        { theoryType: 'continuous_dynamics', weight: 0.4, enabled: true, description: 'MKM12 동역학 기반 문제 해결' },
        { theoryType: 'hmm', weight: 0.3, enabled: true, description: 'HMM으로 문제 패턴 인식' },
        { theoryType: 'bayesian_network', weight: 0.2, enabled: true, description: '베이즈 네트워크로 개념 연결' },
        { theoryType: 'reinforcement_learning', weight: 0.1, enabled: true, description: '강화학습으로 시행착오 학습' }
      ],
      description: '수학 중간 난이도 문제 해결'
    });

    // 수학 어려움: 고급 논리 사고
    mappings.set('math_hard', {
      domain: 'math_hard',
      theoryConfigs: [
        { theoryType: 'continuous_dynamics', weight: 0.5, enabled: true, description: 'MKM12 동역학 기반 고급 논리' },
        { theoryType: 'bayesian_markov', weight: 0.3, enabled: true, description: '베이즈-마르코프로 복잡한 추론' },
        { theoryType: 'mcmc', weight: 0.2, enabled: true, description: 'MCMC로 확률적 추론' }
      ],
      description: '수학 고난도 문제 (킬러 문항)'
    });

    // 영어 쉬움: 기본 어휘/문법
    mappings.set('english_easy', {
      domain: 'english_easy',
      theoryConfigs: [
        { theoryType: 'markov_chain', weight: 0.4, enabled: true, description: '마르코프 체인으로 어휘 순서 학습' },
        { theoryType: 'bayesian_update', weight: 0.4, enabled: true, description: '베이즈 업데이트로 점진적 암기' },
        { theoryType: 'ensemble', weight: 0.2, enabled: true, description: '앙상블로 다양한 학습법 통합' }
      ],
      description: '영어 기본 어휘/문법 학습'
    });

    // 영어 중간: 독해/작문 능력 향상
    mappings.set('english_medium', {
      domain: 'english_medium',
      theoryConfigs: [
        { theoryType: 'hmm', weight: 0.4, enabled: true, description: 'HMM으로 문장 패턴 인식' },
        { theoryType: 'bayesian_network', weight: 0.3, enabled: true, description: '베이즈 네트워크로 문법 규칙 연결' },
        { theoryType: 'continuous_dynamics', weight: 0.2, enabled: true, description: 'MKM12 동역학 기반 의미 이해' },
        { theoryType: 'reinforcement_learning', weight: 0.1, enabled: true, description: '강화학습으로 작문 연습' }
      ],
      description: '영어 중간 난이도 독해/작문'
    });

    // 영어 어려움: 고급 독해/작문
    mappings.set('english_hard', {
      domain: 'english_hard',
      theoryConfigs: [
        { theoryType: 'bayesian_markov', weight: 0.5, enabled: true, description: '베이즈-마르코프로 복잡한 문맥 이해' },
        { theoryType: 'continuous_dynamics', weight: 0.3, enabled: true, description: 'MKM12 동역학 기반 고급 추론' },
        { theoryType: 'mcmc', weight: 0.2, enabled: true, description: 'MCMC로 다양한 해석 탐색' }
      ],
      description: '영어 고난도 독해/작문'
    });

    return mappings;
  }

  /**
   * 학습 난이도 기반 도메인 선택
   */
  getDomainFromDifficulty(
    difficulty: 'easy' | 'medium' | 'hard',
    subject: 'math' | 'english'
  ): LearningDomain {
    return `${subject}_${difficulty}` as LearningDomain;
  }

  /**
   * 도메인에 맞는 이론 선택
   */
  selectTheories(domain: LearningDomain): TheoryConfig[] {
    const mapping = this.domainTheoryMappings.get(domain);
    if (!mapping) {
      console.warn(`[TheoryFusionSelector] 도메인을 찾을 수 없습니다: ${domain}`);
      // 기본 매핑 반환
      return this.domainTheoryMappings.get('math_easy')?.theoryConfigs || [];
    }
    
    // 활성화된 이론만 반환
    return mapping.theoryConfigs.filter(config => config.enabled);
  }

  /**
   * 학습 난이도에 맞는 이론 선택 (편의 함수)
   */
  selectTheoriesForLearning(
    difficulty: 'easy' | 'medium' | 'hard',
    subject: 'math' | 'english'
  ): TheoryConfig[] {
    const domain = this.getDomainFromDifficulty(difficulty, subject);
    return this.selectTheories(domain);
  }

  /**
   * 이론 가중치로 학습 난이도 조정
   * 
   * 선택된 이론들의 가중치를 기반으로 학습 난이도를 미세 조정합니다.
   */
  adjustDifficultyWithTheoryWeights(
    baseDifficulty: 'easy' | 'medium' | 'hard',
    subject: 'math' | 'english',
    theoryConfigs: TheoryConfig[]
  ): {
    adjustedDifficulty: 'easy' | 'medium' | 'hard';
    adjustmentReason: string;
    theoryWeights: Record<TheoryType, number>;
  } {
    // 이론 가중치 합계 계산
    const totalWeight = theoryConfigs.reduce((sum, config) => sum + config.weight, 0);
    
    // 가중치 기반 난이도 조정
    let adjustedDifficulty: 'easy' | 'medium' | 'hard' = baseDifficulty;
    let adjustmentReason = '';
    
    if (totalWeight > 0.8) {
      // 높은 가중치: 어려운 이론 사용 → 난이도 상승
      if (baseDifficulty === 'easy') {
        adjustedDifficulty = 'medium';
        adjustmentReason = '이론 가중치가 높아 난이도를 중간으로 조정했습니다.';
      } else if (baseDifficulty === 'medium') {
        adjustedDifficulty = 'hard';
        adjustmentReason = '이론 가중치가 높아 난이도를 어려움으로 조정했습니다.';
      }
    } else if (totalWeight < 0.4) {
      // 낮은 가중치: 쉬운 이론 사용 → 난이도 하락
      if (baseDifficulty === 'hard') {
        adjustedDifficulty = 'medium';
        adjustmentReason = '이론 가중치가 낮아 난이도를 중간으로 조정했습니다.';
      } else if (baseDifficulty === 'medium') {
        adjustedDifficulty = 'easy';
        adjustmentReason = '이론 가중치가 낮아 난이도를 쉬움으로 조정했습니다.';
      }
    }
    
    // 이론별 가중치 맵 생성
    const theoryWeights: Record<TheoryType, number> = {} as Record<TheoryType, number>;
    theoryConfigs.forEach(config => {
      theoryWeights[config.theoryType] = config.weight;
    });
    
    return {
      adjustedDifficulty,
      adjustmentReason: adjustmentReason || '이론 가중치에 따라 난이도가 유지되었습니다.',
      theoryWeights
    };
  }
}

// 싱글톤 인스턴스
let theoryFusionSelectorInstance: TheoryFusionSelector | null = null;

/**
 * TheoryFusionSelector 인스턴스 가져오기 (싱글톤)
 */
export function getTheoryFusionSelector(): TheoryFusionSelector {
  if (!theoryFusionSelectorInstance) {
    theoryFusionSelectorInstance = new TheoryFusionSelector();
  }
  return theoryFusionSelectorInstance;
}

