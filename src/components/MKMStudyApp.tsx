import { useState, useEffect } from 'react';
import { BookOpen, MessageCircle, HelpCircle, BarChart3, Mic } from 'lucide-react';
import ZodiacEvolution from './ZodiacEvolution';
import CharacterSelection from './CharacterSelection';
import FourDVectorDashboard from './FourDVectorDashboard';
import RewardShop from './RewardShop';
import MathLearning from './MathLearning';
import EnglishLearning from './EnglishLearning';
import RPPGVideoFeed from './RPPGVideoFeed';
import { Vector4D, ZodiacAnimal, CharacterTrait, CoinBalance } from '../utils/types';
import { createInitialEvolutionData, saveEvolutionData } from '../utils/evolutionEngine';
import { loadCoinBalance, saveCoinBalance, earnCoins, spendCoins, calculateCoinsFromStudy } from '../utils/coinSystem';
import { answerQuestion } from '../utils/api';

type TabType = 'math' | 'english' | 'question' | 'dashboard';

export default function MKMStudyApp() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasCharacter, setHasCharacter] = useState(false);
  const [studyTime, setStudyTime] = useState(0);
  const [focusScore, setFocusScore] = useState(75);
  const [coinBalance, setCoinBalance] = useState<CoinBalance>(loadCoinBalance());
  const [currentState, setCurrentState] = useState<Vector4D>({
    S: 0.5,
    L: 0.6,
    K: 0.55,
    M: 0.65
  });
  const [isMicActive, setIsMicActive] = useState(false);
  const [postureWarning, setPostureWarning] = useState(false);
  const [drowsinessAlert, setDrowsinessAlert] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const saved = localStorage.getItem('zodiac-evolution');
    if (saved) {
      setHasCharacter(true);
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStudyTime(prev => prev + 1);

      setCurrentState(prev => ({
        S: Math.max(0.2, Math.min(0.8, prev.S + (Math.random() - 0.5) * 0.05)),
        L: Math.max(0.2, Math.min(0.8, prev.L + (Math.random() - 0.5) * 0.05)),
        K: Math.max(0.2, Math.min(0.8, prev.K + (Math.random() - 0.5) * 0.05)),
        M: Math.max(0.2, Math.min(0.8, prev.M + (Math.random() - 0.5) * 0.05))
      }));

      if (studyTime > 0 && studyTime % 300 === 0) {
        const coins = calculateCoinsFromStudy(5, focusScore, 1);
        const updated = earnCoins(coinBalance, coins, '5분 학습 완료');
        setCoinBalance(updated);
        saveCoinBalance(updated);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [studyTime, focusScore, coinBalance]);

  const handleCharacterSelect = (zodiac: ZodiacAnimal, character: CharacterTrait) => {
    const evolutionData = createInitialEvolutionData(character.id, zodiac.id);
    saveEvolutionData(evolutionData);
    setHasCharacter(true);
  };

  const handlePurchase = (reward: any) => {
    const updated = spendCoins(coinBalance, reward.cost, reward.name);
    if (updated) {
      setCoinBalance(updated);
      saveCoinBalance(updated);
      alert(`${reward.name}을(를) 구매했습니다!`);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const motivationalQuotes = [
    "집중하면 못할 것이 없어요!",
    "오늘도 최선을 다하는 당신이 멋져요!",
    "천천히, 그러나 확실하게!",
    "지식은 힘이에요!",
    "꾸준함이 성공의 비결이에요!",
    "당신은 할 수 있어요!"
  ];

  const quote = motivationalQuotes[Math.floor(currentTime.getTime() / 60000) % motivationalQuotes.length];

  if (!hasCharacter) {
    return <CharacterSelection onSelect={handleCharacterSelect} />;
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-32">
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        <header className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            MKM Study v2.0
          </h1>
          <p className="text-gray-400 text-sm">지능형 평형 학습 요새</p>
        </header>

        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 mb-6 text-center border border-gray-700">
          <div className="text-6xl font-bold mb-3 tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-gray-400 text-sm mb-4">
            {formatDate(currentTime)}
          </div>
          <div className="text-blue-400 italic text-sm">
            "{quote}"
          </div>
        </div>

        {(postureWarning || drowsinessAlert) && (
          <div className="mb-6 bg-red-500/10 border-2 border-red-500 rounded-2xl p-6 text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold text-red-400 mb-2">
              {postureWarning ? '자세 경고!' : '졸음 감지!'}
            </h3>
            <p className="text-white mb-4">
              {postureWarning
                ? '목을 똑바로 세우고 어깨를 펴주세요. 잠시 휴식이 필요합니다.'
                : '졸음 수치가 높습니다. 5분 스트레칭을 권장합니다.'}
            </p>
            <button
              onClick={() => {
                setPostureWarning(false);
                setDrowsinessAlert(false);
              }}
              className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-600 transition-colors"
            >
              확인했어요
            </button>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <div className="space-y-6">
            <ZodiacEvolution studyTime={studyTime} focusScore={focusScore} />
            <FourDVectorDashboard currentState={currentState} />
            <div className="bg-gray-900 rounded-2xl p-4 border border-gray-700">
              <h3 className="text-sm font-bold text-white mb-3">실시간 모니터링</h3>
              <RPPGVideoFeed
                onHeartRateUpdate={(hr) => {
                  setCurrentState(prev => ({
                    ...prev,
                    M: Math.max(0.2, Math.min(0.8, hr / 100))
                  }));
                }}
                onPostureUpdate={(score) => {
                  if (score < 60) {
                    setPostureWarning(true);
                  }
                }}
              />
            </div>
            <RewardShop coinBalance={coinBalance} onPurchase={handlePurchase} />
          </div>
        )}

        {currentTab === 'math' && <MathLearning />}

        {currentTab === 'english' && <EnglishLearning />}

        {currentTab === 'question' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-6 border border-purple-500/30">
              <h2 className="text-2xl font-bold mb-2 text-white">질문 답변</h2>
              <p className="text-sm text-gray-400 mb-4">
                아래 마이크 버튼을 길게 눌러 질문하세요!
              </p>
              <div className="bg-gray-800 rounded-xl p-4 text-sm text-gray-300">
                💡 Tip: VPS Gemma3 AI가 현재 4D 벡터 상태를 고려하여 답변합니다.
              </div>
            </div>

            {question && (
              <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
                <div className="mb-4">
                  <div className="text-sm text-gray-400 mb-2">질문:</div>
                  <div className="text-white font-bold">{question}</div>
                </div>
                {answer ? (
                  <div>
                    <div className="text-sm text-blue-400 mb-2">답변:</div>
                    <div className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                      {answer}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    답변 생성 중...
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2 mb-4">
            <button
              onClick={() => setCurrentTab('math')}
              className={`flex flex-col items-center py-3 rounded-xl transition-colors ${
                currentTab === 'math'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">수학</span>
            </button>
            <button
              onClick={() => setCurrentTab('english')}
              className={`flex flex-col items-center py-3 rounded-xl transition-colors ${
                currentTab === 'english'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageCircle className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">영어</span>
            </button>
            <button
              onClick={() => setCurrentTab('question')}
              className={`flex flex-col items-center py-3 rounded-xl transition-colors ${
                currentTab === 'question'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <HelpCircle className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">질문</span>
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center py-3 rounded-xl transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">대시보드</span>
            </button>
          </div>

          <div className="flex justify-center">
            <button
              onMouseDown={async () => {
                setIsMicActive(true);
                if (currentTab === 'question') {
                  const mockQuestion = '이차함수의 개념을 설명해주세요';
                  setQuestion(mockQuestion);
                  setAnswer('');
                  const response = await answerQuestion(mockQuestion, currentState);
                  setAnswer(response);
                  setIsMicActive(false);
                }
              }}
              onMouseUp={() => setIsMicActive(false)}
              onTouchStart={async () => {
                setIsMicActive(true);
                if (currentTab === 'question') {
                  const mockQuestion = '이차함수의 개념을 설명해주세요';
                  setQuestion(mockQuestion);
                  setAnswer('');
                  const response = await answerQuestion(mockQuestion, currentState);
                  setAnswer(response);
                  setIsMicActive(false);
                }
              }}
              onTouchEnd={() => setIsMicActive(false)}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isMicActive
                  ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                  : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:scale-105'
              }`}
            >
              <Mic className="w-10 h-10 text-white" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-500 mt-2">
            {isMicActive ? '듣고 있어요...' : '길게 눌러서 질문하기'}
          </p>
        </div>
      </div>
    </div>
  );
}
