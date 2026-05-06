# ChoiGPT Corp. Emergency Git History Cleaner v1.1
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Red
Write-Host " [긴급] GitHub 커밋 이력 내 모든 API 키 흔적 삭제 " -ForegroundColor Red
Write-Host "====================================================" -ForegroundColor Red

# 1. 사용자 확인
$confirm = Read-Host "이 작업은 과거의 모든 커밋 이력을 수정하고 강제로 Push합니다. 진행하시겠습니까? (y/n)"
if ($confirm -ne "y") { exit }

try {
    Write-Host "`n1. 깃허브 이력에서 보안 위협이 되는 파일들의 과거 흔적을 지웁니다..." -ForegroundColor Yellow
    # 노출된 파일들을 이력에서 모두 제거 (필요한 경우 나중에 다시 추가)
    $targetFiles = "admin/dashboard.js script.js temp_migration/engine/script.js"
    
    foreach ($file in $targetFiles.Split(" ")) {
        Write-Host "Cleaning history for: $file" -ForegroundColor Gray
        git filter-branch --force --index-filter `
        "git rm --cached --ignore-unmatch $file" `
        --prune-empty --tag-name-filter cat -- --all
    }

    Write-Host "`n2. 수정된 안전한 로컬 파일들을 다시 추가합니다..." -ForegroundColor Yellow
    git add admin/dashboard.js script.js .gitignore
    git commit -m "Security: Complete removal of hardcoded API keys and integration of localStorage system"

    Write-Host "`n3. 원격 저장소에 강제 푸시(Force Push)합니다..." -ForegroundColor Yellow
    git push origin --force --all
    git push origin --force --tags

    Write-Host "`n[성공] 모든 이력이 청소되었습니다!" -ForegroundColor Green
    Write-Host "중요: 1. Google Gemini API 키를 삭제 후 재발급 받으세요." -ForegroundColor White
    Write-Host "중요: 2. Supabase API (anon) 키도 대시보드에서 갱신(Rotate) 하세요." -ForegroundColor White
} catch {
    Write-Host "`n[에러] 작업 중 오류가 발생했습니다: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n아무 키나 누르면 종료됩니다..." -ForegroundColor Gray
$null = [Console]::ReadKey()
