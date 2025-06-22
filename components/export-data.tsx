"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download, Loader2, ShieldCheck, BarChart, AlertTriangle, Eye } from "lucide-react"
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
      "ID", "Timestamp", "Details", "Severity", "EAR",
    ]
    const csvRows = [headers.join(",")]
    data.forEach((row) => {
      const values = [
        `"${row.id}"`,
        `"${new Date(row.timestamp).toLocaleString("sv-SE")}"`,
        `"${row.details}"`,
        row.severity || 1,
        row.ear?.toFixed(4) || "N/A",
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

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>รายงานความปลอดภัยการขับขี่</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; margin: 25px; color: #374151; background-color: #f9fafb; }
              .container { max-width: 800px; margin: auto; background: #fff; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e5e7eb; padding-bottom: 20px; }
              .header h1 { margin: 0; color: #111827; font-size: 2em; }
              .header p { margin: 5px 0; color: #6b7280; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 1.4em; font-weight: 700; color: #111827; margin-bottom: 15px; display: flex; align-items: center; }
              .section-title svg { margin-right: 10px; color: #3b82f6; }
              .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
              .card { background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
              .card .value { font-size: 2.2em; font-weight: 700; color: #1d4ed8; }
              .card .label { font-size: 0.9em; color: #6b7280; margin-top: 5px; }
              .score-card .value { color: ${score >= 80 ? '#16a34a' : score >= 60 ? '#f59e0b' : '#ef4444'};}
              .recommendations ul { list-style-type: none; padding-left: 0; }
              .recommendations li { background-color: #eff6ff; color: #1e40af; border-left: 4px solid #3b82f6; padding: 12px 15px; margin-bottom: 10px; border-radius: 4px;}
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #e5e7eb; padding: 10px 12px; text-align: left; font-size: 0.95em; }
              th { background-color: #f3f4f6; font-weight: 600; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .footer { text-align: center; margin-top: 30px; font-size: 0.8em; color: #9ca3af; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>รายงานความปลอดภัยการขับขี่</h1>
                  <p><strong>ผู้ขับขี่:</strong> ${userProfile.fullName}</p>
                  <p><strong>ช่วงเวลา:</strong> ${new Date(dateRange.start).toLocaleDateString("th-TH")} - ${new Date(dateRange.end).toLocaleDateString("th-TH")}</p>
              </div>

              <div class="section">
                  <div class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    สรุปภาพรวม
                  </div>
                  <div class="grid">
                      <div class="card score-card">
                          <div class="value">${score.toFixed(0)} / 100</div>
                          <div class="label">คะแนนความปลอดภัย</div>
                      </div>
                      <div class="card">
                          <div class="value">${stats.averageEAR?.toFixed(3) || 'N/A'}</div>
                          <div class="label">ค่าเฉลี่ย EAR (สูง=ดี)</div>
                      </div>
                       <div class="card">
                          <div class="value">${stats.yawnEvents || 0}</div>
                          <div class="label">จำนวนครั้งที่หาว</div>
                      </div>
                       <div class="card">
                          <div class="value">${(stats.fatigueEvents || 0) + (stats.criticalEvents || 0)}</div>
                          <div class="label">ความง่วง/เหตุการณ์วิกฤต</div>
                      </div>
                  </div>
              </div>

              <div class="section recommendations">
                  <div class="section-title">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    คำแนะนำเพื่อความปลอดภัย
                  </div>
                  <ul>
                      ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
              </div>

              <div class="section">
                  <div class="section-title">
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"></rect><line x1="16" x2="16" y1="2" y2="6"></line><line x1="8" x2="8" y1="2" y2="6"></line><line x1="3" x2="21" y1="10" y2="10"></line></svg>
                     ประวัติเหตุการณ์ล่าสุด
                  </div>
                  <table>
                      <thead>
                          <tr><th>เวลา</th><th>รายละเอียดเหตุการณ์</th><th>ระดับ</th><th>ค่า EAR</th></tr>
                      </thead>
                      <tbody>
                          ${data && data.length > 0 ? data.slice(-10).reverse().map(event => `
                              <tr>
                                  <td>${new Date(event.timestamp).toLocaleString("th-TH")}</td>
                                  <td>${event.details || 'N/A'}</td>
                                  <td>${event.severity >= 3 ? 'สูง' : event.severity === 2 ? 'กลาง' : 'ต่ำ'}</td>
                                  <td>${event.ear?.toFixed(4) || 'N/A'}</td>
                              </tr>
                          `).join('') : '<tr><td colspan="4" style="text-align:center; padding: 20px;">ไม่พบเหตุการณ์ในช่วงเวลานี้</td></tr>'}
                      </tbody>
                  </table>
              </div>

              <div class="footer">
                  รายงานนี้สร้างโดยระบบ Driver Fatigue Detection
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
