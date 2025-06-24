"use client"

import type React from "react"

/**
 * User profile page
 * – Fetches user profile via useAuthState() from '@/lib/auth'
 * – Works for both driver and admin roles
 * – Knows where to go back (admin → /admin/dashboard, driver → /dashboard)
 */

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { ArrowLeft, Mail, Phone, CreditCard, Smartphone, Calendar, Shield, User } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LoadingScreen } from "@/components/loading-screen"
import { useAuthState } from "@/lib/auth"
import { AlertCircle } from "lucide-react"

export default function ProfilePage() {
  /* ------------------------------------------------------------------ */
  /* auth state ------------------------------------------------------- */
  const { user, userProfile, isLoading, error } = useAuthState()
  const router = useRouter()

  /* ------------------------------------------------------------------ */
  /* redirect unauthenticated users ----------------------------------- */
  useEffect(() => {
    if (!isLoading && !user) router.replace("/login")
  }, [user, isLoading, router])

  /* ------------------------------------------------------------------ */
  /* helpers ----------------------------------------------------------- */
  const handleBack = () => {
    // try to respect browser history first
    if (window.history.length > 1) return router.back()

    // otherwise go by role
    if (userProfile?.role === "admin") router.push("/admin/dashboard")
    else router.push("/dashboard")
  }

  const RoleBadge = () => (
    <Badge variant={userProfile?.role === "admin" ? "destructive" : "default"}>
      {userProfile?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ขับขี่"}
    </Badge>
  )

  /* ------------------------------------------------------------------ */
  /* loading / error states ------------------------------------------- */
  if (isLoading) return <LoadingScreen message="กำลังโหลดข้อมูลโปรไฟล์..." />

  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )

  if (!userProfile)
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-muted/40">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ไม่พบข้อมูลโปรไฟล์</AlertDescription>
        </Alert>
      </div>
    )

  /* ------------------------------------------------------------------ */
  /* main UI ---------------------------------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* header */}
      <header className="bg-white dark:bg-gray-800 border-b shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between py-6 px-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="back to dashboard" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
            <div>
              <h1 className="text-2xl font-bold">โปรไฟล์ผู้ใช้</h1>
              <p className="text-muted-foreground text-sm">ข้อมูลส่วนตัวของคุณ</p>
            </div>
          </div>
          <RoleBadge />
        </div>
      </header>

      {/* content */}
      <main className="max-w-4xl mx-auto py-8 px-4 space-y-6">
        {/* personal info */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                ข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription>ข้อมูลพื้นฐานของผู้ใช้งาน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow label="ชื่อ-นามสกุล" value={userProfile.fullName} />
              <Separator />
              <InfoRow icon={<Mail className="h-4 w-4" />} label="อีเมล" value={userProfile.email} />
              <Separator />
              <InfoRow icon={<Phone className="h-4 w-4" />} label="เบอร์โทรศัพท์" value={userProfile.phone} />
              {userProfile.license && (
                <>
                  <Separator />
                  <InfoRow icon={<CreditCard className="h-4 w-4" />} label="ใบขับขี่" value={userProfile.license} mono />
                </>
              )}
            </CardContent>
          </Card>

          {/* system info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                ข้อมูลระบบ
              </CardTitle>
              <CardDescription>ข้อมูลการใช้งานระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                label="สถานะผู้ใช้"
                value={
                  <Badge variant={userProfile.role === "admin" ? "default" : "secondary"}>
                    {userProfile.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ขับขี่"}
                  </Badge>
                }
              />
              <Separator />
              <InfoRow
                icon={<Smartphone className="h-4 w-4" />}
                label="รหัสอุปกรณ์"
                value={userProfile.deviceId ?? "N/A"}
                mono
              />
              <Separator />
              <InfoRow
                icon={<Calendar className="h-4 w-4" />}
                label="วันที่ลงทะเบียน"
                value={new Date(userProfile.registeredAt).toLocaleDateString("th-TH", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <Separator />
              <InfoRow label="User ID" value={userProfile.uid} mono small />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}

/* -------------------------------------------------------------------- */
/* helper component --------------------------------------------------- */
interface InfoRowProps {
  label: string
  value: React.ReactNode
  icon?: React.ReactNode
  mono?: boolean
  small?: boolean
}
function InfoRow({ label, value, icon, mono, small }: InfoRowProps) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
        {icon}
        {label}:
      </span>
      <span className={`${small ? "text-xs" : "text-sm"} ${mono ? "font-mono" : "font-normal"}`}>{value}</span>
    </div>
  )
}
