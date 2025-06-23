"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUsedDeviceIds } from "@/lib/data-service"
import { Label } from "@/components/ui/label"

interface DeviceIdSelectorProps {
  value?: string
  onValueChange?: (value: string) => void
  error?: string
  disabled?: boolean
}

export function DeviceIdSelector({ value = "", onValueChange, error, disabled = false }: DeviceIdSelectorProps) {
  const [availableDevices, setAvailableDevices] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    const loadAvailableDevices = async () => {
      console.log("🔧 DeviceIdSelector: Loading available devices...")
      setIsLoading(true)
      setLoadError(null)

      try {
        // Get used device IDs
        const usedDeviceIds = await getUsedDeviceIds()
        console.log("🔧 DeviceIdSelector: Used device IDs:", usedDeviceIds)

        // Generate all possible device IDs (01-20)
        const allDeviceIds = Array.from({ length: 20 }, (_, i) => {
          const deviceNumber = (i + 1).toString().padStart(2, "0")
          return deviceNumber
        })

        // Filter out used devices
        const available = allDeviceIds.filter((id) => !usedDeviceIds.includes(id))
        console.log("🔧 DeviceIdSelector: Available devices:", available)

        setAvailableDevices(available)
      } catch (error) {
        console.error("🔧 DeviceIdSelector: Error loading devices:", error)
        setLoadError("ไม่สามารถโหลดรายการอุปกรณ์ได้")

        // Fallback: provide some default devices
        const fallbackDevices = ["04", "05", "06", "07", "08", "09", "10"]
        setAvailableDevices(fallbackDevices)
      } finally {
        setIsLoading(false)
      }
    }

    loadAvailableDevices()
  }, [])

  const handleValueChange = (selectedValue: string) => {
    console.log("🔧 DeviceIdSelector: Device selected:", selectedValue)
    if (onValueChange) {
      onValueChange(selectedValue)
    }
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="deviceId">Device ID *</Label>
      <Select value={value} onValueChange={handleValueChange} disabled={disabled || isLoading}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue
            placeholder={
              isLoading
                ? "กำลังโหลด..."
                : loadError
                  ? "เกิดข้อผิดพลาด"
                  : availableDevices.length === 0
                    ? "ไม่มีอุปกรณ์ที่ใช้งานได้"
                    : "เลือก Device ID"
            }
          />
        </SelectTrigger>
        <SelectContent>
          {availableDevices.length > 0 ? (
            availableDevices.map((deviceId) => (
              <SelectItem key={deviceId} value={deviceId}>
                Device {deviceId}
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>
              {isLoading ? "กำลังโหลด..." : "ไม่มีอุปกรณ์ที่ใช้งานได้"}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {loadError && <p className="text-sm text-yellow-600">{loadError}</p>}
      {!isLoading && availableDevices.length === 0 && !loadError && (
        <p className="text-sm text-gray-500">ไม่มีอุปกรณ์ที่ใช้งานได้ในขณะนี้</p>
      )}
    </div>
  )
}
