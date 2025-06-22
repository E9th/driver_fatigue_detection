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
import { AlertCircle, LogIn } from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const { toast } = useToast()
  const { user, userProfile, loading: authLoading } = useAuthState()

  // --- FIX: This useEffect now handles both redirection for already logged-in users and after a new login ---
  useEffect(() => {
    // Wait until the initial authentication check is complete
    if (!authLoading) {
      if (userProfile) { // If user is logged in and profile is loaded
        toast({ title: "คุณเข้าสู่ระบบอยู่แล้ว", description: "กำลังนำทางไปยังแดชบอร์ด..." });
        
        if (userProfile.role === 'admin') {
          router.replace('/admin/dashboard'); // Use replace to avoid history stack issues
        } else {
          router.replace('/dashboard');
        }
      }
      // If auth is done and there's no user, stay on the login page.
    }
  }, [user, userProfile, authLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { success, error: signInError } = await signIn(email, password)

    if (success) {
      // The useEffect hook above will now handle the redirection once the userProfile is loaded.
      // We just need to wait.
      // We set loading to false because the auth state change will trigger the redirect.
       setIsLoading(false);
    } else {
      setError(signInError || "อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setIsLoading(false)
    }
  }

  // Show a loading screen if the initial auth check is in progress.
  // This prevents the login form from flashing before redirection.
  if (authLoading) {
    return <LoadingScreen message="กำลังตรวจสอบสถานะการล็อคอิน..." />;
  }

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
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
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
