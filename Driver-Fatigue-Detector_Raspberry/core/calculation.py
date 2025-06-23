from scipy.spatial import distance as dist
import numpy as np
from imutils import face_utils

#--eye aspect ratio (EAR) calculation
def eye_aspect_ratio(eye):
    """
    คำนวณ Eye Aspect Ratio (EAR) จากจุด landmark ของตา
    """
    A = dist.euclidean(eye[1], eye[5])
    B = dist.euclidean(eye[2], eye[4])
    C = dist.euclidean(eye[0], eye[3])
    ear = (A + B) / (2.0 * C)
    return ear

#--final EAR calculation
def final_ear(shape):
    """
    คำนวณ EAR จาก landmark shape ทั้งใบหน้า
    คืนค่า EAR และจุดตาซ้าย-ขวา
    """
    (lStart, lEnd) = face_utils.FACIAL_LANDMARKS_IDXS["left_eye"]
    (rStart, rEnd) = face_utils.FACIAL_LANDMARKS_IDXS["right_eye"]
    leftEye = shape[lStart:lEnd]
    rightEye = shape[rStart:rEnd]
    leftEAR = eye_aspect_ratio(leftEye)
    rightEAR = eye_aspect_ratio(rightEye)
    ear = (leftEAR + rightEAR) / 2.0
    return (ear, leftEye, rightEye)

#--Mouth Aspect Ratio (MAR) calculation
def lip_distance(landmarks):
    """
    คำนวณ MAR (Mouth Aspect Ratio) จาก Mediapipe landmark (normalized)
    """
    import numpy as np

    try:
        # จุดบนและล่างของปาก (กลางปาก)
        top = np.array([
            (landmarks[13].x + landmarks[14].x) / 2,
            (landmarks[13].y + landmarks[14].y) / 2
        ])
        bottom = np.array([
            (landmarks[17].x + landmarks[18].x) / 2,
            (landmarks[17].y + landmarks[18].y) / 2
        ])
        vertical = np.linalg.norm(top - bottom)

        # มุมปากซ้ายและขวา
        left = np.array([landmarks[61].x, landmarks[61].y])
        right = np.array([landmarks[291].x, landmarks[291].y])
        horizontal = np.linalg.norm(left - right)

        return vertical / horizontal if horizontal != 0 else 0.0
    except:
        return 0.0
