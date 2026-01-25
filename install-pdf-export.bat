@echo off
REM PDF Export Feature - Installation Script (Windows)
REM Usage: install-pdf-export.bat

color 0A
echo.
echo ========================================================
echo  CureOS PDF Export Feature - Installation Script
echo ========================================================
echo.

REM Step 1: Check Node.js
echo [*] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo [OK] Node.js found: %NODE_VERSION%
echo.

REM Step 2: Check npm
echo [*] Checking npm installation...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [X] npm not found. Please install npm first.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm -v') do set NPM_VERSION=%%i
echo [OK] npm found: %NPM_VERSION%
echo.

REM Step 3: Install jsPDF
echo [*] Installing jsPDF and jsPDF-AutoTable...
call npm install jspdf jspdf-autotable
if %errorlevel% neq 0 (
    echo [X] Failed to install dependencies
    pause
    exit /b 1
)
echo [OK] Dependencies installed successfully
echo.

REM Step 4: Verify files exist
echo [*] Verifying PDF export files...
set all_exist=true

if exist "src\lib\pdf-generator.ts" (
    echo [OK] src\lib\pdf-generator.ts
) else (
    echo [X] src\lib\pdf-generator.ts - NOT FOUND
    set all_exist=false
)

if exist "src\app\api\doctor\patients\[id]\export-pdf\route.ts" (
    echo [OK] src\app\api\doctor\patients\[id]\export-pdf\route.ts
) else (
    echo [X] src\app\api\doctor\patients\[id]\export-pdf\route.ts - NOT FOUND
    set all_exist=false
)

if exist "src\components\doctor\patient-detail.tsx" (
    echo [OK] src\components\doctor\patient-detail.tsx
) else (
    echo [X] src\components\doctor\patient-detail.tsx - NOT FOUND
    set all_exist=false
)

if "%all_exist%"=="false" (
    echo.
    echo [X] Some required files are missing!
    echo Please ensure all files were created correctly.
    pause
    exit /b 1
)
echo.

REM Step 5: Success
echo ========================================================
echo [OK] Installation Complete!
echo ========================================================
echo.
echo Next steps:
echo.
echo 1. Restart your development server:
echo    npm run dev
echo.
echo 2. Open your browser and navigate to:
echo    http://localhost:3000
echo.
echo 3. Log in as a Doctor and navigate to Patients
echo.
echo 4. Click on a patient to view details
echo.
echo 5. Look for the 'Export PDF' button in the top-right corner
echo.
echo Documentation:
echo - Quick Reference: docs/PDF_EXPORT_QUICK_REFERENCE.md
echo - Setup Guide: docs/guides/11-pdf-export-setup.md
echo - Implementation: docs/PDF_EXPORT_IMPLEMENTATION.md
echo - Architecture: docs/PDF_EXPORT_ARCHITECTURE.md
echo.
echo Happy exporting! [Download Icon]
echo.
pause
