import { CoinBalance, CoinTransaction, RewardItem } from './types';

export const REWARD_ITEMS: RewardItem[] = [
  { id: 'avatar-hair-1', name: '새로운 헤어스타일', description: '아바타의 헤어스타일을 변경할 수 있어요!', cost: 50, category: 'avatar', icon: '💇' },
  { id: 'avatar-outfit-1', name: '예쁜 옷', description: '아바타의 옷을 바꿀 수 있어요!', cost: 100, category: 'avatar', icon: '👗' },
  { id: 'avatar-accessory-1', name: '귀여운 액세서리', description: '아바타에 액세서리를 추가할 수 있어요!', cost: 30, category: 'avatar', icon: '💎' },
  { id: 'real-weekend-free', name: '주말 자유 시간', description: '주말에 자유롭게 시간을 보낼 수 있어요!', cost: 200, category: 'real', icon: '🎉' },
  { id: 'real-gift-coupon', name: '선물 쿠폰', description: '아빠가 정한 선물을 받을 수 있어요!', cost: 300, category: 'real', icon: '🎁' },
  { id: 'real-snack', name: '간식', description: '맛있는 간식을 받을 수 있어요!', cost: 50, category: 'real', icon: '🍪' }
];

export function earnCoins(balance: CoinBalance, amount: number, reason: string): CoinBalance {
  const transaction: CoinTransaction = {
    id: `tx_${Date.now()}`,
    type: 'earn',
    amount,
    reason,
    timestamp: Date.now()
  };

  return {
    total: balance.total + amount,
    earned: balance.earned + amount,
    spent: balance.spent,
    transactions: [...balance.transactions, transaction],
    lastUpdated: Date.now()
  };
}

export function spendCoins(balance: CoinBalance, amount: number, reason: string): CoinBalance | null {
  if (balance.total < amount) {
    return null;
  }

  const transaction: CoinTransaction = {
    id: `tx_${Date.now()}`,
    type: 'spend',
    amount,
    reason,
    timestamp: Date.now()
  };

  return {
    total: balance.total - amount,
    earned: balance.earned,
    spent: balance.spent + amount,
    transactions: [...balance.transactions, transaction],
    lastUpdated: Date.now()
  };
}

export function calculateCoinsFromStudy(studyTimeMinutes: number, accuracy: number, level: number): number {
  let coins = Math.floor(studyTimeMinutes / 5);

  if (accuracy >= 80) {
    coins += 5;
  }

  const buffMultiplier = 1.0 + (level * 0.05);
  coins = Math.floor(coins * Math.min(buffMultiplier, 2.0));

  return coins;
}

export function saveCoinBalance(balance: CoinBalance): void {
  localStorage.setItem('coin-balance', JSON.stringify(balance));
}

export function loadCoinBalance(): CoinBalance {
  const saved = localStorage.getItem('coin-balance');
  if (saved) {
    return JSON.parse(saved);
  }
  return {
    total: 0,
    earned: 0,
    spent: 0,
    transactions: [],
    lastUpdated: Date.now()
  };
}
