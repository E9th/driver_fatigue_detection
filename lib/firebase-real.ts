"use client"

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  type Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import {
  getDatabase,
  ref,
  set,
  get,
  query,
  orderByChild,
  equalTo,
  remove,
  update,
  type Database,
} from "firebase/database"
import { firebaseConfig, isDevelopmentMode } from "./firebase-config"

console.log("🔥 Firebase Real functions loading...")

let app: FirebaseApp | null = null
let auth: Auth | null = null
let database: Database | null = null

// Initialize Firebase
const initializeFirebase = () => {
  if (typeof window === "undefined") {
    throw new Error("Firebase can only be initialized on the client side")
  }

  try {
    if (!app) {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp()
      auth = getAuth(app)
      database = getDatabase(app)

      if (isDevelopmentMode) {
        console.log("🔧 Firebase initialized in development mode")
      } else {
        console.log("🔥 Firebase initialized in production mode")
      }
    }
  } catch (error) {
    console.error("❌ Firebase initialization failed:", error)
    throw error
  }
}

// Helper functions
export const normalizeDeviceId = (deviceId: string): string => {
  if (/^\d+$/.test(deviceId)) {
    return `device_${deviceId.padStart(2, "0")}`
  }
  if (deviceId.startsWith("device_")) {
    return deviceId
  }
  return `device_${deviceId}`
}

export const getDeviceDisplayId = (deviceId: string): string => {
  if (deviceId.startsWith("device_")) {
    return deviceId.replace("device_", "")
  }
  return deviceId
}

// Auth functions
export const useAuthState = (callback: (user: User | null) => void) => {
  if (typeof window === "undefined") {
    return () => {}
  }

  try {
    initializeFirebase()
    if (!auth) throw new Error("Auth not initialized")
    return onAuthStateChanged(auth, callback)
  } catch (error) {
    console.error("❌ Auth state listener error:", error)
    return () => {}
  }
}

export const loginUser = async (email: string, password: string) => {
  try {
    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Simulating login")
      const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
      const user = users.find((u: any) => u.email === email)

      if (user) {
        const mockUser = {
          uid: user.uid,
          email: user.email,
          emailVerified: true,
        }
        return { success: true, user: mockUser }
      } else {
        return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
      }
    }

    initializeFirebase()
    if (!auth) throw new Error("Auth not initialized")

    console.log("🔐 Attempting login for:", email)
    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("✅ Login successful")
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("❌ Login failed:", error.message)

    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
    } else if (error.code === "auth/invalid-email") {
      return { success: false, error: "รูปแบบอีเมลไม่ถูกต้อง" }
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }
  }
}

export const registerUser = async (email: string, password: string, userData: any) => {
  try {
    console.log("📝 Attempting registration for:", email)

    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Simulating user registration")

      const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
      const existingUser = users.find((u: any) => u.email === email)

      if (existingUser) {
        return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" }
      }

      const mockUser = {
        uid: `dev-user-${Date.now()}`,
        email,
        emailVerified: false,
        ...userData,
        createdAt: new Date().toISOString(),
      }

      users.push(mockUser)
      localStorage.setItem("dev-users", JSON.stringify(users))

      return { success: true, user: mockUser }
    }

    initializeFirebase()
    if (!auth || !database) throw new Error("Firebase not initialized")

    const deviceAvailable = await checkDeviceIdAvailability(userData.deviceId)
    if (!deviceAvailable) {
      return { success: false, error: "Device ID นี้ถูกใช้งานแล้ว" }
    }

    const userCredential = await createUserWithEmailAndPassword(auth, email, password)
    const user = userCredential.user

    const normalizedDeviceId = normalizeDeviceId(userData.deviceId)
    const userProfile = {
      uid: user.uid,
      email: user.email,
      fullName: userData.fullName || "",
      phone: userData.phone || "",
      license: userData.license || "",
      deviceId: normalizedDeviceId,
      role: userData.role || "driver",
      registeredAt: new Date().toISOString(),
    }

    await set(ref(database, `users/${user.uid}`), userProfile)

    await set(ref(database, `devices/${normalizedDeviceId}/userId`), user.uid)
    await set(ref(database, `devices/${normalizedDeviceId}/assignedAt`), new Date().toISOString())
    await set(ref(database, `devices/${normalizedDeviceId}/status`), "assigned")

    console.log("✅ Registration successful")
    return { success: true, user }
  } catch (error: any) {
    console.error("❌ Registration failed:", error.message)

    if (error.code === "auth/email-already-in-use") {
      return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" }
    } else if (error.code === "auth/weak-password") {
      return { success: false, error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }
    } else if (error.code === "auth/invalid-email") {
      return { success: false, error: "รูปแบบอีเมลไม่ถูกต้อง" }
    }

    return { success: false, error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" }
  }
}

export const logoutUser = async () => {
  try {
    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Simulating logout")
      return { success: true }
    }

    initializeFirebase()
    if (!auth) throw new Error("Auth not initialized")

    await signOut(auth)
    console.log("✅ Logout successful")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Logout failed:", error.message)
    return { success: false, error: "เกิดข้อผิดพลาดในการออกจากระบบ" }
  }
}

// Device functions
export const getUsedDeviceIds = async (): Promise<string[]> => {
  try {
    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Returning mock device IDs")
      const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
      return users.map((user: any) => user.deviceId).filter(Boolean)
    }

    initializeFirebase()
    if (!database) throw new Error("Database not initialized")

    console.log("🔥 Firebase: Getting used device IDs")
    const snapshot = await get(ref(database, "devices"))
    if (snapshot.exists()) {
      const devices = snapshot.val()
      return Object.keys(devices).filter((deviceId) => devices[deviceId].userId)
    }
    return []
  } catch (error) {
    console.error("❌ Error getting device IDs:", error)
    return []
  }
}

export const checkDeviceIdAvailability = async (deviceId: string): Promise<boolean> => {
  try {
    const usedDevices = await getUsedDeviceIds()
    const normalizedId = normalizeDeviceId(deviceId)
    return !usedDevices.includes(normalizedId)
  } catch (error) {
    console.error("❌ Error checking device availability:", error)
    return false
  }
}

export const checkEmailAvailability = async (email: string): Promise<boolean> => {
  try {
    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Checking email in localStorage")
      const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
      const exists = users.some((user: any) => user.email === email)
      return !exists
    }

    initializeFirebase()
    if (!database) throw new Error("Database not initialized")

    console.log("🔥 Firebase: Checking email availability:", email)
    const snapshot = await get(query(ref(database, "users"), orderByChild("email"), equalTo(email)))
    return !snapshot.exists()
  } catch (error) {
    console.error("❌ Error checking email availability:", error)
    return false
  }
}

// Admin functions
export const getAllUsers = async () => {
  try {
    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Getting users from localStorage")
      const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
      return users.map((user: any, index: number) => ({
        uid: user.uid || `dev-${index}`,
        email: user.email,
        fullName: user.fullName || "Development User",
        phone: user.phone || "",
        license: user.license || "",
        deviceId: user.deviceId || null,
        role: user.role || "driver",
        registeredAt: user.createdAt || new Date().toISOString(),
      }))
    }

    initializeFirebase()
    if (!database) throw new Error("Database not initialized")

    const snapshot = await get(ref(database, "users"))
    if (snapshot.exists()) {
      const users = snapshot.val()
      return Object.entries(users).map(([uid, userData]: [string, any]) => ({
        uid,
        ...userData,
      }))
    }
    return []
  } catch (error) {
    console.error("❌ Error getting users:", error)
    return []
  }
}

export const deleteUser = async (uid: string) => {
  try {
    if (isDevelopmentMode) {
      console.log("🔧 Development mode: Removing user from localStorage")
      const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
      const filteredUsers = users.filter((user: any) => user.uid !== uid)
      localStorage.setItem("dev-users", JSON.stringify(filteredUsers))
      return { success: true }
    }

    initializeFirebase()
    if (!database) throw new Error("Database not initialized")

    const userRef = ref(database, `users/${uid}`)
    const userSnapshot = await get(userRef)

    if (userSnapshot.exists()) {
      const userData = userSnapshot.val()

      await remove(userRef)

      if (userData.deviceId) {
        await remove(ref(database, `devices/${userData.deviceId}/userId`))
        await remove(ref(database, `devices/${userData.deviceId}/assignedAt`))
        await update(ref(database, `devices/${userData.deviceId}`), { status: "available" })
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error("❌ Error deleting user:", error)
    return { success: false, error: error.message }
  }
}

console.log("🔥 Firebase Real functions loaded successfully")
