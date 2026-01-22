import { useState } from 'react';
import { User, Calendar, Heart, Stethoscope } from 'lucide-react';

export interface UserProfile {
  // 생년월일시 (학습 리듬 분석용)
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  
  // 학년 정보 (자동 계산 또는 수동 입력)
  currentGrade?: '초6' | '중1' | '중2' | '중3' | '고1' | '고2' | '고3';
  
  // 건강정보
  height: number; // cm
  weight: number; // kg
  bloodType: 'A' | 'B' | 'AB' | 'O';
  chronicDiseases: string[];
  medications: string[];
  
  // 학습 스타일 프로필 (A-Code 기반)
  constitution: 'Type-A' | 'Type-B' | 'Type-C' | 'Type-D' | null;
  constitutionAnswers: {
    // 학습 스타일 진단 질문
    q1: number; // 체형 (1: 마른 편, 2: 보통, 3: 통통한 편)
    q2: number; // 체온 (1: 더위 잘 탐, 2: 보통, 3: 추위 잘 탐)
    q3: number; // 소화 (1: 소화 잘됨, 2: 보통, 3: 소화 안됨)
    q4: number; // 성격 (1: 활발, 2: 보통, 3: 차분)
    q5: number; // 수면 (1: 적게 자도 됨, 2: 보통, 3: 많이 자야 함)
  };
}

interface UserProfileFormProps {
  onComplete: (profile: UserProfile) => void;
}

export default function UserProfileForm({ onComplete }: UserProfileFormProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [profile, setProfile] = useState<Partial<UserProfile>>({
    birthYear: new Date().getFullYear() - 15,
    birthMonth: 1,
    birthDay: 1,
    birthHour: 12,
    birthMinute: 0,
    height: 160,
    weight: 50,
    bloodType: 'A',
    chronicDiseases: [],
    medications: [],
    constitution: null,
    constitutionAnswers: {
      q1: 2,
      q2: 2,
      q3: 2,
      q4: 2,
      q5: 2,
    },
  });

  const calculateGrade = (birthYear: number): '초6' | '중1' | '중2' | '중3' | '고1' | '고2' | '고3' => {
    const currentYear = new Date().getFullYear();
    const age = currentYear - birthYear;
    
    // 만 나이 기준 (3월 기준)
    const currentMonth = new Date().getMonth() + 1;
    const adjustedAge = currentMonth >= 3 ? age : age - 1;
    
    // 초등학교 6학년: 12세 (만 11-12세)
    if (adjustedAge === 12) {
      return '초6';
    }
    // 중학교: 13-15세
    else if (adjustedAge >= 13 && adjustedAge <= 15) {
      const middleGrade = adjustedAge - 12; // 13→중1, 14→중2, 15→중3
      return `중${middleGrade}` as '중1' | '중2' | '중3';
    }
    // 고등학교: 16-18세
    else if (adjustedAge >= 16 && adjustedAge <= 18) {
      const highGrade = adjustedAge - 15; // 16→고1, 17→고2, 18→고3
      return `고${highGrade}` as '고1' | '고2' | '고3';
    }
    
    // 기본값: 초6 (12세 미만) 또는 중1 (13세 이상)
    return adjustedAge < 13 ? '초6' : '중1';
  };

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      // 학습 스타일 자동 진단
      const constitution = diagnoseConstitution(profile.constitutionAnswers!);
      
      // 학년 자동 계산
      const currentGrade = calculateGrade(profile.birthYear || new Date().getFullYear() - 15);
      
      const finalProfile: UserProfile = {
        ...profile,
        constitution,
        currentGrade,
      } as UserProfile;
      
      // localStorage에 저장
      localStorage.setItem('user-profile', JSON.stringify(finalProfile));
      
      onComplete(finalProfile);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((step - 1) as 1 | 2 | 3);
    }
  };

  const diagnoseConstitution = (answers: UserProfile['constitutionAnswers']): 'Type-A' | 'Type-B' | 'Type-C' | 'Type-D' => {
    // A-Code 기반 학습 스타일 진단 로직
    const score = {
      'Type-A': 0,
      'Type-B': 0,
      'Type-C': 0,
      'Type-D': 0,
    };

    // Q1: 체형
    if (answers.q1 === 1) score['Type-C'] += 2;
    else if (answers.q1 === 3) score['Type-B'] += 2;

    // Q2: 체온
    if (answers.q2 === 1) score['Type-A'] += 2;
    else if (answers.q2 === 3) score['Type-D'] += 2;

    // Q3: 소화
    if (answers.q3 === 1) score['Type-A'] += 1;
    else if (answers.q3 === 3) score['Type-B'] += 1;

    // Q4: 성격
    if (answers.q4 === 1) score['Type-C'] += 2;
    else if (answers.q4 === 3) score['Type-D'] += 2;

    // Q5: 수면
    if (answers.q5 === 1) score['Type-A'] += 1;
    else if (answers.q5 === 3) score['Type-D'] += 1;

    // 가장 높은 점수의 타입 반환
    const maxScore = Math.max(...Object.values(score));
    const result = Object.entries(score).find(([_, s]) => s === maxScore)?.[0];
    return (result || 'Type-C') as 'Type-A' | 'Type-B' | 'Type-C' | 'Type-D';
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-900/60 rounded-2xl p-6 border border-gray-700/50">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-400 mb-2">
            <span>단계 {step}/3</span>
            <span>{Math.round((step / 3) * 100)}%</span>
          </div>
          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Step 1: 생년월일시 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-blue-400" />
              <h2 className="text-xl font-bold">생년월일시 입력</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              생체 역학적 스케줄링을 위한 생년월일시를 입력해주세요. 
              <span className="block mt-2 text-xs text-blue-400">
                💡 이 정보는 당신의 최적 학습 시간대(골든 타임) 계산에 사용됩니다.
              </span>
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">생년</label>
                <input
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={profile.birthYear}
                  onChange={(e) =>
                    setProfile({ ...profile, birthYear: parseInt(e.target.value) || 2000 })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">생월</label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={profile.birthMonth}
                    onChange={(e) =>
                      setProfile({ ...profile, birthMonth: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">생일</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={profile.birthDay}
                    onChange={(e) =>
                      setProfile({ ...profile, birthDay: parseInt(e.target.value) || 1 })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">생시</label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={profile.birthHour}
                    onChange={(e) =>
                      setProfile({ ...profile, birthHour: parseInt(e.target.value) || 12 })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">생분</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={profile.birthMinute}
                    onChange={(e) =>
                      setProfile({ ...profile, birthMinute: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: 건강정보 */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Heart className="w-5 h-5 text-red-400" />
              <h2 className="text-xl font-bold">건강정보 입력</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              맞춤형 학습을 위한 기본 건강정보를 입력해주세요.
            </p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">키 (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={profile.height}
                    onChange={(e) =>
                      setProfile({ ...profile, height: parseInt(e.target.value) || 160 })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">몸무게 (kg)</label>
                  <input
                    type="number"
                    min="30"
                    max="200"
                    value={profile.weight}
                    onChange={(e) =>
                      setProfile({ ...profile, weight: parseInt(e.target.value) || 50 })
                    }
                    className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">혈액형</label>
                <select
                  value={profile.bloodType}
                  onChange={(e) =>
                    setProfile({ ...profile, bloodType: e.target.value as 'A' | 'B' | 'AB' | 'O' })
                  }
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="A">A형</option>
                  <option value="B">B형</option>
                  <option value="AB">AB형</option>
                  <option value="O">O형</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">만성질환 (선택사항)</label>
                <input
                  type="text"
                  placeholder="예: 고혈압, 당뇨 등 (쉼표로 구분)"
                  onChange={(e) => {
                    const diseases = e.target.value
                      .split(',')
                      .map((d) => d.trim())
                      .filter((d) => d.length > 0);
                    setProfile({ ...profile, chronicDiseases: diseases });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">복용 중인 약물 (선택사항)</label>
                <input
                  type="text"
                  placeholder="예: 혈압약, 비타민 등 (쉼표로 구분)"
                  onChange={(e) => {
                    const medications = e.target.value
                      .split(',')
                      .map((m) => m.trim())
                      .filter((m) => m.length > 0);
                    setProfile({ ...profile, medications });
                  }}
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: 생체 리듬 및 신경전달 유형 분석 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">생체 리듬 및 신경전달 유형 분석</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              당신의 인지 처리 패턴을 분석하여 최적의 학습 경로를 설계합니다. 
              <span className="block mt-2 text-xs text-blue-400">
                💡 이 정보는 당신의 뇌가 정보를 처리하는 고유한 방식을 파악하는 데 사용됩니다.
              </span>
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  1. 신진대사 유형 (Metabolic Type)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  신진대사는 학습 에너지 관리와 밀접한 관련이 있습니다.
                </p>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '고대사형 (빠른 신진대사)' },
                    { value: 2, label: '균형형 (보통)' },
                    { value: 3, label: '저대사형 (느린 신진대사)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="q1"
                        value={option.value}
                        checked={profile.constitutionAnswers?.q1 === option.value}
                        onChange={() =>
                          setProfile({
                            ...profile,
                            constitutionAnswers: {
                              ...profile.constitutionAnswers!,
                              q1: option.value,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  2. 체온 조절 능력 (Thermoregulation)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  체온 조절 능력은 집중력과 인지 성능에 영향을 미칩니다.
                </p>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '고체온형 (더위에 강함)' },
                    { value: 2, label: '균형형 (보통)' },
                    { value: 3, label: '저체온형 (추위에 강함)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="q2"
                        value={option.value}
                        checked={profile.constitutionAnswers?.q2 === option.value}
                        onChange={() =>
                          setProfile({
                            ...profile,
                            constitutionAnswers: {
                              ...profile.constitutionAnswers!,
                              q2: option.value,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  3. 소화 효율 (Digestive Efficiency)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  소화 효율은 학습 중 에너지 공급과 밀접한 관련이 있습니다.
                </p>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '고효율형 (소화가 빠름)' },
                    { value: 2, label: '균형형 (보통)' },
                    { value: 3, label: '저효율형 (소화가 느림)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="q3"
                        value={option.value}
                        checked={profile.constitutionAnswers?.q3 === option.value}
                        onChange={() =>
                          setProfile({
                            ...profile,
                            constitutionAnswers: {
                              ...profile.constitutionAnswers!,
                              q3: option.value,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  4. 인지 처리 스타일 (Cognitive Processing Style)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  뇌가 정보를 처리하는 기본적인 방식을 파악합니다.
                </p>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '고속 처리형 (빠른 반응, 외향적)' },
                    { value: 2, label: '균형형 (보통)' },
                    { value: 3, label: '심층 처리형 (신중한 반응, 내향적)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="q4"
                        value={option.value}
                        checked={profile.constitutionAnswers?.q4 === option.value}
                        onChange={() =>
                          setProfile({
                            ...profile,
                            constitutionAnswers: {
                              ...profile.constitutionAnswers!,
                              q4: option.value,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-3">
                  5. 수면-각성 주기 (Sleep-Wake Cycle)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  수면 패턴은 학습 골든 타임 계산에 중요한 요소입니다.
                </p>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '단수면형 (짧은 수면으로 충분)' },
                    { value: 2, label: '균형형 (보통)' },
                    { value: 3, label: '장수면형 (긴 수면 필요)' },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl cursor-pointer hover:bg-gray-700 transition-colors"
                    >
                      <input
                        type="radio"
                        name="q5"
                        value={option.value}
                        checked={profile.constitutionAnswers?.q5 === option.value}
                        onChange={() =>
                          setProfile({
                            ...profile,
                            constitutionAnswers: {
                              ...profile.constitutionAnswers!,
                              q5: option.value,
                            },
                          })
                        }
                        className="w-4 h-4 text-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <button
              onClick={handleBack}
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-700 transition-colors"
            >
              이전
            </button>
          )}
          <button
            onClick={handleNext}
            className="flex-1 bg-blue-500 text-white px-4 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
          >
            {step < 3 ? '다음' : '완료'}
          </button>
        </div>
      </div>
    </div>
  );
}

