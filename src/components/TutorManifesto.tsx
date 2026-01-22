/**
 * 🧠 초개인화 인지 최적화 튜터 - 매니페스토
 * 
 * 공학적/뇌과학적 언어로 리브랜딩된 앱 소개 페이지
 * 
 * 작성일: 2026-01-22
 */

import { useState } from 'react';
import { Brain, Zap, Shield, TrendingUp, X } from 'lucide-react';

interface TutorManifestoProps {
  onClose: () => void;
  onGetStarted: () => void;
}

export default function TutorManifesto({ onClose, onGetStarted }: TutorManifestoProps) {
  const [currentSection, setCurrentSection] = useState<number>(0);

  const sections = [
    {
      icon: Brain,
      title: "당신의 뇌는 더 똑똑하게 설계될 수 있습니다",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            기성 교육은 '평균적인 뇌'를 기준으로 설계되었습니다. 하지만 당신의 인지 처리 속도, 기억 패턴, 집중 가능한 시간대는 <strong>지문처럼 고유합니다</strong>.
          </p>
          <p className="text-lg leading-relaxed">
            이 AI 튜터는 당신만의 <strong>'인지 고유값(Eigenvalue)'</strong>을 찾아냅니다.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>인지 고유값이란?</strong> 당신의 뇌가 정보를 처리하는 고유한 패턴입니다. 
              이를 분석하여 가장 효율적인 학습 경로를 설계합니다.
            </p>
          </div>
        </div>
      )
    },
    {
      icon: Zap,
      title: "시맨틱 압축 (Semantic Compression) 기술",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            책 한 권을 통째로 외우는 것은 비효율적입니다. 이 AI 튜터는 방대한 지식에서 <strong>'핵심 의미(Semantic Vector)'</strong>만을 추출하여, 
            당신의 뇌가 가장 받아들이기 쉬운 형태로 압축 전달합니다.
          </p>
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 rounded-lg border border-purple-200">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold text-purple-600">1/10</div>
                <div className="text-sm text-gray-600 mt-1">학습 시간 단축</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-blue-600">99.98%</div>
                <div className="text-sm text-gray-600 mt-1">압축률</div>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            핵심만 추출하여 전달하므로, 학습 효율이 극대화됩니다.
          </p>
        </div>
      )
    },
    {
      icon: TrendingUp,
      title: "생체 역학적 스케줄링 (Bio-Mechanic Scheduling)",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            무조건 오래 앉아 있는 것은 미덕이 아닙니다. 당신의 도파민과 노르에피네프린 수치가 최고조에 달하는 <strong>'골든 타임'</strong>을 계산하여, 
            가장 효율적인 학습 스케줄을 제안합니다.
          </p>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">골든 타임 감지</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• 생체 신호 분석 (심박수, 호흡 패턴)</li>
              <li>• 집중도 실시간 측정</li>
              <li>• 최적 학습 시간대 자동 계산</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      icon: Shield,
      title: "보안과 주권 (Sovereign Intelligence)",
      content: (
        <div className="space-y-4">
          <p className="text-lg leading-relaxed">
            당신의 약점과 학습 데이터는 클라우드로 유출되지 않습니다. 모든 분석은 당신의 기기 내에서 <strong>독립적(Local)</strong>으로 수행됩니다.
          </p>
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
            <h4 className="font-semibold text-amber-800 mb-2">온디바이스 처리</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>✅ 모든 데이터는 기기 내부에서만 처리</li>
              <li>✅ 외부 서버로 전송되지 않음</li>
              <li>✅ 완전한 프라이버시 보장</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const currentSectionData = sections[currentSection];
  const Icon = currentSectionData.icon;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-2">초개인화 인지 최적화 튜터</h1>
              <p className="text-blue-100">당신의 뇌를 위한 공학적 학습 시스템</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
              aria-label="닫기"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="px-6 pt-4 pb-2">
          <div className="flex gap-2">
            {sections.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-all ${
                  index === currentSection
                    ? 'bg-blue-600'
                    : index < currentSection
                    ? 'bg-blue-300'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-100 to-purple-100 p-4 rounded-xl">
              <Icon className="text-blue-600" size={32} />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentSectionData.title}
              </h2>
              {currentSectionData.content}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6 rounded-b-2xl">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
              disabled={currentSection === 0}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              이전
            </button>
            
            <div className="text-sm text-gray-500">
              {currentSection + 1} / {sections.length}
            </div>

            {currentSection < sections.length - 1 ? (
              <button
                onClick={() => setCurrentSection(currentSection + 1)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                다음
              </button>
            ) : (
              <button
                onClick={onGetStarted}
                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold shadow-lg"
              >
                시작하기
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

