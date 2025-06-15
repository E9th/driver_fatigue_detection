import cv2
import dlib
import os

def load_detectors(predictor_path="models/shape_predictor_68_face_landmarks.dat"):
    try:
        # ใช้ path แบบเต็มที่ปลอดภัย
        haar_path = os.path.join(cv2.__path__[0], "data", "haarcascade_frontalface_default.xml")
        if not os.path.exists(haar_path):
            raise FileNotFoundError(f"Haarcascade XML not found: {haar_path}")

        detector = cv2.CascadeClassifier(haar_path)
        if detector.empty():
            raise ValueError("Failed to load Haar Cascade Classifier.")

        predictor = None
        if os.path.exists(predictor_path):
            predictor = dlib.shape_predictor(predictor_path)
            print("[Detector] Predictor loaded successfully.")
        else:
            print(f"[Detector] WARNING: Predictor not found at {predictor_path}")

        return detector, predictor

    except Exception as e:
        print(f"[Detector] Error loading detector/predictor: {e}")
        return None, None
