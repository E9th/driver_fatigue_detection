import threading
import time
from datetime import datetime
import subprocess
import os
from .firebase import db_handler, user_token, firebase_connected

class CallHandler:
    def __init__(self):
        self.is_listening = False
        self.listener_thread = None
        self.current_calls = {}
        
    def start_listening(self):
        """เริ่มฟังคำสั่งโทรจาก Firebase"""
        if self.is_listening:
            return
            
        self.is_listening = True
        self.listener_thread = threading.Thread(target=self._listen_for_calls, daemon=True)
        self.listener_thread.start()
        print("📞 Call handler started listening...")
    
    def stop_listening(self):
        """หยุดฟังคำสั่งโทร"""
        self.is_listening = False
        if self.listener_thread:
            self.listener_thread.join(timeout=5)
        print("📞 Call handler stopped listening")
    
    def _listen_for_calls(self):
        """ฟังคำสั่งโทรจาก Firebase"""
        from .firebase import DEVICE_ID
        
        while self.is_listening:
            try:
                if not firebase_connected or not db_handler or not user_token:
                    time.sleep(5)
                    continue
                
                # ดึงคำสั่งโทรที่ pending
                calls_data = db_handler.child("devices").child(DEVICE_ID).child("commands").child("calls").get(user_token)
                
                if calls_data.val():
                    for call_id, call_data in calls_data.val().items():
                        if call_data.get('status') == 'pending' and call_id not in self.current_calls:
                            self._handle_call_command(call_id, call_data)
                
                time.sleep(2)  # ตรวจสอบทุก 2 วินาที
                
            except Exception as e:
                print(f"❌ Error listening for calls: {e}")
                time.sleep(5)
    
    def _handle_call_command(self, call_id, call_data):
        """จัดการคำสั่งโทร"""
        from .firebase import DEVICE_ID
        
        try:
            self.current_calls[call_id] = call_data
            
            # อัพเดทสถานะเป็น calling
            self._update_call_status(call_id, "calling")
            
            target_phone = call_data.get('targetPhone')
            message = call_data.get('message', 'การแจ้งเตือนจากระบบตรวจจับความง่วงนอน')
            
            print(f"📞 Processing call command {call_id}")
            print(f"   Target: {target_phone}")
            print(f"   Message: {message}")
            
            # เรียกฟังก์ชันโทรจริง
            success = self._make_call(target_phone, message)
            
            if success:
                self._update_call_status(call_id, "completed")
                print(f"✅ Call {call_id} completed successfully")
            else:
                self._update_call_status(call_id, "failed", "Failed to make call")
                print(f"❌ Call {call_id} failed")
                
        except Exception as e:
            print(f"❌ Error handling call {call_id}: {e}")
            self._update_call_status(call_id, "failed", str(e))
        finally:
            if call_id in self.current_calls:
                del self.current_calls[call_id]
    
    def _make_call(self, phone_number, message):
        """ทำการโทรจริง - ใช้วิธีการที่เหมาะสมกับ hardware"""
        try:
            if not phone_number:
                print("⚠️ No phone number provided")
                return False
            
            # วิธีที่ 1: ใช้ espeak สำหรับ text-to-speech (ถ้ามี speaker)
            self._play_voice_message(message)
            
            # วิธีที่ 2: ส่ง SMS แทนการโทร (ถ้ามี GSM module)
            # success = self._send_sms(phone_number, message)
            
            # วิธีที่ 3: ใช้ VoIP service (ถ้ามี internet)
            # success = self._make_voip_call(phone_number, message)
            
            # วิธีที่ 4: ส่งการแจ้งเตือนผ่าน webhook
            success = self._send_webhook_notification(phone_number, message)
            
            return success
            
        except Exception as e:
            print(f"❌ Error making call: {e}")
            return False
    
    def _play_voice_message(self, message):
        """เล่นข้อความเสียง"""
        try:
            # ใช้ espeak สำหรับ text-to-speech
            subprocess.run(['espeak', '-s', '150', '-v', 'th', message], 
                         capture_output=True, timeout=30)
            return True
        except Exception as e:
            print(f"❌ Error playing voice: {e}")
            return False
    
    def _send_sms(self, phone_number, message):
        """ส่ง SMS (ต้องมี GSM module)"""
        try:
            # ตัวอย่างการส่ง SMS ผ่าน AT commands
            # ต้องปรับแต่งตาม GSM module ที่ใช้
            print(f"📱 Sending SMS to {phone_number}: {message}")
            # Implementation depends on GSM module
            return True
        except Exception as e:
            print(f"❌ Error sending SMS: {e}")
            return False
    
    def _send_webhook_notification(self, phone_number, message):
        """ส่งการแจ้งเตือนผ่าน webhook"""
        try:
            import requests
            
            # ส่งไปยัง service ภายนอก เช่น LINE Notify, Discord, etc.
            webhook_url = "YOUR_WEBHOOK_URL"  # ใส่ URL ของ webhook service
            
            payload = {
                "phone": phone_number,
                "message": message,
                "device_id": "DEVICE_01",
                "timestamp": datetime.now().isoformat()
            }
            
            response = requests.post(webhook_url, json=payload, timeout=10)
            return response.status_code == 200
            
        except Exception as e:
            print(f"❌ Error sending webhook: {e}")
            return False
    
    def _update_call_status(self, call_id, status, error=None):
        """อัพเดทสถานะการโทร"""
        from .firebase import DEVICE_ID
        
        try:
            status_data = {
                "status": status,
                "timestamp": datetime.now().isoformat()
            }
            
            if error:
                status_data["error"] = error
            
            db_handler.child("devices").child(DEVICE_ID).child("commands").child("calls").child(call_id).child("status").set(status_data, user_token)
            
        except Exception as e:
            print(f"❌ Error updating call status: {e}")

# Global instance
call_handler = CallHandler()

def initialize_call_handler():
    """เริ่มต้น call handler"""
    call_handler.start_listening()

def cleanup_call_handler():
    """ทำความสะอาด call handler"""
    call_handler.stop_listening()
