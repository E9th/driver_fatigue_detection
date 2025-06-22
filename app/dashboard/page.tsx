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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Shield,
  BarChart3,
  AlertTriangle,
  Clock,
  User,
  LogOut,
  Moon,
  Coffee,
} from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import { dataService } from "@/lib/data-service"
import { useAuthState, signOut } from "@/lib/auth"
import { useToast } from "@/hooks/use-toast"
import type { HistoricalData, DailyStats, SafetyData } from "@/lib/types"
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
  if (stats.criticalEvents > 0) {
    return {
      level: "danger",
      title: "อันตราย",
      description: "ตรวจพบการแจ้งเตือนระดับวิกฤต โปรดหยุดพักทันที",
      icon: <AlertTriangle className="h-10 w-10 text-white" />,
      colorClass: "bg-red-500 text-white",
    }
  }
  if (stats.fatigueEvents > 5) {
    return {
      level: "warning",
      title: "โปรดระวัง",
      description: `ตรวจพบอาการง่วง ${stats.fatigueEvents} ครั้ง ควรหยุดพักเร็วๆ นี้`,
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
  const { user, userProfile, loading: authLoading } = useAuthState()
  const router = useRouter()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)

  // This is the core logic fix: using a modern async/await pattern
  // to fetch data once, instead of the old subscription model.
  const loadData = useCallback(async () => {
    if (authLoading) return;
    if (!userProfile?.deviceId) {
        setLoading(false);
        return;
    }

    setLoading(true);
    try {
        const today = new Date();
        const startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
        const endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).toISOString();

        const data = await dataService.getFilteredSafetyData(userProfile.deviceId, startDate, endDate);
        setSafetyData(data);
    } catch (error) {
        console.error("Failed to load driver dashboard data:", error);
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลแดชบอร์ดได้", variant: "destructive" });
    } finally {
        setLoading(false);
    }
  }, [userProfile, authLoading, toast]);


  useEffect(() => {
    if (!authLoading) {
        if (user) {
            loadData();
        } else {
            router.push("/login");
        }
    }
  }, [authLoading, user, loadData, router]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut()
      toast({ title: "ออกจากระบบสำเร็จ" })
      router.push("/")
    } catch (error) {
      toast({ title: "เกิดข้อผิดพลาดในการออกจากระบบ", variant: "destructive" })
    }
  }, [router, toast])
  
  const todayStats = safetyData?.stats ?? null;
  const recentEvents = safetyData?.events.slice(-5).reverse() ?? [];
  const overallStatus = getOverallSafetyStatus(todayStats)

  if (authLoading || loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลแดชบอร์ด..." />
  }

  if (!userProfile?.deviceId) {
      return (
          <div className="flex items-center justify-center h-screen">
              <Card className="w-96 text-center p-8">
                  <CardHeader>
                      <CardTitle>ยังไม่ได้ผูกอุปกรณ์</CardTitle>
                      <CardDescription>บัญชีของคุณยังไม่ได้ผูกกับ Device ID กรุณาติดต่อผู้ดูแลระบบ</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <Button onClick={handleLogout}>กลับไปหน้าหลัก</Button>
                  </CardContent>
              </Card>
          </div>
      )
  }

  const getEventDescription = (details: string) => {
    // This now uses the 'details' field from the new data structure
    switch (details) {
      case "yawn_detected":
        return "ตรวจพบการหาว"
      case "drowsiness_detected":
        return "ตรวจพบความง่วง"
      case "critical_drowsiness":
        return "แจ้งเตือนระดับวิกฤต"
      default:
        return details
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
                  <div className="text-3xl font-bold text-blue-600">{todayStats?.yawnEvents ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">ความง่วง</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-yellow-600">{todayStats?.fatigueEvents ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">แจ้งเตือนวิกฤต</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-red-600">{todayStats?.criticalEvents ?? "-"}</div>
                  <p className="text-xs text-muted-foreground">ครั้ง</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-500">ค่าเฉลี่ย EAR</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{todayStats?.averageEAR?.toFixed(3) ?? "-"}</div>
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
                          <p className="font-medium text-sm">{getEventDescription(event.details)}</p>
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
