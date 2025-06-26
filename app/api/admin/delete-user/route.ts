import { type NextRequest, NextResponse } from "next/server"
import { auth, database } from "@/lib/firebaseAdmin"

export async function POST(request: NextRequest) {
  try {
    const { uid } = await request.json()

    if (!uid) {
      return NextResponse.json({ error: "UID is required" }, { status: 400 })
    }

    const adminAuth = await auth()
    const adminDb = await database()

    // Delete from Firebase Auth
    await adminAuth.deleteUser(uid)

    // Delete from Realtime Database
    await adminDb.ref(`users/${uid}`).remove()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
