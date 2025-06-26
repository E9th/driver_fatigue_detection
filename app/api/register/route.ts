import { type NextRequest, NextResponse } from "next/server"
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().min(1),
  phone: z.string().min(10),
  license: z.string().min(1),
  deviceId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  try {
    const adminAuth = getAdminAuth()
    const adminDb = getAdminDb()

    if (!adminAuth || !adminDb) {
      return NextResponse.json(
        {
          error: "Server configuration error",
          message: "Firebase Admin is not properly configured. Please contact the administrator.",
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email: validatedData.email,
      password: validatedData.password,
      displayName: validatedData.fullName,
    })

    // Save user data to Realtime Database
    const userData = {
      email: validatedData.email,
      fullName: validatedData.fullName,
      phone: validatedData.phone,
      license: validatedData.license,
      deviceId: validatedData.deviceId,
      role: "user",
      createdAt: new Date().toISOString(),
    }

    await adminDb.ref(`users/${userRecord.uid}`).set(userData)

    return NextResponse.json({
      success: true,
      message: "User registered successfully",
      uid: userRecord.uid,
    })
  } catch (error: any) {
    console.error("Registration error:", error)

    if (error.code === "auth/email-already-exists") {
      return NextResponse.json(
        { error: "Email already exists", message: "This email is already registered." },
        { status: 400 },
      )
    }

    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation error", message: "Invalid input data.", details: error.errors },
        { status: 400 },
      )
    }

    return NextResponse.json(
      { error: "Registration failed", message: "An unexpected error occurred." },
      { status: 500 },
    )
  }
}
