"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Calendar, Clock, Database, Filter } from "lucide-react"

interface DateTimeFilterProps {
  onFilterChange: (startDate: string, endDate: string) => void
  initialStartDate?: string
  initialEndDate?: string
}

export function DateTimeFilter({ onFilterChange, initialStartDate, initialEndDate }: DateTimeFilterProps) {
  const [startDate, setStartDate] = useState(initialStartDate?.split("T")[0] || new Date().toISOString().split("T")[0])
  const [startTime, setStartTime] = useState(initialStartDate?.split("T")[1]?.slice(0, 5) || "00:00")
  const [endDate, setEndDate] = useState(initialEndDate?.split("T")[0] || new Date().toISOString().split("T")[0])
  const [endTime, setEndTime] = useState(initialEndDate?.split("T")[1]?.slice(0, 5) || "23:59")

  const handleApplyFilter = () => {
    const start = `${startDate}T${startTime}:00.000Z`
    const end = `${endDate}T${endTime}:59.999Z`
    onFilterChange(start, end)
  }

  const handleReset = () => {
    const today = new Date().toISOString().split("T")[0]
    setStartDate(today)
    setStartTime("00:00")
    setEndDate(today)
    setEndTime("23:59")

    const start = `${today}T00:00:00.000Z`
    const end = `${today}T23:59:59.999Z`
    onFilterChange(start, end)
  }

  const handleViewAll = () => {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const startDateAll = thirtyDaysAgo.toISOString().split("T")[0]
    const endDateAll = new Date().toISOString().split("T")[0]

    setStartDate(startDateAll)
    setStartTime("00:00")
    setEndDate(endDateAll)
    setEndTime("23:59")

    const start = `${startDateAll}T00:00:00.000Z`
    const end = `${endDateAll}T23:59:59.999Z`
    onFilterChange(start, end)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Start Date */}
        <div className="space-y-2">
          <Label htmlFor="start-date" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            วันเริ่มต้น
          </Label>
          <Input id="start-date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="start-time" className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            เวลาเริ่มต้น
          </Label>
          <Input id="start-time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>

        {/* End Date */}
        <div className="space-y-2">
          <Label htmlFor="end-date" className="text-sm font-medium flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            วันสิ้นสุด
          </Label>
          <Input id="end-date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="end-time" className="text-sm font-medium flex items-center gap-2">
            <Clock className="w-4 h-4" />
            เวลาสิ้นสุด
          </Label>
          <Input id="end-time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleApplyFilter}>
          <Filter className="mr-2 h-4 w-4" />
          แสดงข้อมูล
        </Button>

        <Button onClick={handleReset} variant="outline">
          <Clock className="mr-2 h-4 w-4" />
          วันนี้
        </Button>

        <Button
          onClick={handleViewAll}
          variant="outline"
          className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
        >
          <Database className="mr-2 h-4 w-4" />
          ดูข้อมูลทั้งหมด (30 วัน)
        </Button>
      </div>
    </div>
  )
}
