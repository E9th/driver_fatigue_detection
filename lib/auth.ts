"use client"

/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import { useState, useEffect } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { ref, get } from "firebase/database"
import {
  database,
  auth,
  signIn as firebaseSignIn,
  registerUser as firebaseRegisterUser,
  signOut as firebaseSignOut,
} from "./firebase"
import { DEVICE_UTILS, APP_CONFIG } from "./config"
import type { RegisterData, UserProfile, AuthResponse } from "./types"

/**
 * Custom hook for authentication state management
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
 */
export const registerUser = async (userData: RegisterData): Promise<AuthResponse> => {
  try {
    const result = await firebaseRegisterUser(userData)
    if (result) {
      return result
    } else {
      return { success: false, error: "การลงทะเบียนล้มเหลว กรุณาลองใหม่อีกครั้ง" }
    }
  } catch (error: any) {
    console.error("❌ Firebase: Registration error:", error)
    return { success: false, error: getAuthErrorMessage(error.code) }
  }
}

/**
 * User login authentication
 */
export const loginUser = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const result = await firebaseSignIn(email, password)
    if (result) {
      return result
    } else {
      return { success: false, error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" }
    }
  } catch (error: any) {
    console.error("❌ Firebase: Login error:", error)
    return { success: false, error: getAuthErrorMessage(error.code) }
  }
}

/**
 * User logout
 */
export const signOut = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const result = await firebaseSignOut()
    if (result) {
      return result
    } else {
      return { success: false, error: "การออกจากระบบล้มเหลว" }
    }
  } catch (error: any) {
    console.error("❌ Firebase: Sign out error:", error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Get user profile by UID
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    if (!database) {
      console.warn("🔧 Firebase not available")
      return null
    }

    const userRef = ref(database, `users/${uid}`)
    const snapshot = await get(userRef)

    if (snapshot.exists()) {
      const userData = snapshot.val()
      return {
        uid,
        ...userData,
      }
    }
    return null
  } catch (error) {
    console.error("🔥 Firebase: Error getting user profile:", error)
    return null
  }
}

/**
 * Device ID utility functions
 */
export const normalizeDeviceId = (deviceId: string): string => {
  if (!deviceId) return ""
  return DEVICE_UTILS.normalize ? DEVICE_UTILS.normalize(deviceId) : deviceId
}

export const getDeviceDisplayId = (deviceId: string | null): string => {
  if (!deviceId) return "N/A"
  return DEVICE_UTILS.getDisplayId ? DEVICE_UTILS.getDisplayId(deviceId) : deviceId
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
    "auth/network-request-failed": "เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาตรวจสอบอินเทอร์เน็ต",
    "auth/too-many-requests": "มีการพยายามเข้าสู่ระบบมากเกินไป กรุณารอสักครู่",
  }
  return errorMessages[errorCode] || "เกิดข้อผิดพลาดในการดำเนินการ กรุณาลองใหม่อีกครั้ง"
}

console.log("🔥 Auth service initialized with error recovery")
