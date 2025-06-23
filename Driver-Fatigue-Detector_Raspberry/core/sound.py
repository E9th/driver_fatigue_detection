from playsound import playsound
import threading

def play_alarm_loop(path, alarm_flag):
    """
    เล่นเสียงซ้ำจนกว่า alarm_flag จะเป็น False
    ใช้สำหรับกรณีง่วงนอน (ตาปิดนาน)
    """
    try:
        while alarm_flag():
            playsound(path)
    except Exception as e:
        print(f"[Sound] Alarm loop error: {e}")

def play_alarm_once(path, state_flag_setter=None, state_flag_clearer=None):
    """
    เล่นเสียง 1 ครั้ง เช่นกรณีหาว
    """
    try:
        if state_flag_setter:
            state_flag_setter()
        playsound(path)
    except Exception as e:
        print(f"[Sound] One-time alarm error: {e}")
    finally:
        if state_flag_clearer:
            state_flag_clearer()

def start_alarm_thread(path, alarm_flag=lambda: False, once=False, state_flag_setter=None, state_flag_clearer=None):
    """
    เรียกใช้เสียงใน Thread แยก เพื่อไม่ให้บล็อกการทำงานของ GUI
    - once=True: เล่นครั้งเดียว
    - alarm_flag: ฟังก์ชันคืนค่า boolean สำหรับ loop
    - state_flag_setter/clearer: ตัวเลือกสำหรับจัดการ state
    """
    if once:
        threading.Thread(target=play_alarm_once, args=(path, state_flag_setter, state_flag_clearer), daemon=True).start()
    else:
        threading.Thread(target=play_alarm_loop, args=(path, alarm_flag), daemon=True).start()
