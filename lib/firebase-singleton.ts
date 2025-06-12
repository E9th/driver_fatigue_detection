"use client"

import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import {
  getAuth,
  type Auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  type User,
} from "firebase/auth"
import { getDatabase, ref, set, get, query, orderByChild, equalTo, remove, type Database } from "firebase/database"

// Firebase configuration with proper fallbacks
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyC7Syu0aTE5WkAr7cMWdyllo5F6g--NsxM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "driver-fatigue-detection.firebaseapp.com",
  databaseURL:
    process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ||
    "https://driver-fatigue-detection-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "driver-fatigue-detection",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "driver-fatigue-detection.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1086008277749",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1086008277749:web:5e075a8170f36bd4dc63bc",
}

// Initialize Firebase with proper error handling
let app: FirebaseApp | null = null
let database: Database | null = null
let auth: Auth | null = null

try {
  if (typeof window !== "undefined") {
    console.log("🔥 Firebase: Initializing...")

    // Check if Firebase is already initialized
    const existingApps = getApps()

    if (existingApps.length === 0) {
      console.log("🔥 Firebase: Creating new app...")
      app = initializeApp(firebaseConfig)
    } else {
      console.log("🔥 Firebase: Using existing app...")
      app = existingApps[0]
    }

    // Initialize database and auth
    database = getDatabase(app)
    auth = getAuth(app)

    console.log("🔥 Firebase: Initialized successfully")
    console.log("🔥 Firebase Config:", {
      projectId: firebaseConfig.projectId,
      databaseURL: firebaseConfig.databaseURL,
      authDomain: firebaseConfig.authDomain,
    })
  }
} catch (error) {
  console.error("❌ Firebase initialization error:", error)
  // Set to null so we can use fallback data
  database = null
  auth = null
}

// Check if we're in development mode
const isDevelopment = typeof window !== "undefined" && localStorage.getItem("firebase_mode") === "development"
// Export both names for backward compatibility
export const isDevelopmentMode = isDevelopment
console.log("🔧 Firebase Mode:", isDevelopment ? "DEVELOPMENT (localStorage)" : "PRODUCTION")

// Firebase functions
const getFirebaseFunctions = async () => {
  console.log("🔧 Firebase: Getting Firebase functions...")

  // Helper functions
  const normalizeDeviceId = (deviceId: string): string => {
    console.log("🔧 normalizeDeviceId: Input:", deviceId)
    let normalized: string

    if (/^\d+$/.test(deviceId)) {
      normalized = `device_${deviceId.padStart(2, "0")}`
    } else if (deviceId.startsWith("device_")) {
      normalized = deviceId
    } else {
      normalized = `device_${deviceId}`
    }

    console.log("🔧 normalizeDeviceId: Output:", normalized)
    return normalized
  }

  const getDeviceDisplayId = (deviceId: string): string => {
    console.log("🔧 getDeviceDisplayId: Input:", deviceId)
    let display: string

    if (deviceId.startsWith("device_")) {
      display = deviceId.replace("device_", "")
    } else {
      display = deviceId
    }

    console.log("🔧 getDeviceDisplayId: Output:", display)
    return display
  }

  // Auth functions
  const useAuthState = (callback: (user: User | null) => void) => {
    if (typeof window === "undefined") {
      console.log("🔧 Firebase: Auth not available for useAuthState (server-side)")
      return () => {}
    }

    if (isDevelopment) {
      console.log("🔧 Development mode: Simulating auth state")
      // In development mode, simulate no user initially
      setTimeout(() => callback(null), 100)
      return () => {}
    }

    if (!auth) {
      console.log("🔧 Firebase: Auth not available for useAuthState")
      return () => {}
    }

    try {
      console.log("🔧 Firebase: Setting up auth state listener...")
      return onAuthStateChanged(auth, (user) => {
        console.log("🔧 Firebase: Auth state changed:", user ? `User: ${user.uid}` : "No user")
        callback(user)
      })
    } catch (error) {
      console.error("❌ Firebase: Auth state listener error:", error)
      return () => {}
    }
  }

  const loginUser = async (email: string, password: string) => {
    console.log("🔐 loginUser: Starting login for:", email)

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Simulating login for", email)

        // Check localStorage for development users
        const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
        console.log("🔧 Development mode: Found users in localStorage:", users.length)

        const user = users.find((u: any) => u.email === email)
        console.log("🔧 Development mode: User found:", !!user)

        if (user && user.password === password) {
          console.log("🔧 Development mode: Password matches, logging in...")

          // Update last login
          const updatedUsers = users.map((u: any) =>
            u.email === email ? { ...u, lastLoginAt: new Date().toISOString() } : u,
          )
          localStorage.setItem("dev-users", JSON.stringify(updatedUsers))

          // Simulate successful login
          const result = {
            success: true,
            user: {
              uid: user.uid,
              email: user.email,
              displayName: user.fullName,
            },
          }
          console.log("✅ Development mode: Login successful:", result)
          return result
        } else {
          console.log("❌ Development mode: Invalid credentials")
          return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
        }
      }

      if (!auth) throw new Error("Auth not initialized")

      console.log("🔐 Firebase: Attempting real Firebase login for:", email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log("✅ Firebase: Login successful")
      return { success: true, user: userCredential.user }
    } catch (error: any) {
      console.error("❌ Firebase: Login failed:", error.message)

      if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password") {
        return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
      } else if (error.code === "auth/invalid-email") {
        return { success: false, error: "รูปแบบอีเมลไม่ถูกต้อง" }
      }

      return { success: false, error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ" }
    }
  }

  const registerUser = async (email: string, password: string, userData: any) => {
    console.log("📝 registerUser: Starting registration for:", email)
    console.log("📝 registerUser: User data:", userData)

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Simulating user registration")

        // Check if email already exists
        const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
        console.log("🔧 Development mode: Current users count:", users.length)

        const existingUser = users.find((u: any) => u.email === email)
        console.log("🔧 Development mode: Email exists:", !!existingUser)

        if (existingUser) {
          console.log("❌ Development mode: Email already in use")
          return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" }
        }

        // Check if device is already used
        const deviceId = normalizeDeviceId(userData.deviceId)
        console.log("🔧 Development mode: Checking device availability for:", deviceId)

        const deviceUsed = users.some((u: any) => {
          console.log("🔧 Development mode: Comparing user device:", u.deviceId, "with:", deviceId)
          return u.deviceId === deviceId
        })
        console.log("🔧 Development mode: Device already used:", deviceUsed)

        if (deviceUsed) {
          console.log("❌ Development mode: Device ID already in use")
          return { success: false, error: "Device ID นี้ถูกใช้งานแล้ว" }
        }

        // Create mock user
        const mockUser = {
          uid: `dev-user-${Date.now()}`,
          email,
          password, // Store password for development login
          fullName: userData.fullName,
          phone: userData.phone,
          license: userData.license || "",
          deviceId: deviceId,
          role: userData.role || "driver",
          registeredAt: new Date().toISOString(),
        }

        console.log("🔧 Development mode: Creating user:", mockUser)

        // Save to localStorage
        users.push(mockUser)
        localStorage.setItem("dev-users", JSON.stringify(users))
        console.log("🔧 Development mode: Saved to localStorage, total users:", users.length)

        console.log("✅ Development: User registered successfully:", mockUser)
        return { success: true, user: mockUser }
      }

      if (!auth || !database) throw new Error("Firebase not initialized")

      console.log("🔥 Firebase: Starting real Firebase registration...")

      // Check device availability first
      const deviceId = normalizeDeviceId(userData.deviceId)
      console.log("🔥 Firebase: Checking device availability:", deviceId)

      const usersRef = ref(database, "users")
      const deviceQuery = query(usersRef, orderByChild("deviceId"), equalTo(deviceId))
      const deviceSnapshot = await get(deviceQuery)

      if (deviceSnapshot.exists()) {
        console.log("❌ Firebase: Device already in use")
        return { success: false, error: "Device ID นี้ถูกใช้งานแล้ว" }
      }

      // Create Firebase Auth user
      console.log("🔥 Firebase: Creating auth user...")
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Create user profile in Realtime Database
      const userProfile = {
        uid: user.uid,
        email: user.email,
        fullName: userData.fullName || "",
        phone: userData.phone || "",
        license: userData.license || "",
        deviceId: deviceId,
        role: userData.role || "driver",
        registeredAt: new Date().toISOString(),
      }

      console.log("🔥 Firebase: Saving user profile:", userProfile)

      // Save to users collection
      await set(ref(database, `users/${user.uid}`), userProfile)

      console.log("✅ Firebase: User registered successfully:", userProfile)
      return { success: true, user }
    } catch (error: any) {
      console.error("❌ Firebase: Registration failed:", error.message)

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

  const logoutUser = async () => {
    console.log("🔐 logoutUser: Starting logout...")

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Simulating logout")
        return { success: true }
      }

      if (!auth) throw new Error("Auth not initialized")

      await signOut(auth)
      console.log("✅ Firebase: Logout successful")
      return { success: true }
    } catch (error: any) {
      console.error("❌ Firebase: Logout failed:", error.message)
      return { success: false, error: "เกิดข้อผิดพลาดในการออกจากระบบ" }
    }
  }

  // Device functions
  const getUsedDeviceIds = async (): Promise<string[]> => {
    console.log("🔧 getUsedDeviceIds: Starting...")

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Getting used device IDs from localStorage")
        const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
        console.log("🔧 Development mode: Found users:", users.length)

        const usedDevices = users
          .filter((user: any) => {
            console.log("🔧 Development mode: User device:", user.deviceId)
            return user.deviceId
          })
          .map((user: any) => {
            const deviceId = user.deviceId
            console.log("🔧 Development mode: Processing device:", deviceId)

            if (deviceId.startsWith("device_")) {
              const display = deviceId.replace("device_", "")
              console.log("🔧 Development mode: Converted to display:", display)
              return display
            }
            console.log("🔧 Development mode: Using as-is:", deviceId)
            return deviceId
          })

        console.log("🔧 Development mode: Final used device IDs:", usedDevices)
        return usedDevices
      }

      if (!database) {
        console.log("❌ Firebase: Database not initialized")
        return []
      }

      console.log("🔥 Firebase: Getting used device IDs from Firebase Database")
      const usersRef = ref(database, "users")
      const snapshot = await get(usersRef)

      if (!snapshot.exists()) {
        console.log("🔥 Firebase: No users found in database")
        return []
      }

      const users = snapshot.val()
      console.log("🔥 Firebase: Found users in database:", Object.keys(users).length)

      const usedDeviceIds = Object.values(users)
        .filter((user: any) => {
          const hasDevice = user.deviceId
          console.log("🔥 Firebase: User", user.email, "has device:", hasDevice ? user.deviceId : "none")
          return hasDevice
        })
        .map((user: any) => {
          const display = getDeviceDisplayId(user.deviceId)
          console.log("🔥 Firebase: Device", user.deviceId, "display as:", display)
          return display
        })

      console.log("🔥 Firebase: Final used device IDs:", usedDeviceIds)
      return usedDeviceIds
    } catch (error) {
      console.error("❌ Firebase: Error getting device IDs:", error)
      return []
    }
  }

  const checkEmailAvailability = async (email: string): Promise<boolean> => {
    console.log("🔧 checkEmailAvailability: Checking:", email)

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Checking email in localStorage")
        const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
        const exists = users.some((user: any) => {
          console.log("🔧 Development mode: Comparing:", user.email, "with:", email)
          return user.email === email
        })
        console.log("🔧 Development mode: Email exists:", exists, "Available:", !exists)
        return !exists
      }

      if (!database) {
        console.log("❌ Firebase: Database not initialized")
        return true // Assume available if can't check
      }

      console.log("🔥 Firebase: Checking email availability in Firebase Database:", email)
      const usersRef = ref(database, "users")
      const emailQuery = query(usersRef, orderByChild("email"), equalTo(email))
      const snapshot = await get(emailQuery)

      const isAvailable = !snapshot.exists()
      console.log(`🔥 Firebase: Email ${email} is ${isAvailable ? "available" : "taken"}`)
      return isAvailable
    } catch (error) {
      console.error("❌ Firebase: Error checking email availability:", error)
      return true // Assume available on error
    }
  }

  // Admin functions
  const getAllUsers = async () => {
    console.log("🔧 getAllUsers: Starting...")

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Getting users from localStorage")
        const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
        console.log("🔧 Development mode: Found users:", users.length)

        return users.map((user: any, index: number) => ({
          uid: user.uid || `dev-${index}`,
          email: user.email,
          fullName: user.fullName || "Development User",
          phone: user.phone || "",
          license: user.license || "",
          deviceId: user.deviceId || null,
          role: user.role || "driver",
          registeredAt: user.registeredAt || new Date().toISOString(),
        }))
      }

      if (!database) throw new Error("Database not initialized")

      console.log("🔥 Firebase: Getting all users from Firebase")
      const snapshot = await get(ref(database, "users"))
      if (snapshot.exists()) {
        const users = snapshot.val()
        const userList = Object.entries(users).map(([uid, userData]: [string, any]) => ({
          uid,
          ...userData,
        }))
        console.log("🔥 Firebase: Found users:", userList.length)
        return userList
      }
      console.log("🔥 Firebase: No users found")
      return []
    } catch (error) {
      console.error("❌ Firebase: Error getting users:", error)
      return []
    }
  }

  const deleteUser = async (uid: string) => {
    console.log("🔧 deleteUser: Starting for UID:", uid)

    try {
      if (isDevelopment) {
        console.log("🔧 Development mode: Removing user from localStorage")
        const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
        const userToDelete = users.find((user: any) => user.uid === uid)
        console.log("🔧 Development mode: User to delete:", userToDelete)

        const filteredUsers = users.filter((user: any) => user.uid !== uid)
        localStorage.setItem("dev-users", JSON.stringify(filteredUsers))
        console.log("🔧 Development mode: Remaining users:", filteredUsers.length)

        return { success: true, releasedDeviceId: userToDelete?.deviceId }
      }

      if (!database) throw new Error("Database not initialized")

      // Get user profile first to find device
      const userRef = ref(database, `users/${uid}`)
      const userSnapshot = await get(userRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val()
        const deviceId = userData.deviceId

        // Remove user from database
        await remove(userRef)

        return { success: true, releasedDeviceId: deviceId }
      }

      return { success: false, error: "ไม่พบผู้ใช้งาน" }
    } catch (error: any) {
      console.error("❌ Firebase: Error deleting user:", error)
      return { success: false, error: error.message }
    }
  }

  return {
    normalizeDeviceId,
    getDeviceDisplayId,
    useAuthState,
    loginUser,
    registerUser,
    logoutUser,
    getUsedDeviceIds,
    checkEmailAvailability,
    getAllUsers,
    deleteUser,
  }
}

// Export functions
export { getFirebaseFunctions }

// Export Firebase instances for direct access
export { app, auth, database }

console.log("🔥 Firebase Singleton loaded successfully")
