"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { getNotificationHistory, type NotificationCommand } from "@/lib/device-notifications"
import { CheckCircle, XCircle, Clock, AlertCircle, MessageSquare, Volume2, Monitor } from "lucide-react"

interface NotificationStatusMonitorProps {
  deviceId: string
}

export function NotificationStatusMonitor({ deviceId }: NotificationStatusMonitorProps) {
  const [notifications, setNotifications] = useState<NotificationCommand[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = getNotificationHistory(deviceId, (history) => {
      setNotifications(history.slice(0, 10)) // แสดง 10 รายการล่าสุด
      setIsLoading(false)
    })

    return unsubscribe
  }, [deviceId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "processing":
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "default"
      case "failed":
        return "destructive"
      case "processing":
        return "secondary"
      default:
        return "outline"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "ส่งสำเร็จ"
      case "failed":
        return "ส่งไม่สำเร็จ"
      case "processing":
        return "กำลังส่ง"
      case "pending":
        return "รอส่ง"
      default:
        return "ไม่ทราบสถานะ"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case "warning":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <MessageSquare className="h-4 w-4 text-blue-500" />
    }
  }

  const getChannelIcons = (channels: string[]) => {
    return channels.map((channel, index) => {
      if (channel === "sound" || channel === "sound_with_tts") {
        return <Volume2 key={index} className="h-3 w-3" />
      } else if (channel === "display") {
        return <Monitor key={index} className="h-3 w-3" />
      }
      return null
    })
  }

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return "ไม่ทราบเวลา"

    try {
      const date = new Date(timestamp)
      return date.toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    } catch (error) {
      return "รูปแบบเวลาไม่ถูกต้อง"
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            สถานะการส่งข้อความ
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Clock className="h-6 w-6 animate-spin mr-2" />
            กำลังโหลด...
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          สถานะการส่งข้อความ
          <Badge variant="outline">{notifications.length} รายการ</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">ยังไม่มีการส่งข้อความ</div>
        ) : (
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(notification.type)}
                      <span className="font-medium">
                        {notification.type === "emergency"
                          ? "ฉุกเฉิน"
                          : notification.type === "warning"
                            ? "คำเตือน"
                            : "ข้อความทั่วไป"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(notification.status)}
                      <Badge variant={getStatusColor(notification.status)}>{getStatusText(notification.status)}</Badge>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="font-medium mb-1">ข้อความ:</p>
                    <p className="text-muted-foreground bg-muted p-2 rounded">{notification.message}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span>ช่องทาง:</span>
                      <div className="flex items-center gap-1">{getChannelIcons(notification.channels)}</div>
                      {notification.ttsEnabled && (
                        <Badge variant="outline" className="text-xs">
                          TTS
                        </Badge>
                      )}
                    </div>
                    <span>{formatTimestamp(notification.timestamp)}</span>
                  </div>

                  {notification.status === "failed" && (
                    <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                      ❌ เกิดข้อผิดพลาด: ไม่สามารถส่งข้อความไปยังอุปกรณ์ได้
                    </div>
                  )}

                  {notification.status === "completed" && (
                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                      ✅ ส่งข้อความสำเร็จ - ผู้ขับขี่ได้รับข้อความแล้ว
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
