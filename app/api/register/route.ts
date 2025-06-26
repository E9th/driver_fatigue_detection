import { type NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"
import { validateEnvironmentVariables } from "@/lib/config"

export async function POST(request: NextRequest) {
  try {
    // ตรวจสอบ Environment Variables ก่อน
    validateEnvironmentVariables()

    const { userData, idToken } = await request.json()

    if (!idToken) {
      return NextResponse.json({ error: "ID Token is required" }, { status: 400 })
    }

    // Verify idToken
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    const uid = decodedToken.uid

    // ตรวจสอบว่า email ซ้ำหรือไม่
    const existingUsers = await adminDb.ref("users").orderByChild("email").equalTo(userData.email).once("value")

    if (existingUsers.exists()) {
      return NextResponse.json({ error: "Email already exists" }, { status: 409 })
    }

    // ตรวจสอบว่า license ซ้ำหรือไม่
    const existingLicense = await adminDb.ref("users").orderByChild("license").equalTo(userData.license).once("value")

    if (existingLicense.exists()) {
      return NextResponse.json({ error: "License already exists" }, { status: 409 })
    }

    // ตรวจสอบว่า deviceId ซ้ำหรือไม่
    const existingDevice = await adminDb.ref("users").orderByChild("deviceId").equalTo(userData.deviceId).once("value")

    if (existingDevice.exists()) {
      return NextResponse.json({ error: "Device ID already in use" }, { status: 409 })
    }

    // บันทึกข้อมูล user
    await adminDb.ref(`users/${uid}`).set({
      ...userData,
      uid,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    })

    console.log(`✅ User registered successfully: ${uid}`)

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      uid,
    })
  } catch (error: any) {
    console.error("❌ Registration error:", error)

    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({ error: "Token expired, please try again" }, { status: 401 })
    }

    if (error.code === "auth/invalid-id-token") {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    return NextResponse.json({ error: error.message || "Registration failed" }, { status: 500 })
  }
}
