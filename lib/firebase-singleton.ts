/**
 * Firebase client-side singleton.
 * ถูก import แบบ `import "./firebase-singleton"` เพื่อให้แน่ใจว่า
 * Firebase App จะถูกสร้างเพียงครั้งเดียวในฝั่งเบราว์เซอร์
 *
 * ❗ ไม่แก้ไข UI และไม่เปลี่ยนเส้นทางดึงข้อมูล Firebase
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getDatabase, type Database } from "firebase/database"
import { getFirestore, type Firestore } from "firebase/firestore"

// ใช้ตัวแปร NEXT_PUBLIC_... ตามกฎของ Next.js
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// สร้างหรือดึง Firebase App เดิม
const firebaseApp: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// singletons ของ service ต่าง ๆ
const firebaseAuth: Auth = getAuth(firebaseApp)
const realtimeDb: Database = getDatabase(firebaseApp)
const firestore: Firestore = getFirestore(firebaseApp)

// export ให้ไฟล์อื่นใช้งาน
export { firebaseApp, firebaseAuth, realtimeDb, firestore }

// export default เพื่อรองรับการ import แบบ default (ถ้ามี)
export default firebaseApp
