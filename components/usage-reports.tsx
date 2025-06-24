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
  stats: DailyStats | null
  startDate: Date | null
  endDate: Date | null
}

export function UsageReports({ data, stats, startDate, endDate }: UsageReportsProps) {
  const [report, setReport] = useState<ReportData | null>(null);

  useEffect(() => {
    monitoring.logComponentRender("UsageReports", {
      dataLength: data?.length,
      statsAvailable: !!stats,
    });
  }, [data, stats]);

  useEffect(() => {
    // Generate report only when we have valid stats
    if (data && stats) {
      const startTime = performance.now();
      try {
        // Pass both data and stats to the generateReport function
        const generatedReport = dataService.generateReport(data, stats);
        setReport(generatedReport);

        monitoring.logSuccess("UsageReports.generateReports", {
          dataLength: data.length,
          processingTime: performance.now() - startTime,
          reportStats: generatedReport.stats,
        });
      } catch (error) {
        monitoring.logError("UsageReports.generateReports", error, {
          dataLength: data.length,
        });
        console.error("Error generating reports:", error);
      }
    } else {
        setReport(null); // Clear report if no data or stats
    }
  }, [data, stats]);


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

  const getTrendText = (trend: string, type: string) => {
    const trendTexts: any = {
      yawnTrend: { increasing: "เพิ่มขึ้น", decreasing: "ลดลง", stable: "คงที่" },
      drowsinessTrend: { increasing: "เพิ่มขึ้น", decreasing: "ลดลง", stable: "คงที่" },
      alertnessTrend: { improving: "ดีขึ้น", declining: "แย่ลง", stable: "คงที่" },
    }
    return trendTexts[type]?.[trend] || "ไม่ทราบ"
  }
  
  const getSafetyScore = (currentStats: DailyStats) => {
    let score = 100
    score -= Math.min(currentStats.totalYawns * 2, 30)
    score -= Math.min(currentStats.totalDrowsiness * 5, 40)
    score -= Math.min(currentStats.totalAlerts * 10, 50)
    if (currentStats.averageEAR < 0.25 && currentStats.averageEAR > 0) score -= 20
    else if (currentStats.averageEAR < 0.3 && currentStats.averageEAR > 0) score -= 10
    return Math.max(score, 0)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    if (score >= 40) return "text-orange-600"
    return "text-red-600"
  }

  const getScoreLevel = (score: number) => {
    if (score >= 80) return "ดีเยี่ยม"
    if (score >= 60) return "ดี"
    if (score >= 40) return "ปานกลาง"
    return "ต้องปรับปรุง"
  }

  if (!report || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>รายงานสรุป</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-center h-40 text-gray-500">
                ไม่มีข้อมูลสำหรับสร้างรายงานในช่วงเวลานี้
            </div>
        </CardContent>
      </Card>
    )
  }

  const score = getSafetyScore(stats)

  return (
    <div className="space-y-6">
      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="daily">รายงานสรุป</TabsTrigger>
          <TabsTrigger value="trends">แนวโน้ม</TabsTrigger>
          <TabsTrigger value="recommendations">คำแนะนำ</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                คะแนนความปลอดภัย
              </CardTitle>
              <CardDescription>ประเมินจากพฤติกรรมการขับขี่ของคุณในช่วงเวลาที่เลือก</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${getScoreColor(score)}`}>{score}/100</div>
                  <div className="text-lg font-medium text-muted-foreground">{getScoreLevel(score)}</div>
                </div>
                <Progress value={score} className="h-3" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-semibold">{stats.totalYawns}</div>
                    <div className="text-muted-foreground">ครั้งที่หาว</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{stats.totalDrowsiness}</div>
                    <div className="text-muted-foreground">ครั้งที่ง่วง</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{stats.totalAlerts}</div>
                    <div className="text-muted-foreground">แจ้งเตือนด่วน</div>
                  </div>
                  <div className="text-center">
                    <div className="font-semibold">{stats.averageEAR.toFixed(2)}</div>
                    <div className="text-muted-foreground">ค่าเฉลี่ย EAR</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                    <div className="text-sm text-muted-foreground">{getTrendText(report.trends.yawnTrend, "yawnTrend")}</div>
                  </div>
                  {getTrendIcon(report.trends.yawnTrend)}
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">ความง่วง</div>
                    <div className="text-sm text-muted-foreground">{getTrendText(report.trends.drowsinessTrend, "drowsinessTrend")}</div>
                  </div>
                  {getTrendIcon(report.trends.drowsinessTrend)}
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">ความตื่นตัว</div>
                    <div className="text-sm text-muted-foreground">{getTrendText(report.trends.alertnessTrend, "alertnessTrend")}</div>
                  </div>
                  {getTrendIcon(report.trends.alertnessTrend)}
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
                {report.recommendations.map((recommendation, index) => (
                  <Alert key={index} className="border-blue-200 bg-blue-50 dark:bg-blue-900/30">
                    <Lightbulb className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800 dark:text-blue-200">{recommendation}</AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default UsageReports
