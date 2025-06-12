"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AdminGuard } from "@/components/admin-guard"
import { getUserProfile, type UserProfile } from "@/lib/auth"
import { LoadingScreen } from "@/components/loading-screen"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, User, Phone, Mail, Calendar, CreditCard, Monitor, LayoutDashboard } from "lucide-react"

export default function AdminUserProfilePage({ params }: { params: { uid: string } }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { uid } = params

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        console.log(`🔍 Loading profile for user ID: ${uid}`)
        const profile = await getUserProfile(uid)
        setUserProfile(profile)
        console.log("✅ User profile loaded:", profile)
      } catch (error) {
        console.error("Error loading user profile:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadUserProfile()
  }, [uid])

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-100">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">ข้อมูลผู้ใช้งาน</h1>
          </div>

          {isLoading ? (
            <LoadingScreen message="กำลังโหลดข้อมูลผู้ใช้..." />
          ) : userProfile ? (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลส่วนตัว</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ชื่อ-นามสกุล</p>
                      <p className="font-medium">{userProfile.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">อีเมล</p>
                      <p className="font-medium">{userProfile.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">เบอร์โทรศัพท์</p>
                      <p className="font-medium">{userProfile.phone}</p>
                    </div>
                  </div>

                  {userProfile.license && (
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <CreditCard className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">เลขที่ใบขับขี่</p>
                        <p className="font-medium">{userProfile.license}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ข้อมูลระบบ</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Monitor className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Device ID</p>
                      <p className="font-medium">{userProfile.deviceId}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <Calendar className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">วันที่ลงทะเบียน</p>
                      <p className="font-medium">
                        {new Date(userProfile.registeredAt).toLocaleDateString("th-TH", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-between">
                    <Button variant="outline" onClick={() => router.push(`/admin/dashboard/${uid}`)}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      ดูแดชบอร์ด
                    </Button>
                    <Button onClick={() => router.push("/admin/dashboard")}>กลับไป Master Dashboard</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="rounded-lg bg-white p-6 text-center shadow-md">
              <p className="text-lg text-red-500">ไม่พบข้อมูลผู้ใช้</p>
              <Button className="mt-4" onClick={() => router.push("/admin/dashboard")}>
                กลับไป Master Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    </AdminGuard>
  )
}
