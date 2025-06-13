/**
 * Driver Dashboard Page (Redesigned for better UX)
 * Main dashboard for drivers to monitor their fatigue detection data.
 * Focuses on clarity, immediate feedback, and user-friendliness.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  TrendingUp,
  BarChart3,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  Eye,
  Settings,
  LogOut,
  Moon,
  Coffee,
} from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import { subscribeToCurrentData } from "@/lib/firebase"
import { dataService } from "@/lib/data-service"
import { useAuthState, signOut } from "@/lib/auth"
import { getTodayDateRange } from "@/lib/date-utils"
import { useToast } from "@/hooks/use-toast"
import type { DeviceData, HistoricalData, DailyStats } from "@/lib/types"
import Link from "next/link"

// Helper function to determine overall safety status
const getOverallSafetyStatus = (stats: DailyStats | null) => {
  if (!stats) {
    return {
      level: "unknown",
      title: "รอข้อมูล",
      description: "ยังไม่มีข้อมูลสำหรับวันนี้",
      icon: <Clock className="h-10 w-10 text-gray-400" />,
      colorClass: "bg-gray-100 text-gray-800",
    }
  }

  if (stats.totalAlerts > 0) {
    return {
      level: "danger",
      title: "อันตราย",
      description: "ตรวจพบการแจ้งเตือนระดับวิกฤต โปรดหยุดพักทันที",
      icon: <AlertTriangle className="h-10 w-10 text-white" />,
      colorClass: "bg-red-500 text-white",
    }
  }
  if (stats.totalDrowsiness > 5) {
    return {
      level: "warning",
      title: "โปรดระวัง",
      description: `ตรวจพบอาการง่วง ${stats.totalDrowsiness} ครั้ง ควรหยุดพักเร็วๆ นี้`,
      icon: <Coffee className="h-10 w-10 text-yellow-800" />,
      colorClass: "bg-yellow-400 text-yellow-900",
    }
  }
  if (stats.averageEAR < 0.22 && stats.averageEAR > 0) {
    return {
      level: "warning",
      title: "เริ่มเหนื่อยล้า",
      description: "ระดับความตื่นตัวของคุณเริ่มลดลง",
      icon: <Moon className="h-10 w-10 text-blue-800" />,
      colorClass: "bg-blue-400 text-white",
    }
  }

  return {
    level: "safe",
    title: "ปลอดภัยดี",
    description: "การขับขี่ของคุณวันนี้อยู่ในเกณฑ์ดีเยี่ยม",
    icon: <Shield className="h-10 w-10 text-white" />,
    colorClass: "bg-green-500 text-white",
  }
}

export default function DriverDashboardPage() {
  const { user, userProfile, isLoading: authLoading } = useAuthState()
  const router = useRouter()
  const { toast } = useToast()

  const [isLoading, setIsLoading] = useState(true)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [todayStats, setTodayStats] = useState<DailyStats | null>(null)
  const [recentEvents, setRecentEvents] = useState<HistoricalData[]>([])

  useEffect(() => {
    if (!authLoading && userProfile?.deviceId) {
      setDeviceId(userProfile.deviceId)
    } else if (!authLoading && !user) {
      router.push("/login")
    }
  }, [userProfile, authLoading, user, router])

  useEffect(() => {
    if (!deviceId) return

    const todayRange = getTodayDateRange()
    const unsubscribe = dataService.subscribeToHistoricalDataWithCache(
      deviceId,
      todayRange.start,
      todayRange.end,
      (data, stats) => {
        setTodayStats(stats)
        setRecentEvents(data.slice(-5).reverse()) // Get last 5 events and reverse to show latest first
        setIsLoading(false)
      },
    )

    return unsubscribe
  }, [deviceId])

  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      toast({ title: "ออกจากระบบสำเร็จ" })
      router.push("/")
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาดในการออกจากระบบ", variant: "destructive" })
    }
  }, [router, toast])

  const overallStatus = getOverallSafetyStatus(todayStats)

  if (authLoading || isLoading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลแดชบอร์ด..." />
  }

  const getEventDescription = (status: string) => {
    switch (status) {
      case "YAWN DETECTED":
        return "ตรวจพบการหาว"
      case "DROWSINESS DETECTED":
        return "ตรวจพบความง่วง"
      case "CRITICAL: EXTENDED DROWSINESS":
        return "แจ้งเตือนระดับวิกฤต"
      default:
        return "สถานะปกติ"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              <h1 className="text-xl font-bold ml-3 text-gray-800 dark:text-gray-100">แดชบอร์ดผู้ขับขี่</h1>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span>{userProfile?.fullName || "เมนู"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>ข้อมูลส่วนตัว</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>ออกจากระบบ</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Main Safety Status Card */}
          <Card className={`shadow-xl ${overallStatus.colorClass}`}>
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
              <div className="flex-shrink-0">{overallStatus.icon}</div>
              <div className="text-center sm:text-left">
                <h2 className="text-3xl font-bold">{overallStatus.title}</h2>
                <p className="text-lg opacity-90">{overallStatus.description}</p>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300">ภาพรวมของวันนี้</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">การหาว</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{todayStats?.totalYawns ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">ความง่วง</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{todayStats?.totalDrowsiness ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">แจ้งเตือนวิกฤต</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{todayStats?.totalAlerts ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">ค่าเฉลี่ย EAR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{todayStats?.averageEAR.toFixed(3) ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">สูง = ตื่นตัว</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activity and Reports Link */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>กิจกรรมล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                {recentEvents.length > 0 ? (
                  <ul className="space-y-4">
                    {recentEvents.map((event) => (
                      <li key={event.id} className="flex items-center gap-4">
                        <div className="p-2 bg-gray-100 rounded-full">
                          <Clock className="h-4 w-4 text-gray-500" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{getEventDescription(event.status)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleTimeString("th-TH", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">ไม่มีกิจกรรมในวันนี้</p>
                )}
              </CardContent>
            </Card>

            <Card className="flex flex-col justify-center items-center bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardHeader className="text-center">
                <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle>ดูรายงานและสถิติเชิงลึก</CardTitle>
                <p className="text-muted-foreground text-sm mt-2">
                  วิเคราะห์พฤติกรรมการขับขี่ของคุณย้อนหลัง เพื่อปรับปรุงความปลอดภัยให้ดียิ่งขึ้น
                </p>
              </CardHeader>
              <CardContent>
                <Button asChild>
                  <Link href="/dashboard/reports">เปิดหน้ารายงาน</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
