"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Eye, AlertTriangle, CheckCircle, Wifi, WifiOff, Settings } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ModeToggle } from "@/components/mode-toggle"

interface SafetyDashboardProps {
  deviceId: string
  historicalData?: any[]
  dailyStats?: any
}

export function ImprovedSafetyDashboard({ deviceId, historicalData = [], dailyStats }: SafetyDashboardProps) {
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("connected")
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toISOString())
  const [currentData, setCurrentData] = useState<any>(null)

  // Mock real-time data
  const mockRealTimeData = {
    status: "ปกติ",
    drowsinessLevel: "ระวัง",
    yawnCount: 0,
    fatigueCount: 0,
    earValue: 0.244,
    mouthDistance: 13.6,
    sessionsToday: 152,
    alertLevel: 0,
    timestamp: new Date().toISOString(),
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ปกติ":
      case "normal":
        return "bg-green-100 text-green-800 border-green-200"
      case "ระวัง":
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200"
      case "อันตราย":
      case "danger":
        return "bg-red-100 text-red-800 border-red-200"
      default:
        return "bg-gray-100 text-gray-800 border-gray-200"
    }
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      {/* ภาพรวมความปลอดภัย */}
      <div className="space-y-6">
        <div>
          {/* สถานะการเชื่อมต่อ */}
          <div className="mb-6 p-3 bg-blue-50 dark:bg-blue-50 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {connectionStatus === "connected" ? (
                  <Wifi className="h-4 w-4 text-blue-600" />
                ) : (
                  <WifiOff className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-sm font-medium">สถานะการเชื่อมต่อ</span>
              </div>
              <Badge variant="default" className="bg-blue-600 text-white">
                เชื่อมต่อแล้ว
              </Badge>
            </div>
          </div>

          {/* สถานะปัจจุบัน */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* สถานะปัจจุบัน */}
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-300">สถานะปัจจุบัน</span>
              </div>
              <div className="text-xl font-bold text-green-800 dark:text-green-200">ปกติ</div>
            </div>

            {/* ระดับความเหนื่อย */}
            <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">ระดับความเหนื่อย</span>
              </div>
              <div className="text-xl font-bold text-yellow-800 dark:text-yellow-200">ระวัง</div>
              <div className="text-xs text-yellow-600 dark:text-yellow-400">ตั้งแต่เริ่มสัมผัส</div>
              <Progress value={60} className="mt-2 h-2" />
            </div>

            {/* จำนวนครั้งที่หาว */}
            <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg border border-orange-200 dark:border-orange-800">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700 dark:text-orange-300">จำนวนครั้งที่หาว</span>
              </div>
              <div className="text-xl font-bold text-orange-800 dark:text-orange-200">0</div>
              <div className="text-xs text-orange-600 dark:text-orange-400">ครั้งในวันนี้และเข้ามักน้อยที่สุด</div>
            </div>

            {/* จำนวนครั้งที่ง่วง */}
            <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-700 dark:text-red-300">จำนวนครั้งที่ง่วง</span>
              </div>
              <div className="text-xl font-bold text-red-800 dark:text-red-200">0</div>
              <div className="text-xs text-red-600 dark:text-red-400">ครั้งในวันนี้และเข้ามักน้อยที่สุด</div>
            </div>
          </div>

          {/* ข้อมูลเทคนิค */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* ข้อมูลเทคนิค */}
            <div>
              <h3 className="text-lg font-semibold mb-3">ข้อมูลเทคนิค</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">เฟรมที่ตรวจจับในนาที:</span>
                  <span className="font-medium">152</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ค่าเปิด-ปิดตา:</span>
                  <span className="font-medium">0.244</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">ค่าการเปิดปาก:</span>
                  <span className="font-medium">13.6</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">การเจ้าเสียงเตือนซ่วง:</span>
                  <span className="font-medium text-red-600">0 ครั้ง</span>
                </div>
              </div>
            </div>

            {/* ข้อมูลอุปกรณ์ */}
            <div>
              <h3 className="text-lg font-semibold mb-3">ข้อมูลอุปกรณ์</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">รหัสอุปกรณ์:</span>
                  <span className="font-medium">device_01</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">เวอร์ชัน:</span>
                  <span className="font-medium">v2.0</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">สำเนา:</span>
                  <span className="font-medium text-muted-foreground">Unknown</span>
                </div>
              </div>
            </div>
          </div>

          {/* อัปเดตล่าสุด */}
          <div className="text-xs text-gray-500">
            อัปเดตล่าสุด:{" "}
            {currentData
              ? new Date(currentData.timestamp).toLocaleDateString("th-TH", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "2-digit",
                }) +
                " " +
                new Date(currentData.timestamp).toLocaleTimeString("th-TH")
              : "--/--/-- --:--:--"}
          </div>

          {/* ปุ่มตั้งค่า */}
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Settings className="h-4 w-4" />
                  <span className="sr-only">ตั้งค่า</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>การตั้งค่า</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>โหมดมืด</span>
                    <Button variant="outline" size="sm">
                      เปิด/ปิด
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>การแจ้งเตือน</span>
                    <Button variant="outline" size="sm">
                      เปิด/ปิด
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>ภาษา</span>
                    <Select defaultValue="th">
                      <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="เลือกภาษา" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="th">ไทย</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <ModeToggle />
          </div>
        </div>
      </div>
    </div>
  )
}
