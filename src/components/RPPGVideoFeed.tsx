import { useEffect, useRef, useState } from 'react';
import { Camera, CameraOff, AlertCircle, Heart } from 'lucide-react';
import { RPPGProcessor, RPPGResult } from '../utils/rppgProcessor';

interface RPPGVideoFeedProps {
  onStreamReady?: (stream: MediaStream) => void;
  onError?: (error: string) => void;
  onHeartRate?: (result: RPPGResult) => void;
}

export default function RPPGVideoFeed({ onStreamReady, onError, onHeartRate }: RPPGVideoFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [heartRate, setHeartRate] = useState<RPPGResult | null>(null);
  const processorRef = useRef<RPPGProcessor | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    // mediaDevices API 지원 확인
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      const errorMsg = '이 브라우저는 카메라 접근을 지원하지 않습니다. Chrome, Edge, Firefox 최신 버전을 사용해주세요.';
      setError(errorMsg);
      setIsLoading(false);
      onError?.(errorMsg);
      return;
    }

    // 기존 스트림 정리
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    // 기존 프로세서 정리
    if (processorRef.current) {
      processorRef.current.stop();
      processorRef.current = null;
    }

    try {
      console.log('[카메라] 권한 요청 시작...');
      
      // 사용 가능한 카메라 목록 확인
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        console.log('[카메라] 사용 가능한 카메라:', videoDevices.length, '개');
        if (videoDevices.length === 0) {
          throw new Error('카메라를 찾을 수 없습니다.');
        }
      } catch (enumError) {
        console.warn('[카메라] 카메라 목록 확인 실패:', enumError);
        // 계속 진행 (권한이 없어도 시도)
      }

      // 모바일 환경 감지
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      console.log('[카메라] 환경:', isMobile ? '모바일' : '데스크톱');

      // 타임아웃을 위한 AbortController 사용 (모바일은 더 긴 타임아웃)
      const controller = new AbortController();
      const timeoutDuration = isMobile ? 30000 : 20000; // 모바일 30초, 데스크톱 20초
      const timeoutId = setTimeout(() => {
        console.warn('[카메라] 타임아웃 발생, 요청 취소');
        controller.abort();
      }, timeoutDuration);

      let stream: MediaStream;
      try {
        // 최소한의 설정으로 시도 (호환성 최대화)
        const constraints: MediaStreamConstraints = {
          video: isMobile 
            ? {
                // 모바일: facingMode만 지정
                facingMode: { ideal: 'user' }
              }
            : {
                // 데스크톱: 해상도 제한 없이 최소 설정
                width: { min: 160, ideal: 640, max: 1920 },
                height: { min: 120, ideal: 480, max: 1080 }
              },
          audio: false
        };

        console.log('[카메라] 제약 조건:', JSON.stringify(constraints, null, 2));
        
        stream = await navigator.mediaDevices.getUserMedia(constraints, {
          signal: controller.signal
        });
        clearTimeout(timeoutId);
      } catch (getUserMediaError) {
        clearTimeout(timeoutId);
        // 타임아웃이 아닌 다른 오류인 경우
        if (getUserMediaError instanceof Error && getUserMediaError.name === 'AbortError') {
          // 타임아웃으로 인한 취소
          throw new Error('카메라 시작 시간 초과. 카메라가 다른 프로그램에서 사용 중이거나 응답하지 않습니다.');
        }
        throw getUserMediaError;
      }

      console.log('[카메라] 권한 허용됨, 스트림 획득 성공');

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setHasPermission(true);
        onStreamReady?.(stream);

        videoRef.current.onloadedmetadata = () => {
          if (!videoRef.current) return;
          
          // 기존 프로세서 정리
          if (processorRef.current) {
            processorRef.current.stop();
          }
          
          processorRef.current = new RPPGProcessor(videoRef.current);
          processorRef.current.start((result) => {
            setHeartRate(result);
            onHeartRate?.(result);
          });
        };
      }
    } catch (err) {
      // 상세한 에러 로깅
      console.error('[카메라 접근 오류]', err);
      
      const errorMessage = err instanceof Error ? err.message : String(err);
      const errorName = err instanceof Error ? err.name : 'UnknownError';

      console.log('[카메라 오류 상세]', {
        name: errorName,
        message: errorMessage,
        fullError: err
      });

      let userFriendlyError = '카메라에 접근할 수 없습니다.';
      let helpText = '';

      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError') || errorName === 'NotAllowedError') {
        userFriendlyError = '카메라 권한이 거부되었습니다.';
        helpText = '브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭하여 카메라 권한을 허용해주세요.';
      } else if (errorMessage.includes('not found') || errorMessage.includes('NotFoundError') || errorName === 'NotFoundError') {
        userFriendlyError = '카메라를 찾을 수 없습니다.';
        helpText = '카메라가 연결되어 있는지 확인하고, 다른 프로그램에서 사용 중이 아닌지 확인해주세요.';
      } else if (errorMessage.includes('timeout') || errorName === 'TimeoutError' || errorName === 'AbortError' || errorMessage.includes('Timeout starting video source')) {
        userFriendlyError = '카메라 시작 시간 초과.';
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        if (isMobile) {
          helpText = '휴대폰 카메라가 응답하지 않습니다.\n\n해결 방법:\n1. 다른 앱에서 카메라를 사용 중인지 확인\n2. 카메라 앱을 열어서 정상 작동 확인\n3. 브라우저 앱 재시작\n4. 휴대폰 재시작';
        } else {
          helpText = 'PC 웹캠이 응답하지 않습니다.\n\n해결 방법:\n1. 다른 프로그램(Zoom, Teams, Skype 등) 종료\n2. 작업 관리자에서 카메라 프로세스 확인\n3. 웹캠 드라이버 업데이트\n4. PC 재시작\n\n💡 팁: 휴대폰으로 접속하면 더 안정적으로 작동할 수 있습니다.';
        }
      } else if (errorMessage.includes('NotReadableError') || errorName === 'NotReadableError') {
        userFriendlyError = '카메라가 다른 프로그램에서 사용 중입니다.';
        helpText = 'Zoom, Teams, Skype 등 다른 프로그램을 종료한 후 다시 시도해주세요.';
      } else if (errorMessage.includes('OverconstrainedError') || errorName === 'OverconstrainedError') {
        userFriendlyError = '카메라 설정을 지원하지 않습니다.';
        helpText = '다른 카메라를 선택하거나 브라우저를 업데이트해주세요.';
      } else {
        // 알 수 없는 오류
        userFriendlyError = `카메라 접근 오류: ${errorName}`;
        helpText = `오류 메시지: ${errorMessage}. 브라우저 콘솔(F12)에서 자세한 정보를 확인할 수 있습니다.`;
      }

      setError(userFriendlyError + (helpText ? `\n\n${helpText}` : ''));
      setHasPermission(false);
      onError?.(userFriendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    startCamera();

    return () => {
      if (processorRef.current) {
        processorRef.current.stop();
        processorRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []); // 의존성 배열 비움 (마운트 시 한 번만 실행)

  return (
    <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <Camera className="w-12 h-12 text-blue-500 animate-pulse" />
            <p className="text-white text-sm">Accessing camera...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 p-6">
          <div className="flex flex-col items-center gap-3 text-center max-w-md">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-white text-sm whitespace-pre-line leading-relaxed">{error}</p>
            <CameraOff className="w-8 h-8 text-gray-500 mt-2" />
            <div className="flex gap-2 mt-4">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                다시 시도
              </button>
              <button
                onClick={async () => {
                  // 브라우저 권한 설정 페이지로 안내
                  if (navigator.permissions) {
                    try {
                      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
                      console.log('[카메라 권한 상태]', result.state);
                      if (result.state === 'prompt' || result.state === 'denied') {
                        alert('브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭하여 카메라 권한을 허용해주세요.');
                      } else if (result.state === 'granted') {
                        // 권한은 있지만 타임아웃 발생한 경우
                        try {
                          const devices = await navigator.mediaDevices.enumerateDevices();
                          const videoDevices = devices.filter(device => device.kind === 'videoinput');
                          if (videoDevices.length === 0) {
                            alert('카메라를 찾을 수 없습니다. 카메라가 연결되어 있는지 확인해주세요.');
                          } else {
                            alert(`카메라 ${videoDevices.length}개가 감지되었습니다.\n\n타임아웃 오류는 보통 다음 원인입니다:\n1. 다른 프로그램에서 카메라 사용 중\n2. 카메라 드라이버 문제\n3. 카메라 하드웨어 문제\n\n다른 프로그램을 종료하고 다시 시도해주세요.`);
                          }
                        } catch (e) {
                          alert('카메라 목록을 확인할 수 없습니다. 다른 프로그램에서 카메라를 사용 중인지 확인해주세요.');
                        }
                      }
                    } catch (e) {
                      alert('브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭하여 카메라 권한을 허용해주세요.');
                    }
                  } else {
                    alert('브라우저 주소창 왼쪽 자물쇠 아이콘을 클릭하여 카메라 권한을 허용해주세요.');
                  }
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                권한 확인
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              💡 F12를 눌러 콘솔에서 자세한 오류 정보를 확인할 수 있습니다.
            </p>
          </div>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover ${!hasPermission ? 'hidden' : ''}`}
      />

      {hasPermission && (
        <>
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-500 text-white px-3 py-1 rounded-full text-sm">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            LIVE
          </div>

          {heartRate && (
            <div className="absolute top-4 right-4 backdrop-blur-xl bg-gray-900/80 border border-gray-700/50 rounded-xl p-3 shadow-xl">
              <div className="flex items-center gap-3">
                <Heart className={`w-6 h-6 ${heartRate.signalQuality === 'good' ? 'text-red-500' : 'text-yellow-500'} animate-pulse`} />
                <div>
                  <div className="text-2xl font-bold text-white tabular-nums">
                    {heartRate.heartRate}
                  </div>
                  <div className="text-xs text-gray-400">BPM</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  heartRate.signalQuality === 'good' ? 'bg-green-500' :
                  heartRate.signalQuality === 'fair' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`} />
                <span className="text-xs text-gray-400">
                  {heartRate.signalQuality === 'good' ? '신호 양호' :
                   heartRate.signalQuality === 'fair' ? '신호 보통' :
                   '신호 불량'}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
