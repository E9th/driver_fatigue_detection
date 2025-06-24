#!/usr/bin/env python3
"""
Driver Fatigue Detection System - Complete PC Version
- Face detection จริง (EAR, MAR, Head Tilt)
- ส่งข้อมูลไป Firebase จริง
- รับคำสั่งจาก Admin
- ใช้ Firebase เดียวกับ Raspberry Pi
"""

import sys
import os
import cv2
import dlib
import numpy as np
import time
import threading
from datetime import datetime
from scipy.spatial import distance as dist
from imutils import face_utils
import json

# เพิ่ม path สำหรับ import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

class CompletePCDetector:
    def __init__(self):
        # Detection constants (เหมือน detector.py)
        self.EYE_AR_THRESH = 0.25
        self.EYE_AR_CONSEC_FRAMES = 48
        self.MOUTH_AR_THRESH = 0.7
        self.MOUTH_AR_CONSEC_FRAMES = 48
        self.HEAD_TILT_THRESH = 10
        self.HEAD_TILT_CONSEC_FRAMES = 48
        
        # Detection counters
        self.eye_counter = 0
        self.mouth_counter = 0
        self.head_tilt_counter = 0
        
        # Detection components
        self.detector = None
        self.predictor = None
        self.cap = None
        
        # Face landmark indices
        self.left_eye_start = None
        self.left_eye_end = None
        self.right_eye_start = None
        self.right_eye_end = None
        self.mouth_start = None
        self.mouth_end = None
        
        # Firebase (ใช้ pyrebase เหมือน Raspberry Pi)
        self.firebase_app = None
        self.auth_handler = None
        self.db_handler = None
        self.user_token = None
        self.firebase_connected = False
        
        # Device info
        self.device_id = "PC_TEST_DEVICE"
        self.driver_email = "driver01@gmail.com"
        self.driver_password = "Driver01"
        
        # Control
        self.running = False
        
        print("🖥️ Complete PC Detector initialized")
    
    def initialize(self):
        """เริ่มต้นระบบทั้งหมด"""
        try:
            print("🔧 Initializing complete PC detection system...")
            
            # 1. โหลด face detectors
            if not self._load_detectors():
                return False
            
            # 2. เริ่มต้นกล้อง
            if not self._initialize_camera():
                return False
            
            # 3. ตั้งค่า face landmarks
            self._setup_landmark_indices()
            
            # 4. เชื่อมต่อ Firebase
            if not self._initialize_firebase():
                print("⚠️ Firebase connection failed, running in offline mode")
            
            # 5. เริ่มฟังคำสั่งจาก Firebase
            if self.firebase_connected:
                self._start_firebase_listener()
            
            print("✅ Complete PC detection system initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing system: {e}")
            return False
    
    def _load_detectors(self):
        """โหลด face detector และ predictor (เหมือน detector.py)"""
        try:
            # โหลด Haar Cascade
            haar_path = os.path.join(cv2.__path__[0], "data", "haarcascade_frontalface_default.xml")
            if not os.path.exists(haar_path):
                print(f"❌ Haarcascade not found at: {haar_path}")
                return False
            
            self.detector = cv2.CascadeClassifier(haar_path)
            if self.detector.empty():
                raise ValueError("Failed to load Haar Cascade Classifier")
            
            # โหลด dlib predictor (ต้องดาวน์โหลดไฟล์ .dat)
            predictor_path = "shape_predictor_68_face_landmarks.dat"
            if os.path.exists(predictor_path):
                self.predictor = dlib.shape_predictor(predictor_path)
                print("✅ Face landmark predictor loaded")
            else:
                print(f"⚠️ Predictor not found at {predictor_path}")
                print("⚠️ Download from: http://dlib.net/files/shape_predictor_68_face_landmarks.dat.bz2")
                self.predictor = None
            
            print("✅ Face detectors loaded successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error loading detectors: {e}")
            return False
    
    def _initialize_camera(self):
        """เริ่มต้นกล้อง"""
        try:
            self.cap = cv2.VideoCapture(0)
            if not self.cap.isOpened():
                print("❌ Could not open camera")
                return False
            
            # ตั้งค่ากล้อง
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_FPS, 30)
            
            print("✅ Camera initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing camera: {e}")
            return False
    
    def _setup_landmark_indices(self):
        """ตั้งค่า indices สำหรับ facial landmarks"""
        try:
            if self.predictor is not None:
                (self.left_eye_start, self.left_eye_end) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
                (self.right_eye_start, self.right_eye_end) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]
                (self.mouth_start, self.mouth_end) = face_utils.FACIAL_LANDMARKS_IDXS["mouth"]
                print("✅ Facial landmark indices set up")
            else:
                print("⚠️ Predictor not available, landmark detection disabled")
                
        except Exception as e:
            print(f"❌ Error setting up landmark indices: {e}")
    
    def _initialize_firebase(self):
        """เชื่อมต่อ Firebase (ใช้ pyrebase เหมือน Raspberry Pi)"""
        try:
            # ติดตั้ง pyrebase ก่อน: pip install pyrebase4
            import pyrebase
            
            # Firebase config (เหมือน core/firebase.py)
            firebase_config = {
                "apiKey": "AIzaSyC7Syu0aTE5WkAr7cMWdyllo5F6g--NsxM",
                "authDomain": "driver-fatigue-detection.firebaseapp.com",
                "databaseURL": "https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
                "storageBucket": "driver-fatigue-detection.appspot.com",
            }
            
            # Initialize Firebase app
            self.firebase_app = pyrebase.initialize_app(firebase_config)
            self.auth_handler = self.firebase_app.auth()
            self.db_handler = self.firebase_app.database()
            
            # Authenticate user
            user = self.auth_handler.sign_in_with_email_and_password(
                self.driver_email, self.driver_password
            )
            self.user_token = user['idToken']
            
            print(f"✅ Firebase authenticated as {self.driver_email}")
            self.firebase_connected = True
            
            # Test connection
            self.db_handler.child("devices").child(self.device_id).child("connection").update({
                "status": "connected_pc_test",
                "timestamp": datetime.now().isoformat()
            }, self.user_token)
            
            print("✅ Firebase connection test successful")
            return True
            
        except ImportError:
            print("❌ pyrebase not installed. Run: pip install pyrebase4")
            return False
        except Exception as e:
            print(f"❌ Firebase authentication failed: {e}")
            self.firebase_connected = False
            return False
    
    def _start_firebase_listener(self):
        """เริ่มฟังคำสั่งจาก Firebase"""
        try:
            def firebase_listener():
                print(f"🔔 Listening for Firebase commands on device: {self.device_id}")
                
                while self.running:
                    try:
                        # ฟังคำสั่งจาก Firebase
                        commands_ref = self.db_handler.child("devices").child(self.device_id).child("commands").child("notifications")
                        commands = commands_ref.get(self.user_token)
                        
                        if commands.val():
                            for cmd_id, cmd_data in commands.val().items():
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
        """จัดการคำสั่งจาก Firebase (เหมือน notification_handler.py)"""
        try:
            message = cmd_data.get('message', 'ข้อความจากแอดมิน')
            channels = cmd_data.get('channels', ['sound', 'display'])
            priority = cmd_data.get('priority', 'medium')
            tts_enabled = cmd_data.get('ttsEnabled', False)
            
            print(f"📨 Received Firebase command:")
            print(f"   ID: {cmd_id}")
            print(f"   Message: {message}")
            print(f"   Priority: {priority}")
            print(f"   TTS: {tts_enabled}")
            
            # อัพเดทสถานะเป็น processing
            self._update_command_status(cmd_id, "processing")
            
            # ประมวลผลคำสั่ง
            results = {}
            
            if "sound" in channels or "sound_with_tts" in channels or tts_enabled:
                results["sound"] = self._play_pc_sound_notification(message, priority, tts_enabled)
            
            if "display" in channels:
                results["display"] = self._show_pc_display_notification(message, priority)
            
            # อัพเดทสถานะเป็น completed
            self._update_command_status(cmd_id, "completed", results=results)
            print(f"✅ Firebase command {cmd_id} completed")
                
        except Exception as e:
            print(f"❌ Error handling Firebase command {cmd_id}: {e}")
            self._update_command_status(cmd_id, "failed", error=str(e))
    
    def _play_pc_sound_notification(self, message, priority, enable_tts):
        """เล่นเสียงแจ้งเตือนบน PC"""
        try:
            print(f"🔊 Playing sound notification: {priority}")
            
            # เล่นเสียงแจ้งเตือน
            beep_count = 3 if priority == "critical" else 2 if priority == "high" else 1
            
            if sys.platform == "win32":
                import winsound
                frequency = 1000 if priority == "critical" else 800 if priority == "high" else 600
                for i in range(beep_count):
                    winsound.Beep(frequency, 300)
                    time.sleep(0.2)
            else:
                for i in range(beep_count):
                    print("\a")  # System bell
                    time.sleep(0.2)
            
            # TTS
            if enable_tts:
                print("⏳ Waiting 2 seconds before TTS...")
                time.sleep(2)
                
                try:
                    if sys.platform == "win32":
                        import pyttsx3
                        engine = pyttsx3.init()
                        engine.setProperty('rate', 120 if priority == "critical" else 150)
                        engine.say(message)
                        engine.runAndWait()
                    elif sys.platform == "darwin":
                        os.system(f'say "{message}"')
                    else:
                        os.system(f'espeak "{message}"')
                    
                    print(f"🗣️ TTS completed: {message}")
                except Exception as tts_e:
                    print(f"⚠️ TTS failed: {tts_e}")
            
            return True
            
        except Exception as e:
            print(f"❌ Error playing sound: {e}")
            return False
    
    def _show_pc_display_notification(self, message, priority):
        """แสดงการแจ้งเตือนบน PC"""
        try:
            print("=" * 60)
            print(f"📺 PC DISPLAY NOTIFICATION")
            print(f"Priority: {priority.upper()}")
            print(f"Message: {message}")
            print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
            print("=" * 60)
            return True
            
        except Exception as e:
            print(f"❌ Error showing display: {e}")
            return False
    
    def _update_command_status(self, cmd_id, status, error=None, results=None):
        """อัพเดทสถานะคำสั่งใน Firebase"""
        try:
            if not self.firebase_connected:
                return
            
            status_data = {
                "status": status,
                "timestamp": datetime.now().isoformat()
            }
            
            if error:
                status_data["error"] = error
            if results:
                status_data["results"] = results
            
            self.db_handler.child("devices").child(self.device_id).child("commands").child("notifications").child(cmd_id).child("status").set(status_data, self.user_token)
            
        except Exception as e:
            print(f"❌ Error updating command status: {e}")
    
    def process_frame(self):
        """ประมวลผลเฟรม (เหมือน detector.py)"""
        if not self.cap or not self.cap.isOpened():
            return None, {}
        
        try:
            # อ่านเฟรม
            ret, frame = self.cap.read()
            if not ret:
                return None, {}
            
            # แปลงเป็น grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            
            # ตรวจจับใบหน้า
            faces = self.detector.detectMultiScale(gray, 1.1, 4)
            
            # สถิติการตรวจจับ
            detection_stats = {
                "drowsiness": False,
                "yawning": False,
                "head_tilt": False,
                "faces_detected": len(faces),
                "timestamp": datetime.now().isoformat(),
                "ear": 0.0,
                "mar": 0.0,
                "head_angle": 0.0
            }
            
            # ประมวลผลแต่ละใบหน้า
            for (x, y, w, h) in faces:
                # วาดกรอบใบหน้า
                cv2.rectangle(frame, (x, y), (x + w, y + h), (255, 0, 0), 2)
                
                if self.predictor is not None:
                    # ตรวจจับ facial landmarks
                    rect = dlib.rectangle(x, y, x + w, y + h)
                    shape = self.predictor(gray, rect)
                    shape = face_utils.shape_to_np(shape)
                    
                    # วิเคราะห์การตรวจจับ
                    stats = self._analyze_facial_features(frame, shape)
                    
                    # อัพเดทสถิติ
                    detection_stats.update(stats)
            
            # ส่งข้อมูลไป Firebase
            if self.firebase_connected:
                self._send_detection_data_to_firebase(detection_stats)
            
            return frame, detection_stats
            
        except Exception as e:
            print(f"❌ Error processing frame: {e}")
            return None, {}
    
    def _analyze_facial_features(self, frame, shape):
        """วิเคราะห์ลักษณะใบหน้า (เหมือน detector.py)"""
        stats = {
            "drowsiness": False,
            "yawning": False,
            "head_tilt": False,
            "ear": 0.0,
            "mar": 0.0,
            "head_angle": 0.0
        }
        
        try:
            # วิเคราะห์ดวงตา
            left_eye = shape[self.left_eye_start:self.left_eye_end]
            right_eye = shape[self.right_eye_start:self.right_eye_end]
            
            left_ear = self._eye_aspect_ratio(left_eye)
            right_ear = self._eye_aspect_ratio(right_eye)
            ear = (left_ear + right_ear) / 2.0
            stats["ear"] = ear
            
            # ตรวจสอบความง่วงนอน
            if ear < self.EYE_AR_THRESH:
                self.eye_counter += 1
                if self.eye_counter >= self.EYE_AR_CONSEC_FRAMES:
                    stats["drowsiness"] = True
                    cv2.putText(frame, "DROWSINESS DETECTED!", (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                self.eye_counter = 0
            
            # วิเคราะห์ปาก
            mouth = shape[self.mouth_start:self.mouth_end]
            mar = self._mouth_aspect_ratio(mouth)
            stats["mar"] = mar
            
            # ตรวจสอบการหาว
            if mar > self.MOUTH_AR_THRESH:
                self.mouth_counter += 1
                if self.mouth_counter >= self.MOUTH_AR_CONSEC_FRAMES:
                    stats["yawning"] = True
                    cv2.putText(frame, "YAWNING DETECTED!", (10, 60),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                self.mouth_counter = 0
            
            # วิเคราะห์การเอียงหัว
            head_angle = self._head_tilt_angle(shape)
            stats["head_angle"] = head_angle
            
            if abs(head_angle) > self.HEAD_TILT_THRESH:
                self.head_tilt_counter += 1
                if self.head_tilt_counter >= self.HEAD_TILT_CONSEC_FRAMES:
                    stats["head_tilt"] = True
                    cv2.putText(frame, "HEAD TILT DETECTED!", (10, 90),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
            else:
                self.head_tilt_counter = 0
            
            # วาดจุด landmarks
            self._draw_landmarks(frame, left_eye, right_eye, mouth)
            
        except Exception as e:
            print(f"❌ Error analyzing facial features: {e}")
        
        return stats
    
    def _eye_aspect_ratio(self, eye):
        """คำนวณ Eye Aspect Ratio"""
        A = dist.euclidean(eye[1], eye[5])
        B = dist.euclidean(eye[2], eye[4])
        C = dist.euclidean(eye[0], eye[3])
        ear = (A + B) / (2.0 * C)
        return ear
    
    def _mouth_aspect_ratio(self, mouth):
        """คำนวณ Mouth Aspect Ratio"""
        A = dist.euclidean(mouth[2], mouth[10])
        B = dist.euclidean(mouth[4], mouth[8])
        C = dist.euclidean(mouth[0], mouth[6])
        mar = (A + B) / (2.0 * C)
        return mar
    
    def _head_tilt_angle(self, shape):
        """คำนวณมุมการเอียงหัว"""
        nose = shape[30]
        left_eye = shape[36]
        right_eye = shape[45]
        
        dx = right_eye[0] - left_eye[0]
        dy = right_eye[1] - left_eye[1]
        eye_angle = np.degrees(np.arctan2(dy, dx))
        
        dx = nose[0] - ((left_eye[0] + right_eye[0]) // 2)
        dy = nose[1] - ((left_eye[1] + right_eye[1]) // 2)
        head_angle = np.degrees(np.arctan2(dy, dx)) - eye_angle
        
        return head_angle
    
    def _draw_landmarks(self, frame, left_eye, right_eye, mouth):
        """วาดจุด landmarks บนเฟรม"""
        try:
            cv2.drawContours(frame, [cv2.convexHull(left_eye)], -1, (0, 255, 0), 1)
            cv2.drawContours(frame, [cv2.convexHull(right_eye)], -1, (0, 255, 0), 1)
            cv2.drawContours(frame, [cv2.convexHull(mouth)], -1, (0, 255, 0), 1)
        except Exception as e:
            print(f"⚠️ Error drawing landmarks: {e}")
    
    def _send_detection_data_to_firebase(self, detection_stats):
        """ส่งข้อมูลการตรวจจับไป Firebase (เหมือน core/firebase.py)"""
        try:
            # เพิ่ม device info
            enhanced_data = {
                **detection_stats,
                "device_id": self.device_id,
                "timestamp": datetime.now().isoformat()
            }
            
            # อัพเดทข้อมูลปัจจุบัน
            self.db_handler.child("devices").child(self.device_id).child("current_data").set(enhanced_data, self.user_token)
            
            # เก็บประวัติ
            timestamp_key = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            self.db_handler.child("devices").child(self.device_id).child("history").child(timestamp_key).set(enhanced_data, self.user_token)
            
            # อัพเดท last_update
            self.db_handler.child("devices").child(self.device_id).update({"last_update": datetime.now().isoformat()}, self.user_token)
            
        except Exception as e:
            print(f"❌ Error sending detection data to Firebase: {e}")
    
    def start_detection(self):
        """เริ่มการตรวจจับ"""
        if not self.detector:
            print("❌ Detector not initialized")
            return False
        
        try:
            self.running = True
            print("🎯 Starting complete PC fatigue detection...")
            print("📋 Press 'q' to quit, 's' to screenshot, 't' to test Firebase")
            
            frame_count = 0
            fps_start_time = time.time()
            
            while self.running:
                # ประมวลผลเฟรม
                frame, stats = self.process_frame()
                
                if frame is not None:
                    # แสดงข้อมูลบนเฟรม
                    cv2.putText(frame, f"Device: {self.device_id}", 
                               (10, frame.shape[0] - 80), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    
                    firebase_status = "Connected" if self.firebase_connected else "Offline"
                    cv2.putText(frame, f"Firebase: {firebase_status}", 
                               (10, frame.shape[0] - 60), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
                    
                    # แสดงค่า EAR, MAR
                    if stats.get("faces_detected", 0) > 0:
                        cv2.putText(frame, f"EAR: {stats.get('ear', 0):.3f}", 
                                   (10, frame.shape[0] - 40), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                        cv2.putText(frame, f"MAR: {stats.get('mar', 0):.3f}", 
                                   (10, frame.shape[0] - 20), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 0), 1)
                    
                    # แสดงเฟรม
                    cv2.imshow('Complete PC Fatigue Detection', frame)
                    
                    # คำนวณ FPS
                    frame_count += 1
                    if frame_count % 30 == 0:
                        fps = 30 / (time.time() - fps_start_time)
                        print(f"📊 FPS: {fps:.1f}, Faces: {stats.get('faces_detected', 0)}, Firebase: {firebase_status}")
                        fps_start_time = time.time()
                
                # ตรวจสอบ key press
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("🛑 Quit requested by user")
                    break
                elif key == ord('s'):
                    self._save_screenshot(frame)
                elif key == ord('t'):
                    self._test_firebase()
                
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
    
    def _save_screenshot(self, frame):
        """บันทึกภาพหน้าจอ"""
        try:
            if frame is not None:
                filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.jpg"
                cv2.imwrite(filename, frame)
                print(f"📸 Screenshot saved: {filename}")
        except Exception as e:
            print(f"❌ Error saving screenshot: {e}")
    
    def _test_firebase(self):
        """ทดสอบ Firebase"""
        try:
            if self.firebase_connected:
                test_data = {
                    "test": True,
                    "timestamp": datetime.now().isoformat(),
                    "message": "Test from PC detector"
                }
                
                self.db_handler.child("devices").child(self.device_id).child("test").set(test_data, self.user_token)
                print("✅ Firebase test successful")
            else:
                print("❌ Firebase not connected")
        except Exception as e:
            print(f"❌ Firebase test failed: {e}")
    
    def stop_detection(self):
        """หยุดการตรวจจับ"""
        try:
            self.running = False
            
            if self.cap:
                self.cap.release()
            
            cv2.destroyAllWindows()
            print("✅ Complete PC detection stopped")
            
        except Exception as e:
            print(f"❌ Error stopping detection: {e}")

def main():
    """ฟังก์ชันหลัก"""
    print("=" * 70)
    print("🖥️ Driver Fatigue Detection System - Complete PC Version")
    print("👁️ Real Face Detection (EAR, MAR, Head Tilt)")
    print("🔗 Real Firebase Connection (Send & Receive)")
    print("📨 Admin Command Support")
    print("=" * 70)
    
    detector = CompletePCDetector()
    
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
