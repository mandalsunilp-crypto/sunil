@echo off
title Verified Hub - GitHub & Vercel Automated Deployer
echo ========================================================
echo   VERIFIED HUB - AUTOMATED GITHUB & VERCEL DEPLOYMENT
echo   Target GitHub Account: mandalsunilp-crypto
echo   Target Repository: sunil
echo ========================================================
echo.

set /p GITHUB_TOKEN="Enter your GitHub Personal Access Token (or press Enter if configured): "

if "%GITHUB_TOKEN%"=="" (
    echo.
    echo [!] No GitHub Token provided.
    echo [i] Please generate a classic token with 'repo' scope at:
    echo     https://github.com/settings/tokens
    echo.
    pause
    exit /b
)

echo.
echo [+] Deploying codebase to https://github.com/mandalsunilp-crypto/sunil...
node push-via-token.js %GITHUB_TOKEN%

echo.
echo ========================================================
echo   VERCEL DEPLOYMENT INSTRUCTIONS
echo ========================================================
echo 1. Go to https://vercel.com/new
echo 2. Import 'mandalsunilp-crypto/sunil'
echo 3. Add Environment Variables:
echo    - NEXT_PUBLIC_SUPABASE_URL
echo    - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo    - SUPABASE_SERVICE_ROLE_KEY
echo 4. Click 'Deploy'!
echo ========================================================
echo.
pause
