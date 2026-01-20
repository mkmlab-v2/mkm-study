import { useState, useEffect } from 'react';
import { Heart, Activity, Camera, Shield, Play, Square } from 'lucide-react';
import RPPGVideoFeed from './RPPGVideoFeed';
import DigitalTimerWidget from './DigitalTimerWidget';
import FourDVectorDashboard from './FourDVectorDashboard';
import AudioCapture, { AudioMetrics } from './AudioCapture';
import SpeechRecognition, { SpeechAnalysis } from './SpeechRecognition';
import Card from './ui/Card';
import FlowCard from './ui/FlowCard';
import type { Vector4D } from '../utils/types';
import { biometricMapper, BiometricData } from '../utils/biometricMapper';
import { RPPGResult } from '../utils/rppgProcessor';

export default function StudyDashboard() {
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [currentState, setCurrentState] = useState<Vector4D>({
    S: 0.25,
    L: 0.25,
    K: 0.25,
    M: 0.25
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [biometricData, setBiometricData] = useState<BiometricData>({});
  const [healthScore, setHealthScore] = useState(85);
  
  // currentTime은 향후 UI에 표시 예정 (현재는 타이머만 작동)
  void currentTime;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isSessionActive) return;

    const interval = setInterval(() => {
      const newVector = biometricMapper.mapToVector4D(biometricData);
      setCurrentState(newVector);

      const assessment = biometricMapper.assessOverallHealth(newVector);
      setHealthScore(Math.round(assessment.score));
    }, 2000);

    return () => clearInterval(interval);
  }, [isSessionActive, biometricData]);

  const handleStartSession = () => {
    setIsSessionActive(true);
    setSessionStartTime(Date.now());
    setCameraError(null);
  };

  const handleStopSession = () => {
    setIsSessionActive(false);
    setSessionStartTime(null);
    setCurrentState({ S: 0.25, L: 0.25, K: 0.25, M: 0.25 });
  };

  const handleCameraError = (error: string) => {
    setCameraError(error);
  };

  const handleHeartRate = (result: RPPGResult) => {
    setBiometricData(prev => ({
      ...prev,
      heartRate: result.heartRate
    }));
  };

  const handleAudioData = (metrics: AudioMetrics) => {
    setBiometricData(prev => ({
      ...prev,
      audioMetrics: metrics
    }));
  };

  const handleSpeechAnalysis = (analysis: SpeechAnalysis) => {
    setBiometricData(prev => ({
      ...prev,
      speechAnalysis: analysis
    }));
  };


  return (
    <div className="min-h-screen bg-black text-white pb-24">
      <div className="max-w-md mx-auto w-full px-4 py-6 space-y-4">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold mb-1">학습 모니터링</h1>
          <p className="text-sm text-gray-400">실시간 생체 신호 분석</p>
        </div>

        {/* 4D Vector Dashboard */}
        <FourDVectorDashboard currentState={currentState} healthScore={healthScore} />

        {/* Session Control */}
        <FlowCard
          icon={isSessionActive ? Square : Play}
          title={isSessionActive ? '학습 세션 진행 중' : '학습 세션 시작'}
          description={isSessionActive ? '실시간 모니터링 활성화' : '시작 버튼을 눌러 학습을 시작하세요'}
          status={isSessionActive ? 'active' : 'pending'}
        >
          <div className="space-y-4">
            <DigitalTimerWidget
              isActive={isSessionActive}
              startTime={sessionStartTime}
              onStart={handleStartSession}
              onStop={handleStopSession}
            />
          </div>
        </FlowCard>

        {/* rPPG Monitor */}
        <Card icon={Camera} title="rPPG 모니터" subtitle="심박수 및 각성도 측정">
          {!isSessionActive ? (
            <div className="aspect-video bg-gray-800/50 rounded-2xl flex items-center justify-center border border-gray-700/50">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-xs">세션 시작 후 활성화됩니다</p>
              </div>
            </div>
          ) : (
            <>
              <RPPGVideoFeed
                onStreamReady={(stream) => console.log('Camera ready:', stream)}
                onError={handleCameraError}
                onHeartRate={handleHeartRate}
              />
              {cameraError && (
                <div className="mt-3 p-3 bg-red-900/30 border border-red-700/50 rounded-xl">
                  <p className="text-red-400 text-xs">{cameraError}</p>
                </div>
              )}
              <div className="mt-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <span className="text-gray-400">심박수</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-gray-400">각성도</span>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Audio & Speech */}
        {isSessionActive && (
          <div className="space-y-4">
            <Card icon={Activity} title="음성 분석" subtitle="발음 및 피로도 측정">
              <div className="space-y-4">
                <AudioCapture
                  isActive={isSessionActive}
                  onAudioData={handleAudioData}
                  onError={(error) => console.error('Audio error:', error)}
                />
                <SpeechRecognition
                  isActive={isSessionActive}
                  onTranscript={(text, isFinal) => {
                    if (isFinal) {
                      console.log('Final transcript:', text);
                    }
                  }}
                  onAnalysis={handleSpeechAnalysis}
                />
              </div>
            </Card>
          </div>
        )}

        {/* Security */}
        <Card icon={Shield} title="Zero-Trust 보안" subtitle="로컬 처리 보장">
          <div className="text-center py-6">
            <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
            <p className="text-gray-400 text-xs mb-1">모든 영상/음성 데이터는</p>
            <p className="text-gray-400 text-xs">브라우저 내에서만 처리됩니다</p>
          </div>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 backdrop-blur-xl bg-gray-900/90 border-t border-gray-800/50">
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center justify-around py-3">
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-blue-400 transition-colors">
              <Activity className="w-5 h-5" />
              <span className="text-xs font-medium">모니터</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-white transition-colors">
              <Heart className="w-5 h-5" />
              <span className="text-xs font-medium">건강</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-white transition-colors">
              <Camera className="w-5 h-5" />
              <span className="text-xs font-medium">카메라</span>
            </button>
            <button className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-white transition-colors">
              <Shield className="w-5 h-5" />
              <span className="text-xs font-medium">보안</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
