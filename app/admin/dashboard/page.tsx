"use client"

import { AdminGuard } from "@/components/admin-guard"
import { AdminMasterDashboard } from "@/components/admin-master-dashboard"
import { AdminExportData } from "@/components/admin-export-data"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { User, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import { useState, useRef } from "react"
import type { SystemStats } from "@/lib/types"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 6)
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  })

  // Ref to get data from AdminMasterDashboard
  const dashboardRef = useRef<any>(null)

  // Function to get current dashboard data for export
  const getCurrentDashboardData = (): SystemStats | null => {
    if (dashboardRef.current && dashboardRef.current.getCurrentStats) {
      const currentStats = dashboardRef.current.getCurrentStats()
      console.log("📊 Getting current dashboard stats:", currentStats)
      return currentStats
    }
    console.log("📊 Fallback to systemStats:", systemStats)
    return systemStats
  }

  const handleStatsUpdate = (stats: SystemStats) => {
    console.log("📊 Stats updated:", stats)
    setSystemStats(stats)
  }

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
                {/* Export Data - ใช้ข้อมูลจาก dashboard จริง */}
                <AdminExportData type="system" systemStats={getCurrentDashboardData()} dateRange={dateRange} />

                {/* Settings Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-700">
                      <Settings className="h-4 w-4 mr-1" />
                      เมนู
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
          <AdminMasterDashboard ref={dashboardRef} onStatsUpdate={handleStatsUpdate} />
        </div>
      </div>
    </AdminGuard>
  )
}
