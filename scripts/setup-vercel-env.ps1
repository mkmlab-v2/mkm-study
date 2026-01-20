# 🚀 Vercel 환경 변수 자동 설정 스크립트
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
Write-ColorOutput Green "║   🔧 Vercel 환경 변수 설정        ║"
Write-ColorOutput Green "╚════════════════════════════════════╝"
Write-Output ""

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# 환경 변수 설정
$envVars = @{
    "VITE_VPS_GEMMA3_URL" = "http://148.230.97.246:11434"
    "VITE_API_BASE_URL" = "http://148.230.97.246:8003"
}

Write-ColorOutput Yellow "환경 변수 설정 중..."
Write-Output ""

foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    Write-ColorOutput Cyan "  - $key = $value"
    
    # Vercel CLI로 환경 변수 추가 (프로덕션, 프리뷰, 개발 모두)
    $result = npx vercel env add $key production 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "    ✅ Production 설정 완료"
    } else {
        Write-ColorOutput Yellow "    ⚠️ Production 설정 실패 (수동 설정 필요)"
    }
    
    # 프리뷰 환경에도 추가
    $result = npx vercel env add $key preview 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "    ✅ Preview 설정 완료"
    }
    
    # 개발 환경에도 추가
    $result = npx vercel env add $key development 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "    ✅ Development 설정 완료"
    }
    
    Write-Output ""
}

Write-ColorOutput Green "╔════════════════════════════════════╗"
Write-ColorOutput Green "║   ✅ 환경 변수 설정 완료          ║"
Write-ColorOutput Green "╚════════════════════════════════════╝"
Write-Output ""
Write-ColorOutput Yellow "⚠️ 참고: Vercel CLI로 환경 변수를 설정하려면 로그인이 필요합니다."
Write-ColorOutput Yellow "   또는 Vercel 웹 UI에서 수동으로 설정하세요:"
Write-ColorOutput Cyan "   https://vercel.com/mkmlab-v2/mkm-study20260120/settings/environment-variables"
Write-Output ""

