import { type NextRequest, NextResponse } from "next/server"
import { database } from "@/lib/firebaseAdmin"

export async function GET(request: NextRequest) {
  try {
    const db = await database()
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
