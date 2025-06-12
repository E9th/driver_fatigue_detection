"use client"

import { Suspense, useEffect, useState } from "react"
import { SafetyDashboard } from "@/components/safety-dashboard"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { ArrowLeft, AlertCircle } from "lucide-react"
import { getUserProfile } from "@/lib/auth"
import type { UserProfile } from "@/lib/types"

interface AdminUserDashboardProps {
  params: {
    uid: string
  }
}

export default function AdminUserDashboard({ params }: AdminUserDashboardProps) {
  const { uid } = params
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log(`🔍 Admin: Loading user profile for ${uid}`)
        const profile = await getUserProfile(uid)

        if (!profile) {
          setError("ไม่พบข้อมูลผู้ใช้")
          return
        }

        if (!profile.deviceId) {
          setError("ผู้ใช้นี้ยังไม่ได้กำหนด Device ID")
          return
        }

        setUserProfile(profile)
        console.log(`✅ Admin: User profile loaded:`, profile)
      } catch (err) {
        console.error("❌ Admin: Error loading user profile:", err)
        setError("เกิดข้อผิดพลาดในการโหลดข้อมูลผู้ใช้")
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [uid])

  if (loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลผู้ใช้..." />
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">แดชบอร์ดผู้ใช้</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!userProfile || !userProfile.deviceId) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/dashboard">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">แดชบอร์ดผู้ใช้</h1>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ผู้ใช้นี้ยังไม่ได้กำหนด Device ID หรือไม่มีข้อมูลอุปกรณ์</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">แดชบอร์ดผู้ใช้</h1>
          <p className="text-sm text-gray-600">
            {userProfile.fullName} - Device ID: {userProfile.deviceId}
          </p>
        </div>
      </div>

      <Suspense fallback={<LoadingScreen message="กำลังโหลดข้อมูลความปลอดภัย..." />}>
        <SafetyDashboard deviceId={userProfile.deviceId} viewMode="admin" />
      </Suspense>
    </div>
  )
}
