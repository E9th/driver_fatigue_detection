import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ message: 'No token provided' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];

    // ใช้ Admin SDK ตรวจสอบ Token อย่างปลอดภัย
    // การกำหนด checkRevoked: true จะช่วยให้แน่ใจว่า user ยังไม่ได้ถูกแบนหรือลบไป
    const decodedToken = await adminAuth.verifyIdToken(token, true);

    // สร้าง Session Cookie ที่มีอายุ 5 วัน
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(token, { expiresIn });

    // ตั้งค่า cookie ใน browser ของผู้ใช้
    cookies().set('session', sessionCookie, { httpOnly: true, secure: true, maxAge: expiresIn });

    console.log('✅ Session created and cookie set for UID:', decodedToken.uid);

    return NextResponse.json({ success: true, uid: decodedToken.uid });

  } catch (error) {
    console.error('API Session Error:', error);
    return NextResponse.json({ message: 'Authentication failed' }, { status: 401 });
  }
}
