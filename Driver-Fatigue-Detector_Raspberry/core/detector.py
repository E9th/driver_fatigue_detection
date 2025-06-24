import cv2
import dlib
import numpy as np
from imutils import face_utils
from scipy.spatial import distance as dist
import os
import time
from datetime import datetime

class FatigueDetector:
    def __init__(self):
        # Constants for detection
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
        
        # Notification system (เฉพาะรับคำสั่งจาก Admin เท่านั้น)
        self.notification_handler = None
        
        print("👁️ FatigueDetector initialized (Manual mode only)")
    
    def initialize(self):
        """เริ่มต้นระบบตรวจจับ"""
        try:
            print("🔧 Initializing fatigue detection components...")
            
            # โหลด face detector และ predictor
            if not self._load_detectors():
                return False
            
            # เริ่มต้น video capture
            if not self._initialize_camera():
                return False
            
            # ตั้งค่า face landmark indices
            self._setup_landmark_indices()
            
            # Import notification handler (เฉพาะรับคำสั่งจาก Firebase)
            try:
                from .notification_handler import notification_handler
                self.notification_handler = notification_handler
                print("✅ Notification handler connected (Manual mode)")
            except ImportError as e:
                print(f"⚠️ Notification handler not available: {e}")
                self.notification_handler = None
            
            print("✅ Fatigue detector initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing fatigue detector: {e}")
            return False
    
    def _load_detectors(self):
        """โหลด face detector และ predictor"""
        try:
            # โหลด Haar Cascade
            haar_path = os.path.join(cv2.__path__[0], "data", "haarcascade_frontalface_default.xml")
            if not os.path.exists(haar_path):
                # ลองหา path อื่น
                haar_path = "models/haarcascade_frontalface_default.xml"
                if not os.path.exists(haar_path):
                    raise FileNotFoundError(f"Haarcascade XML not found")
            
            self.detector = cv2.CascadeClassifier(haar_path)
            if self.detector.empty():
                raise ValueError("Failed to load Haar Cascade Classifier")
            
            # โหลด dlib predictor
            predictor_path = "models/shape_predictor_68_face_landmarks.dat"
            if os.path.exists(predictor_path):
                self.predictor = dlib.shape_predictor(predictor_path)
                print("✅ Face landmark predictor loaded")
            else:
                print(f"⚠️ Predictor not found at {predictor_path}")
                print("⚠️ Face landmark detection will be limited")
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
    
    def process_frame(self):
        """ประมวลผลเฟรมเดียว (เฉพาะตรวจจับ ไม่ส่งการแจ้งเตือนอัตโนมัติ)"""
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
            
            # สถิติการตรวจจับ (เฉพาะบันทึกข้อมูล ไม่ส่งการแจ้งเตือน)
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
                    
                    # วิเคราะห์การตรวจจับ (เฉพาะบันทึกข้อมูล)
                    stats = self._analyze_facial_features(frame, shape)
                    
                    # อัพเดทสถิติ
                    detection_stats.update(stats)
            
            return frame, detection_stats
            
        except Exception as e:
            print(f"❌ Error processing frame: {e}")
            return None, {}
    
    def _analyze_facial_features(self, frame, shape):
        """วิเคราะห์ลักษณะใบหน้า (เฉพาะตรวจจับ ไม่ส่งการแจ้งเตือน)"""
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
            
            # ตรวจสอบความง่วงนอน (เฉพาะแสดงผลบนหน้าจอ)
            if ear < self.EYE_AR_THRESH:
                self.eye_counter += 1
                if self.eye_counter >= self.EYE_AR_CONSEC_FRAMES:
                    stats["drowsiness"] = True
                    cv2.putText(frame, "DROWSINESS DETECTED!", (10, 30),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    # ไม่ส่งการแจ้งเตือนอัตโนมัติ - รอให้ Admin ส่งเอง
            else:
                self.eye_counter = 0
            
            # วิเคราะห์ปาก
            mouth = shape[self.mouth_start:self.mouth_end]
            mar = self._mouth_aspect_ratio(mouth)
            stats["mar"] = mar
            
            # ตรวจสอบการหาว (เฉพาะแสดงผลบนหน้าจอ)
            if mar > self.MOUTH_AR_THRESH:
                self.mouth_counter += 1
                if self.mouth_counter >= self.MOUTH_AR_CONSEC_FRAMES:
                    stats["yawning"] = True
                    cv2.putText(frame, "YAWNING DETECTED!", (10, 60),
                               cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    # ไม่ส่งการแจ้งเตือนอัตโนมัติ - รอให้ Admin ส่งเอง
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
                    # ไม่ส่งการแจ้งเตือนอัตโนมัติ - รอให้ Admin ส่งเอง
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
    
    def cleanup(self):
        """ทำความสะอาดทรัพยากร"""
        try:
            if self.cap:
                self.cap.release()
                print("✅ Camera released")
            
            cv2.destroyAllWindows()
            print("✅ OpenCV windows closed")
            
        except Exception as e:
            print(f"❌ Error during cleanup: {e}")

def load_detectors(predictor_path="models/shape_predictor_68_face_landmarks.dat"):
    """Legacy function for backward compatibility"""
    detector = FatigueDetector()
    if detector.initialize():
        return detector.detector, detector.predictor
    else:
        return None, None
