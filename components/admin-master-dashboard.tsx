"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DateTimeFilter } from "@/components/date-time-filter"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import {
  AlertTriangle,
  Eye,
  Users,
  Activity,
  Clock,
  BarChart3,
  Download,
  Search,
  User,
  LayoutDashboard,
  UserX,
  TrendingUp,
  Settings,
  LogOut,
} from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import { formatDate } from "@/lib/date-utils"
import { database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import { deleteUser, signOut } from "@/lib/auth"

interface AlertData {
  alert_type: string
  device_id: string
  severity: string
  timestamp: string
}

interface DeviceData {
  device_id: string
  timestamp: string
  ear: number
  yawn_events: number
  drowsiness_events: number
  critical_alerts: number
  status: string
}

interface UserData {
  uid: string
  email: string
  fullName: string
  deviceId: string
  role: string
}

export function AdminMasterDashboard() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7) // Default to last 7 days
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  })
  const [users, setUsers] = useState<UserData[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [currentData, setCurrentData] = useState<{ [key: string]: DeviceData }>({})
  const [stats, setStats] = useState({
    totalDevices: 0,
    activeDevices: 0,
    totalUsers: 0,
    adminUsers: 0,
    totalYawns: 0,
    totalDrowsiness: 0,
    totalAlerts: 0,
  })

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true)
      try {
        if (!database) {
          console.error("Firebase database is not available.")
          return
        }

        const [usersSnapshot, alertsSnapshot, devicesSnapshot] = await Promise.all([
          get(ref(database, "users")),
          get(ref(database, "alerts")),
          get(ref(database, "devices")),
        ])

        // Process Users
        const usersList: UserData[] = []
        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val()
          Object.entries(usersData).forEach(([uid, data]: [string, any]) => {
            usersList.push({
              uid,
              email: data.email || "",
              fullName: data.fullName || "",
              deviceId: data.deviceId || "",
              role: data.role || "driver",
            })
          })
        }
        setUsers(usersList)
        setFilteredUsers(usersList)

        // Process Alerts
        const alertsList: AlertData[] = []
        if (alertsSnapshot.exists()) {
            const alertsData = alertsSnapshot.val()
            Object.values(alertsData).forEach((alert: any) => {
              alertsList.push(alert)
            })
        }
        setAlerts(alertsList)

        // Process Devices Current Data
        const currentDeviceData: { [key: string]: DeviceData } = {}
        if (devicesSnapshot.exists()) {
          const devicesData = devicesSnapshot.val()
           Object.entries(devicesData).forEach(([deviceId, data]: [string, any]) => {
            if (data.current_data) {
              currentDeviceData[deviceId] = data.current_data
            }
          })
        }
        setCurrentData(currentDeviceData)

      } catch (error) {
        console.error("❌ Error loading initial data:", error)
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถโหลดข้อมูลเริ่มต้นของระบบได้",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  // Recalculate stats when users, alerts, or dateRange change
  useEffect(() => {
    if (loading) return;

    // Filter alerts based on the current date range
    const startTime = new Date(dateRange.startDate).getTime()
    const endTime = new Date(dateRange.endDate).getTime()
    const filteredAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime()
        return alertTime >= startTime && alertTime <= endTime
    })

    const driverUsers = users.filter((user) => user.role === "driver")
    const adminUsers = users.filter((user) => user.role === "admin")
    const devicesWithUsers = new Set(driverUsers.map(user => user.deviceId).filter(id => id && id !== "null"))

    // Check active devices (last data within 5 minutes)
    const now = Date.now()
    const fiveMinutesAgo = now - 5 * 60 * 1000
    const activeDevicesCount = Object.values(currentData).filter((device) => {
      const deviceTime = new Date(device.timestamp).getTime()
      return deviceTime > fiveMinutesAgo
    }).length

    const yawnAlerts = filteredAlerts.filter((alert) => alert.alert_type === "yawn_detected").length
    const drowsinessAlerts = filteredAlerts.filter((alert) => alert.alert_type === "drowsiness_detected").length
    const criticalAlerts = filteredAlerts.filter((alert) => alert.alert_type === "critical_drowsiness").length

    setStats({
      totalDevices: devicesWithUsers.size,
      activeDevices: activeDevicesCount,
      totalUsers: driverUsers.length,
      adminUsers: adminUsers.length,
      totalYawns: yawnAlerts,
      totalDrowsiness: drowsinessAlerts,
      totalAlerts: criticalAlerts,
    })
  }, [users, alerts, currentData, dateRange, loading])


  // Filter users based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(
        (user) =>
          user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.deviceId && user.deviceId.toLowerCase().includes(searchTerm.toLowerCase())),
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  // Handle date filter change
  const handleDateChange = (startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate })
  }

  // Handle user deletion
  const handleDeleteUser = async () => {
    if (!userToDelete) return

    setLoading(true)
    try {
      const result = await deleteUser(userToDelete)

      if (result.success) {
        const updatedUsers = users.filter((user) => user.uid !== userToDelete)
        setUsers(updatedUsers)
        toast({
          title: "ลบผู้ใช้สำเร็จ",
          description: "ผู้ใช้ถูกลบออกจากระบบแล้ว",
        })
      } else {
        toast({
          title: "เกิดข้อผิดพลาด",
          description: `ไม่สามารถลบผู้ใช้ได้: ${result.error}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("❌ Error deleting user:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบผู้ใช้ได้",
        variant: "destructive",
      })
    } finally {
      setUserToDelete(null)
      setLoading(false)
    }
  }

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/login")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถออกจากระบบได้",
        variant: "destructive",
      })
    }
  }

  // Generate hourly activity data
  const hourlyActivity = () => {
     const filteredAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime()
        const startTime = new Date(dateRange.startDate).getTime()
        const endTime = new Date(dateRange.endDate).getTime()
        return alertTime >= startTime && alertTime <= endTime
    })

    const hourlyData = Array(24)
      .fill(0)
      .map((_, i) => ({
        hour: i,
        yawns: 0,
        drowsiness: 0,
        alerts: 0,
      }))

    filteredAlerts.forEach((alert) => {
      const hour = new Date(alert.timestamp).getHours()
      if (alert.alert_type === "yawn_detected") {
        hourlyData[hour].yawns++
      } else if (alert.alert_type === "drowsiness_detected") {
        hourlyData[hour].drowsiness++
      } else if (alert.alert_type === "critical_drowsiness") {
        hourlyData[hour].alerts++
      }
    })

    return hourlyData
  }

  // Generate risk distribution data for pie chart
  const riskDistribution = () => {
    const filteredAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime()
        const startTime = new Date(dateRange.startDate).getTime()
        const endTime = new Date(dateRange.endDate).getTime()
        return alertTime >= startTime && alertTime <= endTime
    })

    if (filteredAlerts.length === 0) return []

    const yawnCount = stats.totalYawns;
    const drowsinessCount = stats.totalDrowsiness;
    const criticalCount = stats.totalAlerts;
    const total = yawnCount + drowsinessCount + criticalCount;


    if (total === 0) return []

    return [
      { name: "ระวัง (หาว)", value: yawnCount, color: "#F59E0B" },
      { name: "อันตราย (ง่วง)", value: drowsinessCount, color: "#F97316" },
      { name: "วิกฤต", value: criticalCount, color: "#EF4444" },
    ].filter((item) => item.value > 0)
  }
  
  if (loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลระบบ..." />
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}>
              <User className="mr-2 h-4 w-4" />
              <span>ข้อมูลส่วนตัว</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>ออกจากระบบ</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">ภาพรวมระบบ</TabsTrigger>
          <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                เลือกช่วงเวลาข้อมูล
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <DateTimeFilter
                onFilterChange={handleDateChange}
                initialStartDate={dateRange.startDate}
                initialEndDate={dateRange.endDate}
              />
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อุปกรณ์ทั้งหมด</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalDevices}</div>
                <p className="text-xs text-muted-foreground">อุปกรณ์ที่มีผู้ใช้</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">อุปกรณ์ที่ใช้งาน</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeDevices}</div>
                <p className="text-xs text-muted-foreground">ส่งข้อมูลใน 5 นาทีล่าสุด</p>
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
                <CardTitle className="text-sm font-medium">ผู้ดูแลระบบ</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.adminUsers}</div>
                <p className="text-xs text-muted-foreground">แอดมิน</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การหาว</CardTitle>
                <Eye className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.totalYawns}</div>
                <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ความง่วง</CardTitle>
                <BarChart3 className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.totalDrowsiness}</div>
                <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">แจ้งเตือนด่วน</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.totalAlerts}</div>
                <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  กิจกรรมตามช่วงเวลา
                </CardTitle>
                <CardDescription>แสดงกิจกรรมตามช่วงเวลา (ตามฟิลเตอร์วันที่)</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hourlyActivity()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="yawns" fill="#F59E0B" name="การหาว" />
                    <Bar dataKey="drowsiness" fill="#F97316" name="ความง่วง" />
                    <Bar dataKey="alerts" fill="#EF4444" name="แจ้งเตือนด่วน" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>การกระจายระดับความเสี่ยง</CardTitle>
                <CardDescription>แสดงสัดส่วนของระดับความเสี่ยงที่ตรวจพบ (ตามฟิลเตอร์วันที่)</CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                {riskDistribution().length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={riskDistribution()}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`}
                      >
                        {riskDistribution().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} เหตุการณ์`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center space-y-2">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto" />
                      <p className="text-gray-500">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    จัดการผู้ใช้งาน
                  </CardTitle>
                  <CardDescription>รายชื่อผู้ใช้งานทั้งหมดในระบบ {filteredUsers.length} คน</CardDescription>
                </div>

                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ค้นหาผู้ใช้..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid gap-4">
            {filteredUsers.map((user) => {
              const isActive =
                user.deviceId &&
                user.deviceId !== "null" &&
                currentData[user.deviceId] &&
                Date.now() - new Date(currentData[user.deviceId].timestamp).getTime() < 5 * 60 * 1000

              return (
                <Card key={user.uid}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-lg">{user.fullName.charAt(0)}</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="font-semibold text-gray-900">{user.fullName}</h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <div className="flex gap-2">
                            <Badge variant="outline">
                              {user.deviceId && user.deviceId !== "null" ? `อุปกรณ์: ${user.deviceId.replace("device_","")}` : "ไม่มีอุปกรณ์"}
                            </Badge>
                            <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                              {user.role === "admin" ? "แอดมิน" : "คนขับ"}
                            </Badge>
                            {user.deviceId && user.deviceId !== "null" && (
                              <Badge variant={isActive ? "default" : "destructive"} className="text-xs">
                                {isActive ? "ออนไลน์" : "ออฟไลน์"}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => router.push(`/admin/profile/${user.uid}`)}>
                          <User className="mr-1 h-4 w-4" />
                          โปรไฟล์
                        </Button>

                        {user.deviceId && user.deviceId !== "null" && user.role !== "admin" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/dashboard/reports?deviceId=${user.deviceId}`)}
                          >
                            <LayoutDashboard className="mr-1 h-4 w-4" />
                            แดชบอร์ด
                          </Button>
                        )}

                        {user.role !== "admin" && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" onClick={() => setUserToDelete(user.uid)}>
                                <UserX className="mr-1 h-4 w-4" />
                                ลบ
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>ยืนยันการลบผู้ใช้</AlertDialogTitle>
                                <AlertDialogDescription>
                                  คุณต้องการลบผู้ใช้ {user.fullName} ({user.email}) ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteUser}>ยืนยันการลบ</AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {filteredUsers.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">ไม่พบผู้ใช้</h3>
                <p className="text-gray-600">ไม่มีผู้ใช้ที่ตรงกับคำค้นหา "{searchTerm}"</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
