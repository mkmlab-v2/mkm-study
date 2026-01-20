import { useState, useEffect, useRef } from 'react';
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
  const [focusScore] = useState(75);
  const [coinBalance, setCoinBalance] = useState<CoinBalance>(loadCoinBalance());
  const [currentState, setCurrentState] = useState<Vector4D>({
    S: 0.5,
    L: 0.6,
    K: 0.55,
    M: 0.65
  });
  const [isMicActive, setIsMicActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [postureWarning, setPostureWarning] = useState(false);
  const [drowsinessAlert, setDrowsinessAlert] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const currentTabRef = useRef<TabType>('dashboard');
  const currentStateRef = useRef<Vector4D>(currentState);

  // 타이머는 별도 useEffect로 분리
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const saved = localStorage.getItem('zodiac-evolution');
    if (saved) {
      setHasCharacter(true);
    }

    return () => {
      clearInterval(timer);
    };
  }, []);

  // currentTab과 currentState를 ref에 동기화 (음성 인식 핸들러에서 최신 값 참조)
  useEffect(() => {
    currentTabRef.current = currentTab;
  }, [currentTab]);

  useEffect(() => {
    currentStateRef.current = currentState;
  }, [currentState]);

  // Web Speech API 초기화 (한 번만 실행)
  useEffect(() => {
    // Web Speech API 초기화
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('[음성 인식] Web Speech API를 사용할 수 없습니다.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'ko-KR';

    recognition.onresult = async (event: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:57',message:'onresult 호출됨',data:{resultsLength:event.results?.length,firstResult:event.results?.[0]?.[0]?.transcript?.substring(0,50)},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      const transcript = event.results[0][0].transcript;
      transcriptRef.current = transcript;
      setQuestion(transcript);
      setIsListening(false);
      setIsMicActive(false);
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:65',message:'transcript 추출 완료',data:{transcript:transcript?.substring(0,50),trimmed:transcript?.trim()?.substring(0,50),isEmpty:!transcript?.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      // 음성 인식 완료 후 즉시 답변 요청
      if (transcript && transcript.trim()) {
        setAnswer('');
        try {
          console.log('[음성 인식] 질문:', transcript);
          // ref에서 최신 currentTab 값 사용 (클로저 문제 해결)
          const latestTab = currentTabRef.current;
          const subject = latestTab === 'math' ? 'math' : 
                          latestTab === 'english' ? 'english' : 
                          undefined;
          
          // ref에서 최신 currentState 값 사용
          const latestState = currentStateRef.current;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:73',message:'answerQuestion 호출 전',data:{transcript:transcript.trim().substring(0,50),subject,currentTab:latestTab,vectorState:latestState},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          const response = await answerQuestion(transcript.trim(), latestState, subject);
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:75',message:'answerQuestion 응답 수신',data:{responseLength:response?.length,responsePreview:response?.substring(0,100),isEmpty:!response},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          console.log('[Gemma3] 답변 수신:', response);
          setAnswer(response);
        } catch (error) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:77',message:'answerQuestion 에러',data:{errorMessage:error instanceof Error?error.message:String(error),errorStack:error instanceof Error?error.stack:undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          
          console.error('[답변 생성 실패]', error);
          setAnswer('죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    };

    recognition.onerror = (event: any) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:83',message:'음성 인식 에러',data:{error:event.error,errorType:event.error},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      
      console.error('[음성 인식 에러]', event.error);
      setIsListening(false);
      setIsMicActive(false);
      if (event.error === 'no-speech') {
        setQuestion('');
        setAnswer('');
        alert('음성이 감지되지 않았습니다. 다시 시도해주세요.');
      } else if (event.error === 'not-allowed') {
        setQuestion('');
        setAnswer('');
        alert('마이크 권한이 허용되지 않았습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
      } else {
        setQuestion('');
        setAnswer('');
        console.error('[음성 인식 기타 에러]', event.error);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsMicActive(false);
      // 음성 인식이 끝났지만 결과가 없으면 (타임아웃 등)
      if (!transcriptRef.current && isMicActive) {
        console.log('[음성 인식] 결과 없음 (타임아웃 또는 음성 없음)');
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []); // 한 번만 초기화, ref를 통해 최신 값 참조

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
    <div className="min-h-screen bg-black text-white flex flex-col pb-24">
      <div className="flex-1 max-w-md mx-auto w-full px-4 py-6">
        {/* Header */}
        <header className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1 flex items-center justify-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-500" />
            MKM Study v2.0
          </h1>
          <p className="text-gray-400 text-xs">지능형 평형 학습 요새</p>
        </header>

        {/* Time Widget */}
        <div className="bg-gradient-to-br from-gray-900/60 to-gray-800/40 rounded-2xl p-6 mb-4 text-center border border-gray-700/50">
          <div className="text-5xl font-bold mb-2 tracking-tight">
            {formatTime(currentTime)}
          </div>
          <div className="text-gray-400 text-xs mb-3">
            {formatDate(currentTime)}
          </div>
          <div className="text-blue-400 italic text-xs">
            "{quote}"
          </div>
        </div>

        {/* Alerts */}
        {(postureWarning || drowsinessAlert) && (
          <div className="mb-4 bg-red-500/10 border-2 border-red-500/50 rounded-2xl p-5 text-center">
            <div className="text-4xl mb-3">⚠️</div>
            <h3 className="text-lg font-bold text-red-400 mb-2">
              {postureWarning ? '자세 경고!' : '졸음 감지!'}
            </h3>
            <p className="text-white text-sm mb-4">
              {postureWarning
                ? '목을 똑바로 세우고 어깨를 펴주세요. 잠시 휴식이 필요합니다.'
                : '졸음 수치가 높습니다. 5분 스트레칭을 권장합니다.'}
            </p>
            <button
              onClick={() => {
                setPostureWarning(false);
                setDrowsinessAlert(false);
              }}
              className="bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-red-600 transition-colors"
            >
              확인했어요
            </button>
          </div>
        )}

        {currentTab === 'dashboard' && (
          <div className="space-y-4">
            <ZodiacEvolution studyTime={studyTime} focusScore={focusScore} />
            <FourDVectorDashboard currentState={currentState} />
            <div className="bg-gray-900/40 rounded-2xl p-4 border border-gray-800/50">
              <h3 className="text-sm font-bold text-white mb-3">실시간 모니터링</h3>
              <RPPGVideoFeed
                onHeartRate={(result) => {
                  // 심박수 기반 M 차원 업데이트
                  if (result.heartRate) {
                    setCurrentState(prev => ({
                      ...prev,
                      M: Math.max(0.2, Math.min(0.8, result.heartRate / 100))
                    }));
                  }
                  // 졸음 감지
                  if (result.drowsiness && result.drowsiness > 80) {
                    setDrowsinessAlert(true);
                  } else {
                    setDrowsinessAlert(false);
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
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-purple-500/30">
              <h2 className="text-xl font-bold mb-2 text-white">질문 답변</h2>
              <p className="text-xs text-gray-400 mb-3">
                아래 마이크 버튼을 길게 눌러 질문하세요!
              </p>
              <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-300">
                💡 Tip: VPS Gemma3 AI가 현재 4D 벡터 상태를 고려하여 답변합니다.
              </div>
            </div>

            {question && (
              <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800/50">
                <div className="mb-4">
                  <div className="text-xs text-gray-400 mb-2">질문:</div>
                  <div className="text-white font-bold text-sm">{question}</div>
                </div>
                {answer ? (
                  <div>
                    <div className="text-xs text-blue-400 mb-2">답변:</div>
                    <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                      {answer}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs">답변 생성 중...</span>
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

          {/* 마이크 버튼: 질문 탭에서만 표시 (중복 방지) */}
          {currentTab === 'question' && (
            <>
              <div className="flex justify-center">
                <button
                  onMouseDown={() => {
                    // #region agent log
                    fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:363',message:'마이크 버튼 클릭 (마우스)',data:{hasRecognition:!!recognitionRef.current,currentTab,isQuestionTab:currentTab==='question'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                    // #endregion
                    
                    if (recognitionRef.current && currentTab === 'question') {
                      setIsMicActive(true);
                      setIsListening(true);
                      setAnswer('');
                      try {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:370',message:'recognition.start() 호출',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        
                        recognitionRef.current.start();
                      } catch (err) {
                        // #region agent log
                        fetch('http://127.0.0.1:7242/ingest/d6c29a92-7aaa-4c05-89b6-575ee18629a6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'MKMStudyApp.tsx:373',message:'recognition.start() 실패',data:{error:err instanceof Error?err.message:String(err)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
                        // #endregion
                        
                        console.error('Failed to start recognition:', err);
                        setIsMicActive(false);
                        setIsListening(false);
                      }
                    }
                  }}
                  onMouseUp={() => {
                    if (recognitionRef.current && isListening) {
                      recognitionRef.current.stop();
                    }
                    setIsMicActive(false);
                    setIsListening(false);
                    // 답변은 recognition.onresult에서 처리
                  }}
                  onTouchStart={() => {
                    if (recognitionRef.current && currentTab === 'question') {
                      transcriptRef.current = ''; // 이전 결과 초기화
                      setIsMicActive(true);
                      setIsListening(true);
                      setQuestion('');
                      setAnswer('');
                      try {
                        console.log('[음성 인식] 시작');
                        recognitionRef.current.start();
                      } catch (err) {
                        console.error('[음성 인식 시작 실패]', err);
                        setIsMicActive(false);
                        setIsListening(false);
                        alert('음성 인식을 시작할 수 없습니다. 브라우저가 Web Speech API를 지원하는지 확인해주세요.');
                      }
                    }
                  }}
                  onTouchEnd={() => {
                    if (recognitionRef.current && isListening) {
                      recognitionRef.current.stop();
                    }
                    setIsMicActive(false);
                    setIsListening(false);
                    // 답변은 recognition.onresult에서 처리
                  }}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                    isMicActive || isListening
                      ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:scale-105'
                  }`}
                >
                  <Mic className="w-10 h-10 text-white" />
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">
                {isMicActive || isListening ? '듣고 있어요...' : '길게 눌러서 질문하기'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
