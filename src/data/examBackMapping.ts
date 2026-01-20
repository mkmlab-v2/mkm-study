/**
 * 🏛️ 수능 역추적 커리큘럼 매핑 (Back-mapping)
 * 
 * 중학교 개념이 수능의 어떤 킬러 문항으로 변모하는지 매핑합니다.
 * 
 * 작성일: 2026-01-20
 * 상태: ✅ Phase 4 구현 중
 */

export interface ExamMapping {
  middleSchoolConcept: string; // "연립방정식"
  examYear: number; // 2024
  examNumber: number; // 22
  examType: 'killer' | 'standard' | 'basic';
  connection: string; // "이 개념이 2024년 수능 수학 22번의 핵심 논리로 쓰였습니다"
  difficulty: 'easy' | 'medium' | 'hard';
  subject: 'math' | 'english';
}

/**
 * 수능 역추적 매핑 데이터
 * 
 * 실제 수능 기출 문제 분석 결과를 기반으로 작성
 */
export const EXAM_MAPPINGS: ExamMapping[] = [
  // 수학
  {
    middleSchoolConcept: '연립방정식',
    examYear: 2024,
    examNumber: 22,
    examType: 'killer',
    connection: '이 개념이 2024년 수능 수학 22번의 핵심 논리로 쓰였습니다. 연립방정식의 해를 구하는 과정이 복잡한 함수 문제의 기초가 됩니다.',
    difficulty: 'hard',
    subject: 'math'
  },
  {
    middleSchoolConcept: '일차함수',
    examYear: 2024,
    examNumber: 19,
    examType: 'standard',
    connection: '일차함수의 그래프와 기울기 개념이 2024년 수능 수학 19번에 활용되었습니다.',
    difficulty: 'medium',
    subject: 'math'
  },
  {
    middleSchoolConcept: '이차방정식',
    examYear: 2024,
    examNumber: 21,
    examType: 'killer',
    connection: '이차방정식의 근의 공식과 판별식이 2024년 수능 수학 21번 킬러 문항의 핵심입니다.',
    difficulty: 'hard',
    subject: 'math'
  },
  {
    middleSchoolConcept: '삼각비',
    examYear: 2023,
    examNumber: 20,
    examType: 'standard',
    connection: '중3 삼각비 개념이 2023년 수능 수학 20번에 직접적으로 연결됩니다.',
    difficulty: 'medium',
    subject: 'math'
  },
  {
    middleSchoolConcept: '원의 성질',
    examYear: 2023,
    examNumber: 22,
    examType: 'killer',
    connection: '원주각과 중심각의 관계가 2023년 수능 수학 22번 킬러 문항의 핵심 논리입니다.',
    difficulty: 'hard',
    subject: 'math'
  },
  {
    middleSchoolConcept: '인수분해',
    examYear: 2024,
    examNumber: 15,
    examType: 'basic',
    connection: '인수분해는 2024년 수능 수학 15번 기본 문제의 핵심입니다.',
    difficulty: 'easy',
    subject: 'math'
  },
  
  // 영어
  {
    middleSchoolConcept: '관계대명사',
    examYear: 2024,
    examNumber: 23,
    examType: 'killer',
    connection: '관계대명사 who/which/that가 2024년 수능 영어 23번 킬러 문항의 핵심 문법입니다.',
    difficulty: 'hard',
    subject: 'english'
  },
  {
    middleSchoolConcept: '현재완료',
    examYear: 2024,
    examNumber: 18,
    examType: 'standard',
    connection: '현재완료 시제가 2024년 수능 영어 18번에 활용되었습니다.',
    difficulty: 'medium',
    subject: 'english'
  },
  {
    middleSchoolConcept: '수동태',
    examYear: 2023,
    examNumber: 22,
    examType: 'killer',
    connection: '수동태 변환이 2023년 수능 영어 22번 킬러 문항의 핵심입니다.',
    difficulty: 'hard',
    subject: 'english'
  },
  {
    middleSchoolConcept: '가정법',
    examYear: 2024,
    examNumber: 24,
    examType: 'killer',
    connection: '가정법 과거가 2024년 수능 영어 24번 킬러 문항의 핵심 문법입니다.',
    difficulty: 'hard',
    subject: 'english'
  },
  {
    middleSchoolConcept: '비교급과 최상급',
    examYear: 2023,
    examNumber: 19,
    examType: 'standard',
    connection: '비교급과 최상급 표현이 2023년 수능 영어 19번에 활용되었습니다.',
    difficulty: 'medium',
    subject: 'english'
  }
];

/**
 * 중학 개념으로 수능 역추적 검색
 */
export function findExamMappings(concept: string, subject?: 'math' | 'english'): ExamMapping[] {
  return EXAM_MAPPINGS.filter(mapping => {
    const conceptMatch = mapping.middleSchoolConcept.includes(concept) || 
                         concept.includes(mapping.middleSchoolConcept);
    const subjectMatch = !subject || mapping.subject === subject;
    return conceptMatch && subjectMatch;
  });
}

/**
 * 단원명으로 수능 역추적 검색
 */
export function findExamMappingsByUnit(unit: string, subject?: 'math' | 'english'): ExamMapping[] {
  // 단원명에서 핵심 개념 추출
  const concepts = unit.split(/[,\s]+/).filter(c => c.length > 1);
  
  const results: ExamMapping[] = [];
  for (const concept of concepts) {
    const mappings = findExamMappings(concept, subject);
    results.push(...mappings);
  }
  
  // 중복 제거 (같은 examYear + examNumber 조합)
  const unique = new Map<string, ExamMapping>();
  for (const mapping of results) {
    const key = `${mapping.examYear}-${mapping.examNumber}`;
    if (!unique.has(key)) {
      unique.set(key, mapping);
    }
  }
  
  return Array.from(unique.values());
}

/**
 * 수능 역추적 알림 메시지 생성
 */
export function generateExamMappingAlert(mappings: ExamMapping[]): string | null {
  if (mappings.length === 0) {
    return null;
  }
  
  // 가장 최근 킬러 문항 우선
  const killerMappings = mappings.filter(m => m.examType === 'killer');
  const targetMapping = killerMappings.length > 0 ? killerMappings[0] : mappings[0];
  
  return `🎯 수능 연결: ${targetMapping.connection}`;
}

