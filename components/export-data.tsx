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

export function ExportData({ data, stats, deviceId, dateRange, disabled = false }: ExportDataProps) {
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("pdf")
  const [isExporting, setIsExporting] = useState(false)
  const { userProfile } = useAuthState()
  const { toast } = useToast()

  /**
   * Translates internal event details into user-friendly Thai strings.
   * @param detail The internal event detail string (e.g., "yawn", "critical").
   * @returns A user-friendly Thai string.
   */
  const translateEventDetails = (detail: string): string => {
    switch (detail?.toLowerCase()) {
      case 'yawn':
        return 'การหาว';
      case 'drowsiness':
      case 'fatigue':
        return 'อาการง่วง/อ่อนเพลีย';
      case 'critical':
        return 'เหตุการณ์ฉุกเฉิน';
      case 'normal':
        return 'ขับขี่ปกติ';
      default:
        return detail || 'ไม่ระบุ';
    }
  };

  const exportToCSV = () => {
    if (!data || data.length === 0) {
      toast({ title: "ไม่มีข้อมูลให้ส่งออก", variant: "destructive" })
      return
    }

    const headers = ["ID", "Timestamp", "รายละเอียดเหตุการณ์", "ระดับความรุนแรง"]
    const csvRows = [headers.join(",")]

    data.forEach((row) => {
      const values = [
        `"${row.id}"`,
        `"${new Date(row.timestamp).toLocaleString("sv-SE")}"`,
        `"${translateEventDetails(row.details)}"`,
        row.severity || 1,
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
    const baseUrl = window.location.origin; // Get base URL for logo path

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
              .logo-container { margin-bottom: 15px; }
              .logo-container img { max-height: 60px; }
              .header h1 { margin: 0; color: #111827; font-size: 2em; }
              .header p { margin: 5px 0; color: #6b7280; }
              .section { margin-bottom: 30px; }
              .section-title { font-size: 1.4em; font-weight: 700; color: #111827; margin-bottom: 15px; display: flex; align-items: center; }
              .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; } /* Changed to 3 columns */
              .card { background-color: #f9fafb; padding: 20px; border-radius: 8px; text-align: center; border: 1px solid #e5e7eb; }
              .card .value { font-size: 2.2em; font-weight: 700; }
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
                  <div class="logo-container">
                    <img src="${baseUrl}/logo.png" alt="Logo">
                  </div>
                  <h1>รายงานความปลอดภัยการขับขี่</h1>
                  <p><strong>ผู้ขับขี่:</strong> ${userProfile.fullName}</p>
                  <p><strong>ช่วงเวลา:</strong> ${new Date(dateRange.start).toLocaleDateString("th-TH")} - ${new Date(dateRange.end).toLocaleDateString("th-TH")}</p>
              </div>

              <div class="section">
                  <div class="section-title">สรุปภาพรวม</div>
                  <div class="grid">
                      <div class="card score-card">
                          <div class="value">${score.toFixed(0)}</div>
                          <div class="label">คะแนนความปลอดภัย</div>
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
                  <div class="section-title">คำแนะนำเพื่อความปลอดภัย</div>
                  <ul>
                      ${report.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                  </ul>
              </div>

              <div class="section">
                  <div class="section-title">ประวัติเหตุการณ์</div>
                  <table>
                      <thead>
                          <tr>
                            <th>เวลา</th>
                            <th>รายละเอียดเหตุการณ์</th>
                            <th>ระดับความรุนแรง</th>
                          </tr>
                      </thead>
                      <tbody>
                          ${data && data.length > 0 ? data.slice(-10).reverse().map(event => `
                              <tr>
                                  <td>${new Date(event.timestamp).toLocaleString("th-TH")}</td>
                                  <td>${translateEventDetails(event.details)}</td>
                                  <td>${event.severity >= 3 ? 'สูง' : event.severity === 2 ? 'ปานกลาง' : 'ต่ำ'}</td>
                              </tr>
                          `).join('') : '<tr><td colspan="3" style="text-align:center; padding: 20px;">ไม่พบเหตุการณ์ในช่วงเวลานี้</td></tr>'}
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
