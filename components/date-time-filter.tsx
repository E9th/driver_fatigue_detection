"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, RefreshCw } from "lucide-react"
import { getCurrentDayFullRange } from "@/lib/date-utils"

interface DateTimeFilterProps {
  onFilterChange?: (startDate: string, endDate: string) => void
  initialStartDate?: string
  initialEndDate?: string
}

export function DateTimeFilter({ onFilterChange, initialStartDate, initialEndDate }: DateTimeFilterProps) {
  // Set default to current day with full time range (12:00 AM to 11:59 PM)
  const defaultRange = getCurrentDayFullRange()

  const [startDate, setStartDate] = useState(() => {
    if (initialStartDate) {
      return new Date(initialStartDate).toISOString().split("T")[0]
    }
    return new Date(defaultRange.start).toISOString().split("T")[0]
  })

  const [endDate, setEndDate] = useState(() => {
    if (initialEndDate) {
      return new Date(initialEndDate).toISOString().split("T")[0]
    }
    return new Date(defaultRange.end).toISOString().split("T")[0]
  })

  const [startTime, setStartTime] = useState(() => {
    if (initialStartDate) {
      const date = new Date(initialStartDate)
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    }
    return "00:00" // Default to 12:00 AM
  })

  const [endTime, setEndTime] = useState(() => {
    if (initialEndDate) {
      const date = new Date(initialEndDate)
      return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`
    }
    return "23:59" // Default to 11:59 PM
  })

  // Auto-apply filter on component mount with default values
  useEffect(() => {
    if (!initialStartDate && !initialEndDate && typeof onFilterChange === "function") {
      console.log("📅 DateTimeFilter: Auto-applying default full day range")
      handleApplyFilter()
    }
  }, [])

  const handleApplyFilter = () => {
    // Check if onFilterChange is a function
    if (typeof onFilterChange !== "function") {
      console.warn("📅 DateTimeFilter: onFilterChange is not a function, skipping filter application")
      return
    }

    // Combine date and time
    const startDateTime = new Date(`${startDate}T${startTime}:00`).toISOString()
    const endDateTime = new Date(`${endDate}T${endTime}:59`).toISOString()

    console.log("📅 DateTimeFilter: Applying filter", {
      startDate,
      startTime,
      endDate,
      endTime,
      startDateTime,
      endDateTime,
      startLocal: new Date(startDateTime).toLocaleString("th-TH"),
      endLocal: new Date(endDateTime).toLocaleString("th-TH"),
    })

    onFilterChange(startDateTime, endDateTime)
  }

  const handleResetToToday = () => {
    const today = new Date()
    const todayStr = today.toISOString().split("T")[0]

    setStartDate(todayStr)
    setEndDate(todayStr)
    setStartTime("00:00") // 12:00 AM
    setEndTime("23:59") // 11:59 PM

    console.log("📅 DateTimeFilter: Reset to today with full day range")

    // Auto-apply after reset
    if (typeof onFilterChange === "function") {
      setTimeout(() => {
        const startDateTime = new Date(`${todayStr}T00:00:00`).toISOString()
        const endDateTime = new Date(`${todayStr}T23:59:59`).toISOString()
        onFilterChange(startDateTime, endDateTime)
      }, 100)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date and Time Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Start Date & Time */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่เริ่มต้น</Label>
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="pl-10" />
            </div>
          </div>
        </div>

        {/* End Date & Time */}
        <div className="space-y-3">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">วันที่สิ้นสุด</Label>
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="pl-10" />
            </div>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="pl-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleApplyFilter}
          className="flex-1 sm:flex-none sm:min-w-[140px]"
          disabled={typeof onFilterChange !== "function"}
        >
          <Calendar className="h-4 w-4 mr-2" />
          ใช้ตัวกรอง
        </Button>
        <Button
          onClick={handleResetToToday}
          variant="outline"
          className="flex-1 sm:flex-none sm:min-w-[140px] bg-transparent"
          disabled={typeof onFilterChange !== "function"}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          รีเซ็ตเป็นวันนี้
        </Button>
      </div>

      {/* Current Filter Display */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border">
        <div className="text-sm">
          <div className="font-medium text-gray-700 dark:text-gray-300 mb-2">ช่วงเวลาที่เลือก:</div>
          <div className="text-gray-600 dark:text-gray-400 font-mono text-xs">
            {new Date(`${startDate}T${startTime}`).toLocaleString("th-TH")}
            <span className="mx-2">ถึง</span>
            {new Date(`${endDate}T${endTime}`).toLocaleString("th-TH")}
          </div>
          {typeof onFilterChange !== "function" && (
            <div className="text-orange-600 dark:text-orange-400 text-xs mt-2 flex items-center gap-1">
              <span>⚠️</span>
              ตัวกรองไม่พร้อมใช้งาน (onFilterChange ไม่ได้กำหนด)
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
