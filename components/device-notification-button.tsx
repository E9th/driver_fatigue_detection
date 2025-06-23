"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { sendNotificationCommand, sendEmergencyNotification } from "@/lib/device-notifications"
import { Bell, AlertTriangle, MessageSquare, Volume2, Monitor, Loader2, VolumeX } from "lucide-react"

interface DeviceNotificationButtonProps {
  deviceId: string
  adminId: string
  disabled?: boolean
}

export function DeviceNotificationButton({ deviceId, adminId, disabled = false }: DeviceNotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notificationType, setNotificationType] = useState<"alert" | "emergency" | "warning">("alert")
  const [message, setMessage] = useState("")
  const [channels, setChannels] = useState<("sound" | "display")[]>(["sound", "display"])
  const [enableTTS, setEnableTTS] = useState(true)
  const { toast } = useToast()

  const handleChannelChange = (channel: "sound" | "display", checked: boolean) => {
    if (checked) {
      setChannels([...channels, channel])
    } else {
      setChannels(channels.filter((c) => c !== channel))
    }
  }

  const handleSendNotification = async () => {
    if (!message.trim()) {
      toast({
        title: "กรุณาใส่ข้อความ",
        description: "ข้อความไม่สามารถเว้นว่างได้",
        variant: "destructive",
      })
      return
    }

    if (channels.length === 0) {
      toast({
        title: "กรุณาเลือกช่องทาง",
        description: "ต้องเลือกช่องทางการแจ้งเตือนอย่างน้อย 1 ช่องทาง",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      // ส่งข้อมูลเพิ่มเติมสำหรับ TTS
      const extendedChannels = channels.map((channel) => {
        if (channel === "sound") {
          return enableTTS ? "sound_with_tts" : "sound"
        }
        return channel
      }) as ("sound" | "sound_with_tts" | "display")[]

      const commandId = await sendNotificationCommand(deviceId, adminId, notificationType, message, extendedChannels)

      toast({
        title: "ส่งการแจ้งเตือนสำเร็จ",
        description: `ส่งข้อความไปยังอุปกรณ์ ${deviceId} แล้ว${enableTTS ? " (พร้อมเสียงอ่านข้อความ)" : ""}`,
      })

      // Reset form
      setMessage("")
      setChannels(["sound", "display"])
      setNotificationType("alert")
      setEnableTTS(true)
      setIsOpen(false)

      console.log(`📱 Notification sent to device ${deviceId}, command ID: ${commandId}`)
    } catch (error) {
      console.error("❌ Error sending notification:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งการแจ้งเตือนได้ กรุณาลองอีกครั้ง",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmergencyNotification = async () => {
    setIsLoading(true)
    try {
      const commandId = await sendEmergencyNotification(deviceId, adminId)

      toast({
        title: "ส่งการแจ้งเตือนฉุกเฉินสำเร็จ",
        description: `ส่งสัญญาณฉุกเฉินไปยังอุปกรณ์ ${deviceId} แล้ว (พร้อมเสียงอ่านข้อความ)`,
      })

      setIsOpen(false)
      console.log(`🚨 Emergency notification sent to device ${deviceId}, command ID: ${commandId}`)
    } catch (error) {
      console.error("❌ Error sending emergency notification:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งการแจ้งเตือนฉุกเฉินได้",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "emergency":
        return "destructive"
      case "warning":
        return "default"
      default:
        return "secondary"
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "emergency":
        return <AlertTriangle className="h-4 w-4" />
      case "warning":
        return <Bell className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <MessageSquare className="mr-2 h-4 w-4" />
          ส่งข้อความ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            ส่งการแจ้งเตือนไปยังอุปกรณ์
          </DialogTitle>
          <DialogDescription>
            ส่งข้อความแจ้งเตือนไปยังอุปกรณ์ {deviceId}
            <br />
            <span className="text-xs text-muted-foreground">🔊 ระบบจะเล่นเสียงแจ้งเตือนก่อน แล้วค่อยอ่านข้อความเป็นเสียง</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">ประเภทการแจ้งเตือน</Label>
            <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alert">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    ข้อความทั่วไป
                  </div>
                </SelectItem>
                <SelectItem value="warning">
                  <div className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    คำเตือน
                  </div>
                </SelectItem>
                <SelectItem value="emergency">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    ฉุกเฉิน
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">ข้อความ</Label>
            <Textarea
              id="message"
              placeholder="พิมพ์ข้อความที่ต้องการส่ง... (ระบบจะอ่านข้อความนี้เป็นเสียง)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-muted-foreground">💡 เขียนข้อความให้เข้าใจง่าย เพราะระบบจะอ่านเป็นเสียงให้ผู้ขับขี่ฟัง</p>
          </div>

          <div className="space-y-3">
            <Label>ช่องทางการแจ้งเตือน</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sound"
                  checked={channels.includes("sound")}
                  onCheckedChange={(checked) => handleChannelChange("sound", checked as boolean)}
                />
                <Label htmlFor="sound" className="flex items-center gap-2 cursor-pointer">
                  <Volume2 className="h-4 w-4" />
                  เสียงแจ้งเตือน + อ่านข้อความ
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="display"
                  checked={channels.includes("display")}
                  onCheckedChange={(checked) => handleChannelChange("display", checked as boolean)}
                />
                <Label htmlFor="display" className="flex items-center gap-2 cursor-pointer">
                  <Monitor className="h-4 w-4" />
                  แสดงบนหน้าจอ
                </Label>
              </div>
            </div>

            {channels.includes("sound") && (
              <div className="ml-6 space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enable-tts"
                    checked={enableTTS}
                    onCheckedChange={(checked) => setEnableTTS(checked as boolean)}
                  />
                  <Label htmlFor="enable-tts" className="flex items-center gap-2 cursor-pointer text-sm">
                    {enableTTS ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
                    อ่านข้อความเป็นเสียง (Text-to-Speech)
                  </Label>
                </div>
                <p className="text-xs text-muted-foreground ml-5">
                  {enableTTS ? "🔊 เล่นเสียงแจ้งเตือน → หยุด 2 วินาที → อ่านข้อความ" : "🔊 เล่นเฉพาะเสียงแจ้งเตือน (ไม่อ่านข้อความ)"}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getTypeColor(notificationType)}>
              {getTypeIcon(notificationType)}
              <span className="ml-1">
                {notificationType === "emergency" ? "ฉุกเฉิน" : notificationType === "warning" ? "คำเตือน" : "ข้อความทั่วไป"}
              </span>
            </Badge>
            <span className="text-sm text-muted-foreground">
              ช่องทาง: {channels.length} ช่องทาง
              {channels.includes("sound") && enableTTS && " (พร้อม TTS)"}
            </span>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="destructive" onClick={handleEmergencyNotification} disabled={isLoading} className="flex-1">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <AlertTriangle className="mr-2 h-4 w-4" />}
            ฉุกเฉิน
          </Button>
          <Button onClick={handleSendNotification} disabled={isLoading || !message.trim()} className="flex-1">
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            ส่งข้อความ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
