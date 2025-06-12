"use client"

import { useState, useEffect } from "react"
import { ref, onValue, off } from "firebase/database"
import { database } from "@/lib/firebase"
import { normalizeDeviceId } from "@/lib/auth"
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
import { AlertCircle } from "lucide-react"

interface SafetyDashboardProps {
  deviceId: string
  viewMode?: "user" | "admin"
}

export function SafetyDashboard({ deviceId, viewMode = "user" }: SafetyDashboardProps) {
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>(deviceId)
  const [startDate, setStartDate] = useState<Date | null>(null)
  const [endDate, setEndDate] = useState<Date | null>(null)

  useEffect(() => {
    // ถ้าเป็นโหมดแอดมิน ให้ใช้ deviceId ที่ส่งมา
    if (viewMode === "admin") {
      setSelectedDeviceId(deviceId)
    }
  }, [deviceId, viewMode])

  useEffect(() => {
    console.log("🔄 กำลังโหลดข้อมูล...", { selectedDeviceId })
    setIsLoading(true)
    setError(null)

    const normalizedDeviceId = normalizeDeviceId(selectedDeviceId)
    const dataRef = ref(database, `devices/${normalizedDeviceId}`)

    const handleDataChange = (snapshot: any) => {
      if (snapshot.exists()) {
        const deviceData = snapshot.val()
        setData(deviceData)
        console.log("✅ ข้อมูลโหลดเสร็จ:", deviceData)
      } else {
        setError(`ไม่พบข้อมูลสำหรับอุปกรณ์ ${selectedDeviceId}`)
        console.log("❌ ไม่พบข้อมูล")
      }
      setIsLoading(false)
    }

    const handleError = (error: any) => {
      setError(`เกิดข้อผิดพลาดในการโหลดข้อมูล: ${error.message}`)
      setIsLoading(false)
      console.error("❌ เกิดข้อผิดพลาด:", error)
    }

    onValue(dataRef, handleDataChange, handleError)

    return () => {
      off(dataRef)
    }
  }, [selectedDeviceId])

  const handleDeviceChange = (newDeviceId: string) => {
    setSelectedDeviceId(newDeviceId)
  }

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    setStartDate(start)
    setEndDate(end)
  }

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

      <ChartsSection data={data} startDate={startDate} endDate={endDate} />

      <Tabs defaultValue="history">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="history">ประวัติการใช้งาน</TabsTrigger>
          <TabsTrigger value="reports">รายงานสรุป</TabsTrigger>
          <TabsTrigger value="export">ส่งออกข้อมูล</TabsTrigger>
        </TabsList>
        <TabsContent value="history">
          <UsageHistory data={data} startDate={startDate} endDate={endDate} />
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
