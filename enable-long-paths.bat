@echo off
echo ========================================
echo  Enable Windows Long Paths
echo ========================================
echo.
echo This will enable Windows Long Path support
echo which is required for AI validation.
echo.
echo You need to run this as Administrator!
echo.
pause

echo Enabling Long Paths in Registry...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f

if errorlevel 1 (
    echo.
    echo ERROR: Failed to enable long paths.
    echo Please run this script as Administrator:
    echo 1. Right-click on enable-long-paths.bat
    echo 2. Select "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SUCCESS!
echo ========================================
echo.
echo Long paths have been enabled.
echo.
echo IMPORTANT: You MUST restart your computer now!
echo.
echo After restart:
echo 1. Run: install-ai.bat
echo 2. This will complete the AI installation
echo.
pause
