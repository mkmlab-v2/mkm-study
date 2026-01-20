import { useState } from 'react';
import { User, Calendar, Heart, Stethoscope } from 'lucide-react';

export interface UserProfile {
  // 생년월일시 (사주)
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  birthMinute: number;
  
  // 건강정보
  height: number; // cm
  weight: number; // kg
  bloodType: 'A' | 'B' | 'AB' | 'O';
  chronicDiseases: string[];
  medications: string[];
  
  // 체질설문 (사상체질)
  constitution: '태양인' | '태음인' | '소양인' | '소음인' | null;
  constitutionAnswers: {
    // 체질 진단 질문 (간단한 버전)
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

  const handleNext = () => {
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      // 체질 자동 진단
      const constitution = diagnoseConstitution(profile.constitutionAnswers!);
      const finalProfile: UserProfile = {
        ...profile,
        constitution,
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

  const diagnoseConstitution = (answers: UserProfile['constitutionAnswers']): '태양인' | '태음인' | '소양인' | '소음인' => {
    // 간단한 체질 진단 로직
    const score = {
      태양인: 0,
      태음인: 0,
      소양인: 0,
      소음인: 0,
    };

    // Q1: 체형
    if (answers.q1 === 1) score.소양인 += 2;
    else if (answers.q1 === 3) score.태음인 += 2;

    // Q2: 체온
    if (answers.q2 === 1) score.태양인 += 2;
    else if (answers.q2 === 3) score.소음인 += 2;

    // Q3: 소화
    if (answers.q3 === 1) score.태양인 += 1;
    else if (answers.q3 === 3) score.태음인 += 1;

    // Q4: 성격
    if (answers.q4 === 1) score.소양인 += 2;
    else if (answers.q4 === 3) score.소음인 += 2;

    // Q5: 수면
    if (answers.q5 === 1) score.태양인 += 1;
    else if (answers.q5 === 3) score.소음인 += 1;

    // 가장 높은 점수의 체질 반환
    const maxScore = Math.max(...Object.values(score));
    const result = Object.entries(score).find(([_, s]) => s === maxScore)?.[0];
    return (result || '소양인') as '태양인' | '태음인' | '소양인' | '소음인';
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
              사주 분석을 위한 생년월일시를 입력해주세요.
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

        {/* Step 3: 체질설문 */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Stethoscope className="w-5 h-5 text-green-400" />
              <h2 className="text-xl font-bold">체질설문</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">
              사상체질 진단을 위한 간단한 설문입니다.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-3">
                  1. 체형은 어떤 편인가요?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '마른 편' },
                    { value: 2, label: '보통' },
                    { value: 3, label: '통통한 편' },
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
                  2. 체온은 어떤 편인가요?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '더위를 잘 탐' },
                    { value: 2, label: '보통' },
                    { value: 3, label: '추위를 잘 탐' },
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
                  3. 소화는 어떤 편인가요?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '소화가 잘됨' },
                    { value: 2, label: '보통' },
                    { value: 3, label: '소화가 안됨' },
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
                  4. 성격은 어떤 편인가요?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '활발하고 외향적' },
                    { value: 2, label: '보통' },
                    { value: 3, label: '차분하고 내향적' },
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
                  5. 수면 패턴은 어떤가요?
                </label>
                <div className="space-y-2">
                  {[
                    { value: 1, label: '적게 자도 됨' },
                    { value: 2, label: '보통' },
                    { value: 3, label: '많이 자야 함' },
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

