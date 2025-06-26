import admin from 'firebase-admin';

// ตรวจสอบว่ายังไม่มีการ initialize app เพื่อป้องกันการสร้างซ้ำ
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // แก้ไขรูปแบบของ private key ให้ถูกต้อง
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
    // ใส่ Database URL ของคุณที่นี่
    databaseURL: `https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app`,
  });
}

// Export สิ่งที่ต้องใช้
export const adminAuth = admin.auth();
export const adminDb = admin.database();
