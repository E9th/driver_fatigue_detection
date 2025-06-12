"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Calendar, Clock, Wifi, WifiOff, User, Database } from "lucide-react"
import { type HistoricalData, subscribeToHistoricalData } from "@/lib/firebase"

interface UsageHistoryProps {
  deviceId: string
  startDate: string
  endDate: string
}

interface LoginSession {
  id: string
  startTime: string
  endTime?: string
  duration?: string
  status: "active" | "disconnected"
  dataPoints: number
}

export function UsageHistory({ deviceId, startDate, endDate }: UsageHistoryProps) {
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([])
  const [loading, setLoading] = useState(true)
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([])

  useEffect(() => {
    setLoading(true)
    const unsubscribe = subscribeToHistoricalData(deviceId, startDate, endDate, (data) => {
      setHistoricalData(data)
      processLoginSessions(data)
      setLoading(false)
    })

    return unsubscribe
  }, [deviceId, startDate, endDate])

  const processLoginSessions = (data: HistoricalData[]) => {
    if (!data.length) {
      setLoginSessions([])
      return
    }

    const sessions: LoginSession[] = []
    let currentSession: Partial<LoginSession> | null = null

    // เรียงข้อมูลตามเวลา
    const sortedData = [...data].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

    // นับจำนวน data points ที่มีข้อมูลจริง (face_detected_frames > 0)
    const validDataPoints = sortedData.filter(
      (item) => item.face_detected_frames && item.face_detected_frames > 0,
    ).length

    sortedData.forEach((item, index) => {
      const currentTime = new Date(item.timestamp)
      const nextItem = sortedData[index + 1]
      const nextTime = nextItem ? new Date(nextItem.timestamp) : null

      if (!currentSession) {
        // เริ่มเซสชันใหม่
        currentSession = {
          id: `session-${sessions.length + 1}`,
          startTime: item.timestamp,
          status: "active",
          dataPoints: 1,
        }
      } else {
        currentSession.dataPoints = (currentSession.dataPoints || 0) + 1
      }

      // ตรวจสอบว่าควรจบเซสชันหรือไม่ (ถ้าห่างกันมากกว่า 10 นาที)
      if (nextTime && nextTime.getTime() - currentTime.getTime() > 10 * 60 * 1000) {
        // จบเซสชันปัจจุบัน
        currentSession.endTime = item.timestamp
        currentSession.status = "disconnected"

        const start = new Date(currentSession.startTime!)
        const end = new Date(currentSession.endTime)
        const durationMs = end.getTime() - start.getTime()
        const hours = Math.floor(durationMs / (1000 * 60 * 60))
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
        currentSession.duration = hours > 0 ? `${hours} ชม. ${minutes} นาที` : `${minutes} นาที`

        sessions.push(currentSession as LoginSession)
        currentSession = null
      }
    })

    // จัดการเซสชันสุดท้าย
    if (currentSession) {
      const lastItem = sortedData[sortedData.length - 1]
      const now = new Date()
      const lastTime = new Date(lastItem.timestamp)

      if (now.getTime() - lastTime.getTime() < 10 * 60 * 1000) {
        // ยังคงเชื่อมต่ออยู่
        currentSession.status = "active"
        currentSession.duration = "กำลังใช้งาน"
      } else {
        // ตัดการเชื่อมต่อแล้ว
        currentSession.endTime = lastItem.timestamp
        currentSession.status = "disconnected"

        const start = new Date(currentSession.startTime!)
        const end = new Date(currentSession.endTime)
        const durationMs = end.getTime() - start.getTime()
        const hours = Math.floor(durationMs / (1000 * 60 * 60))
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
        currentSession.duration = hours > 0 ? `${hours} ชม. ${minutes} นาที` : `${minutes} นาที`
      }

      sessions.push(currentSession as LoginSession)
    }

    setLoginSessions(sessions.reverse()) // แสดงล่าสุดก่อน
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("th-TH", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    }
  }

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!loginSessions.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            ประวัติการเชื่อมต่อ
          </CardTitle>
          <CardDescription>ไม่มีข้อมูลการเชื่อมต่อในช่วงเวลาที่เลือก</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-muted-foreground">ไม่มีประวัติการเชื่อมต่อ</p>
            <p className="text-sm text-muted-foreground mt-2">กรุณาเลือกช่วงเวลาอื่น</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-purple-600" />
          ประวัติการเชื่อมต่อและการใช้งาน
        </CardTitle>
        <CardDescription>แสดงประวัติการเชื่อมต่อกับระบบ รวม {loginSessions.length} เซสชัน</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {loginSessions.map((session, index) => {
              const startDateTime = formatDateTime(session.startTime)
              const endDateTime = session.endTime ? formatDateTime(session.endTime) : null

              return (
                <div key={session.id}>
                  <div className="flex items-start space-x-4 p-4 rounded-lg border bg-card">
                    <div className="flex-shrink-0">
                      {session.status === "active" ? (
                        <div className="p-2 bg-green-100 rounded-full">
                          <Wifi className="h-4 w-4 text-green-600" />
                        </div>
                      ) : (
                        <div className="p-2 bg-gray-100 rounded-full">
                          <WifiOff className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          เซสชัน #{loginSessions.length - index}
                        </h4>
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status === "active" ? "กำลังใช้งาน" : "ตัดการเชื่อมต่อ"}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-3 w-3" />
                          <span>{startDateTime.date}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            เริ่ม: {startDateTime.time}
                            {endDateTime && ` - สิ้นสุด: ${endDateTime.time}`}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <User className="h-3 w-3" />
                          <span>ระยะเวลา: {session.duration}</span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Database className="h-3 w-3" />
                          <span>ข้อมูลที่บันทึก: {session.dataPoints.toLocaleString()} รายการ</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {index < loginSessions.length - 1 && <Separator className="my-4" />}
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

// เพิ่ม default export เพื่อความเข้ากันได้กับโค้ดเดิม
export default UsageHistory
