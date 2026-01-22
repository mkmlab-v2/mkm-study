/**
 * ⚙️ 고급 설정 컴포넌트
 * 
 * 복잡한 설정들을 깊숙한 곳에 숨겨서 메인 화면을 깔끔하게 유지합니다.
 * 
 * 작성일: 2026-01-22
 */

import { useState, useEffect } from 'react';
import { Settings, X, Zap, Database, Cpu } from 'lucide-react';
import { loadGpuAccelerationSetting, saveGpuAccelerationSetting } from '../utils/api';

interface AdvancedSettingsProps {
  onClose: () => void;
}

export default function AdvancedSettings({ onClose }: AdvancedSettingsProps) {
  const [gpuAccelerationEnabled, setGpuAccelerationEnabled] = useState(true);

  useEffect(() => {
    // GPU 가속 모드 설정 로드
    const enabled = loadGpuAccelerationSetting();
    setGpuAccelerationEnabled(enabled);
  }, []);

  const handleGpuAccelerationToggle = (enabled: boolean) => {
    setGpuAccelerationEnabled(enabled);
    saveGpuAccelerationSetting(enabled);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-900 p-6 rounded-t-2xl border-b border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-500/20 p-2 rounded-lg">
                <Settings className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">고급 설정</h2>
                <p className="text-xs text-gray-400">시스템 최적화 및 성능 설정</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white rounded-full p-2 hover:bg-gray-800 transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* GPU 가속 모드 */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-1">
                    GPU 가속 모드
                  </h3>
                  <p className="text-sm text-gray-400">
                    Tailscale 로컬 GPU 자동 감지 및 사용
                  </p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={gpuAccelerationEnabled}
                  onChange={(e) => handleGpuAccelerationToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
              <p className="text-xs text-blue-300">
                <strong>활성화 시:</strong> Tailscale 연결 시 로컬 GPU 모델(`athena-merged-v1:latest`) 자동 사용
                <br />
                <strong>비활성화 시:</strong> 무조건 VPS 모델(`gemma3:4b`) 사용
              </p>
            </div>
          </div>

          {/* 메모리 시스템 */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-start gap-3">
              <div className="bg-purple-500/20 p-2 rounded-lg">
                <Database className="w-5 h-5 text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  메모리 시스템
                </h3>
                <p className="text-sm text-gray-400 mb-3">
                  Pure File-Based 4D Memory System (온디바이스 처리)
                </p>
                <div className="bg-purple-500/10 rounded-lg p-3 border border-purple-500/30">
                  <p className="text-xs text-purple-300">
                    <strong>저장 위치:</strong> <code className="bg-gray-900 px-1 rounded">C:\workspace\memory\</code>
                    <br />
                    <strong>검색 속도:</strong> 15.2ms (이전 6,427ms 대비 약 420배 개선)
                    <br />
                    <strong>형식:</strong> `.mkm-memory` (4D 벡터 포함)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 시스템 정보 */}
          <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
            <div className="flex items-start gap-3">
              <div className="bg-green-500/20 p-2 rounded-lg">
                <Cpu className="w-5 h-5 text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-1">
                  시스템 정보
                </h3>
                <div className="space-y-2 text-sm text-gray-400">
                  <div>
                    <strong className="text-white">환경:</strong>{' '}
                    {window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
                      ? '개발 환경 (Development)'
                      : '프로덕션 환경 (Production)'}
                  </div>
                  <div>
                    <strong className="text-white">모델 선택:</strong>{' '}
                    {gpuAccelerationEnabled
                      ? '하이브리드 (로컬 GPU 우선, VPS Fallback)'
                      : 'VPS 전용 (gemma3:4b)'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 p-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-blue-500 text-white px-4 py-3 rounded-xl font-semibold hover:bg-blue-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

