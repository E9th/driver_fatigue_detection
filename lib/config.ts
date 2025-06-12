/**
 * Application Configuration
 * Centralized configuration management for the Driver Fatigue Detection system
 */

// Firebase Configuration with environment variable fallbacks
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC7Syu0aTE5WkAr7cMWdyllo5F6g--NsxM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driver-fatigue-detection.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driver-fatigue-detection",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driver-fatigue-detection.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1086008277749",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1086008277749:web:5e075a8170f36bd4dc63bc",
}

// Application Constants
export const APP_CONFIG = {
  // Cache settings
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
  MAX_LISTENERS: 10,
  DEFAULT_THROTTLE: 3000, // 3 seconds

  // Data limits
  HISTORICAL_DATA_LIMIT: 200,
  DEVICE_BATCH_SIZE: 5,

  // Development mode detection
  isDevelopmentMode: typeof window !== "undefined" && localStorage.getItem("firebase_mode") === "development",

  // Date/Time settings
  THAILAND_TIMEZONE_OFFSET: 7 * 60, // UTC+7 in minutes

  // UI Constants
  REFRESH_INTERVAL: 30000, // 30 seconds
  CONNECTION_TIMEOUT: 5000, // 5 seconds
} as const

// Device ID utilities
export const DEVICE_UTILS = {
  normalize: (deviceId: string): string => {
    if (/^\d+$/.test(deviceId)) {
      return `device_${deviceId.padStart(2, "0")}`
    }
    if (deviceId.startsWith("device_")) {
      return deviceId
    }
    return `device_${deviceId}`
  },

  getDisplayId: (deviceId: string): string => {
    if (deviceId.startsWith("device_")) {
      return deviceId.replace("device_", "")
    }
    return deviceId
  },
} as const

// Status mappings for Thai language
export const STATUS_MAPPINGS = {
  NORMAL: "ปกติ",
  "YAWN DETECTED": "หาว",
  "DROWSINESS DETECTED": "ง่วงนอน",
  "CRITICAL: EXTENDED DROWSINESS": "อันตราย",
  CRITICAL: "อันตราย",
} as const

// Safety level configurations
export const SAFETY_LEVELS = {
  SAFE: { threshold: 0.25, level: "ปลอดภัย", color: "text-green-600", description: "ตาเปิดปกติ" },
  WARNING: { threshold: 0.2, level: "ระวัง", color: "text-yellow-600", description: "เริ่มง่วงเล็กน้อย" },
  RISK: { threshold: 0.15, level: "เสี่ยง", color: "text-orange-600", description: "ง่วงนอนมาก" },
  DANGER: { threshold: 0, level: "อันตราย", color: "text-red-600", description: "ง่วงนอนอย่างรุนแรง" },
} as const
