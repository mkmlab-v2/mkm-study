export interface MathProblem {
  id: string;
  topic: string;
  level: string;
  title: string;
  problem: string;
  concept: string;
  hint: string;
  answer: string;
  explanation: string;
}

export const MATH_PROBLEMS: MathProblem[] = [
  {
    id: 'quad-1',
    topic: '이차함수',
    level: '중학교 3학년',
    title: '이차함수의 그래프와 최댓값',
    problem: '이차함수 y = -2x² + 8x - 3의 그래프가 있습니다. 이 함수의 최댓값을 구하시오.',
    concept: '이차함수 y = ax² + bx + c (a < 0)의 최댓값은 꼭짓점의 y좌표입니다.',
    hint: '이차함수를 y = a(x - p)² + q 형태로 변형하면 꼭짓점 (p, q)를 쉽게 찾을 수 있습니다.',
    answer: '5',
    explanation: 'y = -2x² + 8x - 3 = -2(x² - 4x) - 3 = -2(x² - 4x + 4 - 4) - 3 = -2(x - 2)² + 8 - 3 = -2(x - 2)² + 5\n따라서 꼭짓점은 (2, 5)이고, a = -2 < 0이므로 최댓값은 5입니다.'
  },
  {
    id: 'quad-2',
    topic: '이차함수',
    level: '중학교 3학년',
    title: '이차함수와 직선의 교점',
    problem: '이차함수 y = x² - 4x + 3과 직선 y = x - 1이 만나는 점의 x좌표를 모두 구하시오.',
    concept: '이차함수와 직선이 만나는 점은 두 식을 연립하여 구합니다.',
    hint: 'x² - 4x + 3 = x - 1을 정리하면 이차방정식이 됩니다.',
    answer: 'x = 1, x = 4',
    explanation: 'x² - 4x + 3 = x - 1\nx² - 5x + 4 = 0\n(x - 1)(x - 4) = 0\n따라서 x = 1 또는 x = 4입니다.'
  },
  {
    id: 'trig-1',
    topic: '삼각함수',
    level: '고등학교 1학년',
    title: '삼각비의 값',
    problem: '직각삼각형 ABC에서 ∠C = 90°이고, AB = 10, AC = 6일 때, sin A의 값을 구하시오.',
    concept: 'sin A = (빗변에 대한 대변의 길이) / (빗변의 길이)',
    hint: '먼저 피타고라스 정리를 이용하여 BC의 길이를 구하세요.',
    answer: '4/5',
    explanation: '피타고라스 정리에 의해 BC² = AB² - AC² = 100 - 36 = 64\n따라서 BC = 8\nsin A = BC/AB = 8/10 = 4/5'
  },
  {
    id: 'trig-2',
    topic: '삼각함수',
    level: '고등학교 1학년',
    title: '삼각함수의 성질',
    problem: 'sin²θ + cos²θ = 1일 때, sin θ = 3/5라면 cos θ의 값을 구하시오. (단, 0° < θ < 90°)',
    concept: '삼각함수의 기본 관계식: sin²θ + cos²θ = 1',
    hint: 'sin θ = 3/5를 대입하고 cos²θ를 구한 다음 제곱근을 취하세요.',
    answer: '4/5',
    explanation: 'sin²θ + cos²θ = 1\n(3/5)² + cos²θ = 1\n9/25 + cos²θ = 1\ncos²θ = 16/25\n0° < θ < 90°이므로 cos θ > 0\n따라서 cos θ = 4/5'
  },
  {
    id: 'diff-1',
    topic: '미분',
    level: '고등학교 2학년',
    title: '다항함수의 미분',
    problem: 'f(x) = 3x³ - 5x² + 2x - 1일 때, f\'(x)를 구하시오.',
    concept: '미분의 기본 공식: (xⁿ)\' = n·xⁿ⁻¹',
    hint: '각 항을 개별적으로 미분한 후 더하세요.',
    answer: 'f\'(x) = 9x² - 10x + 2',
    explanation: 'f\'(x) = 3·3x² - 5·2x + 2·1 - 0 = 9x² - 10x + 2'
  },
  {
    id: 'diff-2',
    topic: '미분',
    level: '고등학교 2학년',
    title: '접선의 방정식',
    problem: '함수 f(x) = x² - 4x + 3 위의 점 (2, -1)에서의 접선의 방정식을 구하시오.',
    concept: '점 (a, f(a))에서의 접선의 방정식: y - f(a) = f\'(a)(x - a)',
    hint: '먼저 f\'(2)를 구한 후 접선의 방정식 공식에 대입하세요.',
    answer: 'y = -1',
    explanation: 'f\'(x) = 2x - 4\nf\'(2) = 2·2 - 4 = 0\n접선의 방정식: y - (-1) = 0·(x - 2)\ny + 1 = 0\ny = -1'
  },
  {
    id: 'int-1',
    topic: '적분',
    level: '고등학교 2학년',
    title: '다항함수의 부정적분',
    problem: '∫(6x² - 4x + 1)dx를 계산하시오.',
    concept: '적분의 기본 공식: ∫xⁿdx = (1/(n+1))xⁿ⁺¹ + C',
    hint: '각 항을 개별적으로 적분한 후 더하고, 적분상수 C를 붙이세요.',
    answer: '2x³ - 2x² + x + C',
    explanation: '∫(6x² - 4x + 1)dx = 6·(x³/3) - 4·(x²/2) + x + C = 2x³ - 2x² + x + C'
  },
  {
    id: 'int-2',
    topic: '적분',
    level: '고등학교 2학년',
    title: '정적분의 계산',
    problem: '정적분 ∫₁³ (x² + 2x)dx의 값을 구하시오.',
    concept: '정적분: ∫ₐᵇ f(x)dx = [F(x)]ₐᵇ = F(b) - F(a)',
    hint: '먼저 부정적분을 구한 후, 상한값을 대입한 값에서 하한값을 대입한 값을 빼세요.',
    answer: '56/3',
    explanation: '∫(x² + 2x)dx = x³/3 + x² + C\n[x³/3 + x²]₁³ = (27/3 + 9) - (1/3 + 1) = 9 + 9 - 1/3 - 1 = 17 - 1/3 = 50/3\n계산 재확인: (27/3 + 9) - (1/3 + 1) = 9 + 9 - 1/3 - 1 = 56/3'
  },
  {
    id: 'seq-1',
    topic: '수열',
    level: '고등학교 2학년',
    title: '등차수열의 일반항',
    problem: '첫째항이 3이고 공차가 4인 등차수열의 제10항을 구하시오.',
    concept: '등차수열의 일반항: aₙ = a₁ + (n-1)d (a₁: 첫째항, d: 공차)',
    hint: 'n = 10, a₁ = 3, d = 4를 공식에 대입하세요.',
    answer: '39',
    explanation: 'a₁₀ = 3 + (10-1)·4 = 3 + 9·4 = 3 + 36 = 39'
  },
  {
    id: 'seq-2',
    topic: '수열',
    level: '고등학교 2학년',
    title: '등비수열의 합',
    problem: '첫째항이 2이고 공비가 3인 등비수열의 첫 5항의 합을 구하시오.',
    concept: '등비수열의 합: Sₙ = a₁(rⁿ - 1)/(r - 1) (r ≠ 1)',
    hint: 'n = 5, a₁ = 2, r = 3을 공식에 대입하세요.',
    answer: '242',
    explanation: 'S₅ = 2(3⁵ - 1)/(3 - 1) = 2(243 - 1)/2 = 242'
  },
  {
    id: 'prob-1',
    topic: '확률과 통계',
    level: '고등학교 2학년',
    title: '순열의 계산',
    problem: '5명의 학생 중에서 3명을 뽑아 일렬로 세우는 경우의 수를 구하시오.',
    concept: '순열: ₙPᵣ = n!/(n-r)! = n(n-1)(n-2)...(n-r+1)',
    hint: '₅P₃ = 5 × 4 × 3을 계산하세요.',
    answer: '60',
    explanation: '₅P₃ = 5!/(5-3)! = 5!/2! = 5 × 4 × 3 = 60'
  },
  {
    id: 'prob-2',
    topic: '확률과 통계',
    level: '고등학교 2학년',
    title: '조합의 계산',
    problem: '7명의 학생 중에서 3명을 뽑는 경우의 수를 구하시오.',
    concept: '조합: ₙCᵣ = n!/[r!(n-r)!]',
    hint: '₇C₃ = (7 × 6 × 5)/(3 × 2 × 1)을 계산하세요.',
    answer: '35',
    explanation: '₇C₃ = 7!/[3!·4!] = (7 × 6 × 5)/(3 × 2 × 1) = 210/6 = 35'
  }
];

export interface MathConcept {
  topic: string;
  title: string;
  description: string;
  genealogy: string;
  examples: string[];
  applications: string[];
}

export const MATH_CONCEPTS: Record<string, MathConcept> = {
  '이차함수': {
    topic: '이차함수',
    title: '이차함수의 개념과 그래프',
    description: `이차함수는 y = ax² + bx + c (a ≠ 0) 형태의 함수로, 최고차항의 차수가 2인 다항함수입니다.

**핵심 성질:**
1. 그래프는 포물선 모양
2. a > 0이면 아래로 볼록, a < 0이면 위로 볼록
3. 꼭짓점을 기준으로 대칭
4. 꼭짓점 형태: y = a(x - p)² + q에서 (p, q)가 꼭짓점`,
    genealogy: `**개념의 계보:**

1차 함수 (직선) → 2차 함수 (포물선) → n차 함수

• 일차함수에서 발전: y = ax + b에서 x² 항이 추가되면서 곡선 형태로 확장
• 물리학적 배경: 자유낙하 운동, 포물선 운동 등 자연 현상을 설명하기 위해 발전
• 역사적 의의: 고대 그리스의 포물선 연구 → 데카르트의 좌표평면 → 뉴턴의 운동법칙`,
    examples: [
      'y = x² (가장 기본적인 형태)',
      'y = -2x² + 8x - 3 (일반형)',
      'y = 2(x - 1)² + 3 (꼭짓점형)'
    ],
    applications: [
      '물체의 포물선 운동',
      '다리의 아치 구조 설계',
      '최댓값/최솟값 문제 (이익 최대화 등)',
      '통신 안테나의 포물면 반사경'
    ]
  },
  '삼각함수': {
    topic: '삼각함수',
    title: '삼각함수의 정의와 활용',
    description: `삼각함수는 각의 크기와 직각삼각형의 변의 길이 비율을 연결하는 함수입니다.

**기본 삼각함수:**
• sin θ = (대변)/(빗변)
• cos θ = (밑변)/(빗변)
• tan θ = (대변)/(밑변)

**기본 관계식:**
• sin²θ + cos²θ = 1
• tan θ = sin θ / cos θ`,
    genealogy: `**개념의 계보:**

기하학적 비율 → 삼각비 → 삼각함수 → 해석학

• 고대 천문학: 별의 위치 측정을 위해 발전 (바빌로니아, 이집트)
• 삼각비의 발견: 직각삼각형의 닮음 성질 연구
• 함수로의 확장: 각을 변수로 하는 함수 개념 확립
• 현대 응용: 파동, 진동, 신호 처리 등`,
    examples: [
      'sin 30° = 1/2',
      'cos 45° = √2/2',
      'tan 60° = √3'
    ],
    applications: [
      '건축물의 높이 측정',
      '음파와 전파의 분석',
      'GPS와 삼각측량',
      '컴퓨터 그래픽스의 회전 변환'
    ]
  },
  '미분': {
    topic: '미분',
    title: '미분의 개념과 응용',
    description: `미분은 함수의 순간변화율을 구하는 연산입니다.

**기본 개념:**
• 접선의 기울기
• 순간 속도
• 변화율

**기본 공식:**
• (xⁿ)' = n·xⁿ⁻¹
• (상수)' = 0
• (af(x) + bg(x))' = af'(x) + bg'(x)`,
    genealogy: `**개념의 계보:**

평균변화율 → 순간변화율 → 미분 → 미적분학

• 고대: 넓이와 부피 문제 (아르키메데스의 취진법)
• 17세기: 뉴턴(물리학) + 라이프니츠(수학)가 독립적으로 발견
• 순간 속도 문제: 시간에 따른 위치 변화를 정확히 측정하려는 시도
• 현대 확장: 편미분, 방향미분, 다양체 위의 미분`,
    examples: [
      'f(x) = x³ → f\'(x) = 3x²',
      'f(x) = 5x² - 3x + 1 → f\'(x) = 10x - 3'
    ],
    applications: [
      '최적화 문제 (최댓값/최솟값)',
      '속도와 가속도 계산',
      '경제학의 한계비용/한계수익',
      '머신러닝의 경사하강법'
    ]
  },
  '적분': {
    topic: '적분',
    title: '적분의 개념과 응용',
    description: `적분은 미분의 역연산이며, 넓이를 구하는 연산입니다.

**두 가지 의미:**
1. 부정적분: 미분의 역연산
2. 정적분: 구간에서의 넓이

**기본 공식:**
• ∫xⁿdx = (1/(n+1))xⁿ⁺¹ + C (n ≠ -1)
• ∫ₐᵇ f(x)dx = [F(x)]ₐᵇ = F(b) - F(a)`,
    genealogy: `**개념의 계보:**

넓이 문제 → 구분구적법 → 적분 → 미적분학의 기본정리

• 고대: 원의 넓이, 구의 부피 계산 (아르키메데스)
• 중세: 무한소 개념의 발전
• 17세기: 뉴턴과 라이프니츠의 미적분학 확립
• 기본정리: 미분과 적분이 역연산임을 증명`,
    examples: [
      '∫x²dx = (1/3)x³ + C',
      '∫₀² xdx = [x²/2]₀² = 2'
    ],
    applications: [
      '넓이와 부피 계산',
      '이동 거리 계산 (속도 적분)',
      '확률 분포의 계산',
      '물리학의 일과 에너지'
    ]
  },
  '수열': {
    topic: '수열',
    title: '수열의 개념과 종류',
    description: `수열은 규칙에 따라 나열된 수의 열입니다.

**등차수열:**
• 일반항: aₙ = a₁ + (n-1)d
• 합: Sₙ = n(a₁ + aₙ)/2

**등비수열:**
• 일반항: aₙ = a₁·rⁿ⁻¹
• 합: Sₙ = a₁(rⁿ - 1)/(r - 1)`,
    genealogy: `**개념의 계보:**

수의 패턴 → 수열 → 급수 → 해석학

• 고대: 자연수의 합, 제곱수의 합 연구
• 피보나치 수열: 자연 현상의 수학적 모델
• 무한급수: 함수를 수열로 표현 (테일러 급수)
• 현대: 알고리즘 복잡도, 점화식 이론`,
    examples: [
      '등차수열: 2, 5, 8, 11, 14, ...',
      '등비수열: 3, 6, 12, 24, 48, ...'
    ],
    applications: [
      '복리 계산',
      '인구 증가 모델',
      '컴퓨터 알고리즘 분석',
      '신호 처리와 푸리에 급수'
    ]
  },
  '확률과 통계': {
    topic: '확률과 통계',
    title: '확률과 통계의 기초',
    description: `확률은 사건이 일어날 가능성을 수치화한 것이고, 통계는 데이터를 수집하고 분석하는 학문입니다.

**기본 개념:**
• 순열: ₙPᵣ = n!/(n-r)!
• 조합: ₙCᵣ = n!/[r!(n-r)!]
• 확률: P(A) = (사건 A가 일어나는 경우의 수) / (전체 경우의 수)`,
    genealogy: `**개념의 계보:**

경우의 수 → 확률 → 통계학 → 데이터 과학

• 17세기: 도박 문제에서 출발 (파스칼, 페르마)
• 경우의 수: 조합론의 발전
• 19세기: 정규분포와 통계적 추론 확립
• 현대: 빅데이터, 기계학습, AI의 기초 이론`,
    examples: [
      '동전 던지기: P(앞면) = 1/2',
      '주사위: P(짝수) = 3/6 = 1/2'
    ],
    applications: [
      '보험과 금융 리스크 관리',
      '의학 연구와 임상시험',
      '여론 조사와 품질 관리',
      '인공지능과 기계학습'
    ]
  }
};

export function getMathProblemsbyTopic(topic: string): MathProblem[] {
  return MATH_PROBLEMS.filter(p => p.topic === topic);
}

export function getMathConcept(topic: string): MathConcept | null {
  return MATH_CONCEPTS[topic] || null;
}

export function getRandomMathProblem(topic: string): MathProblem | null {
  const problems = getMathProblemsbyTopic(topic);
  if (problems.length === 0) return null;
  return problems[Math.floor(Math.random() * problems.length)];
}
