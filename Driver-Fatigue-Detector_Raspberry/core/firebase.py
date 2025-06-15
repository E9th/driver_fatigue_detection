import requests
import time
from datetime import datetime
from tkinter import messagebox, Frame, Label
import pyrebase

#-- Firebase Configuration
DEVICE_ID = "device_01"
FIREBASE_URL = "https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app"
firebase_connected = False

#-- Firebase Configuration
FIREBASE_CONFIG = {
    "apiKey": "AIzaSyC7Syu0aTE5WkAr7cMWdyllo5F6g--NsxM",
    "authDomain": "driver-fatigue-detection.firebaseapp.com",
    "databaseURL": "https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
    "storageBucket": "driver-fatigue-detection.appspot.com",
}

# Device Configuration
DEVICE_ID = "device_01"
DRIVER_EMAIL = "driver01@gmail.com"
DRIVER_PASSWORD = "Driver01"

# Firebase Global Variables
firebase_app = None
auth_handler = None
db_handler = None
user_token = None
firebase_connected = False

#-- Firebase Functions
def initialize_firebase():
    global firebase_app, auth_handler, db_handler, user_token, firebase_connected
    try:
        # Initialize Firebase app
        firebase_app = pyrebase.initialize_app(FIREBASE_CONFIG)
        auth_handler = firebase_app.auth()
        db_handler = firebase_app.database()
        
        # Authenticate user
        user = auth_handler.sign_in_with_email_and_password(DRIVER_EMAIL, DRIVER_PASSWORD)
        user_token = user['idToken']
        
        print(f"DEBUG: Firebase Authenticated as {DRIVER_EMAIL}")
        firebase_connected = True
        
        # Test connection by writing connection status
        db_handler.child("devices").child(DEVICE_ID).child("connection").update({
            "status": "connected_auth_v8",
            "timestamp": datetime.now().isoformat()
        }, user_token)
        
        return True
    except Exception as e:
        print(f"DEBUG ERROR: Firebase authentication failed: {e}")
        firebase_connected = False
        return False

#-- Token Refresh Logic
def refresh_token_if_needed(e):
    global user_token, auth_handler
    if "expired" in str(e).lower() or "permission_denied" in str(e).lower():
        try:
            print("DEBUG: Token expired, refreshing...")
            if auth_handler and hasattr(auth_handler, 'current_user') and auth_handler.current_user:
                user = auth_handler.refresh(auth_handler.current_user['refreshToken'])
                user_token = user['idToken']
                print("DEBUG: Token refreshed successfully.")
                return True
        except Exception as refresh_e:
            print(f"DEBUG ERROR: Failed to refresh token: {refresh_e}")
    return False

#-- Data Sending Functions
def send_data_to_firebase(data):

    if not firebase_connected or not db_handler or not user_token: 
        return
    
    try:
        # Add timestamp to data
        enhanced_data = {**data, "timestamp": datetime.now().isoformat()}
        
        # Update current data
        db_handler.child("devices").child(DEVICE_ID).child("current_data").set(enhanced_data, user_token)
        
        # Store in history
        timestamp_key = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        db_handler.child("devices").child(DEVICE_ID).child("history").child(timestamp_key).set(enhanced_data, user_token)
        
        # Update last update timestamp
        db_handler.child("devices").child(DEVICE_ID).update({"last_update": datetime.now().isoformat()}, user_token)
        
    except Exception as e:
        if not refresh_token_if_needed(e):
            print(f"DEBUG ERROR: Failed to send data: {e}")

#-- Alert Functions
def send_alert_to_firebase(alert_type, severity="medium"):
    if not firebase_connected or not db_handler or not user_token: 
        return
    
    try:
        # Create alert data
        alert_key = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        alert_data = {
            "device_id": DEVICE_ID, 
            "alert_type": alert_type, 
            "severity": severity,
            "timestamp": datetime.now().isoformat(), 
            "status": "active", 
            "acknowledged": False
        }
        
        # Store alert
        db_handler.child("alerts").child(alert_key).set(alert_data, user_token)
        db_handler.child("devices").child(DEVICE_ID).child("latest_alert").set(alert_data, user_token)
        
    except Exception as e:
        if not refresh_token_if_needed(e):
            print(f"DEBUG ERROR: Failed to send alert: {e}")

#-- Update Device Info in UI
def update_device_info(status_info_frame, text_color, card_bg, primary_color, success_color, danger_color):
    global firebase_connected
    try:
        device_info_frame = Frame(status_info_frame, bg=card_bg)
        device_info_frame.pack(pady=(5, 0), fill="x")

        Label(device_info_frame, text="Device ID:", font=("Segoe UI", 9), fg=text_color, bg=card_bg).pack(anchor="w")
        Label(device_info_frame, text=DEVICE_ID, font=("Segoe UI", 10, "bold"), fg=primary_color, bg=card_bg).pack(anchor="w")

        Label(device_info_frame, text="Firebase:", font=("Segoe UI", 9), fg=text_color, bg=card_bg).pack(anchor="w")
        firebase_status = "Connected" if firebase_connected else "Disconnected"
        firebase_color = success_color if firebase_connected else danger_color
        Label(device_info_frame, text=firebase_status, font=("Segoe UI", 10, "bold"), fg=firebase_color, bg=card_bg).pack(anchor="w")
    except Exception as e:
        print(f"[Firebase] Info update error: {e}")
