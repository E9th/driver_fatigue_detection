"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Phone, Loader2, AlertTriangle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { sendCallCommand, listenToCallStatus, sendEmergencyCall } from "@/lib/device-commands"
import type { CallStatus } from "@/lib/device-commands"

interface CallDeviceButtonProps {
  deviceId: string
  adminId: string
  emergencyContacts?: string[]
  disabled?: boolean
}

export function CallDeviceButton({
  deviceId,
  adminId,
  emergencyContacts = [],
  disabled = false,
}: CallDeviceButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isCalling, setIsCalling] = useState(false)
  const [callStatus, setCallStatus] = useState<CallStatus | null>(null)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [message, setMessage] = useState("การแจ้งเตือนจากระบบตรวจจับความง่วงนอน กรุณาตรวจสอบสถานะผู้ขับขี่")
  const { toast } = useToast()

  const handleCall = async () => {
    if (!phoneNumber.trim()) {
      toast({
        title: "กรุณาใส่หมายเลขโทรศัพท์",
        variant: "destructive",
      })
      return
    }

    setIsCalling(true)
    setCallStatus(null)

    try {
      const commandId = await sendCallCommand(deviceId, adminId, phoneNumber, message)

      toast({
        title: "ส่งคำสั่งโทรแล้ว",
        description: "กำลังประมวลผลคำสั่งโทร...",
      })

      // ฟังสถานะการโทร
      const unsubscribe = listenToCallStatus(deviceId, commandId, (status) => {
        if (status) {
          setCallStatus(status)

          if (status.status === "completed") {
            toast({
              title: "โทรสำเร็จ",
              description: "ได้ทำการโทรออกเรียบร้อยแล้ว",
            })
            setIsCalling(false)
            unsubscribe()
          } else if (status.status === "failed") {
            toast({
              title: "โทรไม่สำเร็จ",
              description: status.error || "เกิดข้อผิดพลาดในการโทร",
              variant: "destructive",
            })
            setIsCalling(false)
            unsubscribe()
          }
        }
      })

      // Timeout หลัง 30 วินาที
      setTimeout(() => {
        if (isCalling) {
          setIsCalling(false)
          unsubscribe()
          toast({
            title: "หมดเวลา",
            description: "การโทรใช้เวลานานเกินไป",
            variant: "destructive",
          })
        }
      }, 30000)
    } catch (error) {
      console.error("Call error:", error)
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งคำสั่งโทรได้",
        variant: "destructive",
      })
      setIsCalling(false)
    }
  }

  const handleEmergencyCall = async () => {
    if (emergencyContacts.length === 0) {
      toast({
        title: "ไม่มีเบอร์ฉุกเฉิน",
        description: "กรุณาตั้งค่าเบอร์ฉุกเฉินก่อน",
        variant: "destructive",
      })
      return
    }

    setIsCalling(true)

    try {
      await sendEmergencyCall(deviceId, adminId, emergencyContacts)

      toast({
        title: "ส่งการแจ้งเตือนฉุกเฉิน",
        description: `ได้ส่งการแจ้งเตือนไปยัง ${emergencyContacts.length} หมายเลข`,
      })

      setIsOpen(false)
    } catch (error) {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถส่งการแจ้งเตือนฉุกเฉินได้",
        variant: "destructive",
      })
    } finally {
      setIsCalling(false)
    }
  }

  const getStatusIcon = () => {
    if (!callStatus) return null

    switch (callStatus.status) {
      case "calling":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusText = () => {
    if (!callStatus) return ""

    switch (callStatus.status) {
      case "received":
        return "อุปกรณ์ได้รับคำสั่งแล้ว"
      case "calling":
        return "กำลังโทรออก..."
      case "completed":
        return "โทรสำเร็จ"
      case "failed":
        return `โทรไม่สำเร็จ: ${callStatus.error || "ไม่ทราบสาเหตุ"}`
      default:
        return ""
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Phone className="mr-2 h-4 w-4" />
          โทรออก
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            โทรไปยังอุปกรณ์
          </DialogTitle>
          <DialogDescription>ส่งคำสั่งให้อุปกรณ์ทำการโทรออกหรือส่งการแจ้งเตือน</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">หมายเลขโทรศัพท์</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="0812345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isCalling}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="message">ข้อความ</Label>
            <Textarea
              id="message"
              placeholder="ข้อความที่ต้องการส่ง..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isCalling}
              rows={3}
            />
          </div>

          {callStatus && (
            <Alert>
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <AlertDescription>{getStatusText()}</AlertDescription>
              </div>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          {emergencyContacts.length > 0 && (
            <Button variant="destructive" onClick={handleEmergencyCall} disabled={isCalling}>
              {isCalling ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              ฉุกเฉิน
            </Button>
          )}

          <Button onClick={handleCall} disabled={isCalling || !phoneNumber.trim()}>
            {isCalling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Phone className="mr-2 h-4 w-4" />}
            โทรออก
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
