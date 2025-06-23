"use client"

import { AdminGuard } from "@/components/admin-guard"
import { AdminMasterDashboard } from "@/components/admin-master-dashboard"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, User, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()

  const handleLogout = async () => {
    try {
      await signOut()
      toast({
        title: "ออกจากระบบสำเร็จ",
        description: "กำลังนำคุณไปยังหน้าเข้าสู่ระบบ...",
      })
      router.push("/")
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้ โปรดลองอีกครั้ง",
        variant: "destructive",
      })
    }
  }

  return (
    <AdminGuard>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <header className="bg-white text-gray-800 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <img
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/logo-eaQrLeDTZjvUG3Cdg1wfewuglXumn4.png"
                    alt="Logo"
                    className="h-8 w-8"
                  />
                </div>
                <div className="ml-4">
                  <h1 className="text-xl font-bold">Admin Dashboard</h1>
                  <p className="text-xs text-gray-500">ระบบจัดการแอดมิน</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-700">
                      <Settings className="h-4 w-4 mr-1" />
                      ตั้งค่า
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => router.push("/profile")}>
                      <User className="h-4 w-4 mr-2" />
                      ข้อมูลส่วนตัว
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="h-4 w-4 mr-2" />
                      ออกจากระบบ
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AdminMasterDashboard />
        </div>
      </div>
    </AdminGuard>
  )
}
