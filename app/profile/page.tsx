"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { User, Mail, Phone, CreditCard, Smartphone, Calendar, Shield, ArrowLeft, AlertCircle } from "lucide-react"
import { getUserProfile, useAuthState, type UserProfile, getDeviceDisplayId } from "@/lib/auth"
import { useRouter } from "next/navigation"
import { LoadingScreen } from "@/components/loading-screen"
import Image from "next/image"

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const { user, isLoading: authLoading, error: authError } = useAuthState()

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        console.log("👤 Fetching profile for user:", user.uid)
        try {
          const profile = await getUserProfile(user.uid)
          console.log("👤 Profile loaded:", profile)
          setUserProfile(profile)
        } catch (error) {
          console.error("❌ Error fetching profile:", error)
          setError("ไม่สามารถโหลดข้อมูลโปรไฟล์ได้")
        } finally {
          setIsLoading(false)
        }
      } else if (!authLoading && !user) {
        console.log("🚪 No user, redirecting to login")
        router.push("/login")
      }
    }

    fetchProfile()
  }, [user, authLoading, router])

  const handleBackToDashboard = () => {
    console.log("🔙 Navigating back to dashboard")
    router.push("/dashboard")
  }

  if (isLoading || authLoading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลโปรไฟล์..." />
  }

  if (authError || error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {authError || error}
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push("/dashboard")}>
              กลับไปแดชบอร์ด
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            ไม่พบข้อมูลโปรไฟล์
            <Button variant="outline" size="sm" className="mt-2 w-full" onClick={() => router.push("/dashboard")}>
              กลับไปแดชบอร์ด
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Image src="/logo.png" alt="Logo" width={40} height={40} className="h-10 w-10" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">โปรไฟล์ผู้ใช้</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">ข้อมูลส่วนตัวของคุณ</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleBackToDashboard} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              กลับไปแดชบอร์ด
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* ข้อมูลส่วนตัว */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                ข้อมูลส่วนตัว
              </CardTitle>
              <CardDescription>ข้อมูลพื้นฐานของผู้ใช้งาน</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">ชื่อ-นามสกุล:</span>
                <span className="text-sm font-semibold">{userProfile.fullName}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  อีเมล:
                </span>
                <span className="text-sm">{userProfile.email}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  เบอร์โทรศัพท์:
                </span>
                <span className="text-sm">{userProfile.phone}</span>
              </div>
              {userProfile.license && (
                <>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                      <CreditCard className="h-4 w-4" />
                      ใบขับขี่:
                    </span>
                    <span className="text-sm font-mono">{userProfile.license}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* ข้อมูลระบบ */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                ข้อมูลระบบ
              </CardTitle>
              <CardDescription>ข้อมูลการใช้งานระบบ</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">สถานะผู้ใช้:</span>
                <Badge variant={userProfile.role === "admin" ? "default" : "secondary"}>
                  {userProfile.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้ขับขี่"}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  รหัสอุปกรณ์:
                </span>
                <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  {getDeviceDisplayId(userProfile.deviceId)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  วันที่ลงทะเบียน:
                </span>
                <span className="text-sm">
                  {new Date(userProfile.registeredAt).toLocaleDateString("th-TH", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">User ID:</span>
                <span className="text-xs font-mono text-gray-400 break-all">{userProfile.uid}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ข้อมูลเพิ่มเติม */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>ข้อมูลเพิ่มเติม</CardTitle>
            <CardDescription>ข้อมูลอื่นๆ ที่เกี่ยวข้องกับบัญชีของคุณ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-2">สถานะการเชื่อมต่อ</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">อุปกรณ์ของคุณพร้อมใช้งานและสามารถเชื่อมต่อกับระบบได้</p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">ความปลอดภัย</h3>
                <p className="text-sm text-green-700 dark:text-green-300">ข้อมูลของคุณได้รับการปกป้องด้วยระบบความปลอดภัยขั้นสูง</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
