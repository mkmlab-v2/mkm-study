#!/usr/bin/env pwsh
# -*- coding: utf-8 -*-
<#
.SYNOPSIS
    VPS에 학습 정보 API 서버 배포 스크립트

.DESCRIPTION
    learning_content_api.py를 VPS에 배포하고 실행합니다.
#>

$ErrorActionPreference = "Stop"

Write-Host "🚀 VPS 학습 정보 API 서버 배포 시작..." -ForegroundColor Cyan

# VPS 정보
$VPS_HOST = "148.230.97.246"
$VPS_USER = "root"  # 실제 사용자명으로 변경 필요
$VPS_BACKEND_DIR = "/var/www/mkm-study/backend"
$VPS_LEARNING_DIR = "/var/www/mkm-study/learning-content"

# 로컬 경로 (현재 디렉토리 기준)
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PROJECT_ROOT = Split-Path -Parent $SCRIPT_DIR
$LOCAL_BACKEND = Join-Path $PROJECT_ROOT "backend"
$LOCAL_SCRIPT = Join-Path $LOCAL_BACKEND "learning_content_api.py"

# 파일 존재 확인
if (-not (Test-Path $LOCAL_SCRIPT)) {
    Write-Host "❌ 학습 정보 API 파일을 찾을 수 없습니다: $LOCAL_SCRIPT" -ForegroundColor Red
    exit 1
}

Write-Host "✅ 로컬 파일 확인 완료" -ForegroundColor Green

# SSH 키 확인
$SSH_KEY = "$env:USERPROFILE\.ssh\id_rsa"
if (-not (Test-Path $SSH_KEY)) {
    Write-Host "⚠️ SSH 키를 찾을 수 없습니다. 패스워드 인증을 사용합니다." -ForegroundColor Yellow
    $USE_SSH_KEY = $false
} else {
    $USE_SSH_KEY = $true
}

# VPS 연결 테스트
Write-Host "🔍 VPS 연결 테스트 중..." -ForegroundColor Cyan
try {
    if ($USE_SSH_KEY) {
        ssh -i $SSH_KEY -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo '연결 성공'" 2>&1 | Out-Null
    } else {
        ssh -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo '연결 성공'" 2>&1 | Out-Null
    }
    Write-Host "✅ VPS 연결 성공" -ForegroundColor Green
} catch {
    Write-Host "❌ VPS 연결 실패: $_" -ForegroundColor Red
    exit 1
}

# VPS 디렉토리 생성
Write-Host "📁 VPS 디렉토리 생성 중..." -ForegroundColor Cyan
$sshCmd = "mkdir -p $VPS_BACKEND_DIR $VPS_LEARNING_DIR"
if ($USE_SSH_KEY) {
    ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" $sshCmd
} else {
    ssh "$VPS_USER@$VPS_HOST" $sshCmd
}

# 파일 전송
Write-Host "📤 파일 전송 중..." -ForegroundColor Cyan
if ($USE_SSH_KEY) {
    scp -i $SSH_KEY $LOCAL_SCRIPT "$VPS_USER@${VPS_HOST}:$VPS_BACKEND_DIR/"
} else {
    scp $LOCAL_SCRIPT "$VPS_USER@${VPS_HOST}:$VPS_BACKEND_DIR/"
}

Write-Host "✅ 파일 전송 완료" -ForegroundColor Green

# VPS에서 의존성 설치 및 서버 실행
Write-Host "🔧 VPS에서 의존성 설치 중..." -ForegroundColor Cyan
$installCmd = @"
cd $VPS_BACKEND_DIR
pip3 install fastapi uvicorn pydantic --quiet
"@

if ($USE_SSH_KEY) {
    ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" $installCmd
} else {
    ssh "$VPS_USER@$VPS_HOST" $installCmd
}

Write-Host "✅ 의존성 설치 완료" -ForegroundColor Green

# 서버 실행 (백그라운드, 포트 8004)
Write-Host "🚀 API 서버 시작 중 (포트 8004)..." -ForegroundColor Cyan
$startCmd = @"
cd $VPS_BACKEND_DIR
export LEARNING_API_PORT=8004
nohup python3 learning_content_api.py > learning_api.log 2>&1 &
echo `$!
"@

if ($USE_SSH_KEY) {
    $PID = ssh -i $SSH_KEY "$VPS_USER@$VPS_HOST" $startCmd
} else {
    $PID = ssh "$VPS_USER@$VPS_HOST" $startCmd
}

Write-Host "✅ API 서버 시작 완료 (PID: $PID)" -ForegroundColor Green

# 서버 상태 확인
Write-Host "🔍 서버 상태 확인 중..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# 포트 충돌 방지: 학습 콘텐츠 API는 8004 포트 사용
$LEARNING_API_PORT = 8004
try {
    $response = Invoke-WebRequest -Uri "http://$VPS_HOST:$LEARNING_API_PORT/" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ API 서버 정상 작동 중" -ForegroundColor Green
        Write-Host "   URL: http://$VPS_HOST:$LEARNING_API_PORT/" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️ API 서버 응답 확인 실패 (서버가 시작 중일 수 있습니다)" -ForegroundColor Yellow
    Write-Host "   로그 확인: ssh $VPS_USER@$VPS_HOST 'tail -f $VPS_BACKEND_DIR/learning_api.log'" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ 배포 완료!" -ForegroundColor Green
Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "1. 학습 정보 대량 저장 스크립트 실행" -ForegroundColor White
Write-Host "2. EBS 교과과정 데이터 임포트" -ForegroundColor White
Write-Host "3. 프론트엔드에서 학습 정보 API 테스트" -ForegroundColor White

