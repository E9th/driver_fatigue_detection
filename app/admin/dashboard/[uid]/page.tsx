"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"

import { getFilteredSafetyData } from "@/lib/firebase"
import { getUserProfile } from "@/lib/auth"
import type { UserProfile, SafetyData } from "@/lib/types"

import { LoadingScreen } from "@/components/loading-screen"
import { DateTimeFilter } from "@/components/date-time-filter"
import { SafetyScoreTooltip } from "@/components/safety-score-tooltip"
import { AdminExportData } from "@/components/admin-export-data"
import { DeviceNotificationButton } from "@/components/device-notification-button"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, AlertCircle, User, Activity, Shield, MoreVertical, Eye, AlertTriangle, Mail } from "lucide-react"

interface AdminUserDashboardProps {
  params: {
    uid: string
  }
}

export default function AdminUserDashboardPage({ params }: AdminUserDashboardProps) {
  const { uid } = params
  const router = useRouter()

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ใช้ state แยกสำหรับ dateRange เพื่อป้องกัน infinite loop
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
  })

  // แยก loadData ออกมาและใช้ dependencies ที่ชัดเจน
  const loadData = useCallback(async () => {
    if (!uid) return

    setLoading(true)
    setError(null)

    console.log(`🔄 Loading data for UID: ${uid}`, { dateRange })

    try {
      // โหลด user profile ก่อน
      const profile = await getUserProfile(uid)
      if (!profile) {
        throw new Error("ไม่พบข้อมูลผู้ใช้")
      }

      console.log("✅ User profile loaded:", profile)
      setUserProfile(profile)

      if (!profile.deviceId) {
        throw new Error("ผู้ใช้นี้ยังไม่ได้กำหนด Device ID")
      }

      // โหลด safety data
      console.log(`🔍 Loading safety data for device: ${profile.deviceId}`)
      const data = await getFilteredSafetyData(profile.deviceId, dateRange.start, dateRange.end)

      console.log("✅ Safety data loaded:", data)
      setSafetyData(data)
    } catch (err: any) {
      console.error("❌ Error loading user dashboard:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [uid, dateRange.start, dateRange.end]) // dependencies ที่ชัดเจน

  // useEffect ที่ไม่ทำให้เกิด infinite loop
  useEffect(() => {
    loadData()
  }, [loadData])

  // แยก handler สำหรับ filter change
  const handleFilterChange = useCallback((startDate: string, endDate: string) => {
    console.log("📅 Date range changed:", { startDate, endDate })
    setDateRange({ start: startDate, end: endDate })
  }, [])

  const getSeverityBadge = (severity: number) => {
    if (severity >= 3) return <Badge variant="destructive">สูง</Badge>
    if (severity === 2) return <Badge className="bg-yellow-500 text-white hover:bg-yellow-500/80">ปานกลาง</Badge>
    return <Badge variant="secondary">ต่ำ</Badge>
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  if (loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลแดชบอร์ดผู้ใช้..." />
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับ
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!safetyData || !userProfile) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={() => router.push("/admin/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับ
        </Button>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ไม่พบข้อมูลผู้ใช้หรือข้อมูลความปลอดภัย</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { stats, events, safetyScore } = safetyData

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 space-y-6">
        {/* Header Section - แยกออกมาให้ชัดเจน */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push("/admin/dashboard")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">แดชบอร์ดของผู้ใช้</h1>
              <p className="text-muted-foreground">
                {userProfile.fullName} ({userProfile.deviceId})
              </p>
            </div>
          </div>

          {/* Action Buttons - จัดเรียงใหม่ให้เป็นระเบียบ */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Date Filter - ให้พื้นที่เต็ม */}
            <div className="flex-1">
              <DateTimeFilter
                onFilterChange={handleFilterChange}
                initialStartDate={dateRange.start}
                initialEndDate={dateRange.end}
              />
            </div>

            {/* Action Buttons - จัดกลุ่มให้เป็นระเบียบ */}
            <div className="flex flex-col sm:flex-row gap-2 lg:w-auto">
              {/* Primary Actions */}
              <div className="flex gap-2">
                <DeviceNotificationButton
                  deviceId={userProfile.deviceId || ""}
                  adminId="admin"
                  disabled={!userProfile.deviceId}
                />
                <AdminExportData
                  type="user"
                  userData={{
                    profile: userProfile,
                    safetyData,
                    dateRange,
                  }}
                />
              </div>

              {/* Secondary Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => router.push(`/admin/profile/${uid}`)}>
                    <User className="mr-2 h-4 w-4" />
                    ดูโปรไฟล์
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.open(`mailto:${userProfile.email}`)}>
                    <Mail className="mr-2 h-4 w-4" />
                    ส่งอีเมล
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">คะแนนความปลอดภัย</CardTitle>
              <SafetyScoreTooltip />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getScoreColor(safetyScore)}`}>{safetyScore}/100</div>
              <Progress value={safetyScore} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">การหาว</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.yawnEvents}</div>
              <p className="text-xs text-muted-foreground">ครั้ง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ความง่วงนอน</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.fatigueEvents}</div>
              <p className="text-xs text-muted-foreground">ครั้ง</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">เหตุการณ์อันตราย</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
              <p className="text-xs text-muted-foreground">ครั้ง</p>
            </CardContent>
          </Card>
        </div>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              ประวัติเหตุการณ์ความปลอดภัย
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events && events.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>เวลา</TableHead>
                      <TableHead>เหตุการณ์</TableHead>
                      <TableHead>ระดับความรุนแรง</TableHead>
                      <TableHead>รายละเอียด</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {events
                      .slice(-20)
                      .reverse()
                      .map((event, index) => (
                        <TableRow key={`${event.id}-${index}`}>
                          <TableCell className="font-mono text-sm">
                            {new Date(event.timestamp).toLocaleString("th-TH")}
                          </TableCell>
                          <TableCell>{event.type}</TableCell>
                          <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                          <TableCell className="max-w-xs truncate">{event.details || "-"}</TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>ไม่มีเหตุการณ์ความปลอดภัยในช่วงเวลานี้</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
