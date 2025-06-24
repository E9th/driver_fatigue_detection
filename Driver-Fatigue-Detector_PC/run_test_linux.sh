#!/bin/bash
echo "🖥️ Driver Fatigue Detection - PC Test (Linux/macOS)"
echo

# ตรวจสอบ Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 not found. Please install Python3 first."
    exit 1
fi

# ติดตั้ง requirements
echo "📦 Installing requirements..."
python3 install_requirements.py

# ติดตั้ง TTS สำหรับ Linux
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🗣️ Installing TTS for Linux..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y espeak espeak-data-th
    elif command -v yum &> /dev/null; then
        sudo yum install -y espeak espeak-data
    else
        echo "⚠️ Please install espeak manually"
    fi
fi

echo
echo "🚀 Starting notification test..."
python3 test_notification_system.py
