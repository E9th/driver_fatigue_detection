import cv2
import time
import os
import imutils
import numpy as np
from PIL import Image, ImageTk
from imutils.video import VideoStream
from tkinter import messagebox
import mediapipe as mp
from core.sound import start_alarm_thread
from core.firebase import send_data_to_firebase, send_alert_to_firebase
from core.calculation import lip_distance

#-- Global variables for GUI components and state
video_label = None
status_value_label = None
progress_bar = None
ear_value_label = None
yawn_value_label = None
blink_value_label = None
yawn_count_value_label = None
doze_value_label = None
start_button = None
stop_button = None
root = None
vs = None
detection_enabled = False
camera_available = False
yawn_start_time = None

#-- Detection parameters
EYE_AR_THRESH = 0.25
EYE_AR_CONSEC_FRAMES = 20
YAWN_THRESH = 15
FIREBASE_SEND_INTERVAL = 30
COUNTER = 0
alarm_status = False
alarm_status2 = False
saying = False
eye_blink_count = 0
yawn_count = 0
progress_full_count = 0
closed_eye_time = 0
alert_triggered = False
eyes_closed = False
mouth_open = False
last_backend_send_time = 0
current_detection_data = {}

#-- Path to alarm sound file
alarm_path = "assets/Alert1.wav"

#-- Mediapipe Face Mesh setup
mp_face_mesh = mp.solutions.face_mesh
face_mesh = mp_face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1,
                                   refine_landmarks=True, min_detection_confidence=0.5, min_tracking_confidence=0.5)
drawing_spec = mp.solutions.drawing_utils.DrawingSpec(thickness=1, circle_radius=1, color=(0, 255, 0))

#-- Function to set GUI references
def set_gui_refs(refs):
    global video_label, start_button, stop_button, status_value_label
    global progress_bar, blink_value_label, yawn_count_value_label
    global doze_value_label, ear_value_label, yawn_value_label, root
    global vs, camera_available

    video_label = refs["video_label"]
    start_button = refs["start_button"]
    stop_button = refs["stop_button"]
    status_value_label = refs["status_value_label"]
    progress_bar = refs["progress_bar"]
    blink_value_label = refs["blink_value_label"]
    yawn_count_value_label = refs["yawn_count_value_label"]
    doze_value_label = refs["doze_value_label"]
    ear_value_label = refs["ear_value_label"]
    yawn_value_label = refs["yawn_value_label"]
    root = refs["root"]

    vs = refs["vs"]
    camera_available = refs["camera_available"]

#-- Function to calculate Eye Aspect Ratio (EAR)
def eye_aspect_ratio(landmarks, eye_indices):
    p = [np.array([landmarks[i].x, landmarks[i].y]) for i in eye_indices]
    A = np.linalg.norm(p[1] - p[5])
    B = np.linalg.norm(p[2] - p[4])
    C = np.linalg.norm(p[0] - p[3])
    return (A + B) / (2.0 * C)

#-- Function to draw landmark boxes around eyes and mouth
def draw_landmark_box(frame, landmarks, indices, color=(0, 255, 0)):
    h, w = frame.shape[:2]
    points = np.array([(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in indices])
    cv2.polylines(frame, [points], isClosed=True, color=color, thickness=1)

#-- Function to update the video frame and perform detection
def update_frame():
    global COUNTER, alarm_status, alarm_status2, saying, eye_blink_count, yawn_count
    global eyes_closed, mouth_open, alert_triggered, closed_eye_time, progress_full_count
    global last_backend_send_time, current_detection_data
    global yawn_start_time

    if not detection_enabled or not camera_available or not vs:
        video_label.after(100, update_frame)
        return
    try:
        frame = vs.read()
        if frame is None:
            video_label.after(100, update_frame)
            return
        frame = imutils.resize(frame, width=800)
        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        results = face_mesh.process(rgb)
        display_frame = frame.copy()

        status_message = "NORMAL"
        status_color = "#4CAF50"
        current_ear = 0.0
        current_mouth_distance = 0.0

        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0].landmark
            left_indices = [33, 160, 158, 133, 153, 144]
            right_indices = [263, 387, 385, 362, 380, 373]
            left_ear = eye_aspect_ratio(landmarks, left_indices)
            right_ear = eye_aspect_ratio(landmarks, right_indices)
            current_ear = (left_ear + right_ear) / 2.0
            current_mouth_distance = lip_distance(landmarks)
            draw_landmark_box(display_frame, landmarks, [33, 160, 158, 133, 153, 144], (0, 255, 0))   # ซ้าย
            draw_landmark_box(display_frame, landmarks, [263, 387, 385, 362, 380, 373], (0, 255, 0))  # ขวา
            draw_landmark_box(display_frame, landmarks, [13, 14, 17, 18], (0, 165, 255))              # ปาก

            if current_ear < EYE_AR_THRESH:
                COUNTER += 1
                if COUNTER >= EYE_AR_CONSEC_FRAMES:
                    if not alarm_status:
                        alarm_status = True
                        eye_blink_count += 1
                        if os.path.exists(alarm_path):
                            start_alarm_thread(alarm_path, alarm_flag=lambda: alarm_status)
                    status_message = "DROWSINESS DETECTED"
                    status_color = "#F44336"
                    closed_eye_time += 1
                    if closed_eye_time >= 50:
                        alert_triggered = True
                        status_message = "CRITICAL: EXTENDED DROWSINESS"
                        status_color = "#D32F2F"
            else:
                COUNTER = 0
                alarm_status = False
                closed_eye_time = 0
                alert_triggered = False

            if current_mouth_distance > 0.5:  # MAR Threshold
                if yawn_start_time is None:
                    yawn_start_time = time.time()
                elif time.time() - yawn_start_time > 1.5:
                    if not mouth_open:
                        yawn_count += 1
                        mouth_open = True
                        if os.path.exists(alarm_path) and not alarm_status2 and not saying:
                            alarm_status2 = True
                            start_alarm_thread(
                                alarm_path,
                                once=True,
                                state_flag_setter=lambda: set_saying(True),
                                state_flag_clearer=lambda: clear_saying()
                            )
                    if status_message == "NORMAL":
                        status_message = "YAWN DETECTED"
                        status_color = "#FF9800"
            else:
                mouth_open = False
                alarm_status2 = False
                yawn_start_time = None

        else:
            status_message = "NO FACE DETECTED"
            status_color = "#FF9800"

        if alert_triggered:
            progress_bar["value"] += 3
            if progress_bar["value"] >= 100:
                progress_full_count += 1
                progress_bar["value"] = 0
        else:
            if progress_bar["value"] > 0:
                progress_bar["value"] -= 1

        ear_value_label.config(text=f"{current_ear:.3f}")
        yawn_value_label.config(text=f"{current_mouth_distance:.1f}")
        blink_value_label.config(text=str(eye_blink_count))
        yawn_count_value_label.config(text=str(yawn_count))
        doze_value_label.config(text=str(progress_full_count))
        status_value_label.config(text=status_message, fg=status_color)

        current_detection_data = {
            "ear": current_ear,
            "mouth_distance": current_mouth_distance,
            "status": status_message,
            "drowsiness_events": eye_blink_count,
            "yawn_events": yawn_count,
            "critical_alerts": progress_full_count
        }

        if time.time() - last_backend_send_time >= FIREBASE_SEND_INTERVAL:
            send_data_to_firebase(current_detection_data)
            if status_message == "DROWSINESS DETECTED":
                send_alert_to_firebase("drowsiness_detected", "medium")
            elif status_message == "CRITICAL: EXTENDED DROWSINESS":
                send_alert_to_firebase("critical_drowsiness", "high")
            elif status_message == "YAWN DETECTED":
                send_alert_to_firebase("yawn_detected", "low")
            last_backend_send_time = time.time()

        cv2.putText(display_frame, f"EAR: {current_ear:.3f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
        cv2.putText(display_frame, f"MAR: {current_mouth_distance:.1f}", (10, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255,255,255), 2)
        cv2.putText(display_frame, f"Status: {status_message}", (10, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0) if status_message == "NORMAL" else (0,0,255), 2)

        img = ImageTk.PhotoImage(Image.fromarray(cv2.cvtColor(display_frame, cv2.COLOR_BGR2RGB)))
        video_label.imgtk = img
        video_label.configure(image=img)
        video_label.after(30, update_frame)

    except Exception as e:
        print(f"[Frame Update] Error: {e}")
        video_label.after(100, update_frame)

#-- Functions to control the GUI state and actions
def set_saying(val):
    global saying
    saying = val

#-- Function to clear the saying state and reset alarm status
def clear_saying():
    global saying, alarm_status2
    saying = False
    alarm_status2 = False

#-- Functions to handle button actions
def start_video():
    global detection_enabled
    detection_enabled = True
    if start_button:
        start_button.config(state="disabled", text="SYSTEM RUNNING", bg="#37474F")
    if stop_button:
        stop_button.config(state="normal")
    if status_value_label:
        status_value_label.config(text="DETECTION ACTIVE", fg="#4CAF50")
    update_frame()

#-- Function to stop video detection and reset the state
def stop_video():
    global detection_enabled
    detection_enabled = False
    if start_button:
        start_button.config(state="normal", text="START DETECTION", bg="#4CAF50")
    if stop_button:
        stop_button.config(state="disabled")
    if status_value_label:
        status_value_label.config(text="SYSTEM STOPPED", fg="#FF9800")

#-- Function to reset all values and GUI components
def reset_values():
    global eye_blink_count, yawn_count, progress_full_count, COUNTER
    global closed_eye_time, alarm_status, alarm_status2, alert_triggered, eyes_closed, mouth_open
    eye_blink_count = yawn_count = progress_full_count = COUNTER = closed_eye_time = 0
    alarm_status = alarm_status2 = alert_triggered = eyes_closed = mouth_open = False
    if blink_value_label:
        blink_value_label.config(text="0")
    if yawn_count_value_label:
        yawn_count_value_label.config(text="0")
    if doze_value_label:
        doze_value_label.config(text="0")
    if ear_value_label:
        ear_value_label.config(text="0.000")
    if yawn_value_label:
        yawn_value_label.config(text="0.0")
    if progress_bar:
        progress_bar["value"] = 0
    if status_value_label:
        status_value_label.config(text="RESET COMPLETE", fg="#4CAF50")

#-- Function to exit the program with confirmation
def exit_program():
    on_closing()  # บน Raspberry Pi ไม่ต้องยืนยัน


#-- Function to change the camera source dynamically
def change_camera_source(source):
    global vs, camera_available
    if vs:
        vs.stop()
    vs = VideoStream(src=source).start()
    time.sleep(2.0)
    frame = vs.read()
    camera_available = frame is not None
    if camera_available:
        messagebox.showinfo("Camera Source", f"Camera changed to {source}")
    else:
        messagebox.showerror("Camera Error", f"Failed to connect to camera {source}")

#-- Function to handle the closing of the GUI window
def on_closing():
    global vs
    if vs:
        vs.stop()
    cv2.destroyAllWindows()
    if root:
        root.destroy()
