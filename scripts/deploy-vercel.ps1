# 🚀 Vercel 자동 배포 스크립트
# 작성일: 2026-01-20
# 프로젝트: mkm-study20260120

$ErrorActionPreference = "Stop"

# 색상 출력 함수
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Green "╔════════════════════════════════════╗"
Write-ColorOutput Green "║   🚀 Vercel 자동 배포 시작        ║"
Write-ColorOutput Green "╚════════════════════════════════════╝"
Write-Output ""

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# 1. Vercel CLI 확인
Write-ColorOutput Yellow "[1/5] Vercel CLI 확인..."
if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-ColorOutput Red "❌ Vercel CLI가 설치되지 않았습니다."
    Write-ColorOutput Yellow "   설치 중: npm i -g vercel"
    npm i -g vercel
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Vercel CLI 설치 실패"
        exit 1
    }
}
Write-ColorOutput Green "   ✅ Vercel CLI 확인 완료"
Write-Output ""

# 2. Vercel 로그인 확인
Write-ColorOutput Yellow "[2/5] Vercel 로그인 확인..."
$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0 -or $whoami -match "Not logged in") {
    Write-ColorOutput Yellow "⚠️ Vercel에 로그인되지 않았습니다."
    Write-ColorOutput Cyan "   브라우저에서 로그인하세요..."
    vercel login
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ Vercel 로그인 실패"
        exit 1
    }
} else {
    Write-ColorOutput Green "   ✅ Vercel 로그인 확인: $whoami"
}
Write-Output ""

# 3. 빌드 확인
Write-ColorOutput Yellow "[3/5] 빌드 확인..."
if (-not (Test-Path "dist")) {
    Write-ColorOutput Yellow "   dist 폴더가 없습니다. 빌드 실행 중..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ 빌드 실패"
        exit 1
    }
}
Write-ColorOutput Green "   ✅ 빌드 확인 완료"
Write-Output ""

# 4. 환경 변수 확인
Write-ColorOutput Yellow "[4/5] 환경 변수 확인..."
$envVars = @{
    "VITE_VPS_GEMMA3_URL" = "http://148.230.97.246:11434"
    "VITE_API_BASE_URL" = "http://148.230.97.246:8003"
}

Write-ColorOutput Cyan "   환경 변수:"
foreach ($key in $envVars.Keys) {
    Write-ColorOutput Gray "     - $key = $($envVars[$key])"
}
Write-Output ""

# 5. Vercel 배포 실행
Write-ColorOutput Yellow "[5/5] Vercel 배포 실행..."
Write-ColorOutput Cyan "   프로덕션 배포 중..."

# 환경 변수를 포함하여 배포
$deployCommand = "vercel --prod --yes"
foreach ($key in $envVars.Keys) {
    $deployCommand += " --env $key=$($envVars[$key])"
}

# 배포 실행
Invoke-Expression $deployCommand

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ 배포 실패"
    Write-ColorOutput Yellow "   수동 배포를 시도하세요:"
    Write-ColorOutput Yellow "   vercel --prod"
    exit 1
}

Write-Output ""
Write-ColorOutput Green "╔════════════════════════════════════╗"
Write-ColorOutput Green "║   ✅ 배포 완료!                    ║"
Write-ColorOutput Green "╚════════════════════════════════════╝"
Write-Output ""
Write-ColorOutput Cyan "📋 배포 정보:"
Write-ColorOutput White "   - 배포 플랫폼: Vercel"
Write-ColorOutput White "   - 프로젝트: mkm-study20260120"
Write-Output ""
Write-ColorOutput Yellow "🔍 확인 사항:"
Write-ColorOutput White "   1. Vercel 대시보드에서 배포 상태 확인"
Write-ColorOutput White "   2. 환경 변수 설정 확인 (Vercel 웹 UI)"
Write-ColorOutput White "   3. 배포된 URL에서 앱 테스트"
Write-Output ""
Write-ColorOutput Green "🚀 배포 완료! Vercel 대시보드에서 확인하세요:"
Write-ColorOutput Cyan "   https://vercel.com/dashboard"
Write-Output ""

