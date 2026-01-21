# 🏛️ 하이브리드 Ollama 성능 테스트 스크립트
# 작성일: 2026-01-21
# 목적: 로컬 vs VPS 성능 측정

Write-Host "=== 하이브리드 Ollama 성능 테스트 ===" -ForegroundColor Cyan
Write-Host ""

# 테스트 질문
$testQuestion = "비트코인 전망해봐."

# 1. 로컬 Ollama 연결 테스트
Write-Host "[1] 로컬 Ollama 연결 테스트..." -ForegroundColor Yellow
$localStartTime = Get-Date

try {
    $localResponse = Invoke-RestMethod -Uri "http://localhost:11434/api/tags" -Method Get -TimeoutSec 1 -ErrorAction Stop
    $localEndTime = Get-Date
    $localLatency = ($localEndTime - $localStartTime).TotalMilliseconds
    
    Write-Host "✅ 로컬 연결 성공: ${localLatency}ms" -ForegroundColor Green
    Write-Host "   설치된 모델:" -ForegroundColor Gray
    foreach ($model in $localResponse.models) {
        Write-Host "   - $($model.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ 로컬 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
    $localLatency = $null
}

Write-Host ""

# 2. 로컬 Ollama 응답 속도 테스트
if ($localLatency) {
    Write-Host "[2] 로컬 Ollama 응답 속도 테스트..." -ForegroundColor Yellow
    
    $testBody = @{
        model = "athena-merged-v1:latest"
        prompt = $testQuestion
        stream = $false
        options = @{
            temperature = 0.7
            num_predict = 100
        }
    } | ConvertTo-Json
    
    try {
        $responseStartTime = Get-Date
        $response = Invoke-RestMethod -Uri "http://localhost:11434/api/generate" -Method Post -Body $testBody -ContentType "application/json" -TimeoutSec 30
        $responseEndTime = Get-Date
        $responseTime = ($responseEndTime - $responseStartTime).TotalMilliseconds
        
        Write-Host "✅ 첫 토큰 시간: ${responseTime}ms" -ForegroundColor Green
        Write-Host "   응답 길이: $($response.response.Length)자" -ForegroundColor Gray
        Write-Host "   응답 미리보기: $($response.response.Substring(0, [Math]::Min(100, $response.response.Length)))..." -ForegroundColor Gray
    } catch {
        Write-Host "❌ 응답 생성 실패: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host ""

# 3. VPS Ollama 연결 테스트
Write-Host "[3] VPS Ollama 연결 테스트..." -ForegroundColor Yellow
$vpsStartTime = Get-Date

try {
    $vpsResponse = Invoke-RestMethod -Uri "http://148.230.97.246:11434/api/tags" -Method Get -TimeoutSec 5 -ErrorAction Stop
    $vpsEndTime = Get-Date
    $vpsLatency = ($vpsEndTime - $vpsStartTime).TotalMilliseconds
    
    Write-Host "✅ VPS 연결 성공: ${vpsLatency}ms" -ForegroundColor Green
    Write-Host "   설치된 모델:" -ForegroundColor Gray
    foreach ($model in $vpsResponse.models) {
        Write-Host "   - $($model.name)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ VPS 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
    $vpsLatency = $null
}

Write-Host ""

# 4. 성능 비교 요약
Write-Host "=== 성능 비교 요약 ===" -ForegroundColor Cyan
if ($localLatency) {
    Write-Host "로컬 연결: ${localLatency}ms" -ForegroundColor Green
} else {
    Write-Host "로컬 연결: 실패" -ForegroundColor Red
}

if ($vpsLatency) {
    Write-Host "VPS 연결: ${vpsLatency}ms" -ForegroundColor Yellow
} else {
    Write-Host "VPS 연결: 실패" -ForegroundColor Red
}

if ($localLatency -and $vpsLatency) {
    $speedup = [Math]::Round($vpsLatency / $localLatency, 2)
    Write-Host ""
    Write-Host "로컬이 VPS보다 ${speedup}배 빠릅니다!" -ForegroundColor Green
}

Write-Host ""
Write-Host "테스트 완료!" -ForegroundColor Cyan

