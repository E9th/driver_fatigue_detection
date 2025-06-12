"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, RefreshCw } from "lucide-react"
import { getCurrentDayFullRange } from "@/lib/date-utils"

interface DateTimeFilterProps {
  onFilterChange: (startDate: string, endDate: string) => void
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
    if (!initialStartDate && !initialEndDate) {
      console.log("📅 DateTimeFilter: Auto-applying default full day range")
      handleApplyFilter()
    }
  }, [])

  const handleApplyFilter = () => {
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
    setTimeout(() => {
      const startDateTime = new Date(`${todayStr}T00:00:00`).toISOString()
      const endDateTime = new Date(`${todayStr}T23:59:59`).toISOString()
      onFilterChange(startDateTime, endDateTime)
    }, 100)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center">
          <Calendar className="h-5 w-5 mr-2" />
          ตัวกรองข้อมูล
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Start Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="start-date">วันที่เริ่มต้น</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1" />
            </div>
          </div>

          {/* End Date & Time */}
          <div className="space-y-2">
            <Label htmlFor="end-date">วันที่สิ้นสุด</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full"
            />
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={handleApplyFilter} className="flex-1">
            <Calendar className="h-4 w-4 mr-2" />
            ใช้ตัวกรอง
          </Button>
          <Button onClick={handleResetToToday} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            รีเซ็ตเป็นวันนี้
          </Button>
        </div>

        {/* Current Filter Display */}
        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
          <div className="font-medium mb-1">ช่วงเวลาที่เลือก:</div>
          <div>
            {new Date(`${startDate}T${startTime}`).toLocaleString("th-TH")} -{" "}
            {new Date(`${endDate}T${endTime}`).toLocaleString("th-TH")}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
