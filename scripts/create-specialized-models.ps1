# MKM Study 특화 모델 생성 스크립트
# System Prompt 기반 수학/영어 특화 모델 생성

Write-Host "🏛️ MKM Study 특화 모델 생성 시작..." -ForegroundColor Cyan
Write-Host ""

# VPS Ollama URL
$OLLAMA_URL = "http://148.230.97.246:11434"

# 1. 수학 특화 모델 생성
Write-Host "📘 수학 특화 모델 (mkm-math) 생성 중..." -ForegroundColor Yellow

$mathModelfile = @"
FROM llama3.2:3b
PARAMETER temperature 0.2
PARAMETER num_predict 500
SYSTEM "너는 MKM12 이론 기반의 수학 튜터다. 

4D 벡터 상태: S=0.2, L=0.5, K=0.2, M=0.1
- 논리(L)와 구조(M) 벡터가 극대화되어 있다.
- 모든 답변은 논리적 정확도와 구조적 명확성을 최우선으로 한다.
- EBS 교과과정 기반으로 개념의 계보를 추적한다.
- 단계별로 명확하게 설명하며, 수식의 논리적 흐름을 강조한다.
- 학생이 이해하기 어려운 부분은 비유와 예시를 사용한다."
"@

# Modelfile을 임시 파일로 저장
$mathModelfilePath = "$env:TEMP\mkm-math-modelfile.txt"
$mathModelfile | Out-File -FilePath $mathModelfilePath -Encoding UTF8

Write-Host "   Modelfile 생성 완료: $mathModelfilePath" -ForegroundColor Green
Write-Host "   VPS에서 다음 명령어 실행:"
Write-Host "   ssh user@148.230.97.246" -ForegroundColor Cyan
Write-Host "   ollama create mkm-math -f /path/to/mkm-math-modelfile.txt" -ForegroundColor Cyan
Write-Host ""

# 2. 영어 특화 모델 생성
Write-Host "📗 영어 특화 모델 (mkm-english) 생성 중..." -ForegroundColor Yellow

$englishModelfile = @"
FROM llama3.2:3b
PARAMETER temperature 0.8
PARAMETER num_predict 500
SYSTEM "너는 MKM12 이론 기반의 영어 튜터다.

4D 벡터 상태: S=0.4, L=0.1, K=0.4, M=0.1
- 지식(K)과 감성(S) 벡터가 극대화되어 있다.
- 모든 답변은 자연스러운 표현과 상황에 맞는 뉘앙스를 최우선으로 한다.
- EBS 수능 특강 수준의 영어를 사용한다.
- 학생의 발음을 정밀하게 교정하고, 상황에 맞는 자연스러운 회화 문장을 생성한다.
- Spaced Repetition & Chunking 기법을 활용하여 효율적인 암기를 도와준다."
"@

# Modelfile을 임시 파일로 저장
$englishModelfilePath = "$env:TEMP\mkm-english-modelfile.txt"
$englishModelfile | Out-File -FilePath $englishModelfilePath -Encoding UTF8

Write-Host "   Modelfile 생성 완료: $englishModelfilePath" -ForegroundColor Green
Write-Host "   VPS에서 다음 명령어 실행:"
Write-Host "   ssh user@148.230.97.246" -ForegroundColor Cyan
Write-Host "   ollama create mkm-english -f /path/to/mkm-english-modelfile.txt" -ForegroundColor Cyan
Write-Host ""

# 3. 모델 생성 확인
Write-Host "✅ Modelfile 생성 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 다음 단계:" -ForegroundColor Cyan
Write-Host "1. Modelfile을 VPS로 전송 (scp 또는 직접 복사)" -ForegroundColor White
Write-Host "2. VPS에서 모델 생성:" -ForegroundColor White
Write-Host "   ollama create mkm-math -f mkm-math-modelfile.txt" -ForegroundColor Yellow
Write-Host "   ollama create mkm-english -f mkm-english-modelfile.txt" -ForegroundColor Yellow
Write-Host "3. 모델 확인:" -ForegroundColor White
Write-Host "   ollama list" -ForegroundColor Yellow
Write-Host "4. 앱 코드에서 모델명 변경 (api.ts)" -ForegroundColor White
Write-Host ""

# Modelfile 내용 출력
Write-Host "📄 수학 모델 Modelfile 내용:" -ForegroundColor Cyan
Write-Host $mathModelfile
Write-Host ""
Write-Host "📄 영어 모델 Modelfile 내용:" -ForegroundColor Cyan
Write-Host $englishModelfile
Write-Host ""

Write-Host "✅ 스크립트 실행 완료!" -ForegroundColor Green

