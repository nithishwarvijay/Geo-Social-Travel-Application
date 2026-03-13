@echo off
echo Setting up Deepfake Detection AI Service...
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo Error: Python is not installed. Please install Python 3.8 or higher.
    exit /b 1
)

echo Python found
python --version

REM Create virtual environment (optional but recommended)
echo.
echo Creating virtual environment...
python -m venv venv

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo.
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Setup complete!
echo.
echo To activate the virtual environment in the future, run:
echo   server\ai-service\venv\Scripts\activate.bat
echo.
echo To test the service, run:
echo   python deepfake_detector.py path\to\image.jpg

pause
