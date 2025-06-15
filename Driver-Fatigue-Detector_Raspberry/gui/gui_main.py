import tkinter as tk
from tkinter import Frame, Label, ttk, messagebox
from PIL import Image, ImageTk

from core.firebase import (
    initialize_firebase,
    update_device_info
)

# -- Import GUI update functions
from gui.gui_update import (
    start_video, stop_video, reset_values,
    exit_program, change_camera_source, on_closing,
    update_frame, set_gui_refs
)

# Theme settings
primary_color = "#2196F3"
secondary_color = "#37474F"
accent_color = "#FFC107"
success_color = "#4CAF50"
danger_color = "#F44336"
warning_color = "#FF9800"
text_color = "#FFFFFF"
bg_color = "#1E1E1E"
card_bg = "#2D2D2D"

title_font = ("Segoe UI", 18, "bold")
header_font = ("Segoe UI", 12, "bold")
body_font = ("Segoe UI", 10)

#-- Global variables for GUI components
root = None
video_label = None
start_button = None
stop_button = None
status_value_label = None
progress_bar = None
blink_value_label = None
yawn_count_value_label = None
doze_value_label = None
ear_value_label = None
yawn_value_label = None

#-- Import necessary modules for video processing
from imutils.video import VideoStream
from core.detector import load_detectors
import time

detector, predictor = load_detectors()

vs = None
camera_available = False
try:
    vs = VideoStream(src=0).start()
    time.sleep(2.0)
    test_frame = vs.read()
    camera_available = test_frame is not None
except Exception as e:
    print(f"[Camera] ERROR: {e}")
    camera_available = False

#-- Function to start the GUI application
def start_gui():
    global root, video_label, start_button, stop_button
    global status_value_label, progress_bar
    global blink_value_label, yawn_count_value_label, doze_value_label
    global ear_value_label, yawn_value_label

    initialize_firebase()

    root = tk.Tk()
    root.title("Driver Fatigue Detection System v2.0 - Professional Edition")
    root.attributes("-fullscreen", True)
    root.bind("<Escape>", lambda e: root.attributes("-fullscreen", False))  # กด ESC เพื่อออก
    root.configure(bg=bg_color)
    root.resizable(True, True)
    root.protocol("WM_DELETE_WINDOW", on_closing)

    # Menu
    menu = tk.Menu(root, bg=secondary_color, fg=text_color)
    root.config(menu=menu)
    settings_menu = tk.Menu(menu, tearoff=0, bg=secondary_color, fg=text_color)
    menu.add_cascade(label="Settings", menu=settings_menu)

    camera_menu = tk.Menu(settings_menu, tearoff=0, bg=secondary_color, fg=text_color)
    settings_menu.add_cascade(label="Camera Source", menu=camera_menu)
    camera_menu.add_command(label="Internal Camera (0)", command=lambda: change_camera_source(0))
    camera_menu.add_command(label="External Camera (1)", command=lambda: change_camera_source(1))

    # Header
    header_frame = Frame(root, bg=primary_color, height=60)
    header_frame.pack(fill="x")
    header_frame.pack_propagate(False)
    Label(header_frame, text="DRIVER FATIGUE DETECTION SYSTEM v2.0", 
          font=title_font, fg=text_color, bg=primary_color).pack(expand=True)

    # Main container
    main_container = Frame(root, bg=bg_color)
    main_container.pack(fill="both", expand=True, padx=10, pady=10)

    # Left - Video
    left_frame = Frame(main_container, bg=card_bg, relief="raised", bd=2)
    left_frame.pack(side="left", fill="both", expand=True, padx=(0, 10))

    Label(left_frame, text="LIVE CAMERA FEED", font=header_font, fg=accent_color, bg=card_bg).pack(pady=(10, 5))
    video_label = Label(left_frame, bg=card_bg, relief="sunken", bd=2, font=("Arial", 12))
    video_label.pack(pady=10, padx=10, fill="both", expand=True)

    # Right - Controls
    right_frame = Frame(main_container, bg=bg_color, width=400)
    right_frame.pack(side="right", fill="y", padx=(10, 0))
    right_frame.pack_propagate(False)

    # Status panel
    status_frame = Frame(right_frame, bg=card_bg, relief="raised", bd=2)
    status_frame.pack(fill="x", pady=(0, 5))
    Label(status_frame, text="SYSTEM STATUS", font=("Segoe UI", 10, "bold"), fg=accent_color, bg=card_bg).pack(pady=(5, 3))
    status_info_frame = Frame(status_frame, bg=card_bg)
    status_info_frame.pack(pady=(0, 5), padx=10)

    Label(status_info_frame, text="Status:", font=("Segoe UI", 9), fg=text_color, bg=card_bg).pack(anchor="w")
    status_value_label = Label(status_info_frame, text="WAITING", font=("Segoe UI", 10, "bold"), fg=warning_color, bg=card_bg)
    status_value_label.pack(anchor="w", pady=(2, 5))

    update_device_info(status_info_frame, text_color, card_bg, primary_color, success_color, danger_color)

    # Metrics panel
    metrics_frame = Frame(right_frame, bg=card_bg, relief="raised", bd=2)
    metrics_frame.pack(fill="x", pady=(0, 5))
    Label(metrics_frame, text="DETECTION METRICS", font=("Segoe UI", 10, "bold"), fg=accent_color, bg=card_bg).pack(pady=(5, 3))
    metrics_grid = Frame(metrics_frame, bg=card_bg)
    metrics_grid.pack(pady=(0, 5), padx=10, fill="x")

    # Create metrics labels
    def create_metric(label_text, var_name, default_value, color):
        nonlocal metrics_grid
        row = Frame(metrics_grid, bg=card_bg)
        row.pack(fill="x", pady=1)
        Label(row, text=label_text, font=("Segoe UI", 9), fg=text_color, bg=card_bg, width=8, anchor="w").pack(side="left")
        value_label = Label(row, text=default_value, font=("Segoe UI", 10, "bold"), fg=color, bg=card_bg, width=6, anchor="e")
        value_label.pack(side="right")
        globals()[var_name] = value_label

    create_metric("EAR:", "ear_value_label", "0.000", primary_color)
    create_metric("Mouth:", "yawn_value_label", "0.0", primary_color)
    create_metric("Events:", "blink_value_label", "0", warning_color)

    yawn_count_value_label = Label(metrics_grid, text="0", font=("Segoe UI", 10, "bold"), fg=warning_color, bg=card_bg)
    doze_value_label = Label(metrics_grid, text="0", font=("Segoe UI", 10, "bold"), fg=danger_color, bg=card_bg)

    # Progress bar
    progress_frame = Frame(right_frame, bg=card_bg, relief="raised", bd=2)
    progress_frame.pack(fill="x", pady=(0, 5))
    Label(progress_frame, text="DROWSINESS LEVEL", font=("Segoe UI", 10, "bold"), fg=accent_color, bg=card_bg).pack(pady=(5, 3))

    style = ttk.Style()
    style.theme_use('clam')
    style.configure("Custom.Horizontal.TProgressbar", troughcolor=secondary_color, background=danger_color)
    progress_bar = ttk.Progressbar(progress_frame, length=350, maximum=100, mode="determinate", style="Custom.Horizontal.TProgressbar")
    progress_bar.pack(pady=(0, 5))

   #-- auto start video if camera is available
    root.after(500, start_video)


    # Footer
    footer_frame = Frame(root, bg=secondary_color, height=30)
    footer_frame.pack(fill="x", side="bottom")
    footer_frame.pack_propagate(False)
    Label(footer_frame, text="Driver Fatigue Detection System v2.0 | Professional Edition | Real-time Detection", 
          font=("Segoe UI", 8), fg=text_color, bg=secondary_color).pack(expand=True)

    #-- Set GUI references for update functions
    set_gui_refs({
        "video_label": video_label,
        "start_button": start_button,
        "stop_button": stop_button,
        "status_value_label": status_value_label,
        "progress_bar": progress_bar,
        "blink_value_label": blink_value_label,
        "yawn_count_value_label": yawn_count_value_label,
        "doze_value_label": doze_value_label,
        "ear_value_label": ear_value_label,
        "yawn_value_label": yawn_value_label,
        "root": root,
        "vs": vs,
        "detector": detector,
        "predictor": predictor,
        "camera_available": camera_available,
    })

    root.mainloop()
