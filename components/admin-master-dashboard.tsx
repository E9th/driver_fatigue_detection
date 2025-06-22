"use client"

import { useState, useEffect, useCallback } from "react"
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
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts"
import {
  AlertTriangle, Eye, Users, Activity, Clock, BarChart3, Search, User, Settings, LogOut, Download,
} from "lucide-react"
import { LoadingScreen } from "@/components/loading-screen"
import { database } from "@/lib/firebase"
import { getAllUsers, deleteUser } from "@/lib/admin-utils"
import { signOut } from "@/lib/auth"
import { ref, get } from "firebase/database"
import { useToast } from "@/hooks/use-toast"
import type { UserProfile } from "@/lib/types"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

interface AlertData {
  alert_type: string
  device_id: string
  severity: string
  timestamp: string
}

interface DeviceData {
  current_data?: {
      timestamp: string;
  }
}

export function AdminMasterDashboard() {
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  })
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [devices, setDevices] = useState<{ [key: string]: DeviceData }>({});
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
        const usersList = await getAllUsers();
        setUsers(usersList);
        setFilteredUsers(usersList);

        const [alertsSnapshot, devicesSnapshot] = await Promise.all([
          get(ref(database, "alerts")),
          get(ref(database, "devices")),
        ]);

        const alertsData = alertsSnapshot.exists() ? alertsSnapshot.val() : {};
        const alertsList: AlertData[] = Object.keys(alertsData).reduce((acc: AlertData[], deviceId: string) => {
            const deviceAlerts = alertsData[deviceId] ? Object.values(alertsData[deviceId]) as Omit<AlertData, 'device_id'>[] : [];
            deviceAlerts.forEach(alert => acc.push({ ...alert, device_id: deviceId }));
            return acc;
        }, []);
        setAlerts(alertsList);
        
        const devicesData = devicesSnapshot.exists() ? devicesSnapshot.val() : {};
        setDevices(devicesData);

      } catch (error) {
        console.error("❌ Error loading initial admin data:", error);
        toast({ title: "เกิดข้อผิดพลาด", description: "ไม่สามารถโหลดข้อมูลระบบได้", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadAllData();
  // FIX: Changed dependency array to [] to ensure this runs only once on mount
  }, []);

  useEffect(() => {
    if (loading) return;

    const startTime = new Date(dateRange.startDate).getTime();
    const endTime = new Date(dateRange.endDate).getTime();
    
    const filteredAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime();
        return alertTime >= startTime && alertTime <= endTime;
    });

    const driverUsers = users.filter((user) => user.role === "driver");
    const adminUsers = users.filter((user) => user.role === "admin");
    const devicesWithUsers = new Set(driverUsers.map(user => user.deviceId).filter(id => id && id !== "null"));

    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;
    const activeDevicesCount = Object.keys(devices).filter((deviceId) => {
        const lastUpdate = devices[deviceId]?.current_data?.timestamp;
        return lastUpdate && new Date(lastUpdate).getTime() > fiveMinutesAgo;
    }).length;

    const yawnAlerts = filteredAlerts.filter((alert) => alert.alert_type === "yawn_detected").length;
    const drowsinessAlerts = filteredAlerts.filter((alert) => alert.alert_type === "drowsiness_detected").length;
    const criticalAlerts = filteredAlerts.filter((alert) => alert.alert_type === "critical_drowsiness").length;

    setStats({
      totalDevices: devicesWithUsers.size,
      activeDevices: activeDevicesCount,
      totalUsers: driverUsers.length,
      adminUsers: adminUsers.length,
      totalYawns: yawnAlerts,
      totalDrowsiness: drowsinessAlerts,
      totalAlerts: criticalAlerts,
    });
  }, [users, alerts, devices, dateRange, loading]);

  useEffect(() => {
    setFilteredUsers(
      users.filter(
        (user) =>
          (user.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.email || "").toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, users]);

  const handleDateChange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ startDate, endDate });
  }, []);
  
  const handleLogout = useCallback(async () => {
    await signOut();
    router.push("/");
  }, [router]);

  const handleDeleteUser = useCallback(async (uid: string) => {
    if (!uid) return;
    
    const originalUsers = [...users];
    setUsers(prev => prev.filter(u => u.uid !== uid));

    const result = await deleteUser(uid);
    if (result.success) {
      toast({ title: "ลบผู้ใช้สำเร็จ" });
    } else {
      setUsers(originalUsers);
      toast({ title: "เกิดข้อผิดพลาด", description: result.error, variant: "destructive" });
    }
  }, [users, toast]);

  const hourlyActivity = () => {
    const hourlyData = Array(24).fill(0).map((_, i) => ({ hour: i, yawns: 0, drowsiness: 0, alerts: 0 }))
    const filteredAlerts = alerts.filter(alert => {
        const alertTime = new Date(alert.timestamp).getTime()
        return alertTime >= new Date(dateRange.startDate).getTime() && alertTime <= new Date(dateRange.endDate).getTime()
    })
    filteredAlerts.forEach((alert) => {
      const hour = new Date(alert.timestamp).getHours()
      if (alert.alert_type === "yawn_detected") hourlyData[hour].yawns++
      else if (alert.alert_type === "drowsiness_detected") hourlyData[hour].drowsiness++
      else if (alert.alert_type === "critical_drowsiness") hourlyData[hour].alerts++
    })
    return hourlyData
  }

  const riskDistribution = () => {
    const { totalYawns, totalDrowsiness, totalAlerts } = stats
    const total = totalYawns + totalDrowsiness + totalAlerts
    if (total === 0) return []
    return [
      { name: "หาว", value: totalYawns, color: "#F59E0B" },
      { name: "ง่วง", value: totalDrowsiness, color: "#F97316" },
      { name: "วิกฤต", value: totalAlerts, color: "#EF4444" },
    ].filter((item) => item.value > 0)
  }

  const handleExportSummary = () => {
    const reportDate = new Date().toLocaleDateString("th-TH", { year: 'numeric', month: 'long', day: 'numeric' });
    const timeRange = `${new Date(dateRange.startDate).toLocaleDateString("th-TH")} - ${new Date(dateRange.endDate).toLocaleDateString("th-TH")}`;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>รายงานสรุปภาพรวมระบบ</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; margin: 25px; color: #333; }
              .container { max-width: 800px; margin: auto; }
              .header { text-align: center; margin-bottom: 25px; }
              .header h1 { margin: 0; }
              .header p { margin: 5px 0; color: #555; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .card { border: 1px solid #ddd; padding: 20px; border-radius: 8px; text-align: center; }
              .card .value { font-size: 2.5em; font-weight: 700; }
              .card .label { font-size: 1em; color: #666; margin-top: 5px; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>รายงานสรุปภาพรวมระบบ</h1>
                  <p>ข้อมูล ณ วันที่: ${reportDate}</p>
                  <p>ช่วงเวลาที่แสดงผล: ${timeRange}</p>
              </div>
              <h2>สถิติโดยรวม</h2>
              <div class="grid">
                  <div class="card"><div class="value">${stats.totalDevices}</div><div class="label">อุปกรณ์ทั้งหมด</div></div>
                  <div class="card"><div class="value">${stats.activeDevices}</div><div class="label">อุปกรณ์ที่ใช้งาน</div></div>
                  <div class="card"><div class="value">${stats.totalUsers}</div><div class="label">ผู้ขับขี่ทั้งหมด</div></div>
                  <div class="card"><div class="value">${stats.adminUsers}</div><div class="label">ผู้ดูแลระบบ</div></div>
              </div>
              <h2 style="margin-top: 30px;">สถิติเหตุการณ์</h2>
              <div class="grid">
                  <div class="card"><div class="value">${stats.totalYawns}</div><div class="label">การหาว</div></div>
                  <div class="card"><div class="value">${stats.totalDrowsiness}</div><div class="label">ความง่วง</div></div>
                  <div class="card" style="grid-column: span 2;"><div class="value">${stats.totalAlerts}</div><div class="label">แจ้งเตือนด่วน</div></div>
              </div>
          </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  if (loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลระบบ..." />
  }

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">แดชบอร์ดผู้ดูแลระบบ</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon"><Settings className="h-4 w-4" /></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>บัญชีของฉัน</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/profile")}><User className="mr-2 h-4 w-4" /><span>ข้อมูลส่วนตัว</span></DropdownMenuItem>
            <DropdownMenuItem onClick={handleLogout}><LogOut className="mr-2 h-4 w-4" /><span>ออกจากระบบ</span></DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">ภาพรวมระบบ</TabsTrigger>
          <TabsTrigger value="users">จัดการผู้ใช้</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* FIX: Changed UI for filter/export section to be less intrusive */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>ตัวกรองข้อมูลและเครื่องมือ</CardTitle>
                <Button onClick={handleExportSummary} variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Summary (PDF)
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <DateTimeFilter onFilterChange={handleDateChange} initialStartDate={dateRange.startDate} initialEndDate={dateRange.endDate} />
            </CardContent>
          </Card>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">อุปกรณ์ทั้งหมด</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalDevices}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">อุปกรณ์ที่ใช้งาน</CardTitle><Activity className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.activeDevices}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">ผู้ขับขี่</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div></CardContent></Card>
            <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">ผู้ดูแลระบบ</CardTitle><Clock className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">{stats.adminUsers}</div></CardContent></Card>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">การหาว</CardTitle><Eye className="h-4 w-4 text-yellow-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-600">{stats.totalYawns}</div><p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">ความง่วง</CardTitle><BarChart3 className="h-4 w-4 text-orange-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-orange-600">{stats.totalDrowsiness}</div><p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p></CardContent></Card>
              <Card><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">แจ้งเตือนด่วน</CardTitle><AlertTriangle className="h-4 w-4 text-red-500" /></CardHeader><CardContent><div className="text-2xl font-bold text-red-600">{stats.totalAlerts}</div><p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p></CardContent></Card>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card><CardHeader><CardTitle>กิจกรรมตามช่วงเวลา</CardTitle></CardHeader><CardContent className="h-[350px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={hourlyActivity()}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} /><YAxis /><Tooltip /><Legend /><Bar dataKey="yawns" fill="#F59E0B" name="การหาว" /><Bar dataKey="drowsiness" fill="#F97316" name="ความง่วง" /><Bar dataKey="alerts" fill="#EF4444" name="แจ้งเตือนด่วน" /></BarChart></ResponsiveContainer></CardContent></Card>
            <Card><CardHeader><CardTitle>การกระจายระดับความเสี่ยง</CardTitle></CardHeader><CardContent className="h-[350px]">{riskDistribution().length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={riskDistribution()} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" label={({ name, value }) => `${name}: ${value}`}>{riskDistribution().map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><Tooltip formatter={(value: number, name: string) => [`${value} เหตุการณ์`, name]} /><Legend /></PieChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full"><p className="text-gray-500">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p></div>)}</CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader><div className="flex justify-between items-center"><CardTitle>จัดการผู้ใช้งาน</CardTitle><div className="relative w-64"><Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" /><Input placeholder="ค้นหา..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} /></div></div></CardHeader>
            <CardContent>
                <Table>
                    <TableHeader><TableRow><TableHead>ชื่อ</TableHead><TableHead>อีเมล</TableHead><TableHead>Device ID</TableHead><TableHead>สถานะ</TableHead><TableHead className="text-right">จัดการ</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {filteredUsers.map((user) => {
                            const deviceId = user.deviceId || "";
                            const isActive = deviceId && devices[deviceId] && devices[deviceId].current_data && Date.now() - new Date(devices[deviceId].current_data!.timestamp).getTime() < 5 * 60 * 1000;
                            return (
                                <TableRow key={user.uid}>
                                    <TableCell>{user.fullName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.deviceId || 'N/A'}</TableCell>
                                    <TableCell><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>{isActive && <Badge className="ml-2 bg-green-100 text-green-800">ออนไลน์</Badge>}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => router.push(`/admin/dashboard/${user.uid}`)}>แดชบอร์ด</Button>
                                        {user.role !== 'admin' && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive" size="sm" className="ml-2" onClick={() => setUserToDelete(user.uid)}>ลบ</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle><AlertDialogDescription>คุณต้องการลบผู้ใช้ {user.fullName} หรือไม่?</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>ยกเลิก</AlertDialogCancel><AlertDialogAction onClick={() => userToDelete && handleDeleteUser(userToDelete)}>ยืนยัน</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
