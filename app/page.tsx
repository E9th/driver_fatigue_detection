/**
 * Home Page Component
 * Landing page with authentication and navigation
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthState } from "@/lib/auth"
import { LoadingScreen } from "@/components/loading-screen"
import { HomePage } from "@/components/home-page"

/**
 * Main page component that handles routing based on authentication state
 * Redirects authenticated users to appropriate dashboard
 */
export default function Page() {
  const { user, userProfile, isLoading } = useAuthState()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Don't redirect while still loading auth state
    if (isLoading) return

    // If user is authenticated, redirect to appropriate dashboard
    if (user && userProfile) {
      setIsRedirecting(true)

      if (userProfile.role === "admin") {
        console.log("🔄 Redirecting admin to admin dashboard")
        router.push("/admin")
      } else {
        console.log("🔄 Redirecting user to dashboard")
        router.push("/dashboard")
      }
    }
  }, [user, userProfile, isLoading, router])

  // Show loading screen while checking auth or redirecting
  if (isLoading || isRedirecting) {
    return <LoadingScreen message={isRedirecting ? "กำลังนำคุณไปยังแดชบอร์ด..." : "กำลังตรวจสอบสถานะการเข้าสู่ระบบ..."} />
  }

  // Show home page for unauthenticated users
  return <HomePage />
}
