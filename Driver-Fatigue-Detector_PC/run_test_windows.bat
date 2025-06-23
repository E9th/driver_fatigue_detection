@echo off
echo 🖥️ Driver Fatigue Detection - PC Test (Windows)
echo.

REM ตรวจสอบ Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python not found. Please install Python first.
    pause
    exit /b 1
)

REM ติดตั้ง requirements
echo 📦 Installing requirements...
python install_requirements.py

echo.
echo 🚀 Starting notification test...
python test_notification_system.py

pause
