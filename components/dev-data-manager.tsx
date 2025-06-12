"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { clearDevelopmentData, checkDevelopmentData } from "@/lib/clear-dev-data"
import { isDevelopmentMode } from "@/lib/firebase-singleton"

export function DevDataManager() {
  const [devData, setDevData] = useState<any[]>([])
  const [showData, setShowData] = useState(false)

  const handleCheckData = () => {
    const data = checkDevelopmentData()
    setDevData(data)
    setShowData(true)
  }

  const handleClearData = () => {
    clearDevelopmentData()
  }

  if (!isDevelopmentMode) {
    return null
  }

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader>
        <CardTitle className="text-lg">Development Data Manager</CardTitle>
        <CardDescription>จัดการข้อมูลทดสอบใน localStorage</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button onClick={handleCheckData} variant="outline" size="sm">
            ตรวจสอบข้อมูล
          </Button>
          <Button onClick={handleClearData} variant="destructive" size="sm">
            ลบข้อมูลทั้งหมด
          </Button>
        </div>

        {showData && (
          <div className="mt-4">
            <h4 className="font-medium mb-2">ข้อมูลใน localStorage:</h4>
            <div className="bg-gray-100 p-3 rounded text-sm">
              {devData.length === 0 ? (
                <p>ไม่มีข้อมูล</p>
              ) : (
                <pre className="whitespace-pre-wrap">{JSON.stringify(devData, null, 2)}</pre>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
