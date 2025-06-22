"use client"

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { UserProfile } from '@/lib/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Download, Loader2 } from 'lucide-react'

interface AdminMasterDashboardProps {
  users: UserProfile[]
}

// --- FIX: Add default value users = [] to prevent crash on initial render ---
export function AdminMasterDashboard({ users = [] }: AdminMasterDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [exportFormat, setExportFormat] = useState<"pdf" | "csv">("csv")
  const [isExporting, setIsExporting] = useState(false)
  const router = useRouter()

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users
    return users.filter(
      (user) =>
        user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.deviceId?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [users, searchTerm])

  const exportToCSV = () => {
    const headers = ["UID", "Full Name", "Email", "Device ID", "License Plate", "Role"]
    const csvRows = [headers.join(',')]
    filteredUsers.forEach(user => {
      const values = [
        `"${user.uid}"`,
        `"${user.fullName}"`,
        `"${user.email}"`,
        `"${user.deviceId || 'N/A'}"`,
        `"${user.license || 'N/A'}"`,
        `"${user.role}"`
      ]
      csvRows.push(values.join(','))
    })
    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    const timestamp = new Date().toISOString().split('T')[0]
    link.setAttribute('download', `all_users_export_${timestamp}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = () => {
    const reportDate = new Date().toLocaleDateString("th-TH", {
      year: 'numeric', month: 'long', day: 'numeric',
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="th">
      <head>
          <meta charset="UTF-8">
          <title>รายงานรายชื่อผู้ใช้งานทั้งหมด</title>
          <style>
              @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;700&display=swap');
              body { font-family: 'Sarabun', sans-serif; margin: 25px; color: #374151; }
              .container { max-width: 900px; margin: auto; }
              .header { text-align: center; margin-bottom: 25px; }
              .header h1 { margin: 0; color: #111827; font-size: 1.8em; }
              .header p { margin: 5px 0; color: #6b7280; }
              table { width: 100%; border-collapse: collapse; margin-top: 15px; }
              th, td { border: 1px solid #e5e7eb; padding: 10px; text-align: left; font-size: 0.9em; }
              th { background-color: #f3f4f6; font-weight: 600; }
              tr:nth-child(even) { background-color: #f9fafb; }
              .footer { text-align: center; margin-top: 20px; font-size: 0.8em; color: #9ca3af; }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>รายงานรายชื่อผู้ใช้งานทั้งหมด</h1>
                  <p>ข้อมูล ณ วันที่: ${reportDate}</p>
              </div>
              <table>
                  <thead>
                      <tr>
                          <th>ชื่อ-นามสกุล</th>
                          <th>อีเมล</th>
                          <th>Device ID</th>
                          <th>Role</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${filteredUsers.map(user => `
                          <tr>
                              <td>${user.fullName}</td>
                              <td>${user.email}</td>
                              <td>${user.deviceId || 'ยังไม่กำหนด'}</td>
                              <td>${user.role}</td>
                          </tr>
                      `).join('')}
                      ${filteredUsers.length === 0 ? '<tr><td colspan="4" style="text-align:center; padding: 20px;">ไม่พบข้อมูลผู้ใช้</td></tr>' : ''}
                  </tbody>
              </table>
              <div class="footer">
                  รายงานนี้สร้างโดยระบบ Driver Fatigue Detection
              </div>
          </div>
      </body>
      </html>
    `;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  }

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      alert("ไม่มีข้อมูลผู้ใช้ให้ส่งออก");
      return;
    }
    
    setIsExporting(true);
    try {
      if (exportFormat === 'pdf') {
        exportToPDF();
      } else {
        exportToCSV();
      }
    } catch (error) {
      console.error("Export Error:", error);
      alert("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Admin Master Dashboard
          </h2>
          <p className="text-muted-foreground">
            ภาพรวมผู้ใช้งานทั้งหมดในระบบ
          </p>
        </div>
        
        <div className="flex items-center gap-2">
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as "pdf" | "csv")}>
                <SelectTrigger className="w-[120px]">
                    <SelectValue placeholder="รูปแบบ"/>
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
            </Select>
            <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {isExporting ? "กำลังสร้าง..." : "Export"}
            </Button>
        </div>
      </div>
      
      <div className="p-4 border bg-card text-card-foreground rounded-lg">
        <Input
          placeholder="ค้นหาด้วยชื่อ, อีเมล, หรือ Device ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Device ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.uid}>
                  <TableCell className="font-medium">{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.deviceId ? (
                      <Badge variant="secondary">{user.deviceId}</Badge>
                    ) : (
                      <Badge variant="outline">ยังไม่ได้กำหนด</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/dashboard/${user.uid}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  ไม่พบข้อมูลผู้ใช้
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
