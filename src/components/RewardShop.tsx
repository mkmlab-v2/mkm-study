import { CoinBalance, RewardItem } from '../utils/types';
import { REWARD_ITEMS } from '../utils/coinSystem';
import { Coins } from 'lucide-react';

interface RewardShopProps {
  coinBalance: CoinBalance;
  onPurchase: (reward: RewardItem) => void;
}

export default function RewardShop({ coinBalance, onPurchase }: RewardShopProps) {
  return (
    <div className="bg-gray-900 rounded-2xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">보상 상점</h2>
        <div className="flex items-center gap-2 bg-yellow-500/20 px-4 py-2 rounded-full">
          <Coins className="w-5 h-5 text-yellow-400" />
          <span className="text-xl font-bold text-yellow-400">{coinBalance.total}</span>
        </div>
      </div>

      <div className="space-y-4">
        {REWARD_ITEMS.map((reward) => {
          const canAfford = coinBalance.total >= reward.cost;

          return (
            <div
              key={reward.id}
              className={`p-4 rounded-xl border-2 transition-all ${
                canAfford
                  ? 'border-blue-500/30 bg-blue-500/10 hover:border-blue-500/50 cursor-pointer'
                  : 'border-gray-700 bg-gray-800/50 opacity-60'
              }`}
              onClick={() => canAfford && onPurchase(reward)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl">{reward.icon}</div>
                  <div>
                    <h3 className="font-bold text-white">{reward.name}</h3>
                    <p className="text-sm text-gray-400">{reward.description}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded ${
                      reward.category === 'avatar' ? 'bg-purple-500/20 text-purple-300' :
                      reward.category === 'real' ? 'bg-green-500/20 text-green-300' :
                      'bg-blue-500/20 text-blue-300'
                    }`}>
                      {reward.category === 'avatar' ? '아바타' :
                       reward.category === 'real' ? '실물 보상' : '특권'}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-yellow-400 mb-2">
                    <Coins className="w-5 h-5" />
                    <span className="font-bold text-lg">{reward.cost}</span>
                  </div>
                  {canAfford ? (
                    <button className="px-4 py-1.5 bg-blue-500 text-white rounded-lg text-sm font-bold hover:bg-blue-600 transition-colors">
                      구매
                    </button>
                  ) : (
                    <div className="text-xs text-gray-500">코인 부족</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
