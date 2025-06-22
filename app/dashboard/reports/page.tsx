"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthState } from "@/lib/auth"
import { dataService } from "@/lib/data-service"
import type { SafetyData } from "@/lib/types"

import { LoadingScreen } from "@/components/loading-screen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { SafetyDashboard } from "@/components/safety-dashboard" 
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"

export default function ReportsPage() {
  const { userProfile, loading: authLoading } = useAuthState()
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setMonth(endDate.getMonth() - 1)
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  })

  const loadReportData = useCallback(async () => {
    if (!userProfile?.deviceId || userProfile.deviceId === "null") {
      setError("ไม่พบ Device ID ที่ผูกกับบัญชีของคุณ")
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      console.log(">>> Calling getFilteredSafetyData from Reports Page");
      console.log(">>> dataService keys:", Object.keys(dataService)); // Debugging log as you suggested
      
      const data = await dataService.getFilteredSafetyData(
        userProfile.deviceId,
        dateRange.start,
        dateRange.end
      )
      setSafetyData(data)
    } catch (err: any) {
      console.error("Failed to load report data:", err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userProfile, dateRange])

  useEffect(() => {
    if (!authLoading && userProfile) {
      loadReportData()
    } else if (!authLoading && !userProfile) {
      setLoading(false)
      setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้ กรุณาล็อคอินอีกครั้ง")
      router.push('/login');
    }
  }, [authLoading, userProfile, loadReportData, router])

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  if (authLoading) {
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์..." />
  }
  
  if (error) {
    return (
      <div className="container mx-auto py-8">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>เกิดข้อผิดพลาด</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (loading || !safetyData || !userProfile) {
    return <LoadingScreen message="กำลังโหลดข้อมูลรายงาน..." />
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4">
       <Button
          variant="outline"
          onClick={() => router.push('/dashboard')}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          กลับไปที่แดชบอร์ด
        </Button>
      <SafetyDashboard
        safetyData={safetyData}
        userProfile={userProfile}
        onDateChange={handleDateChange}
        initialDateRange={dateRange}
      />
    </div>
  )
}
