import { useState, useEffect } from 'react';
import { Crown, Gift, Sparkles, GraduationCap } from 'lucide-react';
import { ZodiacEvolutionData } from '../utils/types';
import { ZODIAC_ANIMALS, ACCESSORIES } from '../utils/zodiacData';
import { calculateLevel, getEvolutionStage, calculateXPGain, canFeed, saveEvolutionData, loadEvolutionData } from '../utils/evolutionEngine';

interface ZodiacEvolutionProps {
  studyTime: number;
  focusScore: number;
  onLevelUp?: (level: number) => void;
}

export default function ZodiacEvolution({ studyTime, focusScore, onLevelUp }: ZodiacEvolutionProps) {
  const [evolutionData, setEvolutionData] = useState<ZodiacEvolutionData | null>(null);
  const [isLevelUp, setIsLevelUp] = useState(false);
  const [showFeedMessage, setShowFeedMessage] = useState(false);

  useEffect(() => {
    const saved = loadEvolutionData();
    if (saved) {
      setEvolutionData(saved);
    }
  }, []);

  useEffect(() => {
    if (!evolutionData) return;

    const previousLevel = evolutionData.level;
    const studyTimeDiff = studyTime - evolutionData.totalStudyTime;
    const xpGain = calculateXPGain(studyTimeDiff);
    const newXP = evolutionData.xp + xpGain;
    const newLevel = calculateLevel(newXP);
    const newStage = getEvolutionStage(newLevel);

    if (newLevel > previousLevel) {
      setIsLevelUp(true);
      setTimeout(() => setIsLevelUp(false), 3000);
      onLevelUp?.(newLevel);
    }

    const updated: ZodiacEvolutionData = {
      ...evolutionData,
      level: newLevel,
      xp: newXP,
      totalStudyTime: studyTime,
      focusScore: focusScore,
      evolutionStage: newStage,
      tutorModeUnlocked: newLevel >= 30
    };

    setEvolutionData(updated);
    saveEvolutionData(updated);
  }, [studyTime, focusScore]);

  const handleFeed = () => {
    if (!evolutionData || !canFeed(evolutionData.lastFedAt)) return;

    const updated = {
      ...evolutionData,
      xp: evolutionData.xp + 10,
      lastFedAt: Date.now()
    };

    setEvolutionData(updated);
    saveEvolutionData(updated);
    setShowFeedMessage(true);
    setTimeout(() => setShowFeedMessage(false), 2000);
  };

  if (!evolutionData) return null;

  const zodiac = ZODIAC_ANIMALS[evolutionData.zodiacId];
  const stage = evolutionData.evolutionStage;
  const currentEmoji = zodiac.emoji;
  const progress = (evolutionData.xp % 100) / 100;
  const canFeedNow = canFeed(evolutionData.lastFedAt);

  return (
    <div className={`bg-gradient-to-br ${zodiac.color} rounded-3xl p-6 shadow-xl relative overflow-hidden`}>
      {showFeedMessage && (
        <div className="absolute top-4 right-4 bg-green-500 text-white text-sm px-3 py-1 rounded-full animate-bounce">
          +10 XP!
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <div className="bg-black/30 px-3 py-1 rounded-full">
          <span className="text-yellow-400 font-black">LV.{evolutionData.level}</span>
          <span className="text-white text-sm ml-2">
            {stage.title} {zodiac.name}
          </span>
        </div>
        {evolutionData.tutorModeUnlocked && (
          <div className="bg-purple-500 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <Crown className="w-3 h-3" /> TUTOR
          </div>
        )}
      </div>

      <div className="flex justify-center items-center h-48 relative">
        <div
          className={`text-9xl transition-all duration-500 ${
            stage.effect === 'bounce' ? 'animate-bounce' : ''
          } ${stage.effect === 'pulse' ? 'animate-pulse' : ''} ${
            stage.effect === 'glow' ? 'drop-shadow-2xl' : ''
          }`}
          style={{ transform: `scale(${stage.scale})` }}
        >
          {currentEmoji}
        </div>

        {evolutionData.accessories.map((accessoryId, index) => {
          const accessory = ACCESSORIES[accessoryId as keyof typeof ACCESSORIES];
          if (!accessory) return null;

          const positions = [
            'top-10 right-10',
            'top-16 left-10',
            'bottom-10 left-8',
            'top-4'
          ];

          return (
            <div
              key={accessoryId}
              className={`absolute text-3xl ${positions[index] || 'top-8 right-8'} animate-bounce`}
            >
              {accessory.emoji}
            </div>
          );
        })}

        {isLevelUp && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-6xl animate-bounce">✨ LEVEL UP! ✨</div>
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-white/80 mb-1">
          <span>EXP</span>
          <span>{Math.floor(progress * 100)}%</span>
        </div>
        <div className="w-full bg-black/30 h-3 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-yellow-400 to-yellow-600 h-full transition-all duration-1000"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="text-xs text-white/60 mt-1 text-center">
          다음 레벨까지 {100 - (evolutionData.xp % 100)} XP 필요
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 text-center">
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-xs text-white/60">총 공부</div>
          <div className="text-sm font-bold text-white">{Math.floor(evolutionData.totalStudyTime / 60)}분</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-xs text-white/60">집중도</div>
          <div className="text-sm font-bold text-white">{Math.round(evolutionData.focusScore)}%</div>
        </div>
        <div className="bg-black/20 rounded-lg p-2">
          <div className="text-xs text-white/60">XP</div>
          <div className="text-sm font-bold text-yellow-400">{evolutionData.xp}</div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <button
          onClick={handleFeed}
          disabled={!canFeedNow}
          className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
            canFeedNow
              ? 'bg-white/10 hover:bg-white/20'
              : 'bg-black/20 opacity-50 cursor-not-allowed'
          }`}
        >
          <Gift className="w-5 h-5 text-pink-300" />
          <span className="text-[10px] text-white">간식 주기</span>
        </button>
        <button className="bg-white/10 hover:bg-white/20 p-2 rounded-xl flex flex-col items-center gap-1">
          <Sparkles className="w-5 h-5 text-cyan-300" />
          <span className="text-[10px] text-white">꾸미기</span>
        </button>
        <button
          className={`p-2 rounded-xl flex flex-col items-center gap-1 ${
            evolutionData.tutorModeUnlocked
              ? 'bg-purple-500/20 border border-purple-500/50'
              : 'bg-black/20 opacity-50 cursor-not-allowed'
          }`}
        >
          <GraduationCap
            className={`w-5 h-5 ${
              evolutionData.tutorModeUnlocked ? 'text-purple-300' : 'text-gray-400'
            }`}
          />
          <span className="text-[10px] text-white">튜터 모드</span>
        </button>
      </div>
    </div>
  );
}
