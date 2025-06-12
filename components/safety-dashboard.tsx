"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { database } from "@/lib/firebase"
import { ref, onValue, get } from "firebase/database"
import { formatDate } from "@/lib/date-utils"
import { DateTimeFilter } from "@/components/date-time-filter"
import { ExportData } from "@/components/export-data"
import { ChartsSection } from "@/components/charts-section"
import { SafetyScoreTooltip } from "@/components/safety-score-tooltip"
import { ConnectionStatus } from "@/components/connection-status"
import { AlertTriangle, Smile, Frown, RefreshCw, Calendar, Info } from "lucide-react"

interface SafetyDashboardProps {
  deviceId: string
  viewMode?: "user" | "admin"
}

export function SafetyDashboard({ deviceId, viewMode = "user" }: SafetyDashboardProps) {
  const [activeTab, setActiveTab] = useState("current")
  const [data, setData] = useState<any[]>([])
  const [filteredData, setFilteredData] = useState<any[]>([])
  const [todayData, setTodayData] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [dateRange, setDateRange] = useState<{
    startDate: Date
    endDate: Date
    startTime: string
    endTime: string
  }>({
    startDate: new Date(),
    endDate: new Date(),
    startTime: "00:00",
    endTime: "23:59",
  })
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [todayStats, setTodayStats] = useState({
    yawnCount: 0,
    drowsinessCount: 0,
    alertCount: 0,
    safetyScore: 100,
  })
  const [historicalStats, setHistoricalStats] = useState({
    yawnCount: 0,
    drowsinessCount: 0,
    alertCount: 0,
    safetyScore: 100,
  })
  const [hasHistoricalData, setHasHistoricalData] = useState(false)
  const [hasAutoLoaded, setHasAutoLoaded] = useState(false)

  // ฟังก์ชันสำหรับดึงข้อมูลอุปกรณ์
  const fetchDeviceInfo = async () => {
    try {
      // ลองดึงข้อมูลจาก devices ก่อน
      const deviceRef = ref(database, `devices/${deviceId}`)
      const snapshot = await get(deviceRef)

      if (snapshot.exists()) {
        setDeviceInfo(snapshot.val())
        return
      }

      // ถ้าไม่พบ ลองดึงจาก users แทน (กรณีที่ deviceId เป็น userId)
      const userRef = ref(database, `users/${deviceId}`)
      const userSnapshot = await get(userRef)

      if (userSnapshot.exists()) {
        const userData = userSnapshot.val()
        // ถ้าผู้ใช้มี deviceId ให้ดึงข้อมูลอุปกรณ์อีกครั้ง
        if (userData.deviceId) {
          const linkedDeviceRef = ref(database, `devices/${userData.deviceId}`)
          const linkedDeviceSnapshot = await get(linkedDeviceRef)

          if (linkedDeviceSnapshot.exists()) {
            setDeviceInfo({
              ...linkedDeviceSnapshot.val(),
              id: userData.deviceId,
              linkedUser: userData,
            })
            return
          }
        }

        // ถ้าไม่มี deviceId หรือไม่พบข้อมูลอุปกรณ์ ให้ใช้ข้อมูลผู้ใช้แทน
        setDeviceInfo({
          id: deviceId,
          name: userData.fullName || "ไม่ระบุชื่อ",
          type: "user",
          linkedUser: userData,
        })
      } else {
        // ถ้าไม่พบทั้งในอุปกรณ์และผู้ใช้ ให้แสดงข้อมูลว่างๆ
        setDeviceInfo({
          id: deviceId,
          name: "ไม่พบข้อมูล",
          type: "unknown",
        })
      }
    } catch (error) {
      console.error("Error fetching device info:", error)
      setDeviceInfo({
        id: deviceId,
        name: "เกิดข้อผิดพลาด",
        type: "error",
      })
    }
  }

  // ฟังก์ชันสำหรับดึงข้อมูลจาก Firebase
  const fetchData = async () => {
    setIsLoading(true)
    try {
      // ดึงข้อมูลอุปกรณ์
      await fetchDeviceInfo()

      // ดึงข้อมูลจาก events path
      const eventsRef = ref(database, `events/${deviceId}`)
      const snapshot = await get(eventsRef)

      if (snapshot.exists()) {
        const eventsData = snapshot.val()
        const eventsArray = Object.entries(eventsData).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))

        // เรียงข้อมูลตามเวลา
        const sortedData = eventsArray.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        setData(sortedData)

        // กรองข้อมูลของวันนี้
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayEvents = sortedData.filter((event) => {
          const eventDate = new Date(event.timestamp)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate.getTime() === today.getTime()
        })

        setTodayData(todayEvents)

        // คำนวณสถิติของวันนี้
        calculateTodayStats(todayEvents)

        // ตั้งค่าข้อมูลที่กรองตามช่วงเวลา (เริ่มต้นเป็นวันนี้)
        handleFilterChange(dateRange)
      } else {
        setData([])
        setTodayData([])
        setFilteredData([])
      }
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
      setLastRefresh(new Date())
    }
  }

  // คำนวณสถิติของวันนี้
  const calculateTodayStats = (todayEvents: any[]) => {
    let yawnCount = 0
    let drowsinessCount = 0
    let alertCount = 0

    todayEvents.forEach((event) => {
      const status = event.status || "NORMAL"

      if (status === "YAWN DETECTED") {
        yawnCount++
      } else if (status === "DROWSINESS DETECTED") {
        drowsinessCount++
      } else if (status.includes("CRITICAL")) {
        alertCount++
      }
    })

    // คำนวณคะแนนความปลอดภัย
    const totalEvents = todayEvents.length
    const safetyScore = calculateSafetyScore(yawnCount, drowsinessCount, alertCount, totalEvents)

    setTodayStats({
      yawnCount,
      drowsinessCount,
      alertCount,
      safetyScore,
    })
  }

  // คำนวณสถิติของช่วงเวลาที่เลือก
  const calculateHistoricalStats = (filteredEvents: any[]) => {
    let yawnCount = 0
    let drowsinessCount = 0
    let alertCount = 0

    filteredEvents.forEach((event) => {
      const status = event.status || "NORMAL"

      if (status === "YAWN DETECTED") {
        yawnCount++
      } else if (status === "DROWSINESS DETECTED") {
        drowsinessCount++
      } else if (status.includes("CRITICAL")) {
        alertCount++
      }
    })

    // คำนวณคะแนนความปลอดภัย
    const totalEvents = filteredEvents.length
    const safetyScore = calculateSafetyScore(yawnCount, drowsinessCount, alertCount, totalEvents)

    setHistoricalStats({
      yawnCount,
      drowsinessCount,
      alertCount,
      safetyScore,
    })

    setHasHistoricalData(filteredEvents.length > 0)
  }

  // คำนวณคะแนนความปลอดภัย
  const calculateSafetyScore = (yawns: number, drowsiness: number, alerts: number, total: number) => {
    if (total === 0) return 100

    // คำนวณคะแนนความปลอดภัย
    // หาว: -1 คะแนน, ง่วง: -2 คะแนน, แจ้งเตือน: -5 คะแนน
    const deductions = yawns * 1 + drowsiness * 2 + alerts * 5
    const maxDeduction = total * 5 // สูงสุดที่หักได้ (ถ้าทุกเหตุการณ์เป็นแจ้งเตือน)

    // คำนวณเป็นเปอร์เซ็นต์
    const score = Math.max(0, 100 - (deductions / maxDeduction) * 100)

    return Math.round(score)
  }

  // ฟังก์ชันสำหรับกรองข้อมูลตามช่วงเวลา
  const handleFilterChange = (range: {
    startDate: Date
    endDate: Date
    startTime: string
    endTime: string
  }) => {
    setDateRange(range)

    const { startDate, endDate, startTime, endTime } = range

    // แปลงเวลาเริ่มต้นและสิ้นสุดเป็น Date object
    const startDateTime = new Date(startDate)
    const [startHours, startMinutes] = startTime.split(":").map(Number)
    startDateTime.setHours(startHours, startMinutes, 0, 0)

    const endDateTime = new Date(endDate)
    const [endHours, endMinutes] = endTime.split(":").map(Number)
    endDateTime.setHours(endHours, endMinutes, 59, 999)

    // กรองข้อมูลตามช่วงเวลา
    const filtered = data.filter((item) => {
      const itemDate = new Date(item.timestamp)
      return itemDate >= startDateTime && itemDate <= endDateTime
    })

    setFilteredData(filtered)
    calculateHistoricalStats(filtered)
  }

  // ฟังก์ชันสำหรับรีเฟรชข้อมูล
  const handleRefresh = () => {
    fetchData()
  }

  // ฟังก์ชันสำหรับโหลดข้อมูลประวัติ
  const loadHistoricalData = () => {
    setActiveTab("historical")
    setHasHistoricalData(true)
  }

  // ตั้งค่า real-time listener และดึงข้อมูลเมื่อ component mount
  useEffect(() => {
    fetchData()

    // ตั้งค่า real-time listener สำหรับข้อมูลใหม่
    const eventsRef = ref(database, `events/${deviceId}`)
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      if (snapshot.exists()) {
        const eventsData = snapshot.val()
        const eventsArray = Object.entries(eventsData).map(([key, value]: [string, any]) => ({
          id: key,
          ...value,
        }))

        // เรียงข้อมูลตามเวลา
        const sortedData = eventsArray.sort((a, b) => {
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        })

        setData(sortedData)

        // กรองข้อมูลของวันนี้
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const todayEvents = sortedData.filter((event) => {
          const eventDate = new Date(event.timestamp)
          eventDate.setHours(0, 0, 0, 0)
          return eventDate.getTime() === today.getTime()
        })

        setTodayData(todayEvents)

        // คำนวณสถิติของวันนี้
        calculateTodayStats(todayEvents)

        // อัปเดตข้อมูลที่กรองตามช่วงเวลา
        handleFilterChange(dateRange)
      }
    })

    // Auto-load historical data เมื่อ component mount
    if (!hasAutoLoaded) {
      setHasAutoLoaded(true)
      loadHistoricalData()
    }

    return () => {
      unsubscribe()
    }
  }, [deviceId])

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">{deviceInfo?.name || "กำลังโหลด..."}</h2>
          <div className="text-sm text-muted-foreground flex items-center gap-2">
            <span>รหัสอุปกรณ์: {deviceInfo?.id || deviceId}</span>
            <ConnectionStatus isActive={deviceInfo?.isActive} lastActive={deviceInfo?.lastActive} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-1" />
            รีเฟรช
          </Button>
          <ExportData
            data={{
              deviceInfo,
              stats: activeTab === "current" ? todayStats : historicalStats,
              dateRange: activeTab === "current" ? { startDate: new Date(), endDate: new Date() } : dateRange,
              events: activeTab === "current" ? todayData : filteredData,
            }}
            filename={`safety-data-${deviceInfo?.id || deviceId}-${formatDate(new Date())}`}
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="text-sm text-muted-foreground">อัปเดตล่าสุด: {lastRefresh.toLocaleString("th-TH")}</div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="current">สถานะปัจจุบัน</TabsTrigger>
          <TabsTrigger value="historical">กราฟและสถิติ</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">คะแนนความปลอดภัย</CardTitle>
                <SafetyScoreTooltip />
              </CardHeader>
              <CardContent>
                <div className="flex flex-col space-y-2">
                  <div className="text-2xl font-bold">{todayStats.safetyScore}/100</div>
                  <Progress value={todayStats.safetyScore} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ครั้งที่หาว</CardTitle>
                <Smile className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.yawnCount}</div>
                <p className="text-xs text-muted-foreground">วันนี้</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">ครั้งที่ง่วง</CardTitle>
                <Frown className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.drowsinessCount}</div>
                <p className="text-xs text-muted-foreground">วันนี้</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">การแจ้งเตือน</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{todayStats.alertCount}</div>
                <p className="text-xs text-muted-foreground">วันนี้</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>กิจกรรมล่าสุด</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-40">
                  <p>กำลังโหลดข้อมูล...</p>
                </div>
              ) : todayData.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40 text-center">
                  <Calendar className="h-10 w-10 text-muted-foreground mb-2" />
                  <p>ไม่พบข้อมูลสำหรับวันนี้</p>
                  <p className="text-sm text-muted-foreground mt-1">ข้อมูลจะปรากฏที่นี่เมื่อมีการใช้งานอุปกรณ์</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="space-y-4">
                    {todayData.map((event) => (
                      <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {event.status === "YAWN DETECTED" && "ตรวจพบการหาว"}
                            {event.status === "DROWSINESS DETECTED" && "ตรวจพบอาการง่วง"}
                            {event.status?.includes("CRITICAL") && "การแจ้งเตือนอันตราย"}
                            {(!event.status || event.status === "NORMAL") && "สถานะปกติ"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString("th-TH")}
                          </div>
                        </div>
                        <div>
                          {event.status === "YAWN DETECTED" && (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                              หาว
                            </Badge>
                          )}
                          {event.status === "DROWSINESS DETECTED" && (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                              ง่วง
                            </Badge>
                          )}
                          {event.status?.includes("CRITICAL") && (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              อันตราย
                            </Badge>
                          )}
                          {(!event.status || event.status === "NORMAL") && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              ปกติ
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historical" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>ตัวกรองข้อมูล</CardTitle>
            </CardHeader>
            <CardContent>
              <DateTimeFilter onChange={handleFilterChange} />
            </CardContent>
          </Card>

          {hasHistoricalData ? (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">คะแนนความปลอดภัย</CardTitle>
                    <SafetyScoreTooltip />
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-2">
                      <div className="text-2xl font-bold">{historicalStats.safetyScore}/100</div>
                      <Progress value={historicalStats.safetyScore} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ครั้งที่หาว</CardTitle>
                    <Smile className="h-4 w-4 text-amber-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historicalStats.yawnCount}</div>
                    <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">ครั้งที่ง่วง</CardTitle>
                    <Frown className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historicalStats.drowsinessCount}</div>
                    <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">การแจ้งเตือน</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{historicalStats.alertCount}</div>
                    <p className="text-xs text-muted-foreground">ในช่วงเวลาที่เลือก</p>
                  </CardContent>
                </Card>
              </div>

              <ChartsSection data={filteredData} dateRange={dateRange} />
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-10 text-center">
                <Info className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">ไม่พบข้อมูลในช่วงเวลาที่เลือก</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">
                  ลองเปลี่ยนช่วงเวลาที่เลือกหรือตรวจสอบว่าอุปกรณ์มีการส่งข้อมูลหรือไม่
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
