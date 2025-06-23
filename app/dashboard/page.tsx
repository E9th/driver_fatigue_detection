"use client"

import { useState, useEffect, useCallback } from "react"
import { useAuthState } from "@/lib/auth"
import { dataService } from "@/lib/data-service"
import type { SafetyData } from "@/lib/types"

import { LoadingScreen } from "@/components/loading-screen"
import { DashboardPage } from "@/components/dashboard-page" // อนุมานว่าคุณใช้ชื่อนี้
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function MainDashboard() {
  const { userProfile, loading: authLoading } = useAuthState()
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [loadingData, setLoadingData] = useState(true) // แยก state การโหลดข้อมูล
  const [error, setError] = useState<string | null>(null)

  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 6)
    return {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    }
  })

  const loadSafetyData = useCallback(async (deviceId: string) => {
    setLoadingData(true)
    setError(null)
    try {
      const data = await dataService.getFilteredSafetyData(
        deviceId,
        dateRange.start,
        dateRange.end
      )
      setSafetyData(data)
    } catch (err: any) {
      console.error("Failed to fetch safety data:", err)
      setError(err.message)
    } finally {
      setLoadingData(false)
    }
  }, [dateRange])

  useEffect(() => {
    // รอให้การตรวจสอบ auth เสร็จสิ้นก่อน
    if (!authLoading) {
      if (userProfile) {
        // เมื่อมี profile แล้ว จึงตรวจสอบ deviceId
        if (userProfile.deviceId && userProfile.deviceId !== "null") {
          loadSafetyData(userProfile.deviceId)
        } else {
          // มี profile แต่ไม่มี deviceId
          setError("ไม่พบ Device ID ที่ผูกกับบัญชีของคุณ กรุณาติดต่อผู้ดูแล")
          setLoadingData(false)
        }
      } else {
        // ตรวจสอบ auth เสร็จแล้ว แต่ไม่พบผู้ใช้
        setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้")
        setLoadingData(false)
      }
    }
  }, [authLoading, userProfile, loadSafetyData])

  const handleDateChange = (start: string, end: string) => {
    setDateRange({ start, end })
  }

  // แสดง Loading ขณะกำลังตรวจสอบสิทธิ์
  if (authLoading) {
    return <LoadingScreen message="กำลังตรวจสอบสถานะ..." />
  }

  // แสดง Error หากมีข้อผิดพลาดเกิดขึ้น
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

  // แสดง Loading ขณะกำลังโหลดข้อมูล Dashboard
  if (loadingData || !safetyData) {
    return <LoadingScreen message="กำลังโหลดข้อมูลแดชบอร์ด..." />
  }

  // แสดง Dashboard เมื่อทุกอย่างพร้อม
  return (
    <DashboardPage
      safetyData={safetyData}
      isLoading={false} // ส่ง isLoading เป็น false เพราะเราจัดการแล้ว
      userProfile={userProfile}
    />
  )
}
