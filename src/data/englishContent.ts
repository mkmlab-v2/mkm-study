export interface EnglishSentence {
  id: string;
  difficulty: 'easy' | 'medium' | 'hard';
  sentence: string;
  translation: string;
  vocabulary: Array<{
    word: string;
    meaning: string;
    pronunciation: string;
  }>;
  grammar: string;
  context: string;
  dimension_analysis?: {
    S: number;
    L: number;
    K: number;
    M: number;
    primary_type: 'fact' | 'emotion' | 'logic' | 'action';
    description: string;
  };
}

export const ENGLISH_SENTENCES: EnglishSentence[] = [
  {
    id: 'easy-1',
    difficulty: 'easy',
    sentence: 'The early bird catches the worm.',
    translation: '일찍 일어나는 새가 벌레를 잡는다.',
    vocabulary: [
      { word: 'early', meaning: '이른, 일찍', pronunciation: '[ˈɜːrli]' },
      { word: 'catch', meaning: '잡다', pronunciation: '[kætʃ]' },
      { word: 'worm', meaning: '벌레', pronunciation: '[wɜːrm]' }
    ],
    grammar: '주어(S) + 동사(V) + 목적어(O)',
    context: '부지런함의 중요성을 강조하는 속담',
    dimension_analysis: {
      S: 0.6,
      L: 0.2,
      K: 0.5,
      M: 0.8,
      primary_type: 'action',
      description: '행동(M)을 강조하는 실용적 지혜. 논리보다는 교훈(K)과 의지(S)를 담은 문장.'
    }
  },
  {
    id: 'easy-2',
    difficulty: 'easy',
    sentence: 'Practice makes perfect.',
    translation: '연습이 완벽을 만든다.',
    vocabulary: [
      { word: 'practice', meaning: '연습', pronunciation: '[ˈpræktɪs]' },
      { word: 'perfect', meaning: '완벽한', pronunciation: '[ˈpɜːrfɪkt]' }
    ],
    grammar: '주어(S) + 동사(V) + 목적어(O) + 목적격보어(OC)',
    context: '꾸준한 노력의 가치를 표현하는 속담'
  },
  {
    id: 'easy-3',
    difficulty: 'easy',
    sentence: 'Knowledge is power.',
    translation: '지식은 힘이다.',
    vocabulary: [
      { word: 'knowledge', meaning: '지식', pronunciation: '[ˈnɑːlɪdʒ]' },
      { word: 'power', meaning: '힘, 권력', pronunciation: '[ˈpaʊər]' }
    ],
    grammar: '주어(S) + be동사 + 보어(C)',
    context: '지식의 중요성을 강조하는 명언 (프란시스 베이컨)'
  },
  {
    id: 'easy-4',
    difficulty: 'easy',
    sentence: 'Time flies like an arrow.',
    translation: '시간은 화살처럼 빠르게 흐른다.',
    vocabulary: [
      { word: 'fly', meaning: '날다', pronunciation: '[flaɪ]' },
      { word: 'arrow', meaning: '화살', pronunciation: '[ˈæroʊ]' }
    ],
    grammar: '주어(S) + 동사(V) + 전치사구',
    context: '시간의 빠름을 비유적으로 표현'
  },
  {
    id: 'medium-1',
    difficulty: 'medium',
    sentence: 'The pursuit of knowledge is a lifelong journey.',
    translation: '지식 추구는 평생의 여정이다.',
    vocabulary: [
      { word: 'pursuit', meaning: '추구', pronunciation: '[pərˈsuːt]' },
      { word: 'knowledge', meaning: '지식', pronunciation: '[ˈnɑːlɪdʒ]' },
      { word: 'lifelong', meaning: '평생의', pronunciation: '[ˈlaɪflɔːŋ]' },
      { word: 'journey', meaning: '여정', pronunciation: '[ˈdʒɜːrni]' }
    ],
    grammar: '주어(S: The pursuit of knowledge) + be동사 + 보어(C)',
    context: '학습의 지속성을 강조하는 표현',
    dimension_analysis: {
      S: 0.4,
      L: 0.3,
      K: 0.9,
      M: 0.3,
      primary_type: 'fact',
      description: '지식(K) 중심의 객관적 진술. 감정이나 행동보다는 사실과 개념을 전달하는 문장.'
    }
  },
  {
    id: 'medium-2',
    difficulty: 'medium',
    sentence: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    translation: '성공은 끝이 아니고, 실패는 치명적이지 않다: 중요한 것은 계속할 용기다.',
    vocabulary: [
      { word: 'final', meaning: '최종의', pronunciation: '[ˈfaɪnl]' },
      { word: 'fatal', meaning: '치명적인', pronunciation: '[ˈfeɪtl]' },
      { word: 'courage', meaning: '용기', pronunciation: '[ˈkɜːrɪdʒ]' },
      { word: 'count', meaning: '중요하다', pronunciation: '[kaʊnt]' }
    ],
    grammar: '복합문: 주절 + 주절 + 강조구문',
    context: '윈스턴 처칠의 명언: 지속적인 노력의 중요성'
  },
  {
    id: 'medium-3',
    difficulty: 'medium',
    sentence: 'The only way to do great work is to love what you do.',
    translation: '위대한 일을 하는 유일한 방법은 당신이 하는 일을 사랑하는 것이다.',
    vocabulary: [
      { word: 'great', meaning: '위대한', pronunciation: '[ɡreɪt]' },
      { word: 'work', meaning: '일', pronunciation: '[wɜːrk]' },
      { word: 'love', meaning: '사랑하다', pronunciation: '[lʌv]' }
    ],
    grammar: 'The only way to V + be동사 + to부정사',
    context: '스티브 잡스의 명언: 열정의 중요성'
  },
  {
    id: 'medium-4',
    difficulty: 'medium',
    sentence: 'Education is the most powerful weapon which you can use to change the world.',
    translation: '교육은 세상을 바꾸는 데 사용할 수 있는 가장 강력한 무기다.',
    vocabulary: [
      { word: 'education', meaning: '교육', pronunciation: '[ˌedʒuˈkeɪʃn]' },
      { word: 'powerful', meaning: '강력한', pronunciation: '[ˈpaʊərfl]' },
      { word: 'weapon', meaning: '무기', pronunciation: '[ˈwepən]' },
      { word: 'change', meaning: '바꾸다', pronunciation: '[tʃeɪndʒ]' }
    ],
    grammar: '주어(S) + be동사 + 최상급 표현 + 관계대명사절',
    context: '넬슨 만델라의 명언: 교육의 힘'
  },
  {
    id: 'hard-1',
    difficulty: 'hard',
    sentence: 'It is during our darkest moments that we must focus to see the light.',
    translation: '가장 어두운 순간에 빛을 보기 위해 집중해야 한다.',
    vocabulary: [
      { word: 'darkest', meaning: '가장 어두운', pronunciation: '[ˈdɑːrkɪst]' },
      { word: 'moment', meaning: '순간', pronunciation: '[ˈmoʊmənt]' },
      { word: 'focus', meaning: '집중하다', pronunciation: '[ˈfoʊkəs]' },
      { word: 'light', meaning: '빛', pronunciation: '[laɪt]' }
    ],
    grammar: 'It is ~ that 강조구문 + must + V',
    context: '아리스토텔레스: 역경 속 희망의 메시지',
    dimension_analysis: {
      S: 0.9,
      L: 0.6,
      K: 0.4,
      M: 0.5,
      primary_type: 'emotion',
      description: '정서(S) 중심의 감동적 메시지. 논리적 구조(L)도 갖췄지만 주된 목적은 감정적 동기부여.'
    }
  },
  {
    id: 'hard-2',
    difficulty: 'hard',
    sentence: 'The greatest glory in living lies not in never falling, but in rising every time we fall.',
    translation: '삶의 가장 큰 영광은 넘어지지 않는 데 있는 것이 아니라, 넘어질 때마다 일어서는 데 있다.',
    vocabulary: [
      { word: 'glory', meaning: '영광', pronunciation: '[ˈɡlɔːri]' },
      { word: 'lie', meaning: '놓여있다', pronunciation: '[laɪ]' },
      { word: 'fall', meaning: '넘어지다', pronunciation: '[fɔːl]' },
      { word: 'rise', meaning: '일어서다', pronunciation: '[raɪz]' }
    ],
    grammar: 'not A but B 구문 + 동명사',
    context: '넬슨 만델라: 회복탄력성의 중요성'
  },
  {
    id: 'hard-3',
    difficulty: 'hard',
    sentence: 'In the middle of difficulty lies opportunity.',
    translation: '어려움의 한가운데 기회가 있다.',
    vocabulary: [
      { word: 'middle', meaning: '중간, 한가운데', pronunciation: '[ˈmɪdl]' },
      { word: 'difficulty', meaning: '어려움', pronunciation: '[ˈdɪfɪkəlti]' },
      { word: 'opportunity', meaning: '기회', pronunciation: '[ˌɑːpərˈtuːnəti]' }
    ],
    grammar: '전치사구 + 동사(V) + 주어(S) (도치)',
    context: '알베르트 아인슈타인: 위기를 기회로 전환'
  },
  {
    id: 'hard-4',
    difficulty: 'hard',
    sentence: 'The function of education is to teach one to think intensively and to think critically.',
    translation: '교육의 기능은 집중적으로 생각하고 비판적으로 생각하도록 가르치는 것이다.',
    vocabulary: [
      { word: 'function', meaning: '기능', pronunciation: '[ˈfʌŋkʃn]' },
      { word: 'intensively', meaning: '집중적으로', pronunciation: '[ɪnˈtensɪvli]' },
      { word: 'critically', meaning: '비판적으로', pronunciation: '[ˈkrɪtɪkli]' }
    ],
    grammar: 'to부정사의 명사적 용법 + 병렬구조',
    context: '마틴 루터 킹 주니어: 교육의 본질'
  }
];

export function getEnglishSentencesByDifficulty(difficulty: 'easy' | 'medium' | 'hard'): EnglishSentence[] {
  return ENGLISH_SENTENCES.filter(s => s.difficulty === difficulty);
}

export function getRandomEnglishSentence(difficulty: 'easy' | 'medium' | 'hard'): EnglishSentence | null {
  const sentences = getEnglishSentencesByDifficulty(difficulty);
  if (sentences.length === 0) return null;
  return sentences[Math.floor(Math.random() * sentences.length)];
}

export interface VocabularyCard {
  word: string;
  meaning: string;
  pronunciation: string;
  examples: string[];
  synonyms: string[];
}

export const VOCABULARY_DATABASE: Record<string, VocabularyCard> = {
  'pursuit': {
    word: 'pursuit',
    meaning: '추구, 추적',
    pronunciation: '[pərˈsuːt]',
    examples: [
      'the pursuit of happiness (행복 추구)',
      'in pursuit of knowledge (지식을 추구하여)'
    ],
    synonyms: ['chase', 'quest', 'search']
  },
  'knowledge': {
    word: 'knowledge',
    meaning: '지식, 학식',
    pronunciation: '[ˈnɑːlɪdʒ]',
    examples: [
      'gain knowledge (지식을 얻다)',
      'common knowledge (상식)'
    ],
    synonyms: ['information', 'learning', 'wisdom']
  },
  'courage': {
    word: 'courage',
    meaning: '용기',
    pronunciation: '[ˈkɜːrɪdʒ]',
    examples: [
      'have the courage to do (할 용기가 있다)',
      'moral courage (도덕적 용기)'
    ],
    synonyms: ['bravery', 'valor', 'nerve']
  },
  'education': {
    word: 'education',
    meaning: '교육',
    pronunciation: '[ˌedʒuˈkeɪʃn]',
    examples: [
      'higher education (고등 교육)',
      'quality education (양질의 교육)'
    ],
    synonyms: ['schooling', 'teaching', 'instruction']
  }
};
