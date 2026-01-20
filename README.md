# MKM Study v2.0 - 지능형 평형 학습 요새

**작성일**: 2026-01-20  
**버전**: v2.0  
**상태**: ✅ 배포 준비 완료

---

## 🚀 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# VPS Gemma3 API
VITE_VPS_GEMMA3_URL=http://148.230.97.246:11434

# VPS 표준 API (선택적)
VITE_API_BASE_URL=http://148.230.97.246:8003
VITE_API_KEY=your-api-key-here
```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 접속

### 4. 빌드

```bash
npm run build
```

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## 🚀 배포 방법

### 방법 1: Vercel 배포 (권장) ⭐⭐⭐

**가장 빠르고 간단한 방법**:

1. **Vercel 웹사이트 접속**: https://vercel.com
2. **GitHub 연동**: GitHub 계정으로 로그인
3. **프로젝트 Import**: `mkmlab-v2/mkm-study20260120` 선택
4. **환경 변수 설정**:
   - `VITE_VPS_GEMMA3_URL` = `http://148.230.97.246:11434`
   - `VITE_API_BASE_URL` = `http://148.230.97.246:8003`
5. **배포 실행**: "Deploy" 버튼 클릭

**예상 시간**: 약 2-3분

**자동 설정**:
- ✅ HTTPS 자동 설정
- ✅ CDN 자동 설정
- ✅ GitHub 푸시 시 자동 재배포

---

### 방법 2: VPS 배포 (Nitro)

**VPS 배포가 필요한 경우**:

```powershell
cd C:\workspace\projects\mkm\mkm-study20260120
.\scripts\deploy-vps-nitro.ps1
```

**예상 시간**: 약 5-10분

---

## 📋 주요 기능

### 1. 지능형 학습 엔진
- **수학 학습**: EBS 교과과정 기반, 개념의 계보 설명
- **영어 학습**: EBS 수능 특강 기반, Spaced Repetition & Chunking

### 2. 생체 신호 모니터링
- **rPPG**: 실시간 심박수/HRV 측정
- **자세 교정**: MediaPipe Pose 기반 거북목/구부정한 자세 감지
- **졸음 감지**: 심박수 패턴 기반 졸음 수치 계산

### 3. 게이미피케이션
- **12지지 동물 육성**: 레벨 1-30, 진화 단계별 성장
- **MKM 코인 시스템**: 학습 활동 기반 코인 획득 및 보상 상점
- **12AI 캐릭터**: 12 동물 + 12 특징 조합

### 4. 4D 벡터 시각화
- **Radar Chart**: S(정서), L(논리), K(지식), M(신체) 실시간 표시
- **Line Chart**: 동역학 예측 및 붕괴 위험도 표시

---

## 🔌 API 연결

### VPS Gemma3 API

**URL**: `http://148.230.97.246:11434`

**사용 예시**:
```typescript
import { askGemma3, connectToVPSGemma3 } from './utils/api';

// 연결 확인
const status = await connectToVPSGemma3();
console.log(status); // { connected: true, model: 'gemma3:4b' }

// 질문하기
const answer = await askGemma3("이건 뭐지?");
console.log(answer);
```

### VPS 표준 API (선택적)

**URL**: `http://148.230.97.246:8003`

**주요 엔드포인트**:
- `GET /api/v1/mkm12`: 지능 평형 상태 확인
- `POST /api/v1/analyze`: 생체 데이터 분석
- `POST /api/v1/survey/constitution`: 체질 감별
- `POST /api/v1/saju/calculate`: 사주 정보 추출

---

## 📁 프로젝트 구조

```
src/
  components/
    MKMStudyApp.tsx          # 메인 앱 컴포넌트
    MathLearning.tsx          # 수학 학습
    EnglishLearning.tsx       # 영어 학습
    ZodiacEvolution.tsx       # 12지지 동물 육성
    CharacterSelection.tsx    # 12AI 캐릭터 선택
    FourDVectorDashboard.tsx  # 4D 벡터 시각화
    RPPGVideoFeed.tsx         # rPPG 모니터링
    RewardShop.tsx            # 보상 상점
    ...
  utils/
    api.ts                    # API 연결 함수
    types.ts                  # TypeScript 타입 정의
    evolutionEngine.ts        # 진화 엔진
    coinSystem.ts             # 코인 시스템
    ...
  data/
    mathContent.ts            # 수학 콘텐츠
    englishContent.ts         # 영어 콘텐츠
    conceptGenealogy.ts       # 개념의 계보
```

---

## 🛠️ 기술 스택

- **React 18** + **TypeScript**
- **Vite** (빌드 도구)
- **Tailwind CSS** (스타일링)
- **Recharts** (차트 시각화)
- **Lucide React** (아이콘)
- **MediaPipe** (자세 감지, rPPG)

---

## 📝 개발 가이드

### 환경 변수

`.env.local` 파일을 생성하여 다음 변수를 설정하세요:

- `VITE_VPS_GEMMA3_URL`: VPS Gemma3 API URL (기본값: `http://148.230.97.246:11434`)
- `VITE_API_BASE_URL`: VPS 표준 API URL (선택적)
- `VITE_API_KEY`: API 인증 키 (선택적)

### 빌드 및 배포

```bash
# 개발 모드
npm run dev

# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview

# 타입 체크
npm run typecheck

# 린트
npm run lint
```

---

## 🔗 관련 문서

- [Bolt.new 프롬프트](./docs/BOLT_NEW_지능형_평형_학습_요새_v2.0_프롬프트_2026-01-20.md)
- [배포 옵션 비교](./docs/배포_옵션_비교_2026-01-20.md)
- [배포 자동 진행 가이드](./docs/배포_자동_진행_가이드_2026-01-20.md)
- [VPS Gemma3 설정 가이드](./docs/VPS_Gemma3_외부_접근_설정_가이드_2026-01-20.md)

---

## ✅ 체크리스트

### 초기 설정
- [x] `npm install` 완료
- [x] `.env.local` 파일 생성 및 환경 변수 설정
- [x] VPS Gemma3 연결 확인 (`http://148.230.97.246:11434`)
- [x] 개발 서버 실행 확인 (`npm run dev`)

### 기능 테스트
- [ ] 캐릭터 선택 기능
- [ ] 수학 학습 모드
- [ ] 영어 학습 모드
- [ ] 질문 답변 기능 (VPS Gemma3)
- [ ] 4D 벡터 시각화
- [ ] 게이미피케이션 (진화, 코인)

### 배포 준비
- [x] 빌드 성공 확인
- [x] 타입 에러 수정 완료
- [x] API 키 저장 완료
- [x] 배포 스크립트 준비 완료

---

**작성일**: 2026-01-20  
**상태**: ✅ 배포 준비 완료  
**추천 배포 방법**: Vercel 웹 UI 배포 (가장 간단)

[Verified by Athena Auditor v1.2]
