import { type NextRequest, NextResponse } from "next/server"
import { database } from "@/lib/firebaseAdmin"

export async function GET(request: NextRequest) {
  try {
    // Try to get Firebase Admin database instance
    let db

    try {
      db = await database()
    } catch (error) {
      return NextResponse.json(
        { error: "Firebase Admin not configured. Please set up environment variables." },
        { status: 500 },
      )
    }

    const snapshot = await db.ref("users").get()

    if (snapshot.exists()) {
      const users = Object.values(snapshot.val())
      return NextResponse.json(users)
    } else {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}
