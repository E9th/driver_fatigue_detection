/**
 * Admin Guard Component
 * Protects admin routes by checking user role
 */

"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "@/lib/auth"

interface AdminGuardProps {
  children: React.ReactNode
}

/**
 * Admin Guard component that protects admin-only routes
 * Redirects non-admin users and shows loading/error states
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const { user, userProfile, isLoading } = useAuthState()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // Don't check while auth is still loading
    if (isLoading) return

    // If no user, redirect to login
    if (!user) {
      console.log("🔒 No user found, redirecting to login")
      router.push("/login")
      return
    }

    // If user profile is not loaded yet, wait
    if (!userProfile) {
      console.log("⏳ Waiting for user profile...")
      return
    }

    // Check if user is admin
    if (userProfile.role !== "admin") {
      console.log("🚫 User is not admin, redirecting to dashboard")
      router.push("/dashboard")
      return
    }

    // User is admin, allow access
    console.log("✅ User is admin, allowing access")
    setIsChecking(false)
  }, [user, userProfile, isLoading, router])

  // Show loading screen while checking authentication
  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
