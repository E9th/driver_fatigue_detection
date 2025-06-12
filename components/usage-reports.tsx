"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Target, Lightbulb } from "lucide-react"
import { dataService } from "@/lib/data-service"
import type { HistoricalData, DailyStats, ReportData } from "@/lib/types"
import { monitoring } from "@/lib/monitoring"

interface UsageReportsProps {
  data: HistoricalData[]
  startDate: Date | null
  endDate: Date | null
}

/**
 * UsageReports Component
 *
 * Displays comprehensive safety reports and analytics based on historical driving data
 *
 * @param data - Historical driving data array
 * @param startDate - Start date for filtering data
 * @param endDate - End date for filtering data
 */
export function UsageReports({ data, startDate, endDate }: UsageReportsProps) {
  const [dailyReport, setDailyReport] = useState<ReportData | null>(null)
  const [weeklyReport, setWeeklyReport] = useState<ReportData | null>(null)
  const [monthlyReport, setMonthlyReport] = useState<ReportData | null>(null)

  // Log component render for debugging
  useEffect(() => {
    monitoring.logComponentRender("UsageReports", {
      dataLength: data?.length,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
    })
  }, [])

  // Generate reports when data changes
  useEffect(() => {
    if (data && data.length > 0) {
      // Track performance of report generation
      const startTime = performance.now()

      try {
        const daily = dataService.generateReport(data, "daily")
        const weekly = dataService.generateReport(data, "weekly")
        const monthly = dataService.generateReport(data, "monthly")

        setDailyReport(daily)
        setWeeklyReport(weekly)
        setMonthlyReport(monthly)

        // Log successful report generation
        monitoring.logSuccess("UsageReports.generateReports", {
          dataLength: data.length,
          processingTime: performance.now() - startTime,
          dailyStats: daily.stats,
          weeklyStats: weekly.stats,
          monthlyStats: monthly.stats,
        })
      } catch (error) {
        // Log errors in report generation
        monitoring.logError("UsageReports.generateReports", error, {
          dataLength: data.length,
        })
        console.error("Error generating reports:", error)
      }
    }
  }, [data])

  /**
   * Get trend icon based on trend direction
   */
  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
      case "declining":
        return <TrendingUp className="h-4 w-4 text-red-500" />
      case "decreasing":
      case "improving":
        return <TrendingDown className="h-4 w-4 text-green-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  /**
   * Get trend text based on trend direction and type
   */
  const getTrendText = (trend: string, type: string) => {
    const trendTexts = {
      yawnTrend: {
        increasing: "เพิ่มขึ้น",
        decreasing: "ลดลง",
        stable: "คงที่",
      },
      drowsinessTrend: {
        increasing: "เพิ่มขึ้น",
        decreasing: "ลดลง",
        stable: "คงที่",
      },
      alertnessTrend: {
        improving: "ดีขึ้น",
        declining: "แย่ลง",
        stable: "คงที่",
      },
    }

    return trendTexts[type as keyof typeof trendTexts]?.[trend as keyof typeof trendTexts.yawnTrend] || "ไม่ทราบ"
  }

  /**
   * Calculate safety score based on statistics
   * FIXED: Aligned calculation with the one in admin-analytics.ts
   */
  const getSafetyScore = (stats: DailyStats) => {
    let score = 100

    // Deduct points for yawns (max 30 points)
    score -= Math.min(stats.totalYawns * 2, 30)

    // Deduct points for drowsiness (max 40 points)
    score -= Math.min(stats.totalDrowsiness * 5, 40)

    // Deduct points for alerts (max 50 points)
    score -= Math.min(stats.totalAlerts * 10, 50)

    // Deduct points for low EAR
    if (stats.averageEAR < 0.25) {
      score -= 20
    } else if (stats.averageEAR < 0.3) {
      score -= 10
    }

    // Log score calculation for debugging
    monitoring.logDebug("UsageReports.getSafetyScore", {
      stats,
      calculatedScore: Math.max(score, 0),
    })

    return Math.max(score, 0)
  }

  /**
   * Get color based on safety score
   */
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  /**
   * Get text level based on safety score
   */
  const getScoreLevel = (score: number) => {
    if (score >= 80) return "ดีเยี่ยม"
    if (score >= 60) return "ดี"
    if (score >= 40) return "ปานกลาง"
    return "ต้องปรับปรุง"
  }

  // Show loading state if reports aren't ready
  if (!dailyReport) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">รายงานประจำวัน</TabsTrigger>
          <TabsTrigger value="trends">แนวโน้ม</TabsTrigger>
          <TabsTrigger value="recommendations">คำแนะนำ</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          {/* Safety Score */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                คะแนนความปลอดภัย
              </CardTitle>
              <CardDescription>ประเมินจากพฤติกรรมการขับขี่ของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const score = getSafetyScore(dailyReport.stats)
                return (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}/100</div>
                      <div className="text-lg font-medium text-muted-foreground">{getScoreLevel(score)}</div>
                    </div>
                    <Progress value={score} className="h-3" />
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-semibold">{dailyReport.stats.totalYawns}</div>
                        <div className="text-muted-foreground">ครั้งที่หาว</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{dailyReport.stats.totalDrowsiness}</div>
                        <div className="text-muted-foreground">ครั้งที่ง่วง</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{dailyReport.stats.totalAlerts}</div>
                        <div className="text-muted-foreground">แจ้งเตือนด่วน</div>
                      </div>
                      <div className="text-center">
                        <div className="font-semibold">{dailyReport.stats.averageEAR.toFixed(2)}</div>
                        <div className="text-muted-foreground">ค่าเฉลี่ย EAR</div>
                      </div>
                    </div>
                  </div>
                )
              })()}
            </CardContent>
          </Card>

          {/* Daily Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">สรุปการใช้งานวันนี้</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span>จำนวนเซสชัน:</span>
                  <span className="font-semibold">{dailyReport.stats.totalSessions}</span>
                </div>
                <div className="flex justify-between">
                  <span>ค่าเฉลี่ยการเปิดปาก:</span>
                  <span className="font-semibold">{dailyReport.stats.averageMouthDistance.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>สถานะที่พบมากที่สุด:</span>
                  <span className="font-semibold">
                    {Object.entries(dailyReport.stats.statusDistribution).sort(
                      ([, a], [, b]) => (b as number) - (a as number),
                    )[0]?.[0] || "ไม่มีข้อมูล"}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">การประเมินความเสี่ยง</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const riskLevel =
                    dailyReport.stats.totalAlerts > 0
                      ? "สูง"
                      : dailyReport.stats.totalDrowsiness > 5
                        ? "ปานกลาง"
                        : dailyReport.stats.totalYawns > 15
                          ? "ต่ำ"
                          : "ต่ำมาก"

                  const riskColor =
                    riskLevel === "สูง"
                      ? "text-red-600"
                      : riskLevel === "ปานกลาง"
                        ? "text-orange-600"
                        : riskLevel === "ต่ำ"
                          ? "text-yellow-600"
                          : "text-green-600"

                  return (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>ระดับความเสี่ยง:</span>
                        <Badge variant={riskLevel === "สูง" ? "destructive" : "secondary"} className={riskColor}>
                          {riskLevel}
                        </Badge>
                      </div>

                      {riskLevel === "สูง" && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            พบการแจ้งเตือนด่วน ควรปรึกษาแพทย์หากอาการดังกล่าวเกิดขึ้นบ่อย
                          </AlertDescription>
                        </Alert>
                      )}

                      {riskLevel === "ต่ำมาก" && (
                        <Alert className="border-green-200 bg-green-50">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-800">พฤติกรรมการขับขี่ของคุณอยู่ในเกณฑ์ดีมาก</AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                การวิเคราะห์แนวโน้ม
              </CardTitle>
              <CardDescription>เปรียบเทียบข้อมูลครึ่งแรกและครึ่งหลังของช่วงเวลาที่เลือก</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">การหาว</div>
                    <div className="text-sm text-muted-foreground">
                      {getTrendText(dailyReport.trends.yawnTrend, "yawnTrend")}
                    </div>
                  </div>
                  {getTrendIcon(dailyReport.trends.yawnTrend)}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">ความง่วง</div>
                    <div className="text-sm text-muted-foreground">
                      {getTrendText(dailyReport.trends.drowsinessTrend, "drowsinessTrend")}
                    </div>
                  </div>
                  {getTrendIcon(dailyReport.trends.drowsinessTrend)}
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">ความตื่นตัว</div>
                    <div className="text-sm text-muted-foreground">
                      {getTrendText(dailyReport.trends.alertnessTrend, "alertnessTrend")}
                    </div>
                  </div>
                  {getTrendIcon(dailyReport.trends.alertnessTrend)}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-600" />
                คำแนะนำเพื่อปรับปรุงความปลอดภัย
              </CardTitle>
              <CardDescription>คำแนะนำที่ปรับแต่งตามพฤติกรรมการขับขี่ของคุณ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dailyReport.recommendations.map((recommendation: string, index: number) => (
                  <Alert key={index} className="border-blue-200 bg-blue-50">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">เคล็ดลับเพิ่มเติม</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>หยุดพักทุก 2 ชั่วโมงหรือทุก 200 กิโลเมตร</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>นอนหลับให้เพียงพอ 7-9 ชั่วโมงต่อคืน</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>หลีกเลี่ยงการขับขี่ในช่วง 2:00-6:00 น. และ 14:00-16:00 น.</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>ดื่มน้ำให้เพียงพอและหลีกเลี่ยงอาหารหนักก่อนขับขี่</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// Default export for backward compatibility
export default UsageReports
