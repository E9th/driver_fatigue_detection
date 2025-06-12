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
}

// แก้ไขอินเตอร์เฟซ UserProfile ให้ตรงกับข้อมูลจริง
interface UserProfile {
  fullName: string // เปลี่ยนจาก firstName, lastName เป็น fullName
  email: string
  phone: string
  license: string // เปลี่ยนจาก licenseNumber เป็น license
  deviceId: string
  role?: string
  companyName?: string
}

export function ExportData({ data, filename, disabled = false }: ExportDataProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv")
  const [isExporting, setIsExporting] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const { toast } = useToast()

  // ดึงข้อมูล Profile ของผู้ใช้จาก Firebase
  // แก้ไขการดึงข้อมูลผู้ใช้ให้ถูกต้อง
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        // ดึงข้อมูลผู้ใช้ปัจจุบัน
        const user = auth.currentUser
        if (user) {
          console.log("Current user:", user.uid) // Debug log

          // ดึงข้อมูลจาก path ที่ถูกต้อง
          const userRef = ref(database, `users/${user.uid}`)
          const snapshot = await get(userRef)

          if (snapshot.exists()) {
            console.log("User data found:", snapshot.val()) // Debug log
            const profileData = snapshot.val()

            // ไม่รวมรหัสผ่านในการส่งออก
            const { password, ...safeProfileData } = profileData
            setUserProfile(safeProfileData)
          } else {
            console.log("No user data found") // Debug log

            // ลองดึงจาก path สำรอง (บางครั้งข้อมูลอาจอยู่ใน path อื่น)
            const altUserRef = ref(database, `drivers/${user.uid}`)
            const altSnapshot = await get(altUserRef)

            if (altSnapshot.exists()) {
              console.log("Driver data found:", altSnapshot.val()) // Debug log
              const profileData = altSnapshot.val()
              const { password, ...safeProfileData } = profileData
              setUserProfile(safeProfileData)
            } else {
              console.error("No user profile data found in any location")
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
      }
    }

    fetchUserProfile()
  }, [])

  // ส่งออกข้อมูลเป็น CSV (เฉพาะสถิติและข้อมูล Profile)
  const exportToCSV = () => {
    if (!data || !userProfile) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีข้อมูลที่จะส่งออก หรือไม่พบข้อมูลผู้ใช้",
        variant: "destructive",
      })
      return
    }

    // Format data for export
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      exportedBy: "Admin Dashboard",
    }

    const csvContent = [
      "รายงานสรุปการขับขี่",
      "",
      "ข้อมูลผู้ขับขี่",
      `ชื่อ-นามสกุล,${userProfile.fullName || ""}`,
      `อีเมล,${userProfile.email || ""}`,
      `เบอร์โทรศัพท์,${userProfile.phone || ""}`,
      `เลขที่ใบขับขี่,${userProfile.license || ""}`,
      `รหัสอุปกรณ์,${userProfile.deviceId || ""}`,
      `บริษัท,${userProfile.companyName || "ไม่ระบุ"}`,
      "",
      "ข้อมูลที่ส่งออก",
      JSON.stringify(exportData, null, 2),
    ].join("\n")

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", filename || `system-data-${formatDate(new Date())}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ส่งออกข้อมูลเป็น PDF
  const exportToPDF = async () => {
    if (!data || !userProfile) {
      toast({
        title: "ไม่มีข้อมูล",
        description: "ไม่มีข้อมูลที่จะส่งออก หรือไม่พบข้อมูลผู้ใช้",
        variant: "destructive",
      })
      return
    }

    // Format data for export
    const exportData = {
      ...data,
      exportDate: new Date().toISOString(),
      exportedBy: "Admin Dashboard",
    }

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
 <meta charset="UTF-8">
 <title>รายงานข้อมูล</title>
 <style>
   body { font-family: 'Sarabun', sans-serif; margin: 20px; line-height: 1.6; }
   .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
   .section { margin-bottom: 30px; }
   .section h2 { color: #333; border-bottom: 1px solid #ddd; padding-bottom: 10px; }
   .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
   .info-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: #f9f9f9; }
   .score { text-align: center; font-size: 2em; font-weight: bold; color: #22c55e; }
   .note { background: #f0f9ff; padding: 10px; border-left: 4px solid #0ea5e9; margin-top: 20px; }
 </style>
</head>
<body>
 <div class="header">
   <h1>รายงานข้อมูล</h1>
   <p>สร้างเมื่อ: ${new Date().toLocaleString("th-TH")}</p>
 </div>
 
 <div class="section">
   <h2>ข้อมูลผู้ใช้</h2>
   <div class="info-grid">
     <div class="info-card">
       <strong>ชื่อ-นามสกุล:</strong> ${userProfile.fullName || ""}<br>
       <strong>อีเมล:</strong> ${userProfile.email || ""}<br>
       <strong>เบอร์โทรศัพท์:</strong> ${userProfile.phone || ""}
     </div>
     <div class="info-card">
       <strong>เลขที่ใบขับขี่:</strong> ${userProfile.license || ""}<br>
       <strong>รหัสอุปกรณ์:</strong> ${userProfile.deviceId || ""}<br>
       <strong>บริษัท:</strong> ${userProfile.companyName || "ไม่ระบุ"}
     </div>
   </div>
 </div>

 <div class="section">
   <h2>ข้อมูลที่ส่งออก</h2>
   <pre>${JSON.stringify(exportData, null, 2)}</pre>
 </div>

 <div class="note">
   <strong>หมายเหตุ:</strong> ข้อมูลในรายงานนี้คำนวณจากค่าสะสมที่บันทึกในระบบ ซึ่งแสดงผลรวมของเหตุการณ์ทั้งหมดตั้งแต่เริ่มใช้งานอุปกรณ์
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
            title: "ส่งออกข้อมูลสำเร็จ",
            description: "ไฟล์ CSV ถูกดาวน์โหลดแล้ว",
          })
          break
        case "pdf":
          await exportToPDF()
          toast({
            title: "ส่งออกรายงานสำเร็จ",
            description: "รายงาน PDF ถูกสร้างแล้ว",
          })
          break
        default:
          toast({
            title: "รูปแบบไม่รองรับ",
            description: "กรุณาเลือกรูปแบบที่รองรับ",
            variant: "destructive",
          })
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
      <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "csv" | "pdf")}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="รูปแบบ" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">CSV</SelectItem>
          <SelectItem value="pdf">PDF</SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleExport} variant="outline" disabled={disabled || isExporting}>
        <Download className="mr-2 h-4 w-4" />
        {isExporting ? "กำลังส่งออก..." : "ส่งออกข้อมูล"}
      </Button>
    </div>
  )
}
