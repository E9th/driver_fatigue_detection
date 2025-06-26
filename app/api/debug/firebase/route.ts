import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check environment variables
    const envCheck = {
      hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) + "...",
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      nodeEnv: process.env.NODE_ENV,
    }

    console.log("🔧 Debug: Environment variables check:", envCheck)

    // Try to initialize Firebase Admin
    const { adminAuth } = await import("@/lib/firebase-admin")

    // Test a simple operation
    const listUsers = await adminAuth.listUsers(1)

    return NextResponse.json({
      status: "success",
      message: "Firebase Admin is working correctly",
      envCheck,
      userCount: listUsers.users.length,
    })
  } catch (error: any) {
    console.error("❌ Debug: Firebase Admin error:", error)

    return NextResponse.json(
      {
        status: "error",
        message: error.message,
        code: error.code,
        envCheck: {
          hasProjectId: !!process.env.FIREBASE_PROJECT_ID,
          hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
          hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
          nodeEnv: process.env.NODE_ENV,
        },
      },
      { status: 500 },
    )
  }
}
