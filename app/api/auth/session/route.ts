import { NextResponse } from "next/server"

// Dynamic import to ensure Firebase Admin is initialized
async function getAdminAuth() {
  const { adminAuth } = await import("@/lib/firebase-admin")
  return adminAuth
}

export async function GET(request: Request) {
  try {
    const adminAuth = await getAdminAuth()
    const session = request.headers.get("cookie")?.match(/session=([^;]+)/)?.[1]

    if (!session) {
      return NextResponse.json({ isLogged: false }, { status: 401 })
    }

    const decodedClaims = await adminAuth.verifySessionCookie(session, true)
    if (!decodedClaims) {
      return NextResponse.json({ isLogged: false }, { status: 401 })
    }
    return NextResponse.json({ isLogged: true }, { status: 200 })
  } catch (error) {
    console.error("❌ Error verifying session cookie:", error)
    return NextResponse.json({ isLogged: false, error: "Invalid session cookie" }, { status: 401 })
  }
}

export async function POST(request: Request) {
  try {
    console.log("🔧 Session API: Starting session creation")

    const adminAuth = await getAdminAuth()
    const body = await request.json()
    const idToken = body.idToken

    if (!idToken) {
      console.error("❌ Session API: No ID token provided")
      return NextResponse.json({ error: "ID token is required" }, { status: 400 })
    }

    console.log("🔧 Session API: ID token received, length:", idToken.length)

    // Verify the ID token first
    console.log("🔧 Session API: Verifying ID token...")
    const decodedToken = await adminAuth.verifyIdToken(idToken)
    console.log("✅ Session API: ID Token verified for user:", decodedToken.uid)

    // Create session cookie
    console.log("🔧 Session API: Creating session cookie...")
    const expiresIn = 60 * 60 * 24 * 5 * 1000 // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    console.log("✅ Session API: Session cookie created successfully")

    const options = {
      name: "session",
      value: sessionCookie,
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
    }

    const response = NextResponse.json({ status: "success" }, { status: 200 })
    response.cookies.set(options)

    console.log("✅ Session API: Response sent successfully")
    return response
  } catch (error: any) {
    console.error("❌ Session API: Error creating session cookie:", error)
    console.error("❌ Session API: Error code:", error.code)
    console.error("❌ Session API: Error message:", error.message)

    // Provide more specific error messages
    if (error.code === "auth/id-token-expired") {
      return NextResponse.json({ error: "ID token has expired" }, { status: 401 })
    } else if (error.code === "auth/invalid-id-token") {
      return NextResponse.json({ error: "Invalid ID token" }, { status: 401 })
    } else if (error.code === "auth/project-not-found") {
      return NextResponse.json({ error: "Firebase project not found" }, { status: 500 })
    } else if (error.code === "auth/insufficient-permission") {
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
    }

    return NextResponse.json(
      {
        error: "Failed to create session",
        details: error.message,
        code: error.code,
      },
      { status: 500 },
    )
  }
}
