import { useState, useEffect, useRef } from 'react';
import { BookOpen, MessageCircle, HelpCircle, BarChart3, Mic } from 'lucide-react';
import ZodiacEvolution from './ZodiacEvolution';
import CharacterSelection from './CharacterSelection';
import UserProfileForm, { UserProfile } from './UserProfileForm';
import FourDVectorDashboard from './FourDVectorDashboard';
import RewardShop from './RewardShop';
import MathLearning from './MathLearning';
import EnglishLearning from './EnglishLearning';
import CurriculumLearning from './CurriculumLearning';
import RPPGVideoFeed from './RPPGVideoFeed';
import { Vector4D, ZodiacAnimal, CharacterTrait, CoinBalance } from '../utils/types';
import type { RPPGResult } from '../utils/rppgProcessor';
import { createInitialEvolutionData, saveEvolutionData } from '../utils/evolutionEngine';
import { loadCoinBalance, saveCoinBalance, earnCoins, spendCoins, calculateCoinsFromStudy } from '../utils/coinSystem';
import { addConversationMessage, endConversationSession, getConversationStats } from '../utils/conversationMemory';
import { answerQuestion, answerQuestionStreaming } from '../utils/api';
import { getTutorPersona, type BioCognitiveType } from '../utils/personaMatcher';
import { analyzeConfidence, extractVoiceIndicatorsFromTranscript } from '../utils/metaCognitionAnalyzer';

type TabType = 'math' | 'english' | 'question' | 'dashboard';

export default function MKMStudyApp() {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hasProfile, setHasProfile] = useState(false);
  const [hasCharacter, setHasCharacter] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
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
  const [isProcessing, setIsProcessing] = useState(false); // AI 응답 생성 중
  const [postureWarning, setPostureWarning] = useState(false);
  const [drowsinessAlert, setDrowsinessAlert] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [rppgState, setRppgState] = useState<RPPGResult | undefined>(undefined);
  const [confidenceAnalysis, setConfidenceAnalysis] = useState<ReturnType<typeof analyzeConfidence> | null>(null);
  const [speechStartTime, setSpeechStartTime] = useState<number | null>(null);
  const [tutorPersona, setTutorPersona] = useState<ReturnType<typeof getTutorPersona> | null>(null);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const currentTabRef = useRef<TabType>('dashboard');
  const currentStateRef = useRef<Vector4D>(currentState);

  // 타이머는 별도 useEffect로 분리
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 사용자 프로필 확인
    const savedProfile = localStorage.getItem('user-profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile) as UserProfile;
        setUserProfile(profile);
        setHasProfile(true);
        
        // 페르소나 설정
        const persona = getTutorPersona(profile.constitution as BioCognitiveType | undefined);
        setTutorPersona(persona);
      } catch (e) {
        console.error('[프로필 로드 실패]', e);
      }
    }

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
      console.error('[음성 인식] Web Speech API를 사용할 수 없습니다. Chrome 또는 Edge 브라우저를 사용해주세요.');
      // 사용자에게 알림
      if (currentTab === 'question') {
        alert('이 브라우저는 음성 인식을 지원하지 않습니다. Chrome 또는 Edge 브라우저를 사용해주세요.');
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true; // 중간 결과도 받기 (머뭇거림 감지용)
    recognition.lang = 'ko-KR';

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      const endTime = Date.now();
      const duration = speechStartTime ? (endTime - speechStartTime) / 1000 : 0; // 초 단위
      
      // 중간 결과 수집 (머뭇거림 감지용)
      const interimResults: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          interimResults.push(event.results[i][0].transcript);
        }
      }
      
      transcriptRef.current = transcript;
      setQuestion(transcript);
      setIsListening(false);
      setIsMicActive(false);
      setSpeechStartTime(null);
      
      // 음성 기반 메타인지 확신도 분석
      if (transcript && transcript.trim()) {
        const voiceIndicators = extractVoiceIndicatorsFromTranscript(transcript, duration, interimResults);
        const analysis = analyzeConfidence(
          voiceIndicators.jitter,
          voiceIndicators.shimmer,
          voiceIndicators.pitchVariability,
          voiceIndicators.pauseCount,
          voiceIndicators.speechRate
        );
        setConfidenceAnalysis(analysis);
        
        // 확신도가 낮으면 경고 표시
        if (analysis.confidence < 0.5) {
          console.log('[메타인지 분석] 확신도 낮음:', analysis);
        }
      }
      
      // 음성 인식 완료 후 즉시 답변 요청 (스트리밍 모드)
      if (transcript && transcript.trim()) {
        setAnswer('');
        setIsProcessing(true); // 처리 중 상태 표시
        
        try {
          console.log('[음성 인식] 질문:', transcript);
          // ref에서 최신 currentTab 값 사용 (클로저 문제 해결)
          const latestTab = currentTabRef.current;
          const subject = latestTab === 'math' ? 'math' : 
                          latestTab === 'english' ? 'english' : 
                          undefined;
          
          // ref에서 최신 currentState 값 사용
          const latestState = currentStateRef.current;
          
          console.log('[음성 인식] 스트리밍 API 호출 시작:', { transcript: transcript.trim(), subject, latestState });
          
          // 사용자 질문을 대화 메모리에 저장 (4D 증류)
          await addConversationMessage(
            'user',
            transcript.trim(),
            {
              tab: latestTab,
              subject,
              confidence: confidenceAnalysis?.confidence,
              emotion: rppgState ? (rppgState.stress > 0.5 ? 'stressed' : 'calm') : undefined
            },
            {
              rppgState,
              currentState: latestState,
              tutorPersona: tutorPersona || undefined
            }
          );
          
          // 스트리밍 응답 처리
          let fullAnswer = '';
          for await (const chunk of answerQuestionStreaming(transcript.trim(), latestState, subject)) {
            fullAnswer += chunk;
            setAnswer(fullAnswer); // 실시간으로 답변 업데이트
          }
          
          console.log('[Gemma3 Streaming] 답변 완료:', fullAnswer.substring(0, 100) + '...');
          
          if (!fullAnswer || fullAnswer.trim().length === 0) {
            console.error('[Gemma3 Streaming] 빈 응답 수신');
            setAnswer('죄송합니다. 답변을 생성하지 못했습니다. VPS Gemma3 서버 연결을 확인해주세요.');
          } else {
            // AI 답변을 대화 메모리에 저장 (4D 증류)
            await addConversationMessage(
              'assistant',
              fullAnswer,
              {
                tab: latestTab,
                subject
              },
              {
                rppgState,
                currentState: latestState,
                tutorPersona: tutorPersona || undefined
              }
            );
          }
        } catch (error) {
          console.error('[답변 생성 실패]', error);
          setAnswer('죄송합니다. 답변을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
        } finally {
          setIsProcessing(false);
        }
      }
    };

    recognition.onerror = (event: any) => {
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

  // 사용자 프로필이 없으면 프로필 입력 폼 표시
  if (!hasProfile) {
    return (
      <UserProfileForm
        onComplete={(profile) => {
          setUserProfile(profile);
          setHasProfile(true);
          localStorage.setItem('user-profile', JSON.stringify(profile));
        }}
      />
    );
  }

  // 캐릭터가 없으면 캐릭터 선택 화면 표시
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
                  // RPPG 상태 저장 (CurriculumLearning에 전달용)
                  setRppgState(result);
                  
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

        {currentTab === 'math' && (
          <CurriculumLearning subject="math" currentState={currentState} />
        )}

        {currentTab === 'english' && (
          <CurriculumLearning subject="english" currentState={currentState} />
        )}

        {currentTab === 'question' && (
          <div className="space-y-4 pb-24">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-5 border border-purple-500/30">
              <h2 className="text-xl font-bold mb-2 text-white">AI 질문 답변</h2>
              <p className="text-xs text-gray-400 mb-3">
                마이크 버튼을 길게 눌러 질문하세요!
              </p>
              <div className="bg-gray-800/50 rounded-xl p-3 text-xs text-gray-300">
                💡 Tip: {(() => {
                  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
                  if (isProduction) {
                    return 'VPS Gemma3 AI가 현재 4D 벡터 상태를 고려하여 답변합니다.';
                  } else {
                    return '로컬 Ollama(athena-merged-v1) 우선 사용, 실패 시 VPS Gemma3로 자동 전환됩니다.';
                  }
                })()}
              </div>
              {(() => {
                const stats = getConversationStats();
                if (stats.totalMessages > 0) {
                  return (
                    <div className="mt-2 bg-blue-500/10 rounded-xl p-2 text-xs text-blue-300 border border-blue-500/30">
                      🧠 대화 메모리: {stats.totalMessages}개 메시지 저장됨 (온디바이스 4D 증류)
                    </div>
                  );
                }
                return null;
              })()}
              {tutorPersona && (
                <div className="mt-3 bg-blue-500/10 rounded-xl p-3 text-xs text-blue-300 border border-blue-500/30">
                  🎭 튜터 페르소나: <span className="font-bold">{tutorPersona.name}</span> - {tutorPersona.personality}
                </div>
              )}
            </div>

            {question && (
              <div className="bg-gray-900/40 rounded-2xl p-5 border border-gray-800/50 space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                    <div className="text-xs text-gray-400 font-medium">질문</div>
                  </div>
                  <div className="text-white font-bold text-base leading-relaxed">{question}</div>
                </div>
                
                {/* 메타인지 확신도 분석 결과 */}
                {confidenceAnalysis && (
                  <div className={`rounded-xl p-3 border-2 ${
                    confidenceAnalysis.confidence >= 0.7 
                      ? 'bg-green-500/10 border-green-500/50' 
                      : confidenceAnalysis.confidence >= 0.5
                      ? 'bg-yellow-500/10 border-yellow-500/50'
                      : 'bg-red-500/10 border-red-500/50'
                  }`}>
                    <div className="text-xs font-medium text-white mb-1">
                      🧠 메타인지 분석
                    </div>
                    <div className={`text-xs ${
                      confidenceAnalysis.confidence >= 0.7 
                        ? 'text-green-300' 
                        : confidenceAnalysis.confidence >= 0.5
                        ? 'text-yellow-300'
                        : 'text-red-300'
                    }`}>
                      {confidenceAnalysis.recommendation}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      확신도: {(confidenceAnalysis.confidence * 100).toFixed(0)}% | 
                      불확실성: {(confidenceAnalysis.uncertainty * 100).toFixed(0)}%
                    </div>
                  </div>
                )}
                
                {answer ? (
                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <div className="text-xs text-green-400 font-medium">
                        {isProcessing ? 'AI 답변 생성 중...' : 'AI 답변'}
                      </div>
                    </div>
                    <div className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">
                      {answer}
                      {isProcessing && (
                        <span className="inline-block w-2 h-4 bg-blue-400 ml-1 animate-pulse" />
                      )}
                    </div>
                  </div>
                ) : isProcessing ? (
                  <div className="pt-4 border-t border-gray-700/50">
                    <div className="flex items-center justify-center gap-3 text-blue-400 py-4">
                      <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      <span className="text-sm font-medium">답변 생성 중...</span>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* 마이크 버튼: 질문 탭 내부 중앙 배치 */}
            <div className="flex flex-col items-center justify-center py-8">
              {!recognitionRef.current && (
                <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-center">
                  <p className="text-yellow-300 text-sm">
                    ⚠️ 음성 인식을 사용할 수 없습니다. Chrome 또는 Edge 브라우저를 사용해주세요.
                  </p>
                </div>
              )}
              <button
                disabled={!recognitionRef.current}
                onMouseDown={() => {
                  if (!recognitionRef.current) {
                    alert('음성 인식을 사용할 수 없습니다. Chrome 또는 Edge 브라우저를 사용해주세요.');
                    return;
                  }
                  if (currentTab === 'question') {
                    transcriptRef.current = '';
                    setIsMicActive(true);
                    setIsListening(true);
                    setQuestion('');
                    setAnswer('');
                    setConfidenceAnalysis(null);
                    setSpeechStartTime(Date.now()); // 음성 인식 시작 시간 기록
                    try {
                      recognitionRef.current.start();
                    } catch (err) {
                      console.error('[음성 인식 시작 실패]', err);
                      setIsMicActive(false);
                      setIsListening(false);
                      setSpeechStartTime(null);
                      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                      if (errorMsg.includes('not-allowed') || errorMsg.includes('Permission denied')) {
                        alert('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
                      } else {
                        alert(`음성 인식을 시작할 수 없습니다: ${errorMsg}`);
                      }
                    }
                  }
                }}
                onMouseUp={() => {
                  if (recognitionRef.current && isListening) {
                    recognitionRef.current.stop();
                  }
                  setIsMicActive(false);
                  setIsListening(false);
                }}
                onTouchStart={() => {
                  if (!recognitionRef.current) {
                    alert('음성 인식을 사용할 수 없습니다. Chrome 또는 Edge 브라우저를 사용해주세요.');
                    return;
                  }
                  if (currentTab === 'question') {
                    transcriptRef.current = '';
                    setIsMicActive(true);
                    setIsListening(true);
                    setQuestion('');
                    setAnswer('');
                    setConfidenceAnalysis(null);
                    setSpeechStartTime(Date.now()); // 음성 인식 시작 시간 기록
                    try {
                      recognitionRef.current.start();
                    } catch (err) {
                      console.error('[음성 인식 시작 실패]', err);
                      setIsMicActive(false);
                      setIsListening(false);
                      setSpeechStartTime(null);
                      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
                      if (errorMsg.includes('not-allowed') || errorMsg.includes('Permission denied')) {
                        alert('마이크 권한이 거부되었습니다. 브라우저 설정에서 마이크 권한을 허용해주세요.');
                      } else {
                        alert(`음성 인식을 시작할 수 없습니다: ${errorMsg}`);
                      }
                    }
                  }
                }}
                onTouchEnd={() => {
                  if (recognitionRef.current && isListening) {
                    recognitionRef.current.stop();
                  }
                  setIsMicActive(false);
                  setIsListening(false);
                }}
                className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                  !recognitionRef.current
                    ? 'bg-gray-600 cursor-not-allowed opacity-50'
                    : isMicActive || isListening
                    ? 'bg-red-500 scale-110 shadow-red-500/50'
                    : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:scale-105 hover:shadow-blue-500/50'
                }`}
              >
                <Mic className={`w-12 h-12 text-white ${isMicActive || isListening ? 'animate-pulse' : ''}`} />
                {(isMicActive || isListening) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-ping"></span>
                )}
              </button>
              <p className={`text-center text-sm mt-4 font-medium transition-colors ${
                isMicActive || isListening ? 'text-red-400' : 'text-gray-400'
              }`}>
                {isMicActive || isListening ? '🎤 듣고 있어요...' : '길게 눌러서 질문하기'}
              </p>
              {!question && !answer && (
                <p className="text-center text-xs text-gray-500 mt-2">
                  예: "이차방정식이 뭐야?", "영어 문법 설명해줘"
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/95 backdrop-blur-lg border-t border-gray-800">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => setCurrentTab('math')}
              className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                currentTab === 'math'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <BookOpen className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">수학</span>
            </button>
            <button
              onClick={() => setCurrentTab('english')}
              className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                currentTab === 'english'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <MessageCircle className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">영어</span>
            </button>
            <button
              onClick={() => setCurrentTab('question')}
              className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                currentTab === 'question'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <HelpCircle className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">질문</span>
            </button>
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`flex flex-col items-center py-3 rounded-xl transition-all ${
                currentTab === 'dashboard'
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/50'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              }`}
            >
              <BarChart3 className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">대시보드</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
