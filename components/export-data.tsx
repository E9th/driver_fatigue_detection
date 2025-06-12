"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { auth, database } from "@/lib/firebase"
import { ref, get } from "firebase/database"
import { formatDate } from "@/lib/date-utils"

interface ExportDataProps {
  data: any
  filename?: string
  disabled?: boolean
  dateRange?: {
    startDate?: string
    endDate?: string
    startTime?: string
    endTime?: string
  }
  stats?: {
    safetyScore?: number
    yawnCount?: number
    drowsinessCount?: number
    alertCount?: number
  }
}

interface UserProfile {
  fullName: string
  email: string
  phone: string
  license: string
  deviceId: string
  role?: string
  companyName?: string
}

export function ExportData({ data, filename, disabled = false, dateRange, stats }: ExportDataProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [isExporting, setIsExporting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { toast } = useToast()

  // ดึงข้อมูล Profile ของผู้ใช้จาก Firebase
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const user = auth.currentUser
        if (user) {
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            const profileData = snapshot.val()
            const { password, ...safeProfileData } = profileData
            setUserProfile(safeProfileData)
          } else {
            const altUserRef = ref(database, `drivers/${user.uid}`)
            const altSnapshot = await get(altUserRef)

            if (altSnapshot.exists()) {
              const profileData = altSnapshot.val()
              const { password, ...safeProfileData } = profileData
              setUserProfile(safeProfileData)
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
  }, [])

  // รวมข้อมูลจากทั้งสองแหล่ง
  const getCombinedData = () => {
    // ใช้ stats ที่ส่งมาก่อน ถ้าไม่มีใช้จาก data
    const combinedStats = {
      safetyScore: stats?.safetyScore || data?.stats?.safetyScore || 0,
      yawnCount: stats?.yawnCount || data?.stats?.yawnCount || 0,
      drowsinessCount: stats?.drowsinessCount || data?.stats?.drowsinessCount || 0,
      alertCount: stats?.alertCount || data?.stats?.alertCount || 0,
    }

    // ใช้ dateRange ที่ส่งมาก่อน ถ้าไม่มีใช้จาก data
    const combinedDateRange = dateRange || data?.dateRange || {}

    return {
      stats: combinedStats,
      dateRange: combinedDateRange,
      deviceInfo: data?.deviceInfo || {},
    }
  }

  // สร้างข้อความสำหรับช่วงเวลา
  const getDateRangeText = (dateRangeData: any) => {
    if (!dateRangeData.startDate && !dateRangeData.endDate) {
      return "ไม่ระบุช่วงเวลา"
    }

    const startDate = dateRangeData.startDate ? new Date(dateRangeData.startDate) : null
    const endDate = dateRangeData.endDate ? new Date(dateRangeData.endDate) : null

    if (startDate && endDate) {
      if (startDate.toDateString() === endDate.toDateString()) {
        let dateText = `วันที่ ${startDate.toLocaleDateString("th-TH")}`
        if (dateRangeData.startTime && dateRangeData.endTime) {
          dateText += ` เวลา ${dateRangeData.startTime} - ${dateRangeData.endTime} น.`
        }
        return dateText
      } else {
        let dateText = `วันที่ ${startDate.toLocaleDateString("th-TH")} ถึง ${endDate.toLocaleDateString("th-TH")}`
        if (dateRangeData.startTime && dateRangeData.endTime) {
          dateText += ` เวลา ${dateRangeData.startTime} - ${dateRangeData.endTime} น.`
        }
        return dateText
      }
    }

    return "ไม่ระบุช่วงเวลา"
  }

  // ส่งออกข้อมูลเป็น CSV
  const exportToCSV = () => {
    if (!userProfile) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่พบข้อมูลผู้ใช้",
        variant: "destructive",
      })
      return
    }

    const combinedData = getCombinedData()
    const dateRangeText = getDateRangeText(combinedData.dateRange)

    const csvContent = [
      "รายงานสรุปการขับขี่",
      `ช่วงเวลา: ${dateRangeText}`,
      "",
      "ข้อมูลผู้ขับขี่",
      `ชื่อ-นามสกุล,${userProfile.fullName || ""}`,
      `อีเมล,${userProfile.email || ""}`,
      `เบอร์โทรศัพท์,${userProfile.phone || ""}`,
      `เลขที่ใบขับขี่,${userProfile.license || ""}`,
      `รหัสอุปกรณ์,${userProfile.deviceId || combinedData.deviceInfo.id || ""}`,
      `บริษัท,${userProfile.companyName || "ไม่ระบุ"}`,
      "",
      "สถิติการขับขี่",
      `คะแนนความปลอดภัย,${combinedData.stats.safetyScore}/100`,
      `จำนวนครั้งที่หาว,${combinedData.stats.yawnCount}`,
      `จำนวนครั้งที่ง่วง,${combinedData.stats.drowsinessCount}`,
      `จำนวนการแจ้งเตือน,${combinedData.stats.alertCount}`,
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename || `safety-report-${formatDate(new Date())}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ส่งออกข้อมูลเป็น PDF
  const exportToPDF = async () => {
    if (!userProfile) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่พบข้อมูลผู้ใช้",
        variant: "destructive",
      })
      return
    }

    const combinedData = getCombinedData()
    const dateRangeText = getDateRangeText(combinedData.dateRange)

    // คำนวณระดับความปลอดภัย
    let safetyLevel = "ดีเยี่ยม"
    const safetyScore = combinedData.stats.safetyScore
    if (safetyScore < 50) {
      safetyLevel = "ต่ำ"
    } else if (safetyScore < 70) {
      safetyLevel = "ปานกลาง"
    } else if (safetyScore < 90) {
      safetyLevel = "ดี"
    }

    // กำหนดสีตามระดับความปลอดภัย
    let safetyColor = "#22c55e"
    if (safetyScore < 50) {
      safetyColor = "#ef4444"
    } else if (safetyScore < 70) {
      safetyColor = "#f97316"
    } else if (safetyScore < 90) {
      safetyColor = "#eab308"
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <title>รายงานข้อมูลความปลอดภัยในการขับขี่</title>
 <style>
   body { font-family: 'Sarabun', sans-serif; margin: 20px; line-height: 1.6; }
   .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
   .section { margin-bottom: 30px; }
   .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
   .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
   .info-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
   .score { text-align: center; font-size: 2em; font-weight: bold; color: ${safetyColor}; }
   .stats-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; margin-top: 20px; }
   .stat-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
   .stat-value { font-size: 1.8em; font-weight: bold; margin: 10px 0; }
   .stat-label { font-size: 0.9em; color: #666; }
   .date-range { background: #f0f9ff; padding: 10px; border-left: 4px solid #0ea5e9; margin-top: 20px; }
   .safety-level { text-align: center; font-size: 1.2em; margin-top: 10px; color: ${safetyColor}; }
   .note { background: #f0f9ff; padding: 10px; border-left: 4px solid #0ea5e9; margin-top: 20px; }
 </style>
</head>
<body>
 <div class="header">
   <h1>รายงานข้อมูลความปลอดภัยในการขับขี่</h1>
   <p>สร้างเมื่อ: ${new Date().toLocaleString("th-TH")}</p>
 </div>
 
 <div class="section">
   <h2>ข้อมูลผู้ขับขี่</h2>
   <div class="info-grid">
     <div class="info-card">
       <strong>ชื่อ-นามสกุล:</strong> ${userProfile.fullName || ""}<br>
       <strong>อีเมล:</strong> ${userProfile.email || ""}<br>
       <strong>เบอร์โทรศัพท์:</strong> ${userProfile.phone || ""}
     </div>
     <div class="info-card">
       <strong>เลขที่ใบขับขี่:</strong> ${userProfile.license || ""}<br>
       <strong>รหัสอุปกรณ์:</strong> ${userProfile.deviceId || combinedData.deviceInfo.id || ""}<br>
       <strong>บริษัท:</strong> ${userProfile.companyName || "ไม่ระบุ"}
     </div>
   </div>
   
   <div class="date-range">
     <strong>ช่วงเวลาที่วิเคราะห์:</strong> ${dateRangeText}
   </div>
 </div>

 <div class="section">
   <h2>คะแนนความปลอดภัย</h2>
   <div class="score">${combinedData.stats.safetyScore}/100</div>
   <div class="safety-level">ระดับความปลอดภัย: ${safetyLevel}</div>
   
   <div class="stats-grid">
     <div class="stat-card">
       <div class="stat-label">จำนวนครั้งที่หาว</div>
       <div class="stat-value">${combinedData.stats.yawnCount}</div>
     </div>
     <div class="stat-card">
       <div class="stat-label">จำนวนครั้งที่ง่วง</div>
       <div class="stat-value">${combinedData.stats.drowsinessCount}</div>
     </div>
     <div class="stat-card">
       <div class="stat-label">จำนวนการแจ้งเตือน</div>
       <div class="stat-value">${combinedData.stats.alertCount}</div>
     </div>
   </div>
 </div>

 <div class="note">
   <strong>หมายเหตุ:</strong> คะแนนความปลอดภัยคำนวณจากจำนวนเหตุการณ์ที่ตรวจพบในช่วงเวลาที่เลือก โดยการหาวจะหัก 1 คะแนน, อาการง่วงจะหัก 2 คะแนน, และการแจ้งเตือนจะหัก 5 คะแนน
 </div>
</body>
</html>
`

    const printWindow = window.open("", "_blank")
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleExport = async () => {
    setIsExporting(true)

    try {
      switch (exportFormat) {
        case "csv":
          exportToCSV()
          toast({
            title: "ส่งออกสำเร็จ",
            description: "ไฟล์ CSV ถูกดาวน์โหลดแล้ว",
          })
          break
        case "pdf":
          await exportToPDF()
          toast({
            title: "ส่งออกสำเร็จ",
            description: "ไฟล์ PDF ถูกสร้างแล้ว",
          })
          break
        default:
          throw new Error("รูปแบบไฟล์ไม่ถูกต้อง")
      }
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งออกข้อมูลได้",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Select value={exportFormat} onValueChange={(value: "csv" | "pdf") => setExportFormat(value)}>
        <SelectTrigger className="w-[100px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
        </SelectContent>
      </Select>

      <Button onClick={handleExport} disabled={disabled || isExporting || !userProfile} size="sm">
        <Download className="h-4 w-4 mr-1" />
        {isExporting ? "กำลังส่งออก..." : "ส่งออกข้อมูล"}
      </Button>
    </div>
  )
}
