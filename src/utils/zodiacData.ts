import { ZodiacAnimal, CharacterTrait, EvolutionStage } from './types';

export const ZODIAC_ANIMALS: Record<string, ZodiacAnimal> = {
  'RAT': { id: 'RAT', name: '쥐', emoji: '🐭', element: 'Water', traits: ['똑똑함', '빠른 판단'], color: 'from-slate-500 to-gray-600' },
  'OX': { id: 'OX', name: '소', emoji: '🐮', element: 'Earth', traits: ['성실함', '끈기'], color: 'from-blue-600 to-blue-800' },
  'TIGER': { id: 'TIGER', name: '호랑이', emoji: '🐯', element: 'Wood', traits: ['용맹', '자신감'], color: 'from-amber-500 to-orange-600' },
  'RABBIT': { id: 'RABBIT', name: '토끼', emoji: '🐰', element: 'Wood', traits: ['평화로움', '친근함'], color: 'from-pink-400 to-rose-500' },
  'DRAGON': { id: 'DRAGON', name: '용', emoji: '🐲', element: 'Earth', traits: ['카리스마', '리더십'], color: 'from-purple-600 to-indigo-700' },
  'SNAKE': { id: 'SNAKE', name: '뱀', emoji: '🐍', element: 'Fire', traits: ['지혜로움', '신중함'], color: 'from-green-600 to-emerald-700' },
  'HORSE': { id: 'HORSE', name: '말', emoji: '🐴', element: 'Fire', traits: ['활발함', '자유로움'], color: 'from-yellow-600 to-amber-700' },
  'GOAT': { id: 'GOAT', name: '양', emoji: '🐑', element: 'Earth', traits: ['온화함', '예술성'], color: 'from-teal-500 to-cyan-600' },
  'MONKEY': { id: 'MONKEY', name: '원숭이', emoji: '🐵', element: 'Metal', traits: ['재치', '활발함'], color: 'from-pink-500 to-rose-500' },
  'ROOSTER': { id: 'ROOSTER', name: '닭', emoji: '🐔', element: 'Metal', traits: ['정확함', '책임감'], color: 'from-red-600 to-rose-700' },
  'DOG': { id: 'DOG', name: '개', emoji: '🐶', element: 'Earth', traits: ['충성심', '정직함'], color: 'from-orange-500 to-amber-600' },
  'PIG': { id: 'PIG', name: '돼지', emoji: '🐷', element: 'Water', traits: ['관대함', '순수함'], color: 'from-fuchsia-500 to-pink-600' }
};

export const CHARACTER_TRAITS: Record<string, CharacterTrait> = {
  'TY-1': { id: 'TY-1', name: '혁신가', description: '혁신적이고 대담하며 미래 지향적입니다.', traits: ['대담함', '창의적'] },
  'TY-2': { id: 'TY-2', name: '전략가', description: '분석적이고 체계적이며 세부 지향적입니다.', traits: ['전략적', '체계적'] },
  'TY-3': { id: 'TY-3', name: '도전자', description: '모험을 즐기고 새로운 가능성을 탐구합니다.', traits: ['모험적', '탐구심'] },
  'TE-1': { id: 'TE-1', name: '수호자', description: '안정을 중시하고 신뢰를 쌓아갑니다.', traits: ['안정적', '신뢰'] },
  'TE-2': { id: 'TE-2', name: '조화자', description: '균형과 조화를 추구합니다.', traits: ['균형', '조화'] },
  'TE-3': { id: 'TE-3', name: '건설자', description: '체계적으로 목표를 달성합니다.', traits: ['체계적', '목표지향'] },
  'SY-1': { id: 'SY-1', name: '분석가', description: '논리적이고 효율적으로 문제를 해결합니다.', traits: ['논리적', '효율적'] },
  'SY-2': { id: 'SY-2', name: '최적화자', description: '최선의 방법을 찾아냅니다.', traits: ['최적화', '개선'] },
  'SY-3': { id: 'SY-3', name: '실행자', description: '빠르고 정확하게 실행합니다.', traits: ['신속함', '정확성'] },
  'SE-1': { id: 'SE-1', name: '완벽주의자', description: '세밀하고 정확하게 작업합니다.', traits: ['세밀함', '정확성'] },
  'SE-2': { id: 'SE-2', name: '장인', description: '완벽한 결과물을 만들어냅니다.', traits: ['장인정신', '완성도'] },
  'SE-3': { id: 'SE-3', name: '연구자', description: '깊이 있게 탐구하고 이해합니다.', traits: ['탐구', '이해'] }
};

export const ZODIAC_CHARACTER_MAPPING: Record<string, string> = {
  'TY-1': 'TIGER',
  'TY-2': 'DRAGON',
  'TY-3': 'HORSE',
  'TE-1': 'OX',
  'TE-2': 'RABBIT',
  'TE-3': 'PIG',
  'SY-1': 'MONKEY',
  'SY-2': 'ROOSTER',
  'SY-3': 'SNAKE',
  'SE-1': 'RAT',
  'SE-2': 'DOG',
  'SE-3': 'GOAT'
};

export const EVOLUTION_STAGES: EvolutionStage[] = [
  { level: 1, title: '디지털 AI 알', emoji: '🤖', scale: 0.8, effect: 'bounce' },
  { level: 5, title: 'AI → 유기체 전환', emoji: '⚡', scale: 1.0, effect: 'pulse' },
  { level: 10, title: '하이브리드 형태', emoji: '', scale: 1.2, effect: 'none' },
  { level: 20, title: '인간화 진행', emoji: '', scale: 1.3, effect: 'glow' },
  { level: 30, title: '완전 인간화 튜터', emoji: '', scale: 1.5, effect: 'glow' }
];

export const ACCESSORIES = {
  'glasses': { id: 'glasses', name: '집중력 안경', emoji: '👓', cost: 50, requiredLevel: 5 },
  'pen': { id: 'pen', name: '연필', emoji: '✏️', cost: 30, requiredLevel: 3 },
  'book': { id: 'book', name: '책', emoji: '📚', cost: 40, requiredLevel: 4 },
  'graduation_cap': { id: 'graduation_cap', name: '졸업 모자', emoji: '🎓', cost: 100, requiredLevel: 10 }
};
