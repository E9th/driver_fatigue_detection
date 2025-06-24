"use client"
/**
 * ============================================================================
 * FIREBASE CONFIGURATION - การตั้งค่าและเชื่อมต่อ Firebase
 * ============================================================================
 *
 * ไฟล์นี้เป็นหัวใจของการเชื่อมต่อกับ Firebase Services
 * จัดการการตั้งค่า Firebase App, Authentication, และ Realtime Database
 *
 * FIREBASE SERVICES ที่ใช้:
 * - Firebase Authentication: สำหรับระบบล็อกอิน/ลงทะเบียน
 * - Firebase Realtime Database: สำหรับเก็บข้อมูลผู้ใช้และข้อมูลเซ็นเซอร์
 *
 * ENVIRONMENT VARIABLES ที่ต้องการ:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_DATABASE_URL
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 *
 * USED BY:
 * - lib/auth.ts: สำหรับ Authentication
 * - lib/validation.ts: สำหรับตรวจสอบข้อมูล
 * - lib/data-service.ts: สำหรับดึงข้อมูลเซ็นเซอร์
 * - components/**: สำหรับ components ต่างๆ ที่ต้องใช้ Firebase
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"
import { firebaseConfig } from "./config"

/**
 * Firebase Configuration Object
 * ดึงค่าจาก Environment Variables เพื่อความปลอดภัย
 */

/**
 * Firebase App Instance
 * ใช้ Singleton Pattern เพื่อป้องกันการสร้าง Firebase App ซ้ำ
 *
 * SINGLETON PATTERN:
 * - ตรวจสอบว่ามี Firebase App อยู่แล้วหรือไม่
 * - ถ้ามีแล้วใช้ตัวเดิม ถ้าไม่มีสร้างใหม่
 */
let app: FirebaseApp
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig)
  console.log("✅ Firebase: Initialized successfully")
} else {
  app = getApps()[0]
  console.log("✅ Firebase: Using existing instance")
}

/**
 * Firebase Authentication Instance
 * สำหรับจัดการระบบล็อกอิน/ลงทะเบียน
 *
 * FEATURES:
 * - Email/Password Authentication
 * - User Session Management
 * - Authentication State Persistence
 */
export const auth: Auth = getAuth(app)

/**
 * Firebase Realtime Database Instance
 * สำหรับเก็บและดึงข้อมูลแบบ Real-time
 *
 * DATABASE STRUCTURE:
 * /users/{uid}/
 *   ├── email: string
 *   ├── fullName: string
 *   ├── phone: string
 *   ├── license: string
 *   ├── deviceId: string
 *   ├── role: 'user' | 'admin'
 *   └── createdAt: timestamp
 *
 * /sensor_data/{deviceId}/{timestamp}/
 *   ├── ear: number (0-1)
 *   ├── mouth: number (0-1)
 *   ├── timestamp: number
 *   └── safety_score: number (0-100)
 *
 * /device_commands/{deviceId}/
 *   ├── command: string
 *   ├── timestamp: number
 *   └── status: 'pending' | 'executed'
 */
export const database: Database = getDatabase(app)

/**
 * Firebase App Export
 * สำหรับใช้ในกรณีที่ต้องการ Firebase App Instance โดยตรง
 */
export default app

/**
 * ERROR HANDLING NOTES:
 *
 * 1. Permission Denied:
 *    - ตรวจสอบ Firebase Security Rules
 *    - ตรวจสอบ Authentication State
 *
 * 2. Network Error:
 *    - ตรวจสอบการเชื่อมต่ออินเทอร์เน็ต
 *    - ตรวจสอบ Firebase Project Status
 *
 * 3. Configuration Error:
 *    - ตรวจสอบ Environment Variables
 *    - ตรวจสอบ Firebase Project Settings
 */
