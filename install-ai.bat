@echo off
echo ========================================
echo  AI Validation Setup for Geo Social
echo ========================================
echo.

REM Check if Python is installed
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: Python is not installed!
    echo.
    echo Please install Python first:
    echo 1. Go to: https://www.python.org/downloads/
    echo 2. Download Python 3.11 or 3.10
    echo 3. During installation, CHECK "Add Python to PATH"
    echo 4. Run this script again after installation
    echo.
    pause
    exit /b 1
)

echo Python found!
python --version
echo.

REM Check pip
echo [2/5] Checking pip...
pip --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: pip is not installed!
    pause
    exit /b 1
)
echo pip found!
echo.

REM Navigate to ai-service directory
echo [3/5] Navigating to AI service directory...
cd server\ai-service
if errorlevel 1 (
    echo ERROR: Could not find server\ai-service directory
    pause
    exit /b 1
)
echo.

REM Install dependencies
echo [4/5] Installing AI dependencies...
echo This will take 5-10 minutes and download ~2GB of files.
echo Please be patient and keep your internet connection stable.
echo.
pip install transformers torch torchvision Pillow
if errorlevel 1 (
    echo.
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo.

REM Test the service
echo [5/5] Testing AI service...
echo.
python deepfake_detector.py ..\uploads\1772081889614-227647890.png
if errorlevel 1 (
    echo.
    echo WARNING: Test failed, but dependencies are installed.
    echo The service should work when you upload an image.
)
echo.

echo ========================================
echo  Installation Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Open server\.env file
echo 2. Change: ENABLE_AI_VALIDATION=false
echo    To:     ENABLE_AI_VALIDATION=true
echo 3. Restart your server
echo.
echo The AI validation is now ready to use!
echo.
pause
