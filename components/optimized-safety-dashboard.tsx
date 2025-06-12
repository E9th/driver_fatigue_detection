"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { optimizedDataService, useFirebaseCleanup } from "@/lib/firebase-optimized"
import { ConnectionStatus } from "@/components/connection-status"
import { ChartsSection } from "@/components/charts-section"
import { DateTimeFilter } from "@/components/date-time-filter"
import { UsageHistory } from "@/components/usage-history"
import { UsageReports } from "@/components/usage-reports"
import { ExportData } from "@/components/export-data"
import { DeviceIdSelector } from "@/components/device-id-selector"
import { LoadingScreen } from "@/components/loading-screen"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Activity } from "lucide-react"

interface OptimizedSafetyDashboardProps {
  deviceId: string
  viewMode?: "user" | "admin"
}

export function OptimizedSafetyDashboard({ deviceId, viewMode = "user" }: OptimizedSafetyDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(deviceId)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "connecting">("connecting")

  // Refs สำหรับ cleanup
  const currentDataUnsubscriber = useRef<(() => void) | null>(null)
  const historicalDataUnsubscriber = useRef<(() => void) | null>(null)
  const cleanup = useFirebaseCleanup()

  // Cleanup เมื่อ component unmount
  useEffect(() => {
    return () => {
      console.log("🧹 Cleaning up OptimizedSafetyDashboard")
      if (currentDataUnsubscriber.current) {
        currentDataUnsubscriber.current()
      }
      if (historicalDataUnsubscriber.current) {
        historicalDataUnsubscriber.current()
      }
      cleanup()
    }
  }, [cleanup])

  // Subscribe to current data แบบ optimized
  const subscribeToCurrentData = useCallback((deviceId: string) => {
    console.log(`📡 Subscribing to current data for device: ${deviceId}`)
    setIsLoading(true)
    setError(null)
    setConnectionStatus("connecting")

    // Cleanup previous subscription
    if (currentDataUnsubscriber.current) {
      currentDataUnsubscriber.current()
    }

    currentDataUnsubscriber.current = optimizedDataService.subscribeToCurrentData(deviceId, (deviceData) => {
      if (deviceData) {
        setData(deviceData)
        setConnectionStatus("connected")
        console.log(`✅ Current data updated for device: ${deviceId}`)
      } else {
        setError(`ไม่พบข้อมูลสำหรับอุปกรณ์ ${deviceId}`)
        setConnectionStatus("disconnected")
      }
      setIsLoading(false)
    })
  }, [])

  // Subscribe เมื่อ deviceId เปลี่ยน
  useEffect(() => {
    if (selectedDeviceId) {
      subscribeToCurrentData(selectedDeviceId)
    }
  }, [selectedDeviceId, subscribeToCurrentData])

  // Handle device change
  const handleDeviceChange = useCallback(
    (newDeviceId: string) => {
      console.log(`🔄 Changing device from ${selectedDeviceId} to ${newDeviceId}`)
      setSelectedDeviceId(newDeviceId)
    },
    [selectedDeviceId],
  )

  // Handle date range change
  const handleDateRangeChange = useCallback((start: Date | null, end: Date | null) => {
    console.log("📅 Date range changed:", { start, end })
    setStartDate(start)
    setEndDate(end)
  }, [])

  if (isLoading) {
    return <LoadingScreen message="กำลังโหลดข้อมูล..." />
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            สถานะการเชื่อมต่อ
            <Badge variant={connectionStatus === "connected" ? "default" : "destructive"}>
              {connectionStatus === "connected"
                ? "เชื่อมต่อแล้ว"
                : connectionStatus === "connecting"
                  ? "กำลังเชื่อมต่อ"
                  : "ไม่เชื่อมต่อ"}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">อุปกรณ์และการเชื่อมต่อ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {viewMode === "user" && (
              <DeviceIdSelector currentDeviceId={selectedDeviceId} onDeviceChange={handleDeviceChange} />
            )}
            {viewMode === "admin" && (
              <div className="rounded-md bg-muted p-2">
                <p className="text-sm font-medium">Device ID: {selectedDeviceId}</p>
                <p className="text-xs text-muted-foreground">กำลังดูข้อมูลในโหมดแอดมิน</p>
              </div>
            )}
            <ConnectionStatus data={data} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">ตัวกรองข้อมูล</CardTitle>
          </CardHeader>
          <CardContent>
            <DateTimeFilter onDateRangeChange={handleDateRangeChange} />
          </CardContent>
        </Card>
      </div>

      <ChartsSection data={data} startDate={startDate} endDate={endDate} deviceId={selectedDeviceId} />

      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">ประวัติการใช้งาน</TabsTrigger>
          <TabsTrigger value="reports">รายงานสรุป</TabsTrigger>
          <TabsTrigger value="export">ส่งออกข้อมูล</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <OptimizedUsageHistory
            deviceId={selectedDeviceId}
            startDate={startDate?.toISOString().split("T")[0] || ""}
            endDate={endDate?.toISOString().split("T")[0] || ""}
          />
        </TabsContent>
        <TabsContent value="reports">
          <UsageReports data={data} startDate={startDate} endDate={endDate} />
        </TabsContent>
        <TabsContent value="export">
          <ExportData data={data} startDate={startDate} endDate={endDate} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Optimized Usage History Component
function OptimizedUsageHistory({
  deviceId,
  startDate,
  endDate,
}: {
  deviceId: string
  startDate: string
  endDate: string
}) {
  const [historicalData, setHistoricalData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const unsubscriber = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (!deviceId || !startDate || !endDate) {
      setHistoricalData([])
      setLoading(false)
      return
    }

    console.log(`📊 Loading historical data for ${deviceId} from ${startDate} to ${endDate}`)
    setLoading(true)

    // Cleanup previous subscription
    if (unsubscriber.current) {
      unsubscriber.current()
    }

    unsubscriber.current = optimizedDataService.subscribeToHistoricalData(deviceId, startDate, endDate, (data) => {
      console.log(`📊 Historical data loaded: ${data.length} records`)
      setHistoricalData(data)
      setLoading(false)
    })

    return () => {
      if (unsubscriber.current) {
        unsubscriber.current()
      }
    }
  }, [deviceId, startDate, endDate])

  if (loading) {
    return <LoadingScreen message="กำลังโหลดประวัติการใช้งาน..." />
  }

  return <UsageHistory deviceId={deviceId} startDate={startDate} endDate={endDate} />
}
