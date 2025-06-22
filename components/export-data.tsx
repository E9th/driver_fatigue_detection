"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuthState } from "@/lib/auth"
import type { HistoricalData, DailyStats } from "@/lib/types"
import { dataService } from "@/lib/data-service"

interface ExportDataProps {
  data: HistoricalData[]
  stats: DailyStats | null
  deviceId: string
  dateRange: { start: string; end: string }
  disabled?: boolean
}

// FIX: Changed component name to PascalCase as per React standards
export function ExportData({ data, stats, deviceId, dateRange, disabled = false }: ExportDataProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const { userProfile } = useAuthState()
  const { toast } = useToast()

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast({ title: "ไม่มีข้อมูลให้ส่งออก", variant: "destructive" })
      return
    }

    const headers = [
      "ID", "Timestamp", "Status", "EAR", "Mouth Distance",
      "Yawn Events (Cumulative)", "Drowsiness Events (Cumulative)", "Critical Alerts (Cumulative)",
    ]
    const csvRows = [headers.join(",")]
    data.forEach((row) => {
      const values = [
        `"${row.id}"`,
        `"${new Date(row.timestamp).toLocaleString("sv-SE")}"`,
        `"${row.status}"`,
        row.ear?.toFixed(4) || "0.0000",
        row.mouth_distance?.toFixed(2) || "0.00",
        row.yawn_events || 0,
        row.drowsiness_events || 0,
        row.critical_alerts || 0,
      ]
      csvRows.push(values.join(","))
    })

    const csvContent = csvRows.join("\n")
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `driver_report_${deviceId}_${dateRange.start.split('T')[0]}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    if (!stats || !userProfile) {
      toast({ title: "ข้อมูลไม่พร้อมสำหรับสร้างรายงาน", variant: "destructive" })
      return
    }

    const report = dataService.generateReport(data, stats)
    const score = dataService.calculateSafetyScore(stats)

    // ===== ส่วนที่แก้ไขอยู่ด้านล่างนี้ =====
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>รายงานความปลอดภัยการขับขี่</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; margin: 20px; color: #333; }
              .header { text-align: center; margin-bottom: 25px; }
              .header h1 { margin: 0; color: #1e3a8a; }
              .header p { margin: 5px 0; color: #666; }
              .section { margin-bottom: 25px; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
              .section-title { font-size: 1.2em; font-weight: 700; color: #1e3a8a; border-bottom: 2px solid #93c5fd; padding-bottom: 5px; margin-bottom: 15px; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
              .card { background-color: #f9fafb; padding: 15px; border-radius: 6px; text-align: center; }
              .card .value { font-size: 2em; font-weight: 700; }
              .card .label { font-size: 0.9em; color: #6b7280; }
              .recommendations ul { list-style-type: '✅ '; padding-left: 20px; }
              .recommendations li { margin-bottom: 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 0.9em; }
              th { background-color: #f3f4f6; }
              .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #999; }
          </style>
      </head>
      <body>
          <div class="header">
              <h1>รายงานความปลอดภัยการขับขี่</h1>
              <p>ผู้ขับขี่: ${userProfile.fullName}</p>
              <p>ช่วงเวลา: ${new Date(dateRange.start).toLocaleDateString("th-TH")} - ${new Date(dateRange.end).toLocaleDateString("th-TH")}</p>
          </div>

          <div class="section">
              <div class="section-title">สรุปภาพรวม</div>
              <div class="grid">
                  <div class="card" style="border-left: 5px solid #2563eb;">
                      <div class="value">${score} / 100</div>
                      <div class="label">คะแนนความปลอดภัย</div>
                  </div>
                  <div class="card" style="border-left: 5px solid #16a34a;">
                      <div class="value">${stats.averageEAR?.toFixed(3) || 'N/A'}</div> {/* <-- แก้ไขจุดที่ 1 */}
                      <div class="label">ค่าเฉลี่ย EAR (สูง=ดี)</div>
                  </div>
                   <div class="card" style="border-left: 5px solid #f59e0b;">
                      <div class="value">${stats.totalYawns}</div>
                      <div class="label">จำนวนครั้งที่หาว</div>
                  </div>
                   <div class="card" style="border-left: 5px solid #ef4444;">
                      <div class="value">${stats.totalDrowsiness + stats.totalAlerts}</div>
                      <div class="label">ความง่วง/แจ้งเตือนด่วน</div>
                  </div>
              </div>
          </div>

          <div class="section recommendations">
              <div class="section-title">คำแนะนำเพื่อความปลอดภัย</div>
              <ul>
                  ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
              </ul>
          </div>

          <div class="section">
              <div class="section-title">ประวัติเหตุการณ์ล่าสุด (5 รายการ)</div>
              <table>
                  <thead>
                      <tr><th>เวลา</th><th>เหตุการณ์</th><th>ค่า EAR</th></tr>
                  </thead>
                  <tbody>
                      ${data.slice(-5).reverse().map(event => `
                          <tr>
                              <td>${new Date(event.timestamp).toLocaleString("th-TH")}</td>
                              <td>${event.status}</td>
                              <td>${event.ear?.toFixed(4) || 'N/A'}</td> {/* <-- แก้ไขจุดที่ 2 */}
                          </tr>
                      `).join('')}
                      ${data.length === 0 ? '<tr><td colspan="3" style="text-align:center;">ไม่มีเหตุการณ์</td></tr>' : ''}
                  </tbody>
              </table>
          </div>

          <div class="footer">
              รายงานนี้สร้างโดยระบบ Driver Fatigue Detection
          </div>
      </body>
      </html>
    `
    // ===================================

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
      }, 500);
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (exportFormat === "csv") {
        exportToCSV()
      } else if (exportFormat === "pdf") {
        exportToPDF()
      }
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
        <SelectTrigger className="w-[120px]">
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
