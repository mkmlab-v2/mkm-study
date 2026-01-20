export interface ConceptNode {
  id: string;
  name: string;
  grade: string;
  importance: number;
  ebs_frequency: number;
  parent_concepts: string[];
  child_concepts: string[];
  description: string;
}

export interface ConceptPath {
  from: string;
  to: string;
  connection_type: 'prerequisite' | 'extension' | 'application';
  description: string;
}

export const MATH_CONCEPT_GENEALOGY: Record<string, ConceptNode> = {
  'variable': {
    id: 'variable',
    name: '문자와 식',
    grade: '중1',
    importance: 100,
    ebs_frequency: 45,
    parent_concepts: [],
    child_concepts: ['equation', 'polynomial', 'function'],
    description: '모든 수학의 시작: 미지수를 문자로 표현하는 능력'
  },
  'equation': {
    id: 'equation',
    name: '일차방정식',
    grade: '중1',
    importance: 95,
    ebs_frequency: 38,
    parent_concepts: ['variable'],
    child_concepts: ['quadratic_equation', 'system_equations'],
    description: '등식의 성질을 이용한 미지수 찾기'
  },
  'function': {
    id: 'function',
    name: '함수',
    grade: '중1',
    importance: 100,
    ebs_frequency: 52,
    parent_concepts: ['variable'],
    child_concepts: ['linear_function', 'quadratic_function', 'calculus'],
    description: '입력과 출력의 대응 관계: 수학의 핵심 도구'
  },
  'linear_function': {
    id: 'linear_function',
    name: '일차함수',
    grade: '중2',
    importance: 98,
    ebs_frequency: 41,
    parent_concepts: ['function', 'equation'],
    child_concepts: ['quadratic_function', 'derivative'],
    description: '직선의 방정식: 변화율의 개념 도입'
  },
  'quadratic_function': {
    id: 'quadratic_function',
    name: '이차함수',
    grade: '중3',
    importance: 100,
    ebs_frequency: 67,
    parent_concepts: ['linear_function'],
    child_concepts: ['polynomial_function', 'derivative', 'optimization'],
    description: '포물선: 최댓값/최솟값 문제의 기초'
  },
  'polynomial': {
    id: 'polynomial',
    name: '다항식',
    grade: '고1',
    importance: 92,
    ebs_frequency: 35,
    parent_concepts: ['variable'],
    child_concepts: ['polynomial_function', 'calculus'],
    description: '대수학의 확장: 복잡한 식의 계산과 인수분해'
  },
  'trigonometry': {
    id: 'trigonometry',
    name: '삼각함수',
    grade: '고1',
    importance: 95,
    ebs_frequency: 48,
    parent_concepts: ['function'],
    child_concepts: ['trigonometry_calculus', 'wave_analysis'],
    description: '각과 비율: 주기함수의 세계로 진입'
  },
  'derivative': {
    id: 'derivative',
    name: '미분',
    grade: '고2',
    importance: 100,
    ebs_frequency: 89,
    parent_concepts: ['linear_function', 'quadratic_function'],
    child_concepts: ['integral', 'optimization', 'differential_equation'],
    description: '순간변화율: 접선의 기울기와 최적화'
  },
  'integral': {
    id: 'integral',
    name: '적분',
    grade: '고2',
    importance: 100,
    ebs_frequency: 73,
    parent_concepts: ['derivative'],
    child_concepts: ['differential_equation', 'area_volume'],
    description: '넓이와 부피: 미분의 역연산'
  },
  'optimization': {
    id: 'optimization',
    name: '최적화',
    grade: '고2-3',
    importance: 98,
    ebs_frequency: 61,
    parent_concepts: ['derivative', 'quadratic_function'],
    child_concepts: ['applied_math', 'economics'],
    description: '서울대 킬러: 최댓값/최솟값 문제'
  },
  'sequence': {
    id: 'sequence',
    name: '수열',
    grade: '고2',
    importance: 96,
    ebs_frequency: 55,
    parent_concepts: ['function'],
    child_concepts: ['series', 'mathematical_induction'],
    description: '패턴의 수학: 귀납적 사고의 시작'
  },
  'probability': {
    id: 'probability',
    name: '확률과 통계',
    grade: '고2',
    importance: 94,
    ebs_frequency: 52,
    parent_concepts: [],
    child_concepts: ['statistics', 'data_science'],
    description: '불확실성의 수학: 경우의 수와 확률'
  }
};

export const CONCEPT_PATHS: ConceptPath[] = [
  {
    from: 'variable',
    to: 'function',
    connection_type: 'extension',
    description: '변수의 개념이 함수의 입력값으로 확장됨'
  },
  {
    from: 'linear_function',
    to: 'derivative',
    connection_type: 'prerequisite',
    description: '직선의 기울기가 미분의 기초 개념이 됨'
  },
  {
    from: 'quadratic_function',
    to: 'optimization',
    connection_type: 'application',
    description: '이차함수의 최댓값 문제가 최적화로 일반화됨'
  },
  {
    from: 'derivative',
    to: 'integral',
    connection_type: 'extension',
    description: '미분의 역연산으로 적분 개념 도입'
  },
  {
    from: 'equation',
    to: 'linear_function',
    connection_type: 'prerequisite',
    description: '방정식 풀이 능력이 함수 이해의 기초'
  }
];

export function getConceptPath(startConcept: string, endConcept: string): ConceptNode[] {
  const visited = new Set<string>();
  const path: ConceptNode[] = [];

  function dfs(current: string, target: string): boolean {
    if (current === target) {
      path.push(MATH_CONCEPT_GENEALOGY[current]);
      return true;
    }

    visited.add(current);
    const node = MATH_CONCEPT_GENEALOGY[current];

    if (node) {
      for (const child of node.child_concepts) {
        if (!visited.has(child) && dfs(child, target)) {
          path.unshift(node);
          return true;
        }
      }
    }

    return false;
  }

  dfs(startConcept, endConcept);
  return path;
}

export function getCurrentConceptsByGrade(grade: string): ConceptNode[] {
  return Object.values(MATH_CONCEPT_GENEALOGY).filter(node => node.grade === grade);
}

export function getRelatedConcepts(conceptId: string): {
  prerequisites: ConceptNode[];
  extensions: ConceptNode[];
} {
  const concept = MATH_CONCEPT_GENEALOGY[conceptId];

  if (!concept) {
    return { prerequisites: [], extensions: [] };
  }

  const prerequisites = concept.parent_concepts
    .map(id => MATH_CONCEPT_GENEALOGY[id])
    .filter(Boolean);

  const extensions = concept.child_concepts
    .map(id => MATH_CONCEPT_GENEALOGY[id])
    .filter(Boolean);

  return { prerequisites, extensions };
}

export interface StudyModeConfig {
  mode: 'speed_quiz' | 'deep_dive' | 'concept_review' | 'killer_training';
  duration: number;
  problemCount: number;
  allowHints: boolean;
  timerEnabled: boolean;
  explanation_required: boolean;
}

export function recommendStudyMode(vectorState: {
  S: number;
  L: number;
  K: number;
  M: number;
}, constitution: string): StudyModeConfig {
  const { S, L, K, M } = vectorState;

  if (S > 0.7 && M > 0.6 && constitution.includes('소양인')) {
    return {
      mode: 'speed_quiz',
      duration: 10,
      problemCount: 10,
      allowHints: false,
      timerEnabled: true,
      explanation_required: false
    };
  }

  if (L < 0.4 || K < 0.4) {
    return {
      mode: 'concept_review',
      duration: 30,
      problemCount: 3,
      allowHints: true,
      timerEnabled: false,
      explanation_required: true
    };
  }

  if (M > 0.7 && constitution.includes('태음인')) {
    return {
      mode: 'deep_dive',
      duration: 30,
      problemCount: 1,
      allowHints: false,
      timerEnabled: false,
      explanation_required: true
    };
  }

  if (L > 0.7 && K > 0.7) {
    return {
      mode: 'killer_training',
      duration: 45,
      problemCount: 3,
      allowHints: false,
      timerEnabled: true,
      explanation_required: true
    };
  }

  return {
    mode: 'deep_dive',
    duration: 20,
    problemCount: 5,
    allowHints: true,
    timerEnabled: false,
    explanation_required: false
  };
}

export const STUDY_MODE_DESCRIPTIONS: Record<string, {
  title: string;
  icon: string;
  description: string;
  target: string;
}> = {
  speed_quiz: {
    title: '스피드 퀴즈',
    icon: '⚡',
    description: '10분 안에 10문제 타격! 순발력과 직관을 키웁니다.',
    target: '소양인 기질 · 지루함 방지 · 반사신경 훈련'
  },
  deep_dive: {
    title: '딥 다이브',
    icon: '🏊',
    description: '한 문제를 30분 동안 깊이 탐구합니다.',
    target: '태음인 기질 · 지구력 훈련 · 킬러 문항 대비'
  },
  concept_review: {
    title: '개념 백지 복습',
    icon: '📝',
    description: '개념을 백지에 처음부터 써보며 완전히 내 것으로 만듭니다.',
    target: '논리력(L) 저하 시 · 메타인지 교정'
  },
  killer_training: {
    title: '킬러 트레이닝',
    icon: '🎯',
    description: '서울대 수준의 고난도 문제를 논리적으로 풀어냅니다.',
    target: '상위권 학생 · 서울대 준비 · 최종 점검'
  }
};
