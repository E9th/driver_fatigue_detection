"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getUsedDeviceIds } from "@/lib/firebase"

interface DeviceIdSelectorProps {
  selectedDeviceId: string
  onDeviceChange: (deviceId: string) => void
  users: any[]
}

export function DeviceIdSelector({ selectedDeviceId, onDeviceChange, users }: DeviceIdSelectorProps) {
  const [usedDeviceIds, setUsedDeviceIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUsedDevices = async () => {
      console.log("🔧 DeviceIdSelector: Loading used devices...")
      try {
        const usedIds = await getUsedDeviceIds()
        console.log("🔧 DeviceIdSelector: Used device IDs:", usedIds)
        setUsedDeviceIds(usedIds)
      } catch (error) {
        console.error("🔧 DeviceIdSelector: Error loading used devices:", error)
        setUsedDeviceIds([])
      } finally {
        setLoading(false)
      }
    }

    loadUsedDevices()
  }, [])

  if (loading) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium">เลือกอุปกรณ์</label>
        <div className="h-10 bg-gray-100 animate-pulse rounded-md"></div>
      </div>
    )
  }

  // Create device options from users or used devices
  const deviceOptions =
    users.length > 0
      ? users.map((user) => ({
          value: user.deviceId,
          label: `อุปกรณ์ ${user.deviceId} - ${user.fullName || user.name}`,
          disabled: false,
        }))
      : usedDeviceIds.map((deviceId) => ({
          value: deviceId,
          label: `อุปกรณ์ ${deviceId}`,
          disabled: false,
        }))

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">เลือกอุปกรณ์</label>
      <Select value={selectedDeviceId} onValueChange={onDeviceChange}>
        <SelectTrigger>
          <SelectValue placeholder="เลือกอุปกรณ์..." />
        </SelectTrigger>
        <SelectContent>
          {deviceOptions.map((option) => (
            <SelectItem key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
