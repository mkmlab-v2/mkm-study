import { useEffect, useRef, useState } from 'react';
import { MessageSquare, Loader2 } from 'lucide-react';

interface SpeechRecognitionProps {
  isActive: boolean;
  onTranscript?: (text: string, isFinal: boolean) => void;
  onAnalysis?: (analysis: SpeechAnalysis) => void;
}

export interface SpeechAnalysis {
  wordCount: number;
  logicalWords: number;
  emotionalWords: number;
  technicalWords: number;
  sentiment: 'positive' | 'neutral' | 'negative';
}

const LOGICAL_WORDS = ['왜냐하면', '따라서', '그러므로', '그래서', '때문에', '이유는', '결론', '결과'];
const EMOTIONAL_WORDS = ['좋다', '재밌다', '어렵다', '힘들다', '싫다', '좋아', '재밌어', '어려워'];
const TECHNICAL_WORDS = ['함수', '변수', '알고리즘', '공식', '정리', '증명', '계산', '미분', '적분'];

export default function SpeechRecognition({ isActive, onTranscript, onAnalysis }: SpeechRecognitionProps) {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'ko-KR';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        const newTranscript = transcript + finalTranscript;
        setTranscript(newTranscript);
        onTranscript?.(finalTranscript.trim(), true);
        analyzeText(newTranscript);
      }

      if (interimTranscript) {
        setInterimText(interimTranscript);
        onTranscript?.(interimTranscript, false);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        recognition.stop();
        if (isActive) {
          setTimeout(() => recognition.start(), 1000);
        }
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (isActive) {
        try {
          recognition.start();
        } catch (err) {
          console.error('Failed to restart recognition:', err);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    if (!recognitionRef.current) return;

    if (isActive) {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    } else {
      recognitionRef.current.stop();
      setTranscript('');
      setInterimText('');
    }
  }, [isActive]);

  const analyzeText = (text: string) => {
    const words = text.split(/\s+/);
    const wordCount = words.length;

    let logicalWords = 0;
    let emotionalWords = 0;
    let technicalWords = 0;

    const lowerText = text.toLowerCase();

    LOGICAL_WORDS.forEach(word => {
      if (lowerText.includes(word)) logicalWords++;
    });

    EMOTIONAL_WORDS.forEach(word => {
      if (lowerText.includes(word)) emotionalWords++;
    });

    TECHNICAL_WORDS.forEach(word => {
      if (lowerText.includes(word)) technicalWords++;
    });

    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
    if (lowerText.match(/좋다|재밌다|좋아|재밌어|이해/)) {
      sentiment = 'positive';
    } else if (lowerText.match(/어렵다|힘들다|싫다|모르겠/)) {
      sentiment = 'negative';
    }

    const analysis: SpeechAnalysis = {
      wordCount,
      logicalWords,
      emotionalWords,
      technicalWords,
      sentiment
    };

    onAnalysis?.(analysis);
  };

  return (
    <div className="backdrop-blur-xl bg-gray-900/40 rounded-3xl p-6 border border-gray-800/50 shadow-2xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold text-white">음성 인식</h3>
        </div>

        {isListening && (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
            <span className="text-purple-400 text-xs">인식 중...</span>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="min-h-[120px] max-h-[200px] overflow-y-auto bg-gray-900/50 rounded-xl p-4 border border-gray-700/50">
          {transcript || interimText ? (
            <div className="space-y-2">
              {transcript && (
                <p className="text-white text-sm leading-relaxed">{transcript}</p>
              )}
              {interimText && (
                <p className="text-gray-400 text-sm italic">{interimText}</p>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-sm">
                {isActive ? '말씀해주세요...' : '세션을 시작하면 음성이 인식됩니다'}
              </p>
            </div>
          )}
        </div>

        {transcript && (
          <div className="grid grid-cols-3 gap-2">
            <div className="backdrop-blur-sm bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
              <div className="text-gray-400 text-xs mb-1">단어 수</div>
              <div className="text-white text-lg font-bold">
                {transcript.split(/\s+/).filter(w => w).length}
              </div>
            </div>
            <div className="backdrop-blur-sm bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
              <div className="text-gray-400 text-xs mb-1">논리성</div>
              <div className="text-blue-400 text-lg font-bold">
                {LOGICAL_WORDS.filter(w => transcript.includes(w)).length}
              </div>
            </div>
            <div className="backdrop-blur-sm bg-gray-800/50 rounded-lg p-2 border border-gray-700/50">
              <div className="text-gray-400 text-xs mb-1">전문용어</div>
              <div className="text-green-400 text-lg font-bold">
                {TECHNICAL_WORDS.filter(w => transcript.includes(w)).length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
