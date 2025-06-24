import threading
import time
import json
import subprocess
import os
from datetime import datetime
from .firebase import db_handler, user_token, firebase_connected

class NotificationHandler:
    def __init__(self):
        self.is_listening = False
        self.listener_thread = None
        self.current_notifications = {}
        self.last_heartbeat = time.time()
        
        # เสียงแจ้งเตือนต่างๆ
        self.sound_files = {
            "normal": "/home/pi/Driver-Fatigue-Detector_Raspberry/assets/Alert.wav",
            "warning": "/home/pi/Driver-Fatigue-Detector_Raspberry/assets/Warning.wav", 
            "emergency": "/home/pi/Driver-Fatigue-Detector_Raspberry/assets/Emergency.wav",
            "notification": "/home/pi/Driver-Fatigue-Detector_Raspberry/assets/Notification.wav"
        }
        
        # ตั้งค่า TTS
        self.tts_config = {
            "language": "th",
            "speed": "140",
            "volume": "80",
            "voice": "th"
        }
        
    def start_listening(self):
        """เริ่มฟังคำสั่งแจ้งเตือนจาก Firebase"""
        if self.is_listening:
            return
            
        self.is_listening = True
        self.listener_thread = threading.Thread(target=self._listen_for_notifications, daemon=True)
        self.listener_thread.start()
        
        # เริ่ม heartbeat thread
        self.heartbeat_thread = threading.Thread(target=self._send_heartbeat, daemon=True)
        self.heartbeat_thread.start()
        
        print("🔔 Notification handler started listening...")
    
    def stop_listening(self):
        """หยุดฟังคำสั่งแจ้งเตือน"""
        self.is_listening = False
        if self.listener_thread:
            self.listener_thread.join(timeout=5)
        print("🔔 Notification handler stopped listening")
    
    def _send_heartbeat(self):
        """ส่ง heartbeat เพื่อบอกว่า device ยัง online"""
        from .firebase import DEVICE_ID
        
        while self.is_listening:
            try:
                if firebase_connected and db_handler and user_token:
                    heartbeat_data = {
                        "last_seen": datetime.now().isoformat(),
                        "status": "online",
                        "notification_handler": "active"
                    }
                    
                    db_handler.child("devices").child(DEVICE_ID).child("heartbeat").set(heartbeat_data, user_token)
                    self.last_heartbeat = time.time()
                    
                time.sleep(30)  # ส่ง heartbeat ทุก 30 วินาที
                
            except Exception as e:
                print(f"❌ Error sending heartbeat: {e}")
                time.sleep(60)  # ถ้า error รอ 1 นาทีแล้วลองใหม่
    
    def _listen_for_notifications(self):
        """ฟังคำสั่งแจ้งเตือนจาก Firebase"""
        from .firebase import DEVICE_ID
        
        while self.is_listening:
            try:
                if not firebase_connected or not db_handler or not user_token:
                    time.sleep(5)
                    continue
                
                # ดึงคำสั่งแจ้งเตือนที่ pending
                notifications_data = db_handler.child("devices").child(DEVICE_ID).child("commands").child("notifications").get(user_token)
                
                if notifications_data.val():
                    for notification_id, notification_data in notifications_data.val().items():
                        if notification_data.get('status') == 'pending' and notification_id not in self.current_notifications:
                            self._handle_notification_command(notification_id, notification_data)
                
                time.sleep(1)  # ตรวจสอบทุก 1 วินาที
                
            except Exception as e:
                print(f"❌ Error listening for notifications: {e}")
                time.sleep(5)
    
    def _handle_notification_command(self, notification_id, notification_data):
        """จัดการคำสั่งแจ้งเตือน"""
        from .firebase import DEVICE_ID
        
        try:
            self.current_notifications[notification_id] = notification_data
            
            # อัพเดทสถานะเป็น processing พร้อมเวลาที่รับคำสั่ง
            self._update_notification_status(notification_id, "processing", extra_data={
                "received_at": datetime.now().isoformat(),
                "device_id": DEVICE_ID
            })
            
            message = notification_data.get('message', 'การแจ้งเตือนจากระบบตรวจจับความง่วงนอน')
            channels = notification_data.get('channels', ['sound', 'display'])
            notification_type = notification_data.get('type', 'alert')
            priority = notification_data.get('priority', 'medium')
            tts_enabled = notification_data.get('ttsEnabled', False)
            
            print(f"🔔 Processing notification {notification_id}")
            print(f"   Type: {notification_type}")
            print(f"   Priority: {priority}")
            print(f"   Message: {message}")
            print(f"   Channels: {channels}")
            print(f"   TTS Enabled: {tts_enabled}")
            
            results = {}
            success = True
            execution_log = []
            
            # ประมวลผลแต่ละช่องทาง
            for channel in channels:
                try:
                    if channel == "sound" or channel == "sound_with_tts":
                        enable_tts = channel == "sound_with_tts" or tts_enabled
                        
                        # บันทึกเวลาเริ่มเล่นเสียง
                        sound_start = datetime.now().isoformat()
                        execution_log.append(f"[{sound_start}] เริ่มเล่นเสียงแจ้งเตือน")
                        
                        sound_result = self._play_sound_alert(message, priority, enable_tts, execution_log)
                        results["sound"] = sound_result
                        
                        if enable_tts:
                            results["tts"] = sound_result
                            
                    elif channel == "display":
                        display_start = datetime.now().isoformat()
                        execution_log.append(f"[{display_start}] แสดงข้อความบนหน้าจอ")
                        
                        results["display"] = self._show_display_alert(message, priority)
                        
                except Exception as e:
                    error_time = datetime.now().isoformat()
                    execution_log.append(f"[{error_time}] ❌ Error in channel {channel}: {str(e)}")
                    print(f"❌ Error in channel {channel}: {e}")
                    results[channel.replace("_with_tts", "")] = False
                    success = False
            
            # อัพเดทสถานะสุดท้าย
            if success and any(results.values()):
                completion_time = datetime.now().isoformat()
                execution_log.append(f"[{completion_time}] ✅ การแจ้งเตือนเสร็จสมบูรณ์")
                
                self._update_notification_status(notification_id, "completed", extra_data={
                    "completed_at": completion_time,
                    "execution_log": execution_log,
                    "results": results
                })
                print(f"✅ Notification {notification_id} completed successfully")
            else:
                failure_time = datetime.now().isoformat()
                execution_log.append(f"[{failure_time}] ❌ การแจ้งเตือนล้มเหลว")
                
                self._update_notification_status(notification_id, "failed", "Some channels failed", {
                    "failed_at": failure_time,
                    "execution_log": execution_log,
                    "results": results
                })
                print(f"❌ Notification {notification_id} failed")
                
        except Exception as e:
            error_time = datetime.now().isoformat()
            print(f"❌ Error handling notification {notification_id}: {e}")
            self._update_notification_status(notification_id, "failed", str(e), {
                "error_at": error_time,
                "error_details": str(e)
            })
        finally:
            if notification_id in self.current_notifications:
                del self.current_notifications[notification_id]
    
    def _play_sound_alert(self, message, priority, enable_tts=True, execution_log=None):
        """เล่นเสียงแจ้งเตือนและอ่านข้อความ"""
        try:
            if execution_log is None:
                execution_log = []
                
            print(f"🔊 Playing sound alert with priority: {priority}, TTS: {enable_tts}")
            
            # เลือกไฟล์เสียงตามระดับความสำคัญ
            sound_file = None
            if priority == "critical":
                sound_file = self.sound_files.get("emergency")
            elif priority == "high":
                sound_file = self.sound_files.get("warning")
            else:
                sound_file = self.sound_files.get("notification", self.sound_files.get("normal"))
            
            # เล่นเสียงแจ้งเตือนก่อน
            if sound_file and os.path.exists(sound_file):
                print(f"🎵 Playing notification sound: {sound_file}")
                
                repeat_count = 3 if priority == "critical" else 2 if priority == "high" else 1
                
                for i in range(repeat_count):
                    try:
                        sound_time = datetime.now().isoformat()
                        execution_log.append(f"[{sound_time}] 🎵 เล่นเสียงแจ้งเตือนครั้งที่ {i+1}/{repeat_count}")
                        
                        subprocess.run(['aplay', sound_file], 
                                     capture_output=True, 
                                     timeout=10, 
                                     check=True)
                        if i < repeat_count - 1:
                            time.sleep(0.5)
                    except subprocess.TimeoutExpired:
                        execution_log.append(f"⚠️ เสียงแจ้งเตือนครั้งที่ {i+1} timeout")
                        print(f"⚠️ Sound playback timeout for repeat {i+1}")
                    except subprocess.CalledProcessError as e:
                        execution_log.append(f"⚠️ เสียงแจ้งเตือนครั้งที่ {i+1} error: {str(e)}")
                        print(f"⚠️ Sound playback error for repeat {i+1}: {e}")
                
                execution_log.append(f"✅ เล่นเสียงแจ้งเตือนเสร็จ ({repeat_count} ครั้ง)")
                print(f"✅ Notification sound played {repeat_count} time(s)")
            else:
                execution_log.append(f"⚠️ ไม่พบไฟล์เสียง: {sound_file}")
                print(f"⚠️ Sound file not found: {sound_file}")
            
            # หยุด 2 วินาทีก่อนเล่น TTS
            if enable_tts:
                wait_time = datetime.now().isoformat()
                execution_log.append(f"[{wait_time}] ⏳ รอ 2 วินาทีก่อนเล่น TTS")
                print("⏳ Waiting 2 seconds before TTS...")
                time.sleep(2)
                
                # เล่นข้อความด้วย Text-to-Speech
                tts_start = datetime.now().isoformat()
                execution_log.append(f"[{tts_start}] 🗣️ เริ่มเล่น TTS: '{message}'")
                
                tts_success = self._play_text_to_speech(message, priority, execution_log)
                
                if not tts_success:
                    execution_log.append("⚠️ TTS หลักล้มเหลว กำลังลองวิธีสำรอง...")
                    print("⚠️ TTS failed, trying alternative method...")
                    self._play_text_to_speech_alternative(message, execution_log)
            
            return True
            
        except Exception as e:
            if execution_log:
                execution_log.append(f"❌ Error playing sound alert: {str(e)}")
            print(f"❌ Error playing sound alert: {e}")
            return False
    
    def _play_text_to_speech(self, message, priority, execution_log=None):
        """เล่นข้อความด้วย Text-to-Speech (วิธีหลัก)"""
        try:
            if execution_log is None:
                execution_log = []
                
            # ปรับความเร็วตามความสำคัญ
            speed = "120" if priority == "critical" else "140" if priority == "high" else "160"
            
            tts_start = datetime.now().isoformat()
            execution_log.append(f"[{tts_start}] 🗣️ เล่น TTS ความเร็ว {speed} คำ/นาที")
            print(f"🗣️ Playing TTS: '{message}' (speed: {speed})")
            
            # ใช้ espeak สำหรับภาษาไทย
            tts_command = [
                'espeak',
                '-v', self.tts_config["voice"],
                '-s', speed,
                '-a', self.tts_config["volume"],
                message
            ]
            
            result = subprocess.run(tts_command, 
                                  capture_output=True, 
                                  timeout=30,
                                  text=True,
                                  check=True)
            
            tts_end = datetime.now().isoformat()
            execution_log.append(f"[{tts_end}] ✅ TTS เสร็จสมบูรณ์")
            print("✅ TTS completed successfully")
            return True
            
        except subprocess.TimeoutExpired:
            execution_log.append("❌ TTS timeout (ข้อความยาวเกินไป)")
            print("❌ TTS timeout (message too long)")
            return False
        except subprocess.CalledProcessError as e:
            execution_log.append(f"❌ TTS command failed: {str(e)}")
            print(f"❌ TTS command failed: {e}")
            return False
        except Exception as e:
            execution_log.append(f"❌ TTS error: {str(e)}")
            print(f"❌ TTS error: {e}")
            return False
    
    def _play_text_to_speech_alternative(self, message, execution_log=None):
        """เล่นข้อความด้วย Text-to-Speech (วิธีสำรอง)"""
        try:
            if execution_log is None:
                execution_log = []
                
            alt_start = datetime.now().isoformat()
            execution_log.append(f"[{alt_start}] 🗣️ ลอง TTS วิธีสำรอง")
            print(f"🗣️ Trying alternative TTS for: '{message}'")
            
            # ใช้ pico2wave + aplay (ถ้ามี)
            try:
                temp_file = "/tmp/tts_message.wav"
                
                subprocess.run(['pico2wave', '-l', 'th-TH', '-w', temp_file, message], 
                             capture_output=True, timeout=15, check=True)
                
                subprocess.run(['aplay', temp_file], 
                             capture_output=True, timeout=15, check=True)
                
                os.remove(temp_file)
                
                alt_end = datetime.now().isoformat()
                execution_log.append(f"[{alt_end}] ✅ TTS สำรองเสร็จสมบูรณ์")
                print("✅ Alternative TTS completed successfully")
                return True
                
            except (subprocess.CalledProcessError, FileNotFoundError):
                # ถ้า pico2wave ไม่มี ใช้ espeak แบบง่าย
                subprocess.run(['espeak', message], 
                             capture_output=True, timeout=20, check=True)
                
                simple_end = datetime.now().isoformat()
                execution_log.append(f"[{simple_end}] ✅ TTS แบบง่ายเสร็จสมบูรณ์")
                print("✅ Simple TTS completed")
                return True
                
        except Exception as e:
            execution_log.append(f"❌ TTS สำรองล้มเหลว: {str(e)}")
            print(f"❌ Alternative TTS failed: {e}")
            return False
    
    def _show_display_alert(self, message, priority):
        """แสดงการแจ้งเตือนบนหน้าจอ"""
        try:
            alert_data = {
                "message": message,
                "priority": priority,
                "timestamp": datetime.now().isoformat(),
                "type": "notification",
                "show_duration": 10 if priority == "critical" else 7 if priority == "high" else 5
            }
            
            with open('/tmp/alert_notification.json', 'w', encoding='utf-8') as f:
                json.dump(alert_data, f, ensure_ascii=False, indent=2)
            
            print(f"📺 Display alert shown: {priority} - '{message}'")
            return True
            
        except Exception as e:
            print(f"❌ Error showing display alert: {e}")
            return False
    
    def _update_notification_status(self, notification_id, status, error=None, extra_data=None):
        """อัพเดทสถานะการแจ้งเตือน"""
        from .firebase import DEVICE_ID
        
        try:
            status_data = {
                "status": status,
                "timestamp": datetime.now().isoformat(),
                "device_id": DEVICE_ID
            }
            
            if error:
                status_data["error"] = error
                
            if extra_data:
                status_data.update(extra_data)
            
            # อัพเดท status ใน Firebase
            db_handler.child("devices").child(DEVICE_ID).child("commands").child("notifications").child(notification_id).update(status_data, user_token)
            
            print(f"📤 Updated notification {notification_id} status to: {status}")
            
        except Exception as e:
            print(f"❌ Error updating notification status: {e}")

# Global instance
notification_handler = NotificationHandler()

def initialize_notification_handler():
    """เริ่มต้น notification handler"""
    notification_handler.start_listening()

def cleanup_notification_handler():
    """ทำความสะอาด notification handler"""
    notification_handler.stop_listening()
