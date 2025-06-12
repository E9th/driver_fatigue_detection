"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import Image from "next/image"
import { signIn } from "@/lib/firebase"
import { Loader2, Eye, EyeOff } from "lucide-react"

// Firebase
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn(email, password)

      if (result && result.success) {
        // ตรวจสอบ role ของผู้ใช้เพื่อ redirect ไปยังหน้าที่เหมาะสม
        try {
          if (database) {
            // ดึงข้อมูล user profile จาก Firebase
            const userRef = ref(database, `users/${result.user.uid}`)
            const snapshot = await get(userRef)

            if (snapshot.exists()) {
              const userData = snapshot.val()

              // ตรวจสอบ role และ redirect ตาม role
              if (userData.role === "admin") {
                // ถ้าเป็น admin ให้ไปที่หน้า admin dashboard
                router.push("/admin/dashboard")
              } else {
                // ถ้าเป็น driver หรือ role อื่นๆ ให้ไปที่หน้า dashboard ปกติ
                router.push("/dashboard")
              }
            } else {
              // ถ้าไม่พบข้อมูลผู้ใช้ ให้ไปที่ dashboard ปกติ
              router.push("/dashboard")
            }
          } else {
            // ถ้า Firebase ไม่พร้อมใช้งาน ให้ไปที่ dashboard ปกติ
            router.push("/dashboard")
          }
        } catch (error) {
          console.error("Error checking user role:", error)
          // กรณีเกิดข้อผิดพลาดในการตรวจสอบ role ให้ไปที่ dashboard ปกติ
          router.push("/dashboard")
        }
      } else {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      }
    } catch (error) {
      console.error("Login error:", error)
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/logo.png"
              alt="Driver Fatigue Detection Logo"
              width={80}
              height={80}
              className="h-20 w-20 object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold">เข้าสู่ระบบ</CardTitle>
          <CardDescription>กรอกข้อมูลเพื่อเข้าสู่ระบบ Driver Fatigue Detection</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">รหัสผ่าน</Label>
                <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  กำลังเข้าสู่ระบบ...
                </>
              ) : (
                "เข้าสู่ระบบ"
              )}
            </Button>
            <div className="text-center text-sm">
              ยังไม่มีบัญชี?{" "}
              <Link href="/register" className="text-blue-600 hover:underline">
                สมัครสมาชิก
              </Link>
            </div>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/">กลับสู่หน้าหลัก</Link>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
