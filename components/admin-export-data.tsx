"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { SystemStats, SafetyData, UserProfile } from "@/lib/types"

interface AdminExportDataProps {
  type: "system" | "user"
  systemStats?: SystemStats
  userData?: {
    profile: UserProfile
    safetyData: SafetyData
    dateRange: { start: string; end: string }
  }
  dateRange?: { start: string; end: string }
  disabled?: boolean
}

export function AdminExportData({ type, systemStats, userData, dateRange, disabled = false }: AdminExportDataProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  // Export System Overview Report (PDF) - ธีมเหมือนตัวอย่าง
  const exportSystemReportPDF = () => {
    if (!systemStats) {
      toast({ title: "ไม่มีข้อมูลระบบให้ส่งออก", variant: "destructive" })
      return
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="th">
<head>
    <meta charset="UTF-8">
    <title>รายงานภาพรวมระบบ Driver Fatigue Detection</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@300;400;500;600;700&display=swap');
        
        body { 
            font-family: 'Sarabun', sans-serif; 
            line-height: 1.4; 
            color: #2d3748;
            background: white;
            margin: 0;
            padding: 20px;
            font-size: 14px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #e2e8f0;
        }

        .header h1 { 
            font-size: 1.8em; 
            font-weight: 600; 
            margin: 0 0 10px 0;
            color: #1a202c;
        }

        .header p {
            margin: 5px 0;
            color: #4a5568;
            font-size: 0.9em;
        }

        .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
        }

        .section-title {
            font-size: 1.1em;
            font-weight: 600;
            color: #2d3748;
            margin-bottom: 15px;
            padding-bottom: 5px;
            border-bottom: 1px solid #e2e8f0;
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }

        .stat-card {
            text-align: center;
            padding: 15px;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            background: #f8fafc;
        }

        .stat-value {
            font-size: 1.8em;
            font-weight: 700;
            color: #2d3748;
            margin-bottom: 5px;
        }

        .stat-label {
            font-size: 0.85em;
            color: #4a5568;
            font-weight: 500;
        }

        .risk-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }

        .risk-card {
            text-align: center;
            padding: 15px;
            border-radius: 4px;
            border: 1px solid #e2e8f0;
        }

        .risk-safe { background: #f0fff4; color: #22543d; }
        .risk-warning { background: #fffbf0; color: #744210; }
        .risk-danger { background: #fff5f5; color: #742a2a; }
        .risk-critical { background: #fdf2f8; color: #702459; }

        .risk-value {
            font-size: 1.5em;
            font-weight: 700;
            margin-bottom: 5px;
        }

        .risk-label {
            font-size: 0.85em;
            font-weight: 500;
        }

        .activity-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
            font-size: 0.85em;
        }

        .activity-table th {
            background: #f7fafc;
            color: #2d3748;
            padding: 10px 8px;
            text-align: center;
            font-weight: 600;
            border: 1px solid #e2e8f0;
        }

        .activity-table td {
            padding: 8px;
            text-align: center;
            border: 1px solid #e2e8f0;
        }

        .activity-table tr:nth-child(even) {
            background-color: #f8fafc;
        }

        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            color: #4a5568;
            font-size: 0.8em;
        }

        @media print {
            body { padding: 0; }
            .container { max-width: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>รายงานภาพรวมระบบ</h1>
            <p>Driver Fatigue Detection System</p>
            ${dateRange ? `<p>ข้อมูลในช่วงเวลา: ${new Date(dateRange.start).toLocaleDateString("th-TH")} - ${new Date(dateRange.end).toLocaleDateString("th-TH")}</p>` : ""}
            <p>วันที่สร้างรายงาน: ${new Date().toLocaleDateString("th-TH", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}</p>
        </div>

        <div class="section">
            <div class="section-title">สถิติระบบโดยรวม</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalDevices}</div>
                    <div class="stat-label">อุปกรณ์ทั้งหมด</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.activeDevices}</div>
                    <div class="stat-label">อุปกรณ์ที่ใช้งาน</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalUsers}</div>
                    <div class="stat-label">ผู้ใช้ทั้งหมด</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.adminUsers}</div>
                    <div class="stat-label">ผู้ดูแลระบบ</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">สถิติเหตุการณ์ความปลอดภัย</div>
            <div class="stats-grid">
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalYawns}</div>
                    <div class="stat-label">การหาวทั้งหมด</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalDrowsiness}</div>
                    <div class="stat-label">ความง่วงนอนทั้งหมด</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${systemStats.totalAlerts}</div>
                    <div class="stat-label">การแจ้งเตือนทั้งหมด</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">-</div>
                    <div class="stat-label">-</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">การกระจายระดับความเสี่ยง</div>
            <div class="risk-grid">
                <div class="risk-card risk-safe">
                    <div class="risk-value">${systemStats.riskDistribution.safe}</div>
                    <div class="risk-label">ปลอดภัย</div>
                </div>
                <div class="risk-card risk-warning">
                    <div class="risk-value">${systemStats.riskDistribution.warning}</div>
                    <div class="risk-label">เตือน</div>
                </div>
                <div class="risk-card risk-danger">
                    <div class="risk-value">${systemStats.riskDistribution.danger}</div>
                    <div class="risk-label">อันตราย</div>
                </div>
                <div class="risk-card risk-critical">
                    <div class="risk-value">${systemStats.riskDistribution.critical}</div>
                    <div class="risk-label">วิกฤต</div>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">กิจกรรมรายชั่วโมง (24 ชั่วโมงล่าสุด)</div>
            <table class="activity-table">
                <thead>
                    <tr>
                        <th>ชั่วโมง</th>
                        <th>การหาว</th>
                        <th>ความง่วงนอน</th>
                        <th>การแจ้งเตือน</th>
                        <th>อุปกรณ์ที่ใช้งาน</th>
                    </tr>
                </thead>
                <tbody>
                    ${systemStats.hourlyActivity
                      .map(
                        (activity) => `
                        <tr>
                            <td>${activity.hour.toString().padStart(2, "0")}:00</td>
                            <td>${activity.yawns}</td>
                            <td>${activity.drowsiness}</td>
                            <td>${activity.alerts}</td>
                            <td>${activity.activeDevices}</td>
                        </tr>
                    `,
                      )
                      .join("")}
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>รายงานนี้สร้างโดยระบบ Driver Fatigue Detection</p>
            <p>สำหรับการใช้งานภายในองค์กรเท่านั้น</p>
        </div>
    </div>
</body>
</html>
`

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  // Export System Data as CSV
  const exportSystemCSV = () => {
    if (!systemStats) {
      toast({ title: "ไม่มีข้อมูลระบบให้ส่งออก", variant: "destructive" })
      return
    }

    const headers = ["Metric", "Value", "Description"]

    const csvRows = [headers.join(",")]

    // System overview data
    const systemData = [
      ["Total Devices", systemStats.totalDevices, "อุปกรณ์ทั้งหมดในระบบ"],
      ["Active Devices", systemStats.activeDevices, "อุปกรณ์ที่ใช้งานอยู่"],
      ["Total Users", systemStats.totalUsers, "ผู้ใช้ทั้งหมด"],
      ["Admin Users", systemStats.adminUsers, "ผู้ดูแลระบบ"],
      ["Total Yawns", systemStats.totalYawns, "การหาวทั้งหมด"],
      ["Total Drowsiness", systemStats.totalDrowsiness, "ความง่วงนอนทั้งหมด"],
      ["Total Alerts", systemStats.totalAlerts, "การแจ้งเตือนทั้งหมด"],
      ["Risk Safe", systemStats.riskDistribution.safe, "ระดับปลอดภัย"],
      ["Risk Warning", systemStats.riskDistribution.warning, "ระดับเตือน"],
      ["Risk Danger", systemStats.riskDistribution.danger, "ระดับอันตราย"],
      ["Risk Critical", systemStats.riskDistribution.critical, "ระดับวิกฤต"],
    ]

    systemData.forEach(([metric, value, desc]) => {
      csvRows.push(`"${metric}","${value}","${desc}"`)
    })

    // Add hourly activity data
    csvRows.push("") // Empty row
    csvRows.push("Hour,Yawns,Drowsiness,Alerts,Active Devices")
    systemStats.hourlyActivity.forEach((activity) => {
      csvRows.push(
        `${activity.hour},${activity.yawns},${activity.drowsiness},${activity.alerts},${activity.activeDevices}`,
      )
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `system_report_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Export User Report (PDF)
  const exportUserReportPDF = () => {
    if (!userData) {
      toast({ title: "ไม่มีข้อมูลผู้ใช้ให้ส่งออก", variant: "destructive" })
      return
    }

    const { profile, safetyData, dateRange } = userData
    const { stats, events, safetyScore } = safetyData

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>รายงานผู้ขับขี่ - ${profile.fullName}</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 25px; border-bottom: 3px solid #1e3a8a; padding-bottom: 15px; }
              .header h1 { margin: 0; color: #1e3a8a; }
              .header p { margin: 5px 0; color: #666; }
              .section { margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
              .section-title { font-size: 1.2em; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #93c5fd; padding-bottom: 5px; margin-bottom: 15px; }
              .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; }
              .card { background-color: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; }
              .card .value { font-size: 2em; font-weight: 700; }
              .card .label { font-size: 0.9em; color: #6b7280; }
              .score-card { background: linear-gradient(135deg, #3b82f6, #1e40af); color: white; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9em; }
              th { background-color: #f3f4f6; }
              .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #999; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>รายงานผู้ขับขี่</h1>
              <p>ชื่อ: ${profile.fullName}</p>
              <p>Device ID: ${profile.deviceId}</p>
              <p>ช่วงเวลา: ${new Date(dateRange.start).toLocaleDateString("th-TH")} - ${new Date(dateRange.end).toLocaleDateString("th-TH")}</p>
              <p>วันที่สร้างรายงาน: ${new Date().toLocaleDateString("th-TH")}</p>
          </div>

          <div class="section">
              <div class="section-title">คะแนนความปลอดภัย</div>
              <div class="card score-card">
                  <div class="value">${safetyScore} / 100</div>
                  <div class="label">คะแนนรวม</div>
              </div>
          </div>

          <div class="section">
              <div class="section-title">สรุปเหตุการณ์</div>
              <div class="grid">
                  <div class="card">
                      <div class="value">${stats.yawnEvents}</div>
                      <div class="label">การหาว</div>
                  </div>
                  <div class="card">
                      <div class="value">${stats.fatigueEvents}</div>
                      <div class="label">ความง่วงนอน</div>
                  </div>
                  <div class="card">
                      <div class="value">${stats.criticalEvents}</div>
                      <div class="label">เหตุการณ์อันตราย</div>
                  </div>
                  <div class="card">
                      <div class="value">${(stats.averageEAR || 0).toFixed(3)}</div>
                      <div class="label">ค่าการเปิดตาเฉลี่ย</div>
                  </div>
              </div>
          </div>

          <div class="section">
              <div class="section-title">ประวัติเหตุการณ์ล่าสุด</div>
              <table>
                  <thead>
                      <tr><th>เวลา</th><th>เหตุการณ์</th><th>ระดับความรุนแรง</th></tr>
                  </thead>
                  <tbody>
                      ${
                        events && events.length > 0
                          ? events
                              .slice(-10)
                              .reverse()
                              .map(
                                (event) => `
                              <tr>
                                  <td>${new Date(event.timestamp || Date.now()).toLocaleString("th-TH")}</td>
                                  <td>${event.details || event.type || "ไม่ระบุ"}</td>
                                  <td>${(event.severity || 0) >= 3 ? "สูง" : (event.severity || 0) === 2 ? "ปานกลาง" : "ต่ำ"}</td>
                              </tr>
                          `,
                              )
                              .join("")
                          : '<tr><td colspan="3" style="text-align:center;">ไม่มีเหตุการณ์</td></tr>'
                      }
                  </tbody>
              </table>
          </div>

          <div class="footer">
              รายงานนี้สร้างโดยระบบ Driver Fatigue Detection<br>
              สำหรับการใช้งานของผู้ดูแลระบบเท่านั้น
          </div>
      </body>
      </html>
    `

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500)
    }
  }

  // Export User Data as CSV
  const exportUserCSV = () => {
    if (!userData) {
      toast({ title: "ไม่มีข้อมูลผู้ใช้ให้ส่งออก", variant: "destructive" })
      return
    }

    const { profile, safetyData } = userData
    const { events } = safetyData

    const headers = ["Timestamp", "Event Type", "Severity", "Details", "User Name", "Device ID"]

    const csvRows = [headers.join(",")]

    events.forEach((event) => {
      const values = [
        `"${new Date(event.timestamp || Date.now()).toLocaleString("sv-SE")}"`,
        `"${event.type || "unknown"}"`,
        event.severity || 0,
        `"${event.details || ""}"`,
        `"${profile.fullName}"`,
        `"${profile.deviceId}"`,
      ]
      csvRows.push(values.join(","))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `user_report_${profile.deviceId}_${new Date().toISOString().split("T")[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (type === "system") {
        if (exportFormat === "csv") {
          exportSystemCSV()
        } else {
          exportSystemReportPDF()
        }
      } else {
        if (exportFormat === "csv") {
          exportUserCSV()
        } else {
          exportUserReportPDF()
        }
      }

      toast({
        title: "ส่งออกข้อมูลสำเร็จ",
        description: `ได้สร้าง${exportFormat.toUpperCase()}แล้ว`,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({ title: "เกิดข้อผิดพลาดในการส่งออก", variant: "destructive" })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "pdf" | "csv")}>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="รูปแบบ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="pdf">รายงาน PDF</SelectItem>
          <SelectItem value="csv">ไฟล์ CSV</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleExport} variant="outline" disabled={disabled || isExporting}>
        {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
        {isExporting ? "กำลังสร้าง..." : "ส่งออกข้อมูล"}
      </Button>
    </div>
  )
}
