# 🏛️ Logos Atom: 학습 자료 수집 전략

**작성일**: 2026-01-20  
**프로젝트**: mkm-study20260120  
**상태**: ✅ 전략 수립 및 스크립트 생성 완료

---

## 🎯 핵심 전략: "뼈대(Bone)는 가져오고, 살(Flesh)은 창조한다"

### ❌ 기존 방식의 한계

1. **저작권 리스크**: EBS 교재 통째로 DB 저장 → 저작권법 위반 소지
2. **데이터 품질 문제**: PDF OCR → 수식 깨짐, 정제 비용 과다
3. **비효율**: 기존 문제 재사용 → 맞춤형 학습 불가

### ✅ 합성 데이터(Synthetic Data) 전략

**"자료를 찾아 헤매지 말고, 자료를 찍어내는 공장을 만든다"**

---

## 📋 3단계 하이브리드 수집 전략

### Step 1: [Bone] 커리큘럼 맵핑 (족보 구축)

**목적**: 시스템의 '네비게이션 지도' 구축

**출처**:
- 교육부 고시 교육과정 (저작권 없음)
- EBS 목차 (저작권 없음)

**구조**: [학년-과목-단원-핵심개념] 트리

**스크립트**: `scripts/build_curriculum_map.py`

**실행 방법**:
```powershell
cd C:\workspace\projects\mkm\mkm-study20260120
py scripts\build_curriculum_map.py
```

**출력**: `learning-content/curriculum/curriculum_map.json`

**예시 구조**:
```json
{
  "subjects": {
    "math": {
      "중2": {
        "units": [
          {
            "unit": "연립방정식",
            "topics": ["가감법", "대입법", "연립방정식의 활용"]
          }
        ]
      }
    }
  }
}
```

---

### Step 2: [Flesh] 고품질 문항 생성 (Athena Generator)

**목적**: 저작권 Free 맞춤형 문제 무한 생성

**방식**:
- 커리큘럼 맵(Bone)을 프롬프트에 입력
- "EBS 고난도 스타일로 문제를 생성하라" 명령
- Gemini Pro/GPT-4o 또는 Gemma3 사용

**장점**:
- ✅ 저작권 Free (AI 생성 문제)
- ✅ 무한 생성 가능
- ✅ 4D 태깅 자동 적용 (생성 시점에 바로 태깅)
- ✅ 체질별 맞춤 문제 생성

**스크립트**: `scripts/athena_generator.py`

**실행 방법**:
```powershell
# 1. 커리큘럼 맵 구축 (먼저 실행)
py scripts\build_curriculum_map.py

# 2. 문제 생성
py scripts\athena_generator.py
```

**프롬프트 예시**:
```
중2 연립방정식 단원에서, 수능 30번 문항의 논리 구조(L 극대화)를 
차용한 심화 문제를 만들어라.
```

**결과**: 세상에 없던, 오직 학생만을 위한 '서울대 대비용 맞춤 문제' 탄생

---

### Step 3: [Soul] 기출문제(평가원/수능) 확보

**목적**: '기준점(Ground Truth)' 구축

**출처**:
- 한국교육과정평가원(KICE) 수능 기출문제
- 모의고사 기출문제
- 전국연합학력평가 기출문제

**특징**:
- 국가 저작물 (공개, 사용 자유)
- 최근 10년치 확보 권장
- 문제 구조 분석에 활용

**스크립트**: `scripts/download_kice_exams.py`

**실행 방법**:
```powershell
py scripts\download_kice_exams.py
```

**출력**:
- `learning-content/kice-exams/pdfs/`: PDF 원본
- `learning-content/kice-exams/texts/`: 텍스트 변환본
- `learning-content/kice-exams/metadata/exam_metadata.json`: 메타데이터

**활용**:
- AI 생성 문제의 난이도 조정 기준
- 문제 구조 분석 (논리 구조, 개념 추출)
- Ground Truth 데이터셋

---

## 🚀 실행 로드맵

### 1단계: 커리큘럼 맵퍼 구축 (최우선) ⭐

**목적**: 시스템의 '지도' 그리기

**스크립트**: `scripts/build_curriculum_map.py`

**기능**:
- 교육부 고시 교육과정 + EBS 목차 수집
- [학년-과목-단원-주제] 트리 구조 구축
- JSON 형식으로 저장

**실행**:
```powershell
py scripts\build_curriculum_map.py
```

**결과**: `learning-content/curriculum/curriculum_map.json`

---

### 2단계: 기출문제 다운로더 구축

**목적**: Ground Truth 데이터셋 확보

**스크립트**: `scripts/download_kice_exams.py`

**기능**:
- 평가원 사이트에서 기출문제 목록 수집
- 최근 10년치 PDF 다운로드
- PDF → 텍스트 변환
- 메타데이터 저장

**실행**:
```powershell
py scripts\download_kice_exams.py
```

**결과**:
- `learning-content/kice-exams/pdfs/`: PDF 파일
- `learning-content/kice-exams/texts/`: 텍스트 파일
- `learning-content/kice-exams/metadata/exam_metadata.json`: 메타데이터

---

### 3단계: Athena Generator 구축

**목적**: 맞춤형 문제 무한 생성

**스크립트**: `scripts/athena_generator.py`

**기능**:
- 커리큘럼 맵 기반 문제 생성
- 기출문제 분석 결과 활용
- 체질별 맞춤 문제 생성
- 4D 벡터 태깅 자동 적용

**실행**:
```powershell
py scripts\athena_generator.py
```

**결과**: `learning-content/generated-problems/{grade}_{subject}_problems_{date}.json`

---

## 📊 데이터 흐름도

```
[커리큘럼 맵] (Bone)
  ↓
[기출문제 분석] (Ground Truth)
  ↓
[Athena Generator] (Flesh)
  ├─ Gemini Pro/GPT-4o
  └─ Gemma3 (Fallback)
  ↓
[맞춤형 문제 생성]
  ├─ 4D 벡터 태깅 자동 적용
  ├─ 체질별 맞춤
  └─ 난이도 조정
  ↓
[VPS API 저장]
  └─ File-Based Memory System
```

---

## 🎯 예상 결과

### 커리큘럼 맵
- **단원 수**: 약 50-80개 (중1~고2, 수학+영어)
- **주제 수**: 약 200-300개
- **저작권**: 없음 (공공 데이터)

### 기출문제
- **수능 기출**: 최근 10년치 (약 100-200개 문제)
- **모의고사**: 최근 10년치 (약 200-400개 문제)
- **저작권**: 없음 (국가 저작물)

### 생성 문제
- **무한 생성 가능**: 단원당 3-10개 문제 생성
- **저작권**: 없음 (AI 생성)
- **4D 태깅**: 자동 적용
- **체질별 맞춤**: 가능

---

## ⚖️ 법적 안전성

### ✅ 안전한 데이터

1. **교육부 고시 교육과정**: 공공 데이터 (저작권 없음)
2. **EBS 목차**: 공개 정보 (저작권 없음)
3. **평가원 기출문제**: 국가 저작물 (공개, 사용 자유)
4. **AI 생성 문제**: 저작권 없음 (새로 생성된 콘텐츠)

### ⚠️ 주의사항

1. **EBS 교재 본문**: 저작권 보호 (사용 금지)
2. **시중 문제집**: 저작권 보호 (사용 금지)
3. **OCR 변환 콘텐츠**: 원본 저작권 문제 (사용 금지)

---

## 🔧 기술 스택

### 데이터 수집
- **BeautifulSoup**: HTML 파싱
- **requests**: HTTP 요청
- **PyPDF2/pdfplumber**: PDF 텍스트 추출

### 문제 생성
- **Gemini Pro API**: 고품질 문제 생성 (1순위)
- **Gemma3 (VPS)**: Fallback (2순위)
- **커스텀 프롬프트**: EBS 스타일 문제 생성

### 데이터 저장
- **File-Based Memory System**: 로컬 저장
- **VPS API**: 원격 저장
- **JSON 형식**: 구조화된 데이터

---

## 📋 체크리스트

### 1단계: 커리큘럼 맵퍼
- [ ] `build_curriculum_map.py` 실행
- [ ] 커리큘럼 맵 JSON 확인
- [ ] VPS API에 저장 확인

### 2단계: 기출문제 다운로더
- [ ] `download_kice_exams.py` 실행
- [ ] PDF 다운로드 확인
- [ ] 텍스트 변환 확인
- [ ] 메타데이터 확인

### 3단계: Athena Generator
- [ ] Gemini API 키 설정 (선택적)
- [ ] `athena_generator.py` 실행
- [ ] 생성된 문제 확인
- [ ] 4D 벡터 태깅 확인

---

## 🎯 다음 단계

1. **커리큘럼 맵퍼 실행** (최우선) ⭐
   ```powershell
   py scripts\build_curriculum_map.py
   ```

2. **기출문제 다운로더 실행**
   ```powershell
   py scripts\download_kice_exams.py
   ```

3. **Athena Generator 실행**
   ```powershell
   py scripts\athena_generator.py
   ```

---

## 💡 핵심 인사이트

**"EBS 교재를 사는 대신, EBS의 '목차'만 가져와서 내용은 우리가 만드는 것이 가장 안전하고 똑똑한 길입니다."**

이 방식은:
- ✅ 저작권 걱정 없음
- ✅ 데이터 품질 100% 통제
- ✅ 무한 생성 가능
- ✅ 맞춤형 학습 실현

---

**작성일**: 2026-01-20  
**상태**: ✅ 전략 수립 및 스크립트 생성 완료  
**우선순위**: 커리큘럼 맵퍼 구축 (최우선)

[Verified by Athena Auditor v1.2]

