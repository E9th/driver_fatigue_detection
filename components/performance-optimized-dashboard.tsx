/**
 * Performance Optimized Dashboard Component
 * Enhanced with admin features and export functionality
 */

"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { DateTimeFilter } from "@/components/date-time-filter"
import { ChartsSection } from "@/components/charts-section"
import { UsageHistory } from "@/components/usage-history"
import { UsageReports } from "@/components/usage-reports"
import { ExportData } from "@/components/export-data"
import { LoadingScreen } from "@/components/loading-screen"
import { ConnectionStatus } from "@/components/connection-status"
import { DeviceIdSelector } from "@/components/device-id-selector"
import { SafetyScoreTooltip } from "@/components/safety-score-tooltip"
import { AlertTriangle, Eye, Activity, Shield, Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth } from "@/lib/firebase"
import { dataService } from "@/lib/data-service"
import type { HistoricalData, DailyStats } from "@/lib/types"

interface PerformanceOptimizedDashboardProps {
  isAdminView?: boolean
}

export function PerformanceOptimizedDashboard({ isAdminView = false }: PerformanceOptimizedDashboardProps) {
  // State management
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<HistoricalData[]>([])
  const [stats, setStats] = useState<DailyStats>({
    totalYawns: 0,
    totalDrowsiness: 0,
    totalAlerts: 0,
    totalSessions: 0,
    averageEAR: 0,
    averageMouthDistance: 0,
    statusDistribution: {},
  })
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    end: new Date().toISOString().split("T")[0],
  })
  const [exportLoading, setExportLoading] = useState(false)

  const { toast } = useToast()

  // Load data function using existing dataService
  const loadData = useCallback(() => {
    if (!auth.currentUser) return

    setLoading(true)
    const deviceId = isAdminView ? selectedDeviceId : auth.currentUser.uid

    if (!deviceId) {
      setLoading(false)
      return
    }

    console.log(`📊 Loading data for device: ${deviceId}`)

    // Use the existing subscribeToHistoricalDataWithCache function
    const unsubscribe = dataService.subscribeToHistoricalDataWithCache(
      deviceId,
      dateRange.start,
      dateRange.end,
      (historicalData: HistoricalData[], dailyStats: DailyStats) => {
        console.log("📊 Data received:", { historicalData: historicalData.length, dailyStats })
        setData(historicalData)
        setStats(dailyStats)
        setLoading(false)
      },
    )

    return unsubscribe
  }, [dateRange, selectedDeviceId, isAdminView])

  // Load data on mount and when dependencies change
  useEffect(() => {
    const unsubscribe = loadData()
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [loadData])

  // Handle date filter change
  const handleDateFilterChange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate })
  }, [])

  // Handle device selection change (admin only)
  const handleDeviceChange = useCallback((deviceId: string) => {
    setSelectedDeviceId(deviceId)
  }, [])

  // Handle export data
  const handleExportData = useCallback(async () => {
    setExportLoading(true)
    try {
      const exportData = {
        deviceData: {
          deviceId: selectedDeviceId || auth.currentUser?.uid,
          data,
          stats,
          dateRange,
        },
        exportDate: new Date().toISOString(),
      }

      const dataStr = JSON.stringify(exportData, null, 2)
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)
      const exportFileDefaultName = `dashboard-data-${new Date().toISOString().split("T")[0]}.json`

      const linkElement = document.createElement("a")
      linkElement.setAttribute("href", dataUri)
      linkElement.setAttribute("download", exportFileDefaultName)
      linkElement.click()

      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ไฟล์ข้อมูลถูกดาวน์โหลดแล้ว",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setExportLoading(false)
    }
  }, [data, stats, selectedDeviceId, dateRange, toast])

  // Calculate safety score using dataService
  const safetyScore = useMemo(() => {
    return dataService.calculateSafetyScore(stats)
  }, [stats])

  // Get safety level
  const safetyLevel = useMemo(() => {
    if (safetyScore >= 80) return { text: "ดีมาก", color: "text-green-600", bg: "bg-green-100" }
    if (safetyScore >= 60) return { text: "ดี", color: "text-blue-600", bg: "bg-blue-100" }
    if (safetyScore >= 40) return { text: "ปานกลาง", color: "text-yellow-600", bg: "bg-yellow-100" }
    return { text: "ต้องปรับปรุง", color: "text-red-600", bg: "bg-red-100" }
  }, [safetyScore])

  if (loading) {
    return <LoadingScreen message={isAdminView ? "กำลังโหลดข้อมูลระบบ..." : "กำลังโหลดข้อมูล..."} />
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <DateTimeFilter onFilterChange={handleDateFilterChange} />
        </div>

        {isAdminView && (
          <div className="lg:w-80">
            <DeviceIdSelector selectedDeviceId={selectedDeviceId} onDeviceChange={handleDeviceChange} users={[]} />
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleExportData} variant="outline" disabled={exportLoading}>
            <Download className="mr-2 h-4 w-4" />
            {exportLoading ? "กำลังส่งออก..." : "ส่งออกข้อมูล"}
          </Button>
        </div>
      </div>

      {/* Connection Status */}
      <ConnectionStatus deviceId={selectedDeviceId || auth.currentUser?.uid || ""} />

      {/* Main Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">การหาว</CardTitle>
            <Eye className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.totalYawns}</div>
            <p className="text-xs text-muted-foreground">ครั้ง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความง่วง</CardTitle>
            <Activity className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.totalDrowsiness}</div>
            <p className="text-xs text-muted-foreground">ครั้ง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แจ้งเตือนด่วน</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.totalAlerts}</div>
            <p className="text-xs text-muted-foreground">ครั้ง</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนนความปลอดภัย</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">{safetyScore}</div>
              <SafetyScoreTooltip score={safetyScore} stats={stats} />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className={`${safetyLevel.bg} ${safetyLevel.color}`}>
                {safetyLevel.text}
              </Badge>
            </div>
            <Progress value={safetyScore} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Charts and Analysis */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="charts">กราฟและแผนภูมิ</TabsTrigger>
          <TabsTrigger value="history">ประวัติการใช้งาน</TabsTrigger>
          <TabsTrigger value="reports">รายงาน</TabsTrigger>
          <TabsTrigger value="export">ส่งออกข้อมูล</TabsTrigger>
        </TabsList>

        <TabsContent value="charts" className="space-y-4">
          <ChartsSection data={data} stats={stats} />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <UsageHistory data={data} />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <UsageReports stats={stats} data={data} />
        </TabsContent>

        <TabsContent value="export" className="space-y-4">
          <ExportData
            data={data}
            stats={stats}
            deviceId={selectedDeviceId || auth.currentUser?.uid || ""}
            dateRange={dateRange}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
