# 🚀 MKM-Study20260120 VPS Nitro 배포 스크립트
# 
# 작성일: 2026-01-20
# VPS: 148.230.97.246
# 목적: 로컬 빌드 후 dist만 전송 (소스 코드 제외, VPS 빌드 제거)
# 핵심: "개발은 로컬에서, 상용화는 클린한 VPS에서"

param(
    [string]$Domain = "study.mkmlife.com"
)

$ErrorActionPreference = "Stop"

# 색상 출력 함수
function Write-ColorOutput($ForegroundColor, $Message) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

# 설정 변수
$PROJECT_NAME = "mkm-study20260120"
$PROJECT_DIR = "/var/www/mkm-study20260120"
$VPS_HOST = "148.230.97.246"
$VPS_USER = "root"
$SSH_KEY = "$env:USERPROFILE\.ssh\hostinger_mkmlife"
$FRONTEND_PORT = 3001
$SENTINEL_API_PORT = 8003  # 🏛️ 로컬 센티널 API 포트 (Athena Sovereign v2.5 Nitro)
$PM2_FRONTEND_NAME = "mkm-study20260120-frontend"

Write-ColorOutput Green "╔════════════════════════════════════╗"
Write-ColorOutput Green "║   🚀 MKM-Study20260120 Nitro 배포   ║"
Write-ColorOutput Green "║   Lean & Nitro: dist만 전송         ║"
Write-ColorOutput Green "╚════════════════════════════════════╝"
Write-ColorOutput Cyan "도메인: $Domain"
Write-ColorOutput Cyan "프론트엔드 포트: $FRONTEND_PORT"
Write-ColorOutput Cyan "로컬 센티널 API 포트: $SENTINEL_API_PORT 🏛️"
Write-Output ""

# 프로젝트 루트로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# 1. 로컬 빌드 확인 및 실행
Write-ColorOutput Yellow "[1/6] 로컬 빌드 확인 및 실행..."
if (-not (Test-Path "dist")) {
    Write-ColorOutput Yellow "   dist 폴더가 없습니다. 빌드 실행 중..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-ColorOutput Red "❌ 빌드 실패"
        exit 1
    }
} else {
    Write-ColorOutput Yellow "   기존 dist 폴더 발견. 재빌드 권장..."
    $rebuild = Read-Host "   재빌드하시겠습니까? (Y/N, 기본값: Y)"
    if ($rebuild -ne "N" -and $rebuild -ne "n") {
        npm run build
        if ($LASTEXITCODE -ne 0) {
            Write-ColorOutput Red "❌ 빌드 실패"
            exit 1
        }
    }
}

if (-not (Test-Path "dist")) {
    Write-ColorOutput Red "❌ dist 폴더가 없습니다. 빌드를 먼저 실행하세요."
    exit 1
}

Write-ColorOutput Green "   ✅ 빌드 완료"
Write-Output ""

# 2. SSH 키 확인
Write-ColorOutput Yellow "[2/6] SSH 키 확인..."
if (-not (Test-Path $SSH_KEY)) {
    Write-ColorOutput Red "❌ SSH 키를 찾을 수 없습니다: $SSH_KEY"
    Write-ColorOutput Yellow "   SSH 키 경로를 확인하거나 다른 인증 방법을 사용하세요."
    exit 1
}
Write-ColorOutput Green "   ✅ SSH 키 확인 완료"
Write-Output ""

# 3. VPS 연결 확인
Write-ColorOutput Yellow "[3/6] VPS 연결 확인..."
$testConnection = ssh -i $SSH_KEY -o StrictHostKeyChecking=no -o ConnectTimeout=5 "$VPS_USER@$VPS_HOST" "echo 'connected'" 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ VPS 연결 실패"
    Write-ColorOutput Yellow "   SSH 키 또는 VPS 접속 정보를 확인하세요."
    exit 1
}
Write-ColorOutput Green "   ✅ VPS 연결 확인 완료"
Write-Output ""

# 4. VPS 디렉토리 생성
Write-ColorOutput Yellow "[4/6] VPS 디렉토리 생성..."
$createDirCmd = "mkdir -p $PROJECT_DIR && chmod 755 $PROJECT_DIR"
ssh -i $SSH_KEY -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" $createDirCmd
if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ VPS 디렉토리 생성 실패"
    exit 1
}
Write-ColorOutput Green "   ✅ VPS 디렉토리 생성 완료"
Write-Output ""

# 5. dist 폴더 전송 (Nitro: dist만 전송)
Write-ColorOutput Yellow "[5/6] dist 폴더 전송 중 (Nitro 모드)..."
Write-ColorOutput Cyan "   소스 코드는 제외하고 dist만 전송합니다."

# dist 폴더를 tar로 압축
$distArchive = "dist.tar.gz"
Write-ColorOutput Gray "   압축 중: dist -> $distArchive"
Compress-Archive -Path "dist\*" -DestinationPath $distArchive -Force

# VPS로 전송
Write-ColorOutput Gray "   전송 중: $distArchive -> VPS"
scp -i $SSH_KEY -o StrictHostKeyChecking=no $distArchive "$VPS_USER@${VPS_HOST}:$PROJECT_DIR/" 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ 파일 전송 실패"
    Remove-Item $distArchive -ErrorAction SilentlyContinue
    exit 1
}

# VPS에서 압축 해제 및 배치
Write-ColorOutput Gray "   VPS에서 압축 해제 중..."
$extractCmd = @"
cd $PROJECT_DIR && 
tar -xzf dist.tar.gz && 
rm -f dist.tar.gz && 
chmod -R 755 dist
"@
ssh -i $SSH_KEY -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" $extractCmd

if ($LASTEXITCODE -ne 0) {
    Write-ColorOutput Red "❌ VPS 압축 해제 실패"
    exit 1
}

# 로컬 압축 파일 삭제
Remove-Item $distArchive -ErrorAction SilentlyContinue

Write-ColorOutput Green "   ✅ dist 폴더 전송 완료"
Write-Output ""

# 6. Nginx 설정 및 서버 시작
Write-ColorOutput Yellow "[6/6] Nginx 설정 및 서버 시작..."

# 환경 변수 파일 생성 (VPS)
$envContent = @"
# VPS Gemma3 API
VITE_VPS_GEMMA3_URL=http://148.230.97.246:11434

# VPS 표준 API
VITE_API_BASE_URL=http://148.230.97.246:8003
VITE_API_KEY=your-api-key-here

# 메모리 경로 (File-Based Memory)
MEMORY_ROOT=/var/www/mkm-study20260120/memory/

# 센티널 API 포트
SENTINEL_API_PORT=$SENTINEL_API_PORT
"@

# .env 파일을 VPS에 전송
$envFile = ".env.production"
$envContent | Out-File -FilePath $envFile -Encoding UTF8
scp -i $SSH_KEY -o StrictHostKeyChecking=no $envFile "$VPS_USER@${VPS_HOST}:$PROJECT_DIR/.env" 2>&1 | Out-Null
Remove-Item $envFile -ErrorAction SilentlyContinue

# Nginx 설정 생성
$nginxConfig = @"
server {
    listen 80;
    server_name $Domain;
    
    root $PROJECT_DIR/dist;
    index index.html;
    
    location / {
        try_files `$uri `$uri/ /index.html;
    }
    
    # API 프록시 (선택적)
    location /api/ {
        proxy_pass http://localhost:$SENTINEL_API_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade `$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host `$host;
        proxy_cache_bypass `$http_upgrade;
    }
    
    # 정적 파일 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
"@

# Nginx 설정 파일 생성
$nginxConfigFile = "nginx-$PROJECT_NAME.conf"
$nginxConfig | Out-File -FilePath $nginxConfigFile -Encoding UTF8

# VPS에 Nginx 설정 전송
scp -i $SSH_KEY -o StrictHostKeyChecking=no $nginxConfigFile "$VPS_USER@${VPS_HOST}:/etc/nginx/sites-available/$PROJECT_NAME.conf" 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    # Nginx 설정 활성화 및 재시작
    $nginxCmd = @"
ln -sf /etc/nginx/sites-available/$PROJECT_NAME.conf /etc/nginx/sites-enabled/$PROJECT_NAME.conf && 
nginx -t && 
systemctl reload nginx
"@
    ssh -i $SSH_KEY -o StrictHostKeyChecking=no "$VPS_USER@$VPS_HOST" $nginxCmd
    
    if ($LASTEXITCODE -eq 0) {
        Write-ColorOutput Green "   ✅ Nginx 설정 완료"
    } else {
        Write-ColorOutput Yellow "   ⚠️ Nginx 설정 실패 (수동 설정 필요)"
    }
} else {
    Write-ColorOutput Yellow "   ⚠️ Nginx 설정 파일 전송 실패 (수동 설정 필요)"
}

Remove-Item $nginxConfigFile -ErrorAction SilentlyContinue

Write-Output ""
Write-ColorOutput Green "╔════════════════════════════════════╗"
Write-ColorOutput Green "║   ✅ 배포 완료!                     ║"
Write-ColorOutput Green "╚════════════════════════════════════╝"
Write-Output ""
Write-ColorOutput Cyan "📋 배포 정보:"
Write-ColorOutput White "   - 프로젝트: $PROJECT_NAME"
Write-ColorOutput White "   - VPS 경로: $PROJECT_DIR"
Write-ColorOutput White "   - 도메인: http://$Domain"
Write-ColorOutput White "   - 포트: $FRONTEND_PORT"
Write-Output ""
Write-ColorOutput Yellow "🔍 확인 사항:"
Write-ColorOutput White "   1. VPS에서 Nginx 설정 확인: /etc/nginx/sites-available/$PROJECT_NAME.conf"
Write-ColorOutput White "   2. 도메인 DNS 설정 확인: $Domain -> $VPS_HOST"
Write-ColorOutput White "   3. 방화벽 포트 확인: 80, 443"
Write-Output ""
Write-ColorOutput Green "🚀 배포 완료! 브라우저에서 확인하세요:"
Write-ColorOutput Cyan "   http://$Domain"
Write-Output ""

