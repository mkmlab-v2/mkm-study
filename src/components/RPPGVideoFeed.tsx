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

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    const startCamera = async () => {
      if (!mounted) return;
      
      setIsLoading(true);
      setError(null);

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'user'
          },
          audio: false
        });

        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
          onStreamReady?.(stream);

          videoRef.current.onloadedmetadata = () => {
            if (!mounted || !videoRef.current) return;
            
            // 기존 프로세서 정리
            if (processorRef.current) {
              processorRef.current.stop();
            }
            
            processorRef.current = new RPPGProcessor(videoRef.current);
            processorRef.current.start((result) => {
              if (mounted) {
                setHeartRate(result);
                onHeartRate?.(result);
              }
            });
          };
        }
      } catch (err) {
        if (!mounted) return;
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to access camera';

        let userFriendlyError = 'Failed to access camera';
        if (errorMessage.includes('Permission denied')) {
          userFriendlyError = 'Camera permission denied. Please allow camera access.';
        } else if (errorMessage.includes('not found')) {
          userFriendlyError = 'No camera found. Please connect a camera.';
        } else if (errorMessage.includes('timeout')) {
          userFriendlyError = 'Camera connection timeout. Please try again.';
        }

        setError(userFriendlyError);
        onError?.(userFriendlyError);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (processorRef.current) {
        processorRef.current.stop();
        processorRef.current = null;
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
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
          <div className="flex flex-col items-center gap-3 text-center">
            <AlertCircle className="w-12 h-12 text-red-500" />
            <p className="text-white text-sm">{error}</p>
            <CameraOff className="w-8 h-8 text-gray-500 mt-2" />
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
