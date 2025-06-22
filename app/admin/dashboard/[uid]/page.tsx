"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import { getFilteredSafetyData } from "@/lib/firebase"
import { getUserProfile } from "@/lib/auth"
import type { UserProfile, SafetyData, HistoricalData } from "@/lib/types"

import { LoadingScreen } from "@/components/loading-screen"
import { DateTimeFilter } from "@/components/date-time-filter"
import ChartsSection from "@/components/charts-section"
import { SafetyScoreTooltip } from "@/components/safety-score-tooltip"
import { ExportData } from "@/components/export-data" //  <-- (1) แก้ไขบรรทัดนี้

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    ArrowLeft, AlertCircle, User, Activity, Shield, MoreVertical,
    BarChart3, Eye, AlertTriangle, Phone, Mail
} from "lucide-react"


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

  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 6) // Default to last 7 days
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  })

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    console.log(`🔄 Loading data for UID: ${uid} in range:`, dateRange);
    try {
      const profile = await getUserProfile(uid)
      if (!profile) throw new Error("ไม่พบข้อมูลผู้ใช้")
      setUserProfile(profile)

      if (!profile.deviceId) throw new Error("ผู้ใช้นี้ยังไม่ได้กำหนด Device ID")

      const data = await getFilteredSafetyData(profile.deviceId, dateRange.start, dateRange.end)
      setSafetyData(data)
      console.log("✅ Safety data loaded for admin view:", data);

    } catch (err: any) {
      console.error("❌ Admin: Error loading user dashboard:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [uid, dateRange])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFilterChange = useCallback((startDate: string, endDate: string) => {
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

  if (error || !safetyData) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <Button variant="outline" onClick={() => router.push('/admin/dashboard')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> กลับ
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "ไม่สามารถโหลดข้อมูลได้"}</AlertDescription>
        </Alert>
      </div>
    )
  }
  
  const { stats, events, safetyScore } = safetyData;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto py-6 space-y-6">
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/dashboard')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">แดชบอร์ดของผู้ใช้</h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {userProfile?.fullName} (Device ID: {userProfile?.deviceId})
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {userProfile?.deviceId && (
              <ExportData
                // @ts-ignore
                data={events} // Pass the events array
                stats={stats}   // Pass the stats object
                deviceId={userProfile.deviceId}
                dateRange={dateRange}
              />
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => router.push(`/admin/profile/${uid}`)}><User className="mr-2 h-4 w-4" /> ดูโปรไฟล์เต็ม</DropdownMenuItem>
                <DropdownMenuItem><Mail className="mr-2 h-4 w-4" /> ส่งอีเมล</DropdownMenuItem>
                <DropdownMenuItem><Phone className="mr-2 h-4 w-4" /> ติดต่อ</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <Card><CardContent className="p-4"><DateTimeFilter onFilterChange={handleFilterChange} initialStartDate={dateRange.start} initialEndDate={dateRange.end} /></CardContent></Card>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Shield className="h-5 w-5 text-blue-600"/>คะแนนความปลอดภัย</CardTitle></CardHeader>
              <CardContent className="text-center">
                <div className={`text-6xl font-bold ${getScoreColor(safetyScore)}`}>{safetyScore}</div>
                <p className="text-sm text-muted-foreground mb-4">คะแนนรวมในช่วงเวลาที่เลือก</p>
                <Progress value={safetyScore} className="h-3" />
                <div className="mt-2 flex justify-end">
                    <SafetyScoreTooltip 
                        score={safetyScore}
                        totalYawns={stats.yawnEvents}
                        totalDrowsiness={stats.fatigueEvents}
                        totalAlerts={stats.criticalEvents}
                        averageEAR={stats.averageEAR}
                    />
                </div>
              </Content>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Activity className="h-5 w-5 text-indigo-600"/>สรุปเหตุการณ์</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><Eye className="h-6 w-6 text-yellow-600 mx-auto mb-2"/><p className="text-2xl font-bold">{stats.yawnEvents}</p><p className="text-sm text-muted-foreground">การหาว</p></div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg"><AlertTriangle className="h-6 w-6 text-orange-600 mx-auto mb-2"/><p className="text-2xl font-bold">{stats.fatigueEvents}</p><p className="text-sm text-muted-foreground">ความง่วง</p></div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg col-span-2 md:col-span-1"><AlertTriangle className="h-6 w-6 text-red-600 mx-auto mb-2"/><p className="text-2xl font-bold">{stats.criticalEvents}</p><p className="text-sm text-muted-foreground">เหตุการณ์วิกฤต</p></div>
            </CardContent>
          </Card>
        </div>
        
        <Suspense fallback={<LoadingScreen message="กำลังโหลดกราฟ..." />}>
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><BarChart3 className="h-5 w-5 text-green-600"/>กราฟวิเคราะห์</CardTitle></CardHeader>
            <CardContent>
              <ChartsSection stats={stats} />
            </CardContent>
          </Card>
        </Suspense>

        <Card>
          <CardHeader><CardTitle>ประวัติเหตุการณ์ความปลอดภัย</CardTitle></CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-y-auto">
              <Table>
                <TableHeader><TableRow><TableHead>เวลา</TableHead><TableHead>ประเภทเหตุการณ์</TableHead><TableHead className="text-right">ระดับความรุนแรง</TableHead></TableRow></TableHeader>
                <TableBody>
                  {events && events.length > 0 ? (
                    events.map(event => (
                      <TableRow key={event.id}>
                        <TableCell>{new Date(event.timestamp).toLocaleString('th-TH')}</TableCell>
                        <TableCell className="font-medium">{event.details}</TableCell>
                        <TableCell className="text-right">{getSeverityBadge(event.severity)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={3} className="text-center h-24">ไม่พบเหตุการณ์ในช่วงเวลานี้</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
