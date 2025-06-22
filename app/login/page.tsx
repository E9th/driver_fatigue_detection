"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { useAuthState, signIn } from "@/lib/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()
  const { userProfile, loading: authLoading } = useAuthState()

  // --- FIX: This useEffect now has a stable dependency array and handles redirection correctly ---
  useEffect(() => {
    // Only act when authentication status is fully resolved
    if (!authLoading && userProfile) {
      if (userProfile.role === 'admin') {
        router.replace('/admin/dashboard');
      } else {
        router.replace('/dashboard');
      }
    }
  }, [authLoading, userProfile, router]); // `router` is stable from next/navigation

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const { success, error: signInError } = await signIn(email, password)

    if (success) {
      toast({ title: "เข้าสู่ระบบสำเร็จ", description: "กำลังนำทางไปยังแดชบอร์ด..." });
      // The useEffect above will handle redirection automatically.
    } else {
      setError(signInError || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setIsSubmitting(false)
    }
  }

  // --- FIX: Add guards to prevent rendering the form unnecessarily ---
  // Guard 1: Show a loading screen while checking auth state.
  if (authLoading) {
    return <LoadingScreen message="กำลังตรวจสอบสถานะ..." />;
  }

  // Guard 2: If user is already logged in, show a loading screen while redirecting.
  if (userProfile) {
    return <LoadingScreen message="กำลังนำทาง..." />;
  }
  // -----------------------------------------------------------

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
          </div>
          <CardTitle className="text-2xl">เข้าสู่ระบบ</CardTitle>
          <CardDescription>
            กรุณากรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">รหัสผ่าน</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && (
              <div className="text-red-500 text-sm flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm">
            ยังไม่มีบัญชี?{" "}
            <Link href="/register" className="underline">
              ลงทะเบียนที่นี่
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
