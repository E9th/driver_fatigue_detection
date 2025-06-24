#!/usr/bin/env python3
"""
Driver Fatigue Detection System - PC Test Version
สำหรับทดสอบระบบการแจ้งเตือนบน PC
"""

import sys
import os
import time
import threading
import json
import subprocess
import platform
from datetime import datetime

# ตรวจสอบ OS
IS_WINDOWS = platform.system() == "Windows"
IS_MAC = platform.system() == "Darwin"
IS_LINUX = platform.system() == "Linux"

class PCNotificationHandler:
    def __init__(self):
        self.is_listening = False
        self.listener_thread = None
        self.current_notifications = {}
        
        # Firebase config (ใส่ config จริงของคุณ)
        self.firebase_config = {
            "databaseURL": "YOUR_FIREBASE_DATABASE_URL",
            "apiKey": "YOUR_API_KEY",
            "authDomain": "YOUR_AUTH_DOMAIN",
            "projectId": "YOUR_PROJECT_ID"
        }
        
        # Device ID สำหรับทดสอบ
        self.device_id = "TEST_DEVICE_PC"
        
        print(f"🖥️ PC Notification Handler initialized")
        print(f"   OS: {platform.system()} {platform.release()}")
        print(f"   Device ID: {self.device_id}")
        
    def start_listening(self):
        """เริ่มฟังคำสั่งแจ้งเตือน (จำลอง)"""
        if self.is_listening:
            return
            
        self.is_listening = True
        self.listener_thread = threading.Thread(target=self._simulate_listening, daemon=True)
        self.listener_thread.start()
        print("🔔 PC Notification handler started listening...")
        
    def stop_listening(self):
        """หยุดฟังคำสั่งแจ้งเตือน"""
        self.is_listening = False
        if self.listener_thread:
            self.listener_thread.join(timeout=5)
        print("🔔 PC Notification handler stopped listening")
    
    def _simulate_listening(self):
        """จำลองการฟังคำสั่งจาก Firebase"""
        print("👂 Simulating Firebase listening...")
        print("💡 ใช้คำสั่ง 'test' เพื่อทดสอบการแจ้งเตือน")
        
        while self.is_listening:
            try:
                # ในการใช้งานจริง จะเชื่อมต่อ Firebase ที่นี่
                # สำหรับทดสอบ ให้รอคำสั่งจาก console
                time.sleep(1)
                
            except Exception as e:
                print(f"❌ Error in listening loop: {e}")
                time.sleep(5)
    
    def test_notification(self, message="ทดสอบระบบการแจ้งเตือน", notification_type="alert", enable_tts=True):
        """ทดสอบการแจ้งเตือน"""
        print(f"\n🧪 Testing notification...")
        print(f"   Message: {message}")
        print(f"   Type: {notification_type}")
        print(f"   TTS: {enable_tts}")
        
        # จำลองข้อมูลการแจ้งเตือน
        notification_data = {
            "message": message,
            "type": notification_type,
            "channels": ["sound_with_tts" if enable_tts else "sound", "display"],
            "priority": "high" if notification_type == "emergency" else "medium",
            "timestamp": datetime.now().isoformat()
        }
        
        # ประมวลผลการแจ้งเตือน
        self._handle_test_notification("TEST_001", notification_data)
    
    def _handle_test_notification(self, notification_id, notification_data):
        """จัดการการแจ้งเตือนทดสอบ"""
        try:
            message = notification_data.get('message', 'ทดสอบระบบ')
            channels = notification_data.get('channels', ['sound', 'display'])
            notification_type = notification_data.get('type', 'alert')
            priority = notification_data.get('priority', 'medium')
            
            print(f"\n🔔 Processing test notification {notification_id}")
            print(f"   Type: {notification_type}")
            print(f"   Priority: {priority}")
            print(f"   Message: {message}")
            print(f"   Channels: {channels}")
            
            results = {}
            
            # ประมวลผลแต่ละช่องทาง
            for channel in channels:
                try:
                    if channel == "sound" or channel == "sound_with_tts":
                        enable_tts = channel == "sound_with_tts"
                        results["sound"] = self._play_pc_sound_alert(message, priority, enable_tts)
                    elif channel == "display":
                        results["display"] = self._show_pc_display_alert(message, priority)
                except Exception as e:
                    print(f"❌ Error in channel {channel}: {e}")
                    results[channel.replace("_with_tts", "")] = False
            
            # แสดงผลลัพธ์
            print(f"\n✅ Test notification {notification_id} completed")
            for channel, success in results.items():
                status = "✅ Success" if success else "❌ Failed"
                print(f"   {channel}: {status}")
                
        except Exception as e:
            print(f"❌ Error handling test notification {notification_id}: {e}")
    
    def _play_pc_sound_alert(self, message, priority, enable_tts=True):
        """เล่นเสียงแจ้งเตือนบน PC"""
        try:
            print(f"\n🔊 Playing PC sound alert...")
            print(f"   Priority: {priority}")
            print(f"   TTS Enabled: {enable_tts}")
            
            # เล่นเสียงแจ้งเตือนก่อน
            beep_count = 3 if priority == "critical" else 2 if priority == "high" else 1
            
            for i in range(beep_count):
                print(f"🎵 Beep {i+1}/{beep_count}")
                self._play_system_beep()
                if i < beep_count - 1:
                    time.sleep(0.5)
            
            # หยุด 2 วินาทีก่อน TTS
            if enable_tts:
                print("⏳ Waiting 2 seconds before TTS...")
                time.sleep(2)
                
                # เล่น Text-to-Speech
                tts_success = self._play_pc_tts(message, priority)
                
                if not tts_success:
                    print("⚠️ TTS not available, showing text instead")
                    print(f"📢 TTS Message: '{message}'")
            
            return True
            
        except Exception as e:
            print(f"❌ Error playing PC sound alert: {e}")
            return False
    
    def _play_system_beep(self):
        """เล่นเสียง beep ของระบบ"""
        try:
            if IS_WINDOWS:
                # Windows
                import winsound
                winsound.Beep(1000, 500)  # 1000Hz, 500ms
            elif IS_MAC:
                # macOS
                os.system("afplay /System/Library/Sounds/Glass.aiff")
            elif IS_LINUX:
                # Linux
                os.system("paplay /usr/share/sounds/alsa/Front_Left.wav 2>/dev/null || echo -e '\a'")
            else:
                # Fallback - terminal bell
                print("\a", end="", flush=True)
                
        except Exception as e:
            print(f"⚠️ System beep failed: {e}")
            print("\a", end="", flush=True)  # Fallback
    
    def _play_pc_tts(self, message, priority):
        """เล่น Text-to-Speech บน PC"""
        try:
            print(f"🗣️ Playing TTS: '{message}'")
            
            # ปรับความเร็วตามความสำคัญ
            rate = 120 if priority == "critical" else 140 if priority == "high" else 160
            
            if IS_WINDOWS:
                return self._play_windows_tts(message, rate)
            elif IS_MAC:
                return self._play_mac_tts(message, rate)
            elif IS_LINUX:
                return self._play_linux_tts(message, rate)
            else:
                print("⚠️ TTS not supported on this platform")
                return False
                
        except Exception as e:
            print(f"❌ TTS error: {e}")
            return False
    
    def _play_windows_tts(self, message, rate):
        """Windows TTS"""
        try:
            import pyttsx3
            engine = pyttsx3.init()
            engine.setProperty('rate', rate)
            engine.setProperty('volume', 0.8)
            engine.say(message)
            engine.runAndWait()
            print("✅ Windows TTS completed")
            return True
        except ImportError:
            print("⚠️ pyttsx3 not installed. Install with: pip install pyttsx3")
            return False
        except Exception as e:
            print(f"❌ Windows TTS failed: {e}")
            return False
    
    def _play_mac_tts(self, message, rate):
        """macOS TTS"""
        try:
            # ใช้ say command ของ macOS
            subprocess.run(['say', '-r', str(rate), message], 
                         timeout=30, check=True)
            print("✅ macOS TTS completed")
            return True
        except subprocess.CalledProcessError as e:
            print(f"❌ macOS TTS failed: {e}")
            return False
        except FileNotFoundError:
            print("⚠️ 'say' command not found")
            return False
    
    def _play_linux_tts(self, message, rate):
        """Linux TTS"""
        try:
            # ลอง espeak ก่อน
            subprocess.run(['espeak', '-s', str(rate), message], 
                         timeout=30, check=True)
            print("✅ Linux TTS (espeak) completed")
            return True
        except (subprocess.CalledProcessError, FileNotFoundError):
            try:
                # ลอง spd-say
                subprocess.run(['spd-say', message], 
                             timeout=30, check=True)
                print("✅ Linux TTS (spd-say) completed")
                return True
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("⚠️ TTS not available. Install with: sudo apt-get install espeak")
                return False
    
    def _show_pc_display_alert(self, message, priority):
        """แสดงการแจ้งเตือนบนหน้าจอ PC"""
        try:
            print(f"\n📺 PC Display Alert:")
            print(f"   Priority: {priority}")
            print(f"   Message: {message}")
            print(f"   Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            
            # สร้างไฟล์ alert สำหรับ GUI (ถ้ามี)
            alert_data = {
                "message": message,
                "priority": priority,
                "timestamp": datetime.now().isoformat(),
                "type": "notification",
                "platform": "PC"
            }
            
            # เขียนไฟล์ alert
            os.makedirs("temp", exist_ok=True)
            with open('temp/pc_alert_notification.json', 'w', encoding='utf-8') as f:
                json.dump(alert_data, f, ensure_ascii=False, indent=2)
            
            print("✅ Display alert saved to temp/pc_alert_notification.json")
            return True
            
        except Exception as e:
            print(f"❌ Error showing PC display alert: {e}")
            return False

def main():
    """ฟังก์ชันหลักสำหรับทดสอบ"""
    print("=" * 60)
    print("🖥️ Driver Fatigue Detection System - PC Test Version")
    print("🔔 Notification System Tester")
    print("=" * 60)
    
    # สร้าง notification handler
    handler = PCNotificationHandler()
    
    try:
        # เริ่มระบบ
        handler.start_listening()
        
        print("\n📋 Available commands:")
        print("  'test' - ทดสอบการแจ้งเตือนพื้นฐาน")
        print("  'emergency' - ทดสอบการแจ้งเตือนฉุกเฉิน")
        print("  'custom' - ทดสอบข้อความกำหนดเอง")
        print("  'no-tts' - ทดสอบแบบไม่มี TTS")
        print("  'quit' - ออกจากโปรแกรม")
        
        while True:
            try:
                command = input("\n🎮 Enter command: ").strip().lower()
                
                if command == "quit" or command == "q":
                    break
                elif command == "test":
                    handler.test_notification(
                        message="ทดสอบระบบการแจ้งเตือน กรุณาตรวจสอบสถานะผู้ขับขี่",
                        notification_type="alert",
                        enable_tts=True
                    )
                elif command == "emergency":
                    handler.test_notification(
                        message="การแจ้งเตือนฉุกเฉิน ตรวจพบความง่วงนอนระดับสูง กรุณาหยุดพักผ่อนทันที",
                        notification_type="emergency",
                        enable_tts=True
                    )
                elif command == "custom":
                    custom_message = input("📝 Enter custom message: ")
                    if custom_message.strip():
                        handler.test_notification(
                            message=custom_message,
                            notification_type="alert",
                            enable_tts=True
                        )
                elif command == "no-tts":
                    handler.test_notification(
                        message="ทดสอบแบบไม่มี Text-to-Speech",
                        notification_type="warning",
                        enable_tts=False
                    )
                else:
                    print("❌ Unknown command. Type 'quit' to exit.")
                    
            except KeyboardInterrupt:
                print("\n🛑 Interrupted by user")
                break
            except Exception as e:
                print(f"❌ Error: {e}")
        
    finally:
        print("\n🛑 Shutting down...")
        handler.stop_listening()
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()
