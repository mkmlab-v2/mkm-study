# 🛡️ Tailscale 터널 설정 스크립트 (mkm-study용)
# 
# 로컬 PC와 VPS를 Tailscale로 연결하여 프로덕션에서도 로컬 Ollama 사용 가능하도록 설정
# 
# 작성일: 2026-01-22
# 상태: ✅ Tailscale 터널 설정 스크립트

Write-Host "🏛️ Tailscale 터널 설정 시작 (mkm-study)..." -ForegroundColor Cyan

# 1. Tailscale 설치 확인
Write-Host "`n[1/5] Tailscale 설치 확인 중..." -ForegroundColor Yellow
$tailscaleInstalled = Get-Command tailscale -ErrorAction SilentlyContinue

if (-not $tailscaleInstalled) {
    Write-Host "⚠️ Tailscale이 설치되어 있지 않습니다." -ForegroundColor Red
    Write-Host "다운로드: https://tailscale.com/download" -ForegroundColor Yellow
    Write-Host "설치 후 이 스크립트를 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Tailscale 설치 확인됨" -ForegroundColor Green

# 2. Tailscale 상태 확인
Write-Host "`n[2/5] Tailscale 상태 확인 중..." -ForegroundColor Yellow
$tailscaleStatus = tailscale status --json 2>$null | ConvertFrom-Json

if (-not $tailscaleStatus -or -not $tailscaleStatus.Self.Online) {
    Write-Host "⚠️ Tailscale이 실행되지 않았거나 로그인되지 않았습니다." -ForegroundColor Red
    Write-Host "다음 명령어로 로그인하세요: tailscale up" -ForegroundColor Yellow
    exit 1
}

$localTailscaleIP = $tailscaleStatus.Self.TailscaleIPs[0]
Write-Host "✅ Tailscale 상태: Online" -ForegroundColor Green
Write-Host "   로컬 Tailscale IP: $localTailscaleIP" -ForegroundColor Cyan

# 3. 로컬 Ollama 외부 접근 허용 확인
Write-Host "`n[3/5] 로컬 Ollama 외부 접근 설정 확인 중..." -ForegroundColor Yellow

# Windows에서 Ollama는 기본적으로 localhost:11434에서만 리스닝
# Tailscale IP로 접근하려면 환경 변수 설정 필요
$ollamaHostEnv = $env:OLLAMA_HOST
if (-not $ollamaHostEnv -or $ollamaHostEnv -notmatch "0\.0\.0\.0") {
    Write-Host "⚠️ OLLAMA_HOST 환경 변수가 설정되지 않았거나 외부 접근이 허용되지 않습니다." -ForegroundColor Yellow
    Write-Host "   현재 OLLAMA_HOST: $ollamaHostEnv" -ForegroundColor Gray
    
    Write-Host "`n로컬 Ollama를 Tailscale IP로 접근 가능하도록 설정하려면:" -ForegroundColor Yellow
    Write-Host "   1. Ollama 서비스를 중지하세요" -ForegroundColor White
    Write-Host "   2. 환경 변수 설정: `$env:OLLAMA_HOST='0.0.0.0:11434'" -ForegroundColor White
    Write-Host "   3. Ollama 서비스 재시작" -ForegroundColor White
    Write-Host "`n또는 Ollama를 수동으로 실행: ollama serve --host 0.0.0.0:11434" -ForegroundColor Yellow
} else {
    Write-Host "✅ OLLAMA_HOST 환경 변수 설정됨: $ollamaHostEnv" -ForegroundColor Green
}

# 4. 로컬 Ollama 연결 테스트
Write-Host "`n[4/5] 로컬 Ollama 연결 테스트 중..." -ForegroundColor Yellow
try {
    $ollamaResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 2 -ErrorAction Stop
    $models = $ollamaResponse.models | ForEach-Object { $_.name }
    Write-Host "✅ 로컬 Ollama 연결 성공!" -ForegroundColor Green
    Write-Host "   사용 가능한 모델: $($models -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "⚠️ 로컬 Ollama 연결 실패: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   로컬 Ollama가 실행 중인지 확인하세요." -ForegroundColor Yellow
}

# 5. 환경 변수 파일 생성 (.env.local)
Write-Host "`n[5/5] 환경 변수 파일 설정 중..." -ForegroundColor Yellow
$envFile = ".env.local"
$projectRoot = Split-Path -Parent $PSScriptRoot

if (-not (Test-Path $projectRoot)) {
    Write-Host "⚠️ 프로젝트 루트를 찾을 수 없습니다: $projectRoot" -ForegroundColor Red
    exit 1
}

$envFilePath = Join-Path $projectRoot $envFile
$envContent = @()

if (Test-Path $envFilePath) {
    $envContent = Get-Content $envFilePath
    Write-Host "✅ 기존 .env.local 파일 발견" -ForegroundColor Green
} else {
    Write-Host "📝 새 .env.local 파일 생성" -ForegroundColor Cyan
}

# 환경 변수 업데이트/추가
$updated = $false
$newContent = @()

foreach ($line in $envContent) {
    if ($line -match "^VITE_LOCAL_OLLAMA_URL=") {
        $newContent += "VITE_LOCAL_OLLAMA_URL=http://$localTailscaleIP:11434"
        $updated = $true
    } elseif ($line -match "^VITE_TAILSCALE_IP=") {
        $newContent += "VITE_TAILSCALE_IP=$localTailscaleIP"
        $updated = $true
    } else {
        $newContent += $line
    }
}

if (-not $updated) {
    $newContent += ""
    $newContent += "# Tailscale 터널 설정 (자동 생성: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss'))"
    $newContent += "VITE_LOCAL_OLLAMA_URL=http://$localTailscaleIP:11434"
    $newContent += "VITE_TAILSCALE_IP=$localTailscaleIP"
}

Set-Content -Path $envFilePath -Value $newContent
Write-Host "✅ 환경 변수 파일 설정 완료: $envFilePath" -ForegroundColor Green

# 6. 최종 확인
Write-Host "`n✅ Tailscale 터널 설정 완료!" -ForegroundColor Green
Write-Host "`n설정 요약:" -ForegroundColor Cyan
Write-Host "   - 로컬 Tailscale IP: $localTailscaleIP" -ForegroundColor White
Write-Host "   - 로컬 Ollama URL: http://$localTailscaleIP:11434" -ForegroundColor White
Write-Host "   - 환경 변수 파일: $envFilePath" -ForegroundColor White

Write-Host "`n다음 단계:" -ForegroundColor Yellow
Write-Host "   1. 로컬 Ollama 외부 접근 허용 (OLLAMA_HOST=0.0.0.0:11434)" -ForegroundColor White
Write-Host "   2. api.ts 수정하여 프로덕션에서도 로컬 시도" -ForegroundColor White
Write-Host "   3. Vercel 환경 변수 설정 (VITE_LOCAL_OLLAMA_URL)" -ForegroundColor White
Write-Host "   4. 프로덕션 배포 후 테스트" -ForegroundColor White

