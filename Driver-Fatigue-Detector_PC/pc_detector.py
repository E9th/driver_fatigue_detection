#!/usr/bin/env python3
"""
Driver Fatigue Detection System - PC Version
สำหรับทดสอบระบบตรวจจับบน PC
"""

import sys
import os
import cv2
import time
import threading
from datetime import datetime

# เพิ่ม path สำหรับ import
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Driver-Fatigue-Detector_Raspberry'))

class PCFatigueDetector:
    def __init__(self):
        self.running = False
        self.detector = None
        self.notification_handler = None
        
        print("🖥️ PC Fatigue Detector initialized")
    
    def initialize(self):
        """เริ่มต้นระบบ"""
        try:
            print("🔧 Initializing PC fatigue detection system...")
            
            # Import และสร้าง detector
            from core.detector import FatigueDetector
            self.detector = FatigueDetector()
            
            if not self.detector.initialize():
                print("❌ Failed to initialize detector")
                return False
            
            # Import notification handler สำหรับ PC
            try:
                from test_notification_system import PCNotificationHandler
                self.notification_handler = PCNotificationHandler()
                self.notification_handler.start_listening()
                
                # เชื่อมต่อ notification handler กับ detector
                self.detector.notification_handler = self.notification_handler
                print("✅ PC Notification handler connected")
                
            except ImportError as e:
                print(f"⚠️ PC Notification handler not available: {e}")
            
            print("✅ PC Fatigue detection system initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error initializing PC system: {e}")
            return False
    
    def start_detection(self):
        """เริ่มการตรวจจับ"""
        if not self.detector:
            print("❌ Detector not initialized")
            return False
        
        try:
            self.running = True
            print("🎯 Starting PC fatigue detection...")
            print("📋 Press 'q' to quit, 's' to take screenshot")
            
            frame_count = 0
            fps_start_time = time.time()
            
            while self.running:
                # ประมวลผลเฟรม
                frame, stats = self.detector.process_frame()
                
                if frame is not None:
                    # แสดงสถิติบนเฟรม
                    self._draw_stats_on_frame(frame, stats)
                    
                    # แสดงเฟรม
                    cv2.imshow('PC Fatigue Detection', frame)
                    
                    # คำนวณ FPS
                    frame_count += 1
                    if frame_count % 30 == 0:
                        fps = 30 / (time.time() - fps_start_time)
                        print(f"📊 FPS: {fps:.1f}, Stats: {stats}")
                        fps_start_time = time.time()
                
                # ตรวจสอบ key press
                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    print("🛑 Quit requested by user")
                    break
                elif key == ord('s'):
                    self._save_screenshot(frame, stats)
                elif key == ord('t'):
                    self._trigger_test_alert()
                
                # หน่วงเวลาเล็กน้อย
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
    
    def _draw_stats_on_frame(self, frame, stats):
        """วาดสถิติบนเฟรม"""
        try:
            y_offset = 120
            
            # แสดงสถิติ
            cv2.putText(frame, f"Faces: {stats.get('faces_detected', 0)}", 
                       (10, y_offset), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            if stats.get('ear', 0) > 0:
                cv2.putText(frame, f"EAR: {stats.get('ear', 0):.3f}", 
                           (10, y_offset + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            if stats.get('mar', 0) > 0:
                cv2.putText(frame, f"MAR: {stats.get('mar', 0):.3f}", 
                           (10, y_offset + 50), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            if stats.get('head_angle', 0) != 0:
                cv2.putText(frame, f"Head: {stats.get('head_angle', 0):.1f}°", 
                           (10, y_offset + 75), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
            
            # แสดงคำแนะนำ
            cv2.putText(frame, "Press 'q' to quit, 's' for screenshot, 't' for test alert", 
                       (10, frame.shape[0] - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
            
        except Exception as e:
            print(f"⚠️ Error drawing stats: {e}")
    
    def _save_screenshot(self, frame, stats):
        """บันทึกภาพหน้าจอ"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"screenshot_{timestamp}.jpg"
            
            os.makedirs("screenshots", exist_ok=True)
            filepath = os.path.join("screenshots", filename)
            
            cv2.imwrite(filepath, frame)
            print(f"📸 Screenshot saved: {filepath}")
            print(f"   Stats: {stats}")
            
        except Exception as e:
            print(f"❌ Error saving screenshot: {e}")
    
    def _trigger_test_alert(self):
        """ทดสอบการแจ้งเตือน"""
        try:
            if self.notification_handler:
                print("🧪 Triggering test alert...")
                self.notification_handler.test_notification(
                    message="ทดสอบการแจ้งเตือนจากระบบตรวจจับความง่วงนอน",
                    notification_type="test",
                    enable_tts=True
                )
            else:
                print("⚠️ Notification handler not available")
                
        except Exception as e:
            print(f"❌ Error triggering test alert: {e}")
    
    def stop_detection(self):
        """หยุดการตรวจจับ"""
        try:
            self.running = False
            
            if self.detector:
                self.detector.cleanup()
            
            if self.notification_handler:
                self.notification_handler.stop_listening()
            
            print("✅ PC Fatigue detection stopped")
            
        except Exception as e:
            print(f"❌ Error stopping detection: {e}")

def main():
    """ฟังก์ชันหลัก"""
    print("=" * 60)
    print("🖥️ Driver Fatigue Detection System - PC Version")
    print("🎯 Real-time Detection with Notification System")
    print("=" * 60)
    
    detector = PCFatigueDetector()
    
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
