"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  AlertTriangle,
  Eye,
  Clock,
  Activity,
  RefreshCw,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"

import { DateTimeFilter } from "@/components/date-time-filter"
import { ChartsSection } from "@/components/charts-section"
import { ExportData } from "@/components/export-data"
import { LoadingScreen } from "@/components/loading-screen"

import { getFilteredSafetyData, type SafetyData } from "@/lib/firebase"
import { getCurrentDayFullRange } from "@/lib/date-utils"

interface SafetyDashboardProps {
  deviceId: string
  viewMode?: "user" | "admin"
}

export function SafetyDashboard({ deviceId, viewMode = "user" }: SafetyDashboardProps) {
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Date filter state
  const defaultRange = getCurrentDayFullRange()
  const [startDate, setStartDate] = useState(defaultRange.start)
  const [endDate, setEndDate] = useState(defaultRange.end)

  const loadSafetyData = useCallback(
    async (start: string, end: string) => {
      try {
        setLoading(true)
        setError(null)

        console.log(`🔍 SafetyDashboard: Loading data for device ${deviceId}`, {
          startDate: start,
          endDate: end,
          startLocal: new Date(start).toLocaleString("th-TH"),
          endLocal: new Date(end).toLocaleString("th-TH"),
          viewMode,
        })

        const data = await getFilteredSafetyData(deviceId, start, end)

        if (!data) {
          console.log("⚠️ SafetyDashboard: No data found for device", deviceId)
          setSafetyData(null)
          return
        }

        console.log("✅ SafetyDashboard: Data loaded successfully", {
          eventsCount: data.events?.length || 0,
          safetyScore: data.safetyScore,
        })

        setSafetyData(data)
      } catch (err) {
        console.error("❌ SafetyDashboard: Error loading data:", err)
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดข้อมูล")
      } finally {
        setLoading(false)
      }
    },
    [deviceId, viewMode],
  )

  // Handle filter change
  const handleFilterChange = useCallback(
    (newStartDate: string, newEndDate: string) => {
      console.log("📅 SafetyDashboard: Filter changed", {
        newStartDate,
        newEndDate,
        startLocal: new Date(newStartDate).toLocaleString("th-TH"),
        endLocal: new Date(newEndDate).toLocaleString("th-TH"),
      })

      setStartDate(newStartDate)
      setEndDate(newEndDate)
      loadSafetyData(newStartDate, newEndDate)
    },
    [loadSafetyData],
  )

  // Initial load
  useEffect(() => {
    loadSafetyData(startDate, endDate)
  }, []) // Only run on mount

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadSafetyData(startDate, endDate)
    setRefreshing(false)
  }

  if (loading) {
    return <LoadingScreen message="กำลังโหลดข้อมูลความปลอดภัย..." />
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          ลองใหม่
        </Button>
      </div>
    )
  }

  if (!safetyData) {
    return (
      <div className="space-y-6">
        {/* Date Filter */}
        <DateTimeFilter onFilterChange={handleFilterChange} initialStartDate={startDate} initialEndDate={endDate} />

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>ไม่พบข้อมูลความปลอดภัยสำหรับอุปกรณ์นี้ในช่วงเวลาที่เลือก</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { events = [], safetyScore } = safetyData

  // Calculate statistics
  const totalEvents = events.length
  const fatigueEvents = events.filter((e) => e.type === "fatigue").length
  const distractionEvents = events.filter((e) => e.type === "distraction").length

  // Get safety status
  const getSafetyStatus = (score: number) => {
    if (score >= 80) return { label: "ปลอดภัย", color: "bg-green-500", icon: CheckCircle }
    if (score >= 60) return { label: "ระวัง", color: "bg-yellow-500", icon: AlertTriangle }
    return { label: "อันตราย", color: "bg-red-500", icon: XCircle }
  }

  const safetyStatus = getSafetyStatus(safetyScore)
  const StatusIcon = safetyStatus.icon

  return (
    <div className="space-y-6">
      {/* Date Filter */}
      <DateTimeFilter onFilterChange={handleFilterChange} initialStartDate={startDate} initialEndDate={endDate} />

      {/* Header with Refresh */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">แดshboard ความปลอดภัย</h2>
          <p className="text-gray-600">Device ID: {deviceId}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline" size="sm" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            รีเฟรช
          </Button>
          <ExportData data={safetyData} deviceId={deviceId} startDate={startDate} endDate={endDate} />
        </div>
      </div>

      {/* Safety Score Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              คะแนนความปลอดภัย
            </span>
            <Badge variant="secondary" className="flex items-center">
              <StatusIcon className="h-4 w-4 mr-1" />
              {safetyStatus.label}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="text-3xl font-bold">{safetyScore.toFixed(1)}/100</div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div className={`h-2 rounded-full ${safetyStatus.color}`} style={{ width: `${safetyScore}%` }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">เหตุการณ์ทั้งหมด</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
            <p className="text-xs text-muted-foreground">เหตุการณ์ในช่วงเวลาที่เลือก</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ความเหนื่อยล้า</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{fatigueEvents}</div>
            <p className="text-xs text-muted-foreground">เหตุการณ์ความเหนื่อยล้า</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ไขว้เขว</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{distractionEvents}</div>
            <p className="text-xs text-muted-foreground">เหตุการณ์ไขว้เขว</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data Tabs */}
      <Tabs defaultValue="charts" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="charts" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            กราฟและแผนภูมิ
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center">
            <Clock className="h-4 w-4 mr-2" />
            รายการเหตุการณ์
          </TabsTrigger>
        </TabsList>

        <TabsContent value="charts">
          <ChartsSection events={events} safetyScore={safetyScore} startDate={startDate} endDate={endDate} />
        </TabsContent>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>รายการเหตุการณ์</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                  <p>ไม่มีเหตุการณ์ความปลอดภัยในช่วงเวลานี้</p>
                  <p className="text-sm">ขับขี่อย่างปลอดภัย!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {events.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        {event.type === "fatigue" ? (
                          <Eye className="h-5 w-5 text-red-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                        )}
                        <div>
                          <div className="font-medium">{event.type === "fatigue" ? "ความเหนื่อยล้า" : "ไขว้เขว"}</div>
                          <div className="text-sm text-gray-500">
                            {new Date(event.timestamp).toLocaleString("th-TH")}
                          </div>
                        </div>
                      </div>
                      <Badge variant={event.type === "fatigue" ? "destructive" : "secondary"}>
                        ระดับ {event.severity}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
