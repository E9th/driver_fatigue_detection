#!/usr/bin/env python3
"""
ติดตั้ง dependencies สำหรับทดสอบบน PC
"""

import subprocess
import sys
import platform

def install_package(package):
    """ติดตั้ง Python package"""
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", package])
        return True
    except subprocess.CalledProcessError:
        return False

def main():
    print("🔧 Installing PC Test Requirements...")
    print(f"Platform: {platform.system()} {platform.release()}")
    
    # รายการ packages ที่ต้องการ
    packages = []
    
    # TTS สำหรับ Windows
    if platform.system() == "Windows":
        packages.append("pyttsx3")
    
    # Firebase (ถ้าต้องการเชื่อมต่อจริง)
    packages.extend([
        "pyrebase4",
        "requests"
    ])
    
    # ติดตั้ง packages
    for package in packages:
        print(f"📦 Installing {package}...")
        if install_package(package):
            print(f"✅ {package} installed successfully")
        else:
            print(f"❌ Failed to install {package}")
    
    # แสดงคำแนะนำสำหรับ TTS
    print("\n🗣️ TTS Setup Instructions:")
    
    if platform.system() == "Windows":
        print("✅ Windows: pyttsx3 installed (should work out of the box)")
    elif platform.system() == "Darwin":  # macOS
        print("✅ macOS: Uses built-in 'say' command (no additional setup needed)")
    elif platform.system() == "Linux":
        print("⚠️ Linux: Install espeak with:")
        print("   sudo apt-get install espeak espeak-data-th")
        print("   or")
        print("   sudo apt-get install speech-dispatcher")
    
    print("\n🎉 Setup completed! Run the test with:")
    print("   python Driver-Fatigue-Detector_PC/test_notification_system.py")

if __name__ == "__main__":
    main()
