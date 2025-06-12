"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"
import type { DailyStats } from "@/lib/data-service"
import type { HistoricalData } from "@/lib/firebase"

interface ChartsSectionProps {
  data: HistoricalData[]
  stats?: DailyStats | null
  showAllCharts?: boolean
}

export function ChartsSection({ data, stats, showAllCharts = false }: ChartsSectionProps) {
  const [activeChart, setActiveChart] = useState("ear")

  // ตรวจสอบและประมวลผลข้อมูลจาก Firebase
  const safeData = useMemo(() => {
    console.log("🔍 ChartsSection: Processing data", {
      dataLength: Array.isArray(data) ? data.length : 0,
      type: typeof data,
      isArray: Array.isArray(data),
      hasStats: !!stats,
      statsData: stats,
    })

    if (!data) {
      console.warn("⚠️ Data is null or undefined")
      return []
    }

    if (!Array.isArray(data)) {
      console.warn("⚠️ Data is not an array:", { data, type: typeof data })
      return []
    }

    // กรองข้อมูลที่ไม่มี timestamp ออก
    const filteredData = data.filter((item) => item && item.timestamp)

    console.log("✅ Data is valid array with length:", filteredData.length)
    return filteredData
  }, [data])

  // ประมวลผลข้อมูลสำหรับกราฟเทคนิค (EAR และ Mouth Distance)
  const technicalData = useMemo(() => {
    if (!Array.isArray(safeData) || safeData.length === 0) {
      console.warn("⚠️ SafeData is not valid for technicalData")
      return []
    }

    return safeData.map((item) => ({
      time: new Date(item.timestamp).toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ear: item.ear || 0,
      mouth: item.mouth_distance || 0,
      face_frames: item.face_detected_frames || 0,
    }))
  }, [safeData])

  // สร้างข้อมูลสำหรับกราฟการกระจายสถานะ
  const statusDistribution = useMemo(() => {
    if (!Array.isArray(safeData) || safeData.length === 0) {
      console.log("⚠️ No data for status distribution")
      return []
    }

    // ใช้ข้อมูลจาก stats ถ้ามี หรือคำนวณจากข้อมูลดิบ
    let totalYawns = 0
    let totalDrowsiness = 0
    let totalAlerts = 0

    if (stats) {
      totalYawns = stats.totalYawns || 0
      totalDrowsiness = stats.totalDrowsiness || 0
      totalAlerts = stats.totalAlerts || 0
    } else {
      // คำนวณจากข้อมูลดิบ
      const dailyGroups: { [date: string]: HistoricalData[] } = {}
      safeData.forEach((item) => {
        const date = new Date(item.timestamp).toDateString()
        if (!dailyGroups[date]) dailyGroups[date] = []
        dailyGroups[date].push(item)
      })

      Object.values(dailyGroups).forEach((dayData) => {
        const sortedDayData = [...dayData].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        const latestOfDay = sortedDayData[0]

        totalYawns += latestOfDay.yawn_events || 0
        totalDrowsiness += latestOfDay.drowsiness_events || 0
        totalAlerts += latestOfDay.critical_alerts || 0
      })
    }

    const totalNormal = Math.max(0, safeData.length - (totalYawns + totalDrowsiness + totalAlerts))

    const distribution = {
      ปกติ: totalNormal,
      หาว: totalYawns,
      ง่วงนอน: totalDrowsiness,
      อันตราย: totalAlerts,
    }

    const colors = {
      ปกติ: "#22c55e",
      หาว: "#f97316",
      ง่วงนอน: "#f59e0b",
      อันตราย: "#ef4444",
    }

    return Object.entries(distribution).map(([status, count]) => ({
      name: status,
      value: count,
      color: colors[status as keyof typeof colors] || "#6B7280",
    }))
  }, [safeData, stats])

  // สร้างข้อมูลสำหรับกราฟกิจกรรมตามชั่วโมง
  const hourlyActivityData = useMemo(() => {
    if (!Array.isArray(safeData) || safeData.length === 0) return []

    // สร้างข้อมูลครบ 24 ชั่วโมง
    const allHours = Array.from({ length: 24 }, (_, i) => {
      const hourKey = `${i.toString().padStart(2, "0")}:00`
      return {
        hour: hourKey,
        หาว: 0,
        ง่วงนอน: 0,
        อันตราย: 0,
      }
    })

    // จัดกลุ่มข้อมูลตามชั่วโมง
    const hourlyGroups: { [hour: number]: HistoricalData[] } = {}

    safeData.forEach((item) => {
      const hour = new Date(item.timestamp).getHours()
      if (!hourlyGroups[hour]) hourlyGroups[hour] = []
      hourlyGroups[hour].push(item)
    })

    // ใช้ข้อมูลสะสมล่าสุดในแต่ละชั่วโมง
    Object.entries(hourlyGroups).forEach(([hourStr, records]) => {
      const hour = Number.parseInt(hourStr)
      if (hour >= 0 && hour < 24 && records.length > 0) {
        const sortedRecords = [...records].sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
        const latestRecord = sortedRecords[0]

        allHours[hour].หาว = latestRecord.yawn_events || 0
        allHours[hour].ง่วงนอน = latestRecord.drowsiness_events || 0
        allHours[hour].อันตราย = latestRecord.critical_alerts || 0
      }
    })

    return allHours
  }, [safeData])

  // คำนวณสถิติความปลอดภัย
  const safetyStats = useMemo(() => {
    if (stats) {
      // ใช้ข้อมูลจาก stats ที่ส่งมา
      const earScore = Math.min(100, (stats.averageEAR || 0) * 300)
      const yawnPenalty = Math.min(30, (stats.totalYawns || 0) * 2)
      const drowsinessPenalty = Math.min(40, (stats.totalDrowsiness || 0) * 5)
      const criticalPenalty = Math.min(50, (stats.totalAlerts || 0) * 25)

      const finalScore = Math.max(0, Math.min(100, earScore - yawnPenalty - drowsinessPenalty - criticalPenalty))

      let status = "ดีเยี่ยม"
      if (finalScore < 20) status = "ต้องปรับปรุง"
      else if (finalScore < 40) status = "แย่"
      else if (finalScore < 60) status = "พอใช้"
      else if (finalScore < 80) status = "ดี"

      return {
        totalYawns: stats.totalYawns || 0,
        totalDrowsiness: stats.totalDrowsiness || 0,
        totalCritical: stats.totalAlerts || 0,
        avgEar: (stats.averageEAR || 0).toFixed(3),
        score: Math.round(finalScore),
        status,
      }
    }

    // ถ้าไม่มี stats ให้คำนวณจากข้อมูลดิบ
    if (!Array.isArray(safeData) || safeData.length === 0) {
      return {
        totalYawns: 0,
        totalDrowsiness: 0,
        totalCritical: 0,
        avgEar: "0.000",
        score: 0,
        status: "ไม่มีข้อมูล",
      }
    }

    // คำนวณจากข้อมูลดิบ
    const dailyGroups: { [date: string]: HistoricalData[] } = {}
    safeData.forEach((item) => {
      const date = new Date(item.timestamp).toDateString()
      if (!dailyGroups[date]) dailyGroups[date] = []
      dailyGroups[date].push(item)
    })

    let totalYawns = 0
    let totalDrowsiness = 0
    let totalAlerts = 0

    Object.values(dailyGroups).forEach((dayData) => {
      const sortedDayData = [...dayData].sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )
      const latestOfDay = sortedDayData[0]

      totalYawns += latestOfDay.yawn_events || 0
      totalDrowsiness += latestOfDay.drowsiness_events || 0
      totalAlerts += latestOfDay.critical_alerts || 0
    })

    const validEarData = safeData.filter((item) => (item.ear || 0) > 0)
    const avgEar =
      validEarData.length > 0 ? validEarData.reduce((sum, item) => sum + (item.ear || 0), 0) / validEarData.length : 0

    const earScore = Math.min(100, avgEar * 300)
    const yawnPenalty = Math.min(30, totalYawns * 2)
    const drowsinessPenalty = Math.min(40, totalDrowsiness * 5)
    const criticalPenalty = Math.min(50, totalAlerts * 25)

    const finalScore = Math.max(0, Math.min(100, earScore - yawnPenalty - drowsinessPenalty - criticalPenalty))

    let status = "ดีเยี่ยม"
    if (finalScore < 20) status = "ต้องปรับปรุง"
    else if (finalScore < 40) status = "แย่"
    else if (finalScore < 60) status = "พอใช้"
    else if (finalScore < 80) status = "ดี"

    return {
      totalYawns,
      totalDrowsiness,
      totalCritical: totalAlerts,
      avgEar: avgEar.toFixed(3),
      score: Math.round(finalScore),
      status,
    }
  }, [safeData, stats])

  // ถ้าไม่มีข้อมูลให้แสดงข้อความแจ้งเตือน
  if (!Array.isArray(safeData) || safeData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground text-sm sm:text-base">ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">กรุณาเลือกช่วงเวลาอื่น หรือตรวจสอบการเชื่อมต่ออุปกรณ์</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* แสดงสถิติสรุปด้านบน */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-yellow-50 p-3 sm:p-4 rounded-lg border border-yellow-200">
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{safetyStats.totalYawns}</div>
          <div className="text-xs sm:text-sm text-yellow-700">ครั้งที่หาว</div>
        </div>
        <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200">
          <div className="text-xl sm:text-2xl font-bold text-orange-600">{safetyStats.totalDrowsiness}</div>
          <div className="text-xs sm:text-sm text-orange-700">ครั้งที่ง่วง</div>
        </div>
        <div className="bg-red-50 p-3 sm:p-4 rounded-lg border border-red-200">
          <div className="text-xl sm:text-2xl font-bold text-red-600">{safetyStats.totalCritical}</div>
          <div className="text-xs sm:text-sm text-red-700">แจ้งเตือนด่วน</div>
        </div>
        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{stats?.totalSessions || 0}</div>
          <div className="text-xs sm:text-sm text-blue-700">เซสชัน</div>
        </div>
      </div>

      {/* กราฟหลัก 2 คอลัมน์ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Distribution Pie Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">สัดส่วนสถานะการขับขี่</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              แสดงสัดส่วนเวลาที่คุณอยู่ในสถานะต่างๆ (คำนวณจากค่าสะสม)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value} ครั้ง`, "จำนวน"]} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity Bar Chart */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">กิจกรรมตามช่วงเวลา (24 ชั่วโมง)</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              แสดงจำนวนเหตุการณ์ที่เกิดขึ้นในแต่ละชั่วโมงตลอดทั้งวัน (คำนวณจากค่าสะสม)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="หาว" fill="#f97316" />
                <Bar dataKey="ง่วงนอน" fill="#f59e0b" />
                <Bar dataKey="อันตราย" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* กราฟข้อมูลทางเทคนิค (แสดงเมื่อ showAllCharts = true) */}
      {showAllCharts && (
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">กราฟสถิติข้อมูลทางเทคนิค</CardTitle>
            <CardDescription className="text-xs sm:text-sm">แสดงข้อมูลทางเทคนิคจากระบบตรวจจับ</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={technicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(value: any) => [value?.toFixed(3), "ค่า EAR"]} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="ear"
                    name="ค่าตาเปิด-ปิด"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ fill: "#10B981", strokeWidth: 2, r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey={() => 0.25}
                    name="เกณฑ์ความง่วง"
                    stroke="#EF4444"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default ChartsSection
