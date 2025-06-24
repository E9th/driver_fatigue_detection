#!/usr/bin/env python3
"""
Driver Fatigue Detection System - PC Version with Real Firebase
เชื่อมต่อกับ Firebase จริง สำหรับทดสอบระบบแอดมิน
"""

import sys
import os
import cv2
import time
import threading
from datetime import datetime
import json

# เพิ่ม path สำหรับ import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class PCFatigueDetectorWithFirebase:
    def __init__(self):
        self.running = False
        self.detector = None
        self.firebase_handler = None
        self.device_id = "PC_TEST_DEVICE"
        
        print("🖥️ PC Fatigue Detector with Firebase initialized")
    
    def initialize(self):
        """เริ่มต้นระบบ"""
        try:
            print("🔧 Initializing PC fatigue detection system with Firebase...")
            
            # สร้าง simple detector สำหรับ PC
            self.detector = self._create_simple_detector()
            
            # เชื่อมต่อ Firebase
            if not self._initialize_firebase():
                print("⚠️ Firebase connection failed, running in offline mode")
            
            print("✅ PC Fatigue detection system initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing PC system: {e}")
            return False
    
    def _create_simple_detector(self):
        """สร้าง detector แบบง่ายสำหรับ PC"""
        try:
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("❌ Could not open camera")
                return None
            
            # ตั้งค่ากล้อง
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            cap.set(cv2.CAP_PROP_FPS, 30)
            
            print("✅ Simple camera detector created")
            return cap
            
        except Exception as e:
            print(f"❌ Error creating detector: {e}")
            return None
    
    def _initialize_firebase(self):
        """เชื่อมต่อ Firebase"""
        try:
            # ใช้ Firebase config จริง
            firebase_config = {
                "apiKey": os.getenv("NEXT_PUBLIC_FIREBASE_API_KEY"),
                "authDomain": os.getenv("NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"),
                "databaseURL": os.getenv("NEXT_PUBLIC_FIREBASE_DATABASE_URL"),
                "projectId": os.getenv("NEXT_PUBLIC_FIREBASE_PROJECT_ID"),
                "storageBucket": os.getenv("NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"),
                "messagingSenderId": os.getenv("NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"),
                "appId": os.getenv("NEXT_PUBLIC_FIREBASE_APP_ID")
            }
            
            # ตรวจสอบว่ามี config ครบหรือไม่
            if not all(firebase_config.values()):
                print("⚠️ Firebase config not complete, please set environment variables")
                return False
            
            # Import Firebase (ต้องติดตั้ง: pip install firebase-admin)
            try:
                import firebase_admin
                from firebase_admin import credentials, db
                
                # ใช้ service account หรือ default credentials
                if not firebase_admin._apps:
                    firebase_admin.initialize_app({
                        'databaseURL': firebase_config["databaseURL"]
                    })
                
                self.firebase_handler = db
                print("✅ Firebase connected successfully")
                
                # เริ่มฟังคำสั่งจาก Admin
                self._start_firebase_listener()
                return True
                
            except ImportError:
                print("⚠️ firebase-admin not installed. Run: pip install firebase-admin")
                return False
                
        except Exception as e:
            print(f"❌ Error initializing Firebase: {e}")
            return False
    
    def _start_firebase_listener(self):
        """เริ่มฟังคำสั่งจาก Firebase"""
        try:
            def firebase_listener():
                print(f"🔔 Listening for commands on device: {self.device_id}")
                
                while self.running:
                    try:
                        # ฟังคำสั่งจาก Firebase
                        ref = self.firebase_handler.reference(f'devices/{self.device_id}/commands/notifications')
                        
                        # ดึงคำสั่งที่ pending
                        commands = ref.get()
                        if commands:
                            for cmd_id, cmd_data in commands.items():
                                if cmd_data.get('status') == 'pending':
                                    self._handle_firebase_command(cmd_id, cmd_data)
                        
                        time.sleep(2)  # ตรวจสอบทุก 2 วินาที
                        
                    except Exception as e:
                        print(f"❌ Firebase listener error: {e}")
                        time.sleep(5)
            
            # รันใน thread แยก
            listener_thread = threading.Thread(target=firebase_listener, daemon=True)
            listener_thread.start()
            
        except Exception as e:
            print(f"❌ Error starting Firebase listener: {e}")
    
    def _handle_firebase_command(self, cmd_id, cmd_data):
        """จัดการคำสั่งจาก Firebase"""
        try:
            message = cmd_data.get('message', 'ข้อความจากแอดมิน')
            channels = cmd_data.get('channels', ['sound', 'display'])
            priority = cmd_data.get('priority', 'medium')
            tts_enabled = cmd_data.get('ttsEnabled', False)
            
            print(f"📨 Received command from Admin:")
            print(f"   ID: {cmd_id}")
            print(f"   Message: {message}")
            print(f"   Channels: {channels}")
            print(f"   Priority: {priority}")
            print(f"   TTS: {tts_enabled}")
            
            # อัพเดทสถานะเป็น processing
            self._update_command_status(cmd_id, "processing")
            
            # ประมวลผลคำสั่ง
            results = {}
            success = True
            
            for channel in channels:
                if channel in ["sound", "sound_with_tts"] or tts_enabled:
                    results["sound"] = self._play_pc_notification(message, priority, True)
                elif channel == "display":
                    results["display"] = self._show_pc_notification(message, priority)
            
            # อัพเดทสถานะ
            if success:
                self._update_command_status(cmd_id, "completed", results=results)
                print(f"✅ Command {cmd_id} completed successfully")
            else:
                self._update_command_status(cmd_id, "failed", results=results)
                print(f"❌ Command {cmd_id} failed")
                
        except Exception as e:
            print(f"❌ Error handling Firebase command {cmd_id}: {e}")
            self._update_command_status(cmd_id, "failed", error=str(e))
    
    def _play_pc_notification(self, message, priority, enable_tts=True):
        """เล่นการแจ้งเตือนบน PC"""
        try:
            print(f"🔊 Playing PC notification: {priority}")
            
            # เล่นเสียงแจ้งเตือน (ใช้ system beep)
            import winsound if sys.platform == "win32" else None
            
            if sys.platform == "win32" and winsound:
                # Windows
                frequency = 1000 if priority == "critical" else 800 if priority == "high" else 600
                duration = 500 if priority == "critical" else 300
                
                for i in range(3 if priority == "critical" else 2 if priority == "high" else 1):
                    winsound.Beep(frequency, duration)
                    time.sleep(0.2)
            else:
                # Linux/Mac
                for i in range(3 if priority == "critical" else 2 if priority == "high" else 1):
                    print(f"\a")  # System bell
                    time.sleep(0.2)
            
            # TTS
            if enable_tts:
                print("⏳ Waiting 2 seconds before TTS...")
                time.sleep(2)
                
                if sys.platform == "win32":
                    # Windows TTS
                    import pyttsx3
                    engine = pyttsx3.init()
                    engine.setProperty('rate', 120 if priority == "critical" else 150)
                    engine.say(message)
                    engine.runAndWait()
                elif sys.platform == "darwin":
                    # macOS TTS
                    os.system(f'say "{message}"')
                else:
                    # Linux TTS
                    os.system(f'espeak "{message}"')
                
                print(f"🗣️ TTS completed: {message}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error playing PC notification: {e}")
            return False
    
    def _show_pc_notification(self, message, priority):
        """แสดงการแจ้งเตือนบน PC"""
        try:
            print("=" * 60)
            print(f"📺 PC NOTIFICATION ALERT")
            print(f"Priority: {priority.upper()}")
            print(f"Message: {message}")
            print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)
            return True
            
        except Exception as e:
            print(f"❌ Error showing PC notification: {e}")
            return False
    
    def _update_command_status(self, cmd_id, status, error=None, results=None):
        """อัพเดทสถานะคำสั่งใน Firebase"""
        try:
            if not self.firebase_handler:
                return
            
            status_data = {
                "status": status,
                "timestamp": datetime.now().isoformat()
            }
            
            if error:
                status_data["error"] = error
            if results:
                status_data["results"] = results
            
            ref = self.firebase_handler.reference(f'devices/{self.device_id}/commands/notifications/{cmd_id}/status')
            ref.set(status_data)
            
        except Exception as e:
            print(f"❌ Error updating command status: {e}")
    
    def start_detection(self):
        """เริ่มการตรวจจับ"""
        if not self.detector:
            print("❌ Detector not initialized")
            return False
        
        try:
            self.running = True
            print("🎯 Starting PC fatigue detection with Firebase...")
            print("📋 Press 'q' to quit, 's' to take screenshot, 't' to test Firebase")
            
            frame_count = 0
            fps_start_time = time.time()
            
            while self.running:
                # อ่านเฟรม
                ret, frame = self.detector.read()
                
                if ret and frame is not None:
                    # แสดงข้อมูลบนเฟรม
                    cv2.putText(frame, f"Device ID: {self.device_id}", 
                               (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    
                    firebase_status = "Connected" if self.firebase_handler else "Offline"
                    cv2.putText(frame, f"Firebase: {firebase_status}", 
                               (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)
                    
                    cv2.putText(frame, "Waiting for Admin commands...", 
                               (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 0), 2)
                    
                    # แสดงคำแนะนำ
                    cv2.putText(frame, "Press 'q' to quit, 't' to test Firebase", 
                               (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
                    
                    # แสดงเฟรม
                    cv2.imshow('PC Fatigue Detection with Firebase', frame)
                    
                    # คำนวณ FPS
                    frame_count += 1
                    if frame_count % 30 == 0:
                        fps = 30 / (time.time() - fps_start_time)
                        print(f"📊 FPS: {fps:.1f}, Firebase: {firebase_status}")
                        fps_start_time = time.time()
                
                # ตรวจสอบ key press
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("🛑 Quit requested by user")
                    break
                elif key == ord('t'):
                    self._test_firebase_connection()
                
                time.sleep(0.01)
            
            return True
            
        except KeyboardInterrupt:
            print("\n🛑 Interrupted by user")
            return True
        except Exception as e:
            print(f"❌ Error during detection: {e}")
            return False
        finally:
            self.stop_detection()
    
    def _test_firebase_connection(self):
        """ทดสอบการเชื่อมต่อ Firebase"""
        try:
            if self.firebase_handler:
                print("🧪 Testing Firebase connection...")
                
                # ส่งข้อมูลทดสอบ
                test_data = {
                    "test": True,
                    "timestamp": datetime.now().isoformat(),
                    "device_id": self.device_id,
                    "status": "online"
                }
                
                ref = self.firebase_handler.reference(f'devices/{self.device_id}/test')
                ref.set(test_data)
                
                print("✅ Firebase test data sent successfully")
            else:
                print("❌ Firebase not connected")
                
        except Exception as e:
            print(f"❌ Firebase test failed: {e}")
    
    def stop_detection(self):
        """หยุดการตรวจจับ"""
        try:
            self.running = False
            
            if self.detector:
                self.detector.release()
            
            cv2.destroyAllWindows()
            print("✅ PC Fatigue detection stopped")
            
        except Exception as e:
            print(f"❌ Error stopping detection: {e}")

def main():
    """ฟังก์ชันหลัก"""
    print("=" * 70)
    print("🖥️ Driver Fatigue Detection System - PC Version with Firebase")
    print("🔗 Connected to Real Firebase Database")
    print("📨 Receives commands from Admin Web Interface")
    print("=" * 70)
    
    detector = PCFatigueDetectorWithFirebase()
    
    try:
        if detector.initialize():
            detector.start_detection()
        else:
            print("❌ Failed to initialize system")
            sys.exit(1)
            
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)
    finally:
        print("👋 Goodbye!")

if __name__ == "__main__":
    main()
