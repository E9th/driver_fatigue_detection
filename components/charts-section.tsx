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
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { DailyStats } from "@/lib/data-service"
import type { HistoricalData } from "@/lib/firebase"

interface ChartsSectionProps {
  data: HistoricalData[]
  stats?: DailyStats | null
  showAllCharts?: boolean
}

export function ChartsSection({ data, stats, showAllCharts = false }: ChartsSectionProps) {
  const [activeChart, setActiveChart] = useState("ear")
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const { toast } = useToast()

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

  // แก้ไขการคำนวณ statusDistribution - นับจาก status ของแต่ละ timestamp
  const statusDistribution = useMemo(() => {
    if (!Array.isArray(safeData) || safeData.length === 0) {
      console.log("⚠️ No data for status distribution")
      return []
    }

    // นับจำนวน timestamp ที่มี status แต่ละประเภท
    let normalCount = 0
    let yawnCount = 0
    let drowsinessCount = 0
    let criticalCount = 0

    safeData.forEach((item) => {
      const status = item.status || "NORMAL"

      if (status === "YAWN DETECTED") {
        yawnCount++
      } else if (status === "DROWSINESS DETECTED") {
        drowsinessCount++
      } else if (status.includes("CRITICAL") || status.includes("EXTENDED DROWSINESS")) {
        criticalCount++
      } else {
        normalCount++
      }
    })

    console.log("📊 Status counts from timestamps:", {
      normal: normalCount,
      yawn: yawnCount,
      drowsiness: drowsinessCount,
      critical: criticalCount,
      total: safeData.length,
    })

    const distribution = [
      {
        name: "ปกติ",
        value: normalCount,
        color: "#22c55e",
      },
      {
        name: "หาว",
        value: yawnCount,
        color: "#f97316",
      },
      {
        name: "ง่วงนอน",
        value: drowsinessCount,
        color: "#f59e0b",
      },
      {
        name: "อันตราย",
        value: criticalCount,
        color: "#ef4444",
      },
    ].filter((item) => item.value > 0) // แสดงเฉพาะที่มีค่ามากกว่า 0

    return distribution
  }, [safeData])

  // แก้ไขการคำนวณ hourlyActivityData - นับจาก timestamp ที่มีเหตุการณ์
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

    // นับจำนวน timestamp ที่มีเหตุการณ์ในแต่ละชั่วโมง
    safeData.forEach((item) => {
      const hour = new Date(item.timestamp).getHours()
      const status = item.status || "NORMAL"

      if (hour >= 0 && hour < 24) {
        if (status === "YAWN DETECTED") {
          allHours[hour].หาว++
        } else if (status === "DROWSINESS DETECTED") {
          allHours[hour].ง่วงนอน++
        } else if (status.includes("CRITICAL") || status.includes("EXTENDED DROWSINESS")) {
          allHours[hour].อันตราย++
        }
      }
    })

    console.log(
      "📊 Hourly activity from timestamps:",
      allHours.filter((h) => h.หาว > 0 || h.ง่วงนอน > 0 || h.อันตราย > 0),
    )

    return allHours
  }, [safeData])

  // คำนวณสถิติความปลอดภัย - นับจาก timestamp
  const safetyStats = useMemo(() => {
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

    // นับจำนวน timestamp ที่มีเหตุการณ์แต่ละประเภท
    let yawnCount = 0
    let drowsinessCount = 0
    let criticalCount = 0

    safeData.forEach((item) => {
      const status = item.status || "NORMAL"

      if (status === "YAWN DETECTED") {
        yawnCount++
      } else if (status === "DROWSINESS DETECTED") {
        drowsinessCount++
      } else if (status.includes("CRITICAL") || status.includes("EXTENDED DROWSINESS")) {
        criticalCount++
      }
    })

    // คำนวณค่าเฉลี่ย EAR
    const validEarData = safeData.filter((item) => (item.ear || 0) > 0)
    const avgEar =
      validEarData.length > 0 ? validEarData.reduce((sum, item) => sum + (item.ear || 0), 0) / validEarData.length : 0

    // คำนวณคะแนนความปลอดภัย
    const earScore = Math.min(100, avgEar * 300)
    const yawnPenalty = Math.min(30, yawnCount * 2)
    const drowsinessPenalty = Math.min(40, drowsinessCount * 5)
    const criticalPenalty = Math.min(50, criticalCount * 25)

    const finalScore = Math.max(0, Math.min(100, earScore - yawnPenalty - drowsinessPenalty - criticalPenalty))

    let status = "ดีเยี่ยม"
    if (finalScore < 20) status = "ต้องปรับปรุง"
    else if (finalScore < 40) status = "แย่"
    else if (finalScore < 60) status = "พอใช้"
    else if (finalScore < 80) status = "ดี"

    console.log("📊 Safety stats from timestamps:", {
      yawnCount,
      drowsinessCount,
      criticalCount,
      avgEar: avgEar.toFixed(3),
      finalScore: Math.round(finalScore),
    })

    return {
      totalYawns: yawnCount,
      totalDrowsiness: drowsinessCount,
      totalCritical: criticalCount,
      avgEar: avgEar.toFixed(3),
      score: Math.round(finalScore),
      status,
    }
  }, [safeData])

  // ฟังก์ชันส่งออกข้อมูล
  const exportData = () => {
    if (!safeData || safeData.length === 0) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีข้อมูลที่จะส่งออก",
        variant: "destructive",
      })
      return
    }

    const filename = `driver-data-${new Date().toISOString().split("T")[0]}`

    if (exportFormat === "csv") {
      // สร้าง CSV
      const headers = [
        "timestamp",
        "ear",
        "mouth_distance",
        "yawn_events",
        "drowsiness_events",
        "critical_alerts",
        "status",
      ]
      const csvContent = [
        headers.join(","),
        ...safeData.map((item) =>
          [
            item.timestamp,
            item.ear || 0,
            item.mouth_distance || 0,
            item.yawn_events || 0,
            item.drowsiness_events || 0,
            item.critical_alerts || 0,
            item.status || "NORMAL",
          ].join(","),
        ),
      ].join("\n")

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `${filename}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: "ไฟล์ CSV ถูกดาวน์โหลดแล้ว",
      })
    } else {
      // สร้าง PDF (ใช้การพิมพ์)
      const printWindow = window.open("", "_blank")
      if (printWindow) {
        const htmlContent = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <title>รายงานข้อมูลการขับขี่</title>
            <style>
              body { font-family: 'Sarabun', sans-serif; margin: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .section { margin-bottom: 30px; }
              .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
              .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
              .info-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>รายงานข้อมูลการขับขี่</h1>
              <p>สร้างเมื่อ: ${new Date().toLocaleString("th-TH")}</p>
              <p>วิธีการนับ: นับจากจำนวน timestamp ที่มีเหตุการณ์เกิดขึ้น</p>
            </div>
            
            <div class="section">
              <h2>สรุปข้อมูล</h2>
              <div class="info-grid">
                <div class="info-card">
                  <strong>จำนวน timestamp ที่หาว:</strong> ${safetyStats.totalYawns}<br>
                  <strong>จำนวน timestamp ที่ง่วง:</strong> ${safetyStats.totalDrowsiness}<br>
                  <strong>จำนวน timestamp อันตราย:</strong> ${safetyStats.totalCritical}
                </div>
                <div class="info-card">
                  <strong>ค่าเฉลี่ย EAR:</strong> ${safetyStats.avgEar}<br>
                  <strong>คะแนนความปลอดภัย:</strong> ${safetyStats.score}/100<br>
                  <strong>สถานะ:</strong> ${safetyStats.status}
                </div>
              </div>
            </div>

            <div class="section">
              <h2>ข้อมูลดิบ (${safeData.length} timestamp)</h2>
              <table>
                <thead>
                  <tr>
                    <th>เวลา</th>
                    <th>EAR</th>
                    <th>ระยะปาก</th>
                    <th>สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  ${safeData
                    .slice(0, 20)
                    .map(
                      (item) => `
                    <tr>
                      <td>${new Date(item.timestamp).toLocaleString("th-TH")}</td>
                      <td>${(item.ear || 0).toFixed(3)}</td>
                      <td>${(item.mouth_distance || 0).toFixed(2)}</td>
                      <td>${item.status || "NORMAL"}</td>
                    </tr>
                  `,
                    )
                    .join("")}
                  ${safeData.length > 20 ? `<tr><td colspan="4" style="text-align: center;">... และอีก ${safeData.length - 20} timestamp</td></tr>` : ""}
                </tbody>
              </table>
            </div>
          </body>
          </html>
        `
        printWindow.document.write(htmlContent)
        printWindow.document.close()
        setTimeout(() => {
          printWindow.print()
        }, 500)
      }

      toast({
        title: "ส่งออกรายงานสำเร็จ",
        description: "รายงาน PDF ถูกสร้างแล้ว",
      })
    }
  }

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
          <div className="text-xl sm:text-2xl font-bold text-blue-600">{safeData.length}</div>
          <div className="text-xs sm:text-sm text-blue-700">เซสชัน</div>
        </div>
      </div>

      {/* ปุ่มส่งออกข้อมูล */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-2">
          <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "csv" | "pdf")}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="รูปแบบ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="pdf">PDF</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            ส่งออกข้อมูล
          </Button>
        </div>
      </div>

      {/* กราฟหลัก 2 คอลัมน์ */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6">
        {/* Status Distribution Pie Chart - นับจาก timestamp */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">สัดส่วนสถานะการขับขี่</CardTitle>
            <CardDescription className="text-xs sm:text-sm">แสดงสัดส่วนเหตุการณ์ที่เกิดขึ้น</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={false} // ปิด label ใน pie เพื่อไม่ให้ซ้อนกัน
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any) => {
                    const total = statusDistribution.reduce((sum, item) => sum + item.value, 0)
                    const percentage = total > 0 ? Math.round((value / total) * 100) : 0
                    return [`${value} ครั้ง (${percentage}%)`, name]
                  }}
                />
                <Legend
                  formatter={(value, entry) => {
                    const { payload } = entry as any
                    const total = statusDistribution.reduce((sum, item) => sum + item.value, 0)
                    const percentage = total > 0 ? Math.round((payload.value / total) * 100) : 0
                    return `${value} ${percentage}%`
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Hourly Activity Bar Chart - นับจาก timestamp */}
        <Card>
          <CardHeader className="pb-3 sm:pb-4">
            <CardTitle className="text-base sm:text-lg">กิจกรรมตามช่วงเวลา (24 ชั่วโมง)</CardTitle>
            <CardDescription className="text-xs sm:text-sm">แสดงจำนวนเหตุการณ์ในแต่ละชั่วโมง</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={hourlyActivityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} interval={1} angle={-45} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value: any, name: any) => [value > 0 ? `${value} ครั้ง` : "ไม่มีข้อมูล", name]}
                  labelFormatter={(label) => `เวลา ${label}`}
                />
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
