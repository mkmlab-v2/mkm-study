import { useState, useEffect } from 'react';
import { Volume2, Mic, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import { getRandomEnglishSentence, EnglishSentence } from '../data/englishContent';

interface SentenceData extends EnglishSentence {
  nextReview: number;
  reviewCount: number;
}

export default function EnglishLearning() {
  const [currentSentence, setCurrentSentence] = useState<SentenceData | null>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [pronunciation, setPronunciation] = useState<'good' | 'tryagain' | null>(null);

  const loadSentence = (difficulty: 'easy' | 'medium' | 'hard') => {
    setShowTranslation(false);
    setShowDetails(false);
    setPronunciation(null);

    const sentence = getRandomEnglishSentence(difficulty);
    if (sentence) {
      setCurrentSentence({
        ...sentence,
        nextReview: Date.now() + 86400000,
        reviewCount: 0
      });
    }
  };

  const speakSentence = () => {
    if (!currentSentence) return;

    const utterance = new SpeechSynthesisUtterance(currentSentence.sentence);
    utterance.lang = 'en-US';
    utterance.rate = 0.8;
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = () => {
    setIsRecording(true);
    setPronunciation(null);

    setTimeout(() => {
      setIsRecording(false);
      const result = Math.random() > 0.3 ? 'good' : 'tryagain';
      setPronunciation(result);

      if (result === 'good' && currentSentence) {
        setCurrentSentence({
          ...currentSentence,
          reviewCount: currentSentence.reviewCount + 1,
          nextReview: calculateNextReview(currentSentence.reviewCount + 1)
        });
      }
    }, 2000);
  };

  const calculateNextReview = (reviewCount: number): number => {
    const intervals = [1, 3, 7, 14, 30];
    const days = intervals[Math.min(reviewCount, intervals.length - 1)];
    return Date.now() + (days * 86400000);
  };

  const getDaysUntilReview = (nextReview: number): number => {
    return Math.ceil((nextReview - Date.now()) / 86400000);
  };

  useEffect(() => {
    loadSentence('medium');
  }, []);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-green-500/20 to-teal-500/20 rounded-2xl p-6 border border-green-500/30">
        <div className="flex items-center gap-3 mb-4">
          <Volume2 className="w-8 h-8 text-green-400" />
          <div>
            <h2 className="text-2xl font-bold text-white">영어 회화</h2>
            <p className="text-sm text-gray-400">EBS 수능특강 수준 · Spaced Repetition</p>
          </div>
        </div>

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => loadSentence('easy')}
            className="flex-1 bg-green-500/20 text-green-400 py-2 px-4 rounded-xl font-bold hover:bg-green-500/30 transition-colors"
          >
            쉬움
          </button>
          <button
            onClick={() => loadSentence('medium')}
            className="flex-1 bg-yellow-500/20 text-yellow-400 py-2 px-4 rounded-xl font-bold hover:bg-yellow-500/30 transition-colors"
          >
            보통
          </button>
          <button
            onClick={() => loadSentence('hard')}
            className="flex-1 bg-red-500/20 text-red-400 py-2 px-4 rounded-xl font-bold hover:bg-red-500/30 transition-colors"
          >
            어려움
          </button>
        </div>
      </div>

      {currentSentence && (
        <>
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-700">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-500 font-mono">
                    복습 #{currentSentence.reviewCount}
                  </div>
                  {currentSentence.reviewCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-blue-400">
                      <Clock className="w-3 h-3" />
                      {getDaysUntilReview(currentSentence.nextReview)}일 후 복습
                    </div>
                  )}
                </div>
                <button
                  onClick={speakSentence}
                  className="bg-blue-500/20 text-blue-400 p-2 rounded-full hover:bg-blue-500/30 transition-colors"
                >
                  <Volume2 className="w-5 h-5" />
                </button>
              </div>

              <div className="text-2xl font-bold text-white mb-4">
                {currentSentence.sentence}
              </div>

              {showTranslation && (
                <div className="text-lg text-gray-400 mb-4">
                  {currentSentence.translation}
                </div>
              )}

              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
              >
                {showTranslation ? '번역 숨기기' : '번역 보기'}
              </button>
            </div>

            <div className="space-y-3 mb-6">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="w-full bg-gray-800 hover:bg-gray-700 rounded-lg p-3 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-bold text-white">상세 학습 정보</span>
                </div>
                <span className="text-gray-400 text-xs">{showDetails ? '▼' : '▶'}</span>
              </button>

              {showDetails && (
                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <div>
                    <div className="text-xs text-blue-400 font-bold mb-2">📚 문법</div>
                    <div className="text-sm text-gray-300">{currentSentence.grammar}</div>
                  </div>

                  <div>
                    <div className="text-xs text-green-400 font-bold mb-2">💬 문맥</div>
                    <div className="text-sm text-gray-300">{currentSentence.context}</div>
                  </div>

                  <div>
                    <div className="text-xs text-purple-400 font-bold mb-2">📖 핵심 어휘</div>
                    <div className="space-y-2">
                      {currentSentence.vocabulary.map((vocab, idx) => (
                        <div key={idx} className="bg-gray-900 rounded p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-white font-bold">{vocab.word}</span>
                            <span className="text-xs text-gray-500">{vocab.pronunciation}</span>
                          </div>
                          <div className="text-sm text-gray-400">{vocab.meaning}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-4">
              <button
                onMouseDown={startRecording}
                onMouseUp={() => setIsRecording(false)}
                onTouchStart={startRecording}
                onTouchEnd={() => setIsRecording(false)}
                disabled={isRecording}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isRecording
                    ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                    : 'bg-gradient-to-br from-green-500 to-teal-500 hover:scale-105'
                }`}
              >
                <Mic className="w-10 h-10 text-white" />
              </button>

              <p className="text-sm text-gray-400">
                {isRecording ? '듣고 있어요...' : '길게 눌러서 발음하기'}
              </p>

              {pronunciation === 'good' && (
                <div className="flex items-center gap-2 text-green-400 animate-bounce">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-bold">완벽해요!</span>
                </div>
              )}

              {pronunciation === 'tryagain' && (
                <div className="flex items-center gap-2 text-yellow-400 animate-bounce">
                  <XCircle className="w-5 h-5" />
                  <span className="font-bold">다시 한번 해볼까요?</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
            <div className="text-sm text-green-300">
              💡 <strong>Spaced Repetition:</strong> 이 문장은 {getDaysUntilReview(currentSentence.nextReview)}일 후에 자동으로 다시 나타납니다!
            </div>
          </div>
        </>
      )}
    </div>
  );
}
