"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

interface DeviceIdSelectorProps {
  value: string
  onValueChange: (value: string) => void
  error?: string
  disabled?: boolean
  usedDevices?: string[]
}

export function DeviceIdSelector({
  value,
  onValueChange,
  error,
  disabled = false,
  usedDevices = [],
}: DeviceIdSelectorProps) {
  // สร้างรายการ device ทั้งหมด (device_01 ถึง device_20)
  const allDevices = Array.from({ length: 20 }, (_, i) => {
    const deviceNumber = String(i + 1).padStart(2, "0")
    return `device_${deviceNumber}`
  })

  // กรองอุปกรณ์ที่ถูกใช้งานแล้วออก
  const availableDevices = allDevices.filter((device) => !usedDevices.includes(device))

  return (
    <div className="space-y-2">
      <Label htmlFor="deviceId">Device ID *</Label>
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder="เลือกอุปกรณ์" />
        </SelectTrigger>
        <SelectContent>
          {availableDevices.map((deviceId) => (
            <SelectItem key={deviceId} value={deviceId}>
              {deviceId.replace("device_", "Device ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  )
}
