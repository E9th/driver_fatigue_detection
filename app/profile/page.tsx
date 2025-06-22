"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuthState, updateUserProfile, reauthenticate, updateUserPassword } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { LoadingScreen } from "@/components/loading-screen"
import { ArrowLeft, User, Lock, Mail, Phone, Car } from "lucide-react"
import type { UserProfile } from "@/lib/types"

export default function ProfilePage() {
  const { user, userProfile, loading, refreshUserProfile } = useAuthState()
  const router = useRouter()
  const { toast } = useToast()

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [license, setLicense] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false)

  useEffect(() => {
    if (userProfile) {
      setFullName(userProfile.fullName || "")
      setPhone(userProfile.phone || "")
      setLicense(userProfile.license || "")
    }
  }, [userProfile])

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setIsUpdating(true)
    const updatedData: Partial<UserProfile> = { fullName, phone, license }

    const success = await updateUserProfile(user.uid, updatedData)
    if (success) {
      toast({ title: "อัปเดตข้อมูลส่วนตัวสำเร็จ" })
      await refreshUserProfile()
    } else {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัปเดตข้อมูลได้", variant: "destructive" })
    }
    setIsUpdating(false)
  }

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!user) return

    setIsPasswordUpdating(true)
    const success = await reauthenticate(currentPassword)
    if (!success) {
      toast({ title: "รหัสผ่านปัจจุบันไม่ถูกต้อง", variant: "destructive" })
      setIsPasswordUpdating(false)
      return
    }

    const passwordUpdated = await updateUserPassword(newPassword)
    if (passwordUpdated) {
      toast({ title: "อัปเดตรหัสผ่านสำเร็จ" })
      setCurrentPassword("")
      setNewPassword("")
    } else {
      toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถอัปเดตรหัสผ่านได้", variant: "destructive" })
    }
    setIsPasswordUpdating(false)
  }

  // --- FIX: This function now correctly routes based on user role ---
  const handleBackToDashboard = () => {
    if (userProfile?.role === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/dashboard');
    }
  };
  // -----------------------------------------------------------------

  if (loading || !user || !userProfile) {
    return <LoadingScreen message="กำลังโหลดข้อมูลโปรไฟล์..." />
  }

  return (
    <div className="container mx-auto max-w-4xl py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={handleBackToDashboard} // Use the new handler function
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับไปที่แดชบอร์ด
        </Button>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Profile Information Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><User className="mr-2"/>ข้อมูลส่วนตัว</CardTitle>
            <CardDescription>อัปเดตข้อมูลส่วนตัวของคุณที่นี่</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">อีเมล</Label>
                <Input id="email" type="email" value={user.email || ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">ชื่อ-นามสกุล</Label>
                <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">เบอร์โทรศัพท์</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="license">ใบขับขี่</Label>
                <Input id="license" value={license} onChange={(e) => setLicense(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" disabled={isUpdating}>
                {isUpdating ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center"><Lock className="mr-2"/>เปลี่ยนรหัสผ่าน</CardTitle>
            <CardDescription>เพื่อความปลอดภัย ควรเปลี่ยนรหัสผ่านอย่างสม่ำเสมอ</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">รหัสผ่านปัจจุบัน</Label>
                <Input id="current-password" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">รหัสผ่านใหม่</Label>
                <Input id="new-password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <Button type="submit" className="w-full" variant="secondary" disabled={isPasswordUpdating}>
                {isPasswordUpdating ? "กำลังอัปเดต..." : "อัปเดตรหัสผ่าน"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
