"use client"

import type { SafetyData, UserProfile, HistoricalData, AlertData } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Shield, TrendingUp, User } from "lucide-react"
import ChartsSection from "@/components/charts-section"
import { SafetyScoreTooltip } from "@/components/safety-score-tooltip"
import { LoadingScreen } from "./loading-screen"

// กำหนด Type ของ Props ที่จะรับเข้ามา
interface DashboardPageProps {
  safetyData: SafetyData | null
  isLoading: boolean
  userProfile?: UserProfile | null
}

// Component หลัก
export const DashboardPage = ({ safetyData, isLoading, userProfile }: DashboardPageProps) => {
  // หากกำลังโหลดข้อมูล ให้แสดงหน้า Loading
  if (isLoading || !safetyData) {
    return <LoadingScreen />
  }

  // --- จุดแก้ไขที่ 1: เปลี่ยนจากการอ่าน historicalData มาเป็น events ---
  const { events, stats, safetyScore } = safetyData

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-4">
        <User className="w-8 h-8" />
        <div>
          <h1 className="text-2xl font-bold">
            แดชบอร์ดของ: {userProfile?.fullName || "Driver"}
          </h1>
          <p className="text-muted-foreground">
            ข้อมูลภาพรวมความปลอดภัยในการขับขี่
          </p>
        </div>
      </div>

      {/* ส่วนของการ์ดแสดงสถิติ */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">คะแนนความปลอดภัย</CardTitle>
            <SafetyScoreTooltip score={safetyScore} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{safetyScore}</div>
            <p className="text-xs text-muted-foreground">ยิ่งคะแนนสูง ยิ่งปลอดภัย</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ค่าเฉลี่ย EAR</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.averageEAR ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground">ค่าการลืมตาเฉลี่ย</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แจ้งเตือน (ทั้งหมด)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.totalYawns ?? 0) + (stats?.totalDrowsiness ?? 0) + (stats?.totalAlerts ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">จำนวนครั้งที่ระบบแจ้งเตือน</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">แจ้งเตือน (วิกฤต)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAlerts ?? 0}</div>
            <p className="text-xs text-muted-foreground">จำนวนครั้งที่เสี่ยงอันตราย</p>
          </CardContent>
        </Card>
      </div>

      {/* ส่วนของกราฟ */}
      <div className="grid gap-6">
        {/* --- จุดแก้ไขที่ 2: ส่ง events ไปเป็น prop ที่ชื่อ data --- */}
        <ChartsSection
          data={events as HistoricalData[]}
          stats={stats}
          showAllCharts={true}
        />
      </div>
    </div>
  )
}

// export default เพื่อให้สามารถนำไปใช้ที่อื่นได้
export default DashboardPage
