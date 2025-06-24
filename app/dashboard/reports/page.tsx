/**
 * Reports and Statistics Page
 * A dedicated page for detailed historical data analysis, charts, and reports.
 */
"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, BarChart3, Calendar, Download } from "lucide-react"

// Components
import ChartsSection from "@/components/charts-section"
import { DateTimeFilter } from "@/components/date-time-filter"
import { LoadingScreen } from "@/components/loading-screen"
import { UsageHistory } from "@/components/usage-history"
import { UsageReports } from "@/components/usage-reports"
import { ExportData } from "@/components/export-data"

// Services and utilities
import { dataService } from "@/lib/data-service"
import { useAuthState } from "@/lib/auth"
import { getCurrentDayFullRange } from "@/lib/date-utils"
import type { HistoricalData, DailyStats } from "@/lib/types"

export default function ReportsPage() {
  const { userProfile, isLoading: authLoading } = useAuthState()
  const router = useRouter()

  const [isLoading, setIsLoading] = useState(true)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState(getCurrentDayFullRange())
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null)

  useEffect(() => {
    if (!authLoading && userProfile?.deviceId) {
      setDeviceId(userProfile.deviceId)
    }
  }, [userProfile, authLoading])

  useEffect(() => {
    if (!deviceId) return

    setIsLoading(true)

    const unsubscribe = dataService.subscribeToHistoricalDataWithCache(
      deviceId,
      dateRange.start,
      dateRange.end,
      (data, stats) => {
        setHistoricalData(data)
        setDailyStats(stats)
        setIsLoading(false)
      },
    )

    return () => unsubscribe()
  }, [deviceId, dateRange])

  const handleFilterChange = useCallback((startDate: string, endDate: string) => {
    setDateRange({ start: startDate, end: endDate })
  }, [])

  if (authLoading) {
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์..." />
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="mr-2" onClick={() => router.push("/dashboard")}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100">รายงานและสถิติ</h1>
            </div>
            <ExportData data={historicalData} stats={dailyStats} deviceId={deviceId || ""} dateRange={dateRange} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Date Filter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-600" />
                เลือกช่วงเวลา
              </CardTitle>
              <CardDescription>เลือกช่วงวันที่และเวลาที่ต้องการดูข้อมูลย้อนหลัง</CardDescription>
            </CardHeader>
            <CardContent>
              <DateTimeFilter onFilterChange={handleFilterChange} initialStartDate={dateRange.start} initialEndDate={dateRange.end} />
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : historicalData.length > 0 ? (
            <>
              {/* Charts */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    กราฟสรุปผล
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartsSection data={historicalData} stats={dailyStats} showAllCharts={true} />
                </CardContent>
              </Card>

              {/* Usage Reports */}
              <UsageReports data={historicalData} startDate={new Date(dateRange.start)} endDate={new Date(dateRange.end)} />

              {/* Usage History */}
              <UsageHistory deviceId={deviceId!} startDate={dateRange.start} endDate={dateRange.end} />
            </>
          ) : (
            <Card>
              <CardContent className="py-20 text-center">
                <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-lg font-medium text-gray-900">ไม่พบข้อมูล</h3>
                <p className="mt-1 text-sm text-gray-500">ไม่พบข้อมูลการขับขี่ในช่วงเวลาที่คุณเลือก</p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
