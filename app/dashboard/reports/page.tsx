"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthState } from "@/lib/auth"
import { dataService } from "@/lib/data-service"
import type { SafetyData } from "@/lib/types"

import { LoadingScreen } from "@/components/loading-screen"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, HardHat } from "lucide-react"
import { SafetyDashboard } from "@/components/safety-dashboard" 
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

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
    // This check now happens inside useEffect, after authLoading is false
    if (!userProfile?.deviceId || userProfile.deviceId === "null") return;

    setLoading(true)
    setError(null)
    try {
      const data = await dataService.getFilteredSafetyData(
        userProfile.deviceId,
        dateRange.start,
        dateRange.end
      )
      setSafetyData(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userProfile, dateRange])

  useEffect(() => {
    if (!authLoading) {
      if (userProfile) {
        loadReportData()
      } else {
        router.push('/login');
      }
    }
  }, [authLoading, userProfile, loadReportData, router])

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  // Guard 1: Show loading screen while auth state is being resolved
  if (authLoading) {
    return <LoadingScreen message="กำลังตรวจสอบสิทธิ์..." />
  }

  // Guard 2: Handle case where user is logged in but has no deviceId
  if (userProfile && (!userProfile.deviceId || userProfile.deviceId === 'null')) {
    return (
      <div className="container mx-auto flex items-center justify-center min-h-[60vh]">
        <Alert variant="default" className="max-w-md">
          <HardHat className="h-4 w-4" />
          <AlertTitle>ยังไม่ได้ผูกอุปกรณ์</AlertTitle>
          <AlertDescription>
            คุณยังไม่ได้ผูก Device ID กับบัญชีของคุณ ทำให้ไม่สามารถดูรายงานได้ กรุณาติดต่อผู้ดูแลระบบเพื่อดำเนินการ
             <Button onClick={() => router.push('/dashboard')} variant="link" className="pl-1">กลับไปหน้าแดชบอร์ด</Button>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // Guard 3: Handle any other generic error
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

  // Guard 4: Show loading screen while fetching report data
  if (loading || !safetyData) {
    return <LoadingScreen message="กำลังโหลดข้อมูลรายงาน..." />
  }
  
  // Render the dashboard if everything is successful
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
