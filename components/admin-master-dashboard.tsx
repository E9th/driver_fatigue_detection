"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useRouter } from "next/navigation"
import { database } from "@/lib/firebase"
import { ref, onValue, get } from "firebase/database"
import { UsageReports } from "@/components/usage-reports"
import { UsageHistory } from "@/components/usage-history"
import { FirebaseUsageMonitor } from "@/components/firebase-usage-monitor"
import { ExportData } from "@/components/export-data"
import { formatDate } from "@/lib/date-utils"
import { Users, AlertTriangle, Clock, Activity, Cpu, Smile, BarChart3, RefreshCw } from "lucide-react"

export function AdminMasterDashboard() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("overview")
  const [users, setUsers] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalDevices: 0,
    activeDevices: 0,
    totalYawns: 0,
    totalDrowsiness: 0,
    totalAlerts: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        // Fetch users
        const usersRef = ref(database, "users")
        const usersSnapshot = await get(usersRef)

        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val()
          const usersArray = Object.entries(usersData).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          setUsers(usersArray)

          // Calculate stats
          const activeUsers = usersArray.filter(
            (user) => user.lastLogin && new Date(user.lastLogin).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
          ).length

          setStats((prev) => ({
            ...prev,
            totalUsers: usersArray.length,
            activeUsers,
          }))
        }

        // Fetch devices
        const devicesRef = ref(database, "devices")
        const devicesSnapshot = await get(devicesRef)

        if (devicesSnapshot.exists()) {
          const devicesData = devicesSnapshot.val()
          const devicesArray = Object.entries(devicesData).map(([id, data]: [string, any]) => ({
            id,
            ...data,
          }))
          setDevices(devicesArray)

          // Calculate device stats
          const activeDevices = devicesArray.filter(
            (device) => device.lastActive && new Date(device.lastActive).getTime() > Date.now() - 24 * 60 * 60 * 1000,
          ).length

          let totalYawns = 0
          let totalDrowsiness = 0
          let totalAlerts = 0

          devicesArray.forEach((device) => {
            if (device.stats) {
              totalYawns += device.stats.yawn_events || 0
              totalDrowsiness += device.stats.drowsiness_events || 0
              totalAlerts += device.stats.alert_events || 0
            }
          })

          setStats((prev) => ({
            ...prev,
            totalDevices: devicesArray.length,
            activeDevices,
            totalYawns,
            totalDrowsiness,
            totalAlerts,
          }))
        }
      } catch (error) {
        console.error("Error fetching admin data:", error)
      } finally {
        setIsLoading(false)
        setLastRefresh(new Date())
      }
    }

    fetchData()

    // Set up real-time listeners
    const usersRef = ref(database, "users")
    const usersListener = onValue(usersRef, (snapshot) => {
      if (snapshot.exists()) {
        const usersData = snapshot.val()
        const usersArray = Object.entries(usersData).map(([id, data]: [string, any]) => ({
          id,
          ...data,
        }))
        setUsers(usersArray)

        const activeUsers = usersArray.filter(
          (user) => user.lastLogin && new Date(user.lastLogin).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
        ).length

        setStats((prev) => ({
          ...prev,
          totalUsers: usersArray.length,
          activeUsers,
        }))
      }
    })

    return () => {
      // Clean up listeners
      usersListener()
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  const viewUserDashboard = (userId: string) => {
    router.push(`/admin/dashboard/${userId}`)
  }

  const viewUserProfile = (userId: string) => {
    router.push(`/admin/profile/${userId}`)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            รีเฟรช
          </Button>
          <ExportData data={stats} filename={`admin-dashboard-${formatDate(new Date())}`} disabled={isLoading} />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">อัปเดตล่าสุด: {lastRefresh.toLocaleString("th-TH")}</div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อุปกรณ์ทั้งหมด</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDevices}</div>
            <p className="text-xs text-muted-foreground">อุปกรณ์ทั้งหมดในระบบ</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">อุปกรณ์ที่ใช้งาน</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeDevices}</div>
            <p className="text-xs text-muted-foreground">ใช้งานใน 24 ชั่วโมงที่ผ่านมา</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ผู้ขับขี่</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">ผู้ใช้ทั้งหมด</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">มีผู้ใช้ระบบ</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">ใช้งานใน 7 วันที่ผ่านมา</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การหาว</CardTitle>
            <Smile className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalYawns}</div>
            <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความง่วง</CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalDrowsiness}</div>
            <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แจ้งเตือนซ้ำ</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">ภาพรวมระบบ</TabsTrigger>
          <TabsTrigger value="users">ผู้ใช้งาน</TabsTrigger>
          <TabsTrigger value="usage">การใช้งาน</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>สถานะระบบ</CardTitle>
            </CardHeader>
            <CardContent>
              <FirebaseUsageMonitor />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>รายงานการใช้งาน</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageReports />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>ผู้ใช้งานทั้งหมด</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p>กำลังโหลดข้อมูล...</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{user.fullName || "ไม่ระบุชื่อ"}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                          <div className="text-sm text-muted-foreground">
                            {user.role === "admin" ? (
                              <Badge variant="default">แอดมิน</Badge>
                            ) : (
                              <Badge variant="outline">ผู้ใช้ทั่วไป</Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => viewUserDashboard(user.id)}>
                            ดูแดชบอร์ด
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => viewUserProfile(user.id)}>
                            ดูโปรไฟล์
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>ประวัติการใช้งาน</CardTitle>
            </CardHeader>
            <CardContent>
              <UsageHistory />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ลบปุ่มฟันเฟืองที่มุมซ้ายล่าง */}
    </div>
  )
}
