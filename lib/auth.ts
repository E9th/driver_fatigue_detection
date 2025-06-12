"use client"

/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
} from "firebase/auth"
import { ref, set, get, query, orderByChild, equalTo } from "firebase/database"
import { database, auth } from "./firebase"
import { useState, useEffect } from "react"
import { DEVICE_UTILS, APP_CONFIG } from "./config"
import type { RegisterData, UserProfile, AuthResponse } from "./types"

/**
 * Custom hook for authentication state management
 * Provides user data, profile, and loading states
 */
export const useAuthState = () => {
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!auth) {
      console.log("🔧 Auth not available, using mock auth state")
      setIsLoading(false)
      return
    }

    console.log("🔥 Auth: Setting up auth state listener")
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log("🔥 Auth state changed:", firebaseUser?.uid || "no user")

      setUser(firebaseUser)

      if (firebaseUser) {
        try {
          const profile = await getUserProfile(firebaseUser.uid)
          setUserProfile(profile)
          console.log("✅ User profile loaded:", profile)
        } catch (error) {
          console.error("❌ Error loading user profile:", error)
          setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้")
        }
      } else {
        setUserProfile(null)
      }

      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  const isAdmin = userProfile?.role === "admin"

  return { user, userProfile, isAdmin, isLoading, error }
}

/**
 * User registration with device assignment
 * @param userData - Registration form data
 * @returns Promise with user data or error
 */
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    console.log("🔥 Firebase: Registering user:", userData.email)

    // Development mode handling
    if (APP_CONFIG.isDevelopmentMode) {
      return handleDevelopmentRegistration(userData)
    }

    if (!auth || !database) {
      throw new Error("Firebase not initialized")
    }

    // Check device availability
    const normalizedDeviceId = DEVICE_UTILS.normalize(userData.deviceId)
    const deviceAvailable = await checkDeviceAvailability(normalizedDeviceId)

    if (!deviceAvailable) {
      return { success: false, error: "Device ID นี้ถูกใช้งานแล้ว" }
    }

    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(auth, userData.email, userData.password)
    const uid = userCredential.user.uid

    // Save user profile to database
    const userProfile = {
      uid,
      email: userData.email,
      fullName: userData.fullName,
      phone: userData.phone,
      license: userData.license,
      deviceId: normalizedDeviceId,
      role: userData.role || "driver",
      registeredAt: new Date().toISOString(),
    }

    await set(ref(database, `users/${uid}`), userProfile)

    console.log("✅ Firebase: User registered successfully:", uid)
    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("❌ Firebase: Registration error:", error.message)
    return { success: false, error: getAuthErrorMessage(error.code) }
  }
}

/**
 * User login authentication
 * @param email - User email
 * @param password - User password
 * @returns Promise with authentication result
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    console.log("🔥 Firebase: Logging in user:", email)

    // Development mode handling
    if (APP_CONFIG.isDevelopmentMode) {
      return handleDevelopmentLogin(email, password)
    }

    if (!auth) {
      throw new Error("Auth not initialized")
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password)
    console.log("✅ Firebase: User logged in successfully:", userCredential.user.uid)

    return { success: true, user: userCredential.user }
  } catch (error: any) {
    console.error("❌ Firebase: Login error:", error.message)
    return { success: false, error: getAuthErrorMessage(error.code) }
  }
}

/**
 * User logout
 * @returns Promise with logout result
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log("🔥 Firebase: Signing out user")

    if (APP_CONFIG.isDevelopmentMode) {
      console.log("🔧 Development mode: Simulating logout")
      return { success: true }
    }

    if (!auth) {
      throw new Error("Auth not initialized")
    }

    await firebaseSignOut(auth)
    console.log("✅ Firebase: User signed out successfully")
    return { success: true }
  } catch (error: any) {
    console.error("❌ Firebase: Sign out error:", error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile by UID
 * @param uid - User unique identifier
 * @returns Promise with user profile or null
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    // Development mode handling
    if (APP_CONFIG.isDevelopmentMode) {
      return getDevelopmentUserProfile(uid)
    }

    if (!database) {
      console.warn("🔧 Firebase not available")
      return null
    }

    console.log(`🔥 Firebase: Getting user profile for ${uid}`)
    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      const userData = snapshot.val()
      return {
        uid,
        role: userData.role || "driver",
        fullName: userData.fullName || "",
        email: userData.email,
        phone: userData.phone || "",
        license: userData.license || "",
        deviceId: userData.deviceId || null,
        registeredAt: userData.registeredAt || new Date().toISOString(),
        promotedToAdminAt: userData.promotedToAdminAt,
      }
    }

    return null
  } catch (error) {
    console.error("🔥 Firebase: Error getting user profile:", error)
    return null
  }
}

/**
 * Get all users (Admin function)
 * @returns Promise with array of user profiles
 */
export const getAllUsers = async (): Promise<UserProfile[]> => {
  try {
    // Development mode handling
    if (APP_CONFIG.isDevelopmentMode) {
      return getDevelopmentUsers()
    }

    if (!database) {
      console.warn("🔧 Firebase not available")
      return []
    }

    console.log("🔥 Firebase: Getting all users")
    const usersRef = ref(database, "users")
    const snapshot = await get(usersRef)

    if (snapshot.exists()) {
      const usersData = snapshot.val()
      return Object.entries(usersData).map(([uid, userData]: [string, any]) => ({
        uid,
        role: userData.role || "driver",
        fullName: userData.fullName || "",
        email: userData.email,
        phone: userData.phone || "",
        license: userData.license || "",
        deviceId: userData.deviceId || null,
        registeredAt: userData.registeredAt || new Date().toISOString(),
        promotedToAdminAt: userData.promotedToAdminAt,
      }))
    }

    return []
  } catch (error) {
    console.error("🔥 Firebase: Error getting all users:", error)
    return []
  }
}

/**
 * Delete user (Admin function)
 * @param uid - User unique identifier
 * @returns Promise with deletion result
 */
export const deleteUser = async (
  uid: string,
): Promise<{ success: boolean; error?: string; releasedDeviceId?: string }> => {
  try {
    console.log(`🔥 Firebase: Deleting user ${uid}`)

    // Development mode handling
    if (APP_CONFIG.isDevelopmentMode) {
      return handleDevelopmentUserDeletion(uid)
    }

    if (!database) {
      throw new Error("Database not initialized")
    }

    // Get user data first to return released device ID
    const userProfile = await getUserProfile(uid)

    // Delete user from database
    const userRef = ref(database, `users/${uid}`)
    await set(userRef, null)

    console.log("✅ Firebase: User deleted successfully")
    return {
      success: true,
      releasedDeviceId: userProfile?.deviceId || undefined,
    }
  } catch (error: any) {
    console.error("🔥 Firebase: Error deleting user:", error)
    return { success: false, error: error.message }
  }
}

/**
 * Check if device ID is available for assignment
 * @param deviceId - Device identifier to check
 * @returns Promise with availability status
 */
const checkDeviceAvailability = async (deviceId: string): Promise<boolean> => {
  try {
    if (!database) return true

    const usersRef = ref(database, "users")
    const deviceQuery = query(usersRef, orderByChild("deviceId"), equalTo(deviceId))
    const snapshot = await get(deviceQuery)

    return !snapshot.exists()
  } catch (error) {
    console.error("❌ Error checking device availability:", error)
    return false
  }
}

/**
 * Development mode helper functions
 */
const handleDevelopmentRegistration = (userData: RegisterData): AuthResponse => {
  console.log("🔧 Development mode: Simulating user registration")

  const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
  const existingUser = users.find((u: any) => u.email === userData.email)

  if (existingUser) {
    return { success: false, error: "อีเมลนี้ถูกใช้งานแล้ว" }
  }

  const deviceId = DEVICE_UTILS.normalize(userData.deviceId)
  const deviceUsed = users.some((u: any) => u.deviceId === deviceId)

  if (deviceUsed) {
    return { success: false, error: "Device ID นี้ถูกใช้งานแล้ว" }
  }

  const mockUser = {
    uid: `dev-user-${Date.now()}`,
    email: userData.email,
    password: userData.password,
    fullName: userData.fullName,
    phone: userData.phone,
    license: userData.license || "",
    deviceId: deviceId,
    role: userData.role || "driver",
    registeredAt: new Date().toISOString(),
  }

  users.push(mockUser)
  localStorage.setItem("dev-users", JSON.stringify(users))

  return { success: true, user: mockUser }
}

const handleDevelopmentLogin = (email: string, password: string): AuthResponse => {
  console.log("🔧 Development mode: Simulating login")

  const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
  const user = users.find((u: any) => u.email === email && u.password === password)

  if (user) {
    const updatedUsers = users.map((u: any) =>
      u.email === email ? { ...u, lastLoginAt: new Date().toISOString() } : u,
    )
    localStorage.setItem("dev-users", JSON.stringify(updatedUsers))

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.fullName,
      },
    }
  }

  return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
}

const getDevelopmentUserProfile = (uid: string): UserProfile | null => {
  const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
  const user = users.find((u: any) => u.uid === uid)

  if (user) {
    return {
      uid: user.uid,
      role: user.role || "driver",
      fullName: user.fullName || "",
      email: user.email,
      phone: user.phone || "",
      license: user.license || "",
      deviceId: user.deviceId || null,
      registeredAt: user.registeredAt || new Date().toISOString(),
      promotedToAdminAt: user.promotedToAdminAt,
    }
  }

  return null
}

const getDevelopmentUsers = (): UserProfile[] => {
  const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
  return users.map((user: any) => ({
    uid: user.uid,
    role: user.role || "driver",
    fullName: user.fullName || "",
    email: user.email,
    phone: user.phone || "",
    license: user.license || "",
    deviceId: user.deviceId || null,
    registeredAt: user.registeredAt || new Date().toISOString(),
    promotedToAdminAt: user.promotedToAdminAt,
  }))
}

const handleDevelopmentUserDeletion = (
  uid: string,
): { success: boolean; error?: string; releasedDeviceId?: string } => {
  const users = JSON.parse(localStorage.getItem("dev-users") || "[]")
  const userIndex = users.findIndex((u: any) => u.uid === uid)

  if (userIndex !== -1) {
    const deletedUser = users[userIndex]
    users.splice(userIndex, 1)
    localStorage.setItem("dev-users", JSON.stringify(users))
    return { success: true, releasedDeviceId: deletedUser.deviceId }
  }

  return { success: false, error: "User not found" }
}

/**
 * Convert Firebase auth error codes to Thai messages
 */
const getAuthErrorMessage = (errorCode: string): string => {
  const errorMessages: { [key: string]: string } = {
    "auth/email-already-in-use": "อีเมลนี้ถูกใช้งานแล้ว",
    "auth/weak-password": "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร",
    "auth/invalid-email": "รูปแบบอีเมลไม่ถูกต้อง",
    "auth/user-not-found": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
    "auth/wrong-password": "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
  }

  return errorMessages[errorCode] || "เกิดข้อผิดพลาดในการดำเนินการ"
}

/**
 * Device ID utility functions
 */
export const normalizeDeviceId = (deviceId: string): string => {
  if (!deviceId) return ""
  return deviceId.startsWith("device_") ? deviceId : `device_${deviceId}`
}

export const getDeviceDisplayId = (deviceId: string): string => {
  if (deviceId.startsWith("device_")) {
    return deviceId.replace("device_", "")
  }
  return deviceId
}

/**
 * Sign in user (alias for loginUser for backward compatibility)
 * @param email - User email
 * @param password - User password
 * @returns Promise with authentication result
 */
export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  return await loginUser(email, password)
}

console.log("🔥 Auth service initialized")
