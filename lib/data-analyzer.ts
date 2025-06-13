/**
 * Data Analyzer - ใช้สำหรับวิเคราะห์ข้อมูลจาก Firebase
 */

/**
 * วิเคราะห์ข้อมูลจาก alerts collection
 * @param alertsData ข้อมูลจาก alerts collection
 * @param deviceId รหัสอุปกรณ์ที่ต้องการวิเคราะห์
 * @param startTime เวลาเริ่มต้น (timestamp)
 * @param endTime เวลาสิ้นสุด (timestamp)
 */
export function analyzeAlertsData(alertsData: any, deviceId: string, startTime: number, endTime: number) {
  // นับจำนวนเหตุการณ์แต่ละประเภท
  let yawnCount = 0
  let drowsinessCount = 0
  let criticalCount = 0

  // กรองเฉพาะ alerts ของอุปกรณ์ที่ต้องการและอยู่ในช่วงเวลาที่กำหนด
  const filteredAlerts = Object.values(alertsData).filter((alert: any) => {
    const alertTime = new Date(alert.timestamp).getTime()
    return alert.device_id === deviceId && alertTime >= startTime && alertTime <= endTime
  })

  // นับจำนวนเหตุการณ์แต่ละประเภท
  filteredAlerts.forEach((alert: any) => {
    if (alert.alert_type === "yawn_detected") {
      yawnCount++
    } else if (alert.alert_type === "drowsiness_detected") {
      drowsinessCount++
    } else if (alert.alert_type === "critical_drowsiness") {
      criticalCount++
    }
  })

  return {
    yawnCount,
    drowsinessCount,
    criticalCount,
    totalAlerts: filteredAlerts.length,
    alerts: filteredAlerts,
  }
}

/**
 * วิเคราะห์ข้อมูลจาก history collection
 * @param historyData ข้อมูลจาก history collection
 * @param startTime เวลาเริ่มต้น (timestamp)
 * @param endTime เวลาสิ้นสุด (timestamp)
 */
export function analyzeHistoryData(historyData: any, startTime: number, endTime: number) {
  // กรองเฉพาะข้อมูลที่อยู่ในช่วงเวลาที่กำหนด
  const filteredHistory = Object.values(historyData).filter((item: any) => {
    const itemTime = new Date(item.timestamp).getTime()
    return itemTime >= startTime && itemTime <= endTime
  })

  // คำนวณค่าเฉลี่ย EAR
  let totalEAR = 0
  let validEARCount = 0

  filteredHistory.forEach((item: any) => {
    if (item.ear && item.ear > 0) {
      totalEAR += item.ear
      validEARCount++
    }
  })

  const averageEAR = validEARCount > 0 ? totalEAR / validEARCount : 0

  // ดึงค่าล่าสุดจาก history
  const latestRecord = filteredHistory.sort((a: any, b: any) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })[0]

  return {
    averageEAR,
    latestYawnEvents: latestRecord?.yawn_events || 0,
    latestDrowsinessEvents: latestRecord?.drowsiness_events || 0,
    latestCriticalAlerts: latestRecord?.critical_alerts || 0,
    historyRecords: filteredHistory.length,
  }
}

/**
 * คำนวณคะแนนความปลอดภัย
 * @param yawnCount จำนวนการหาว
 * @param drowsinessCount จำนวนความง่วง
 * @param criticalCount จำนวนเหตุการณ์วิกฤต
 * @param averageEAR ค่าเฉลี่ย EAR
 */
export function calculateSafetyScore(
  yawnCount: number,
  drowsinessCount: number,
  criticalCount: number,
  averageEAR: number,
) {
  let score = 100

  // หักคะแนนตามจำนวนเหตุการณ์
  score -= Math.min(yawnCount * 2, 30) // หักสูงสุด 30 คะแนนสำหรับการหาว
  score -= Math.min(drowsinessCount * 5, 40) // หักสูงสุด 40 คะแนนสำหรับความง่วง
  score -= Math.min(criticalCount * 10, 50) // หักสูงสุด 50 คะแนนสำหรับเหตุการณ์วิกฤต

  // หักคะแนนตามค่า EAR เฉลี่ย
  if (averageEAR < 0.25) {
    score -= 20
  } else if (averageEAR < 0.3) {
    score -= 10
  }

  // ปรับคะแนนให้อยู่ในช่วง 0-100
  return Math.max(0, Math.min(100, score))
}

/**
 * เปรียบเทียบข้อมูลจาก alerts และ history
 * @param alertsAnalysis ผลการวิเคราะห์จาก alerts
 * @param historyAnalysis ผลการวิเคราะห์จาก history
 */
export function compareAlertsAndHistory(alertsAnalysis: any, historyAnalysis: any) {
  return {
    // เปรียบเทียบจำนวนการหาว
    yawnComparison: {
      fromAlerts: alertsAnalysis.yawnCount,
      fromHistory: historyAnalysis.latestYawnEvents,
      difference: historyAnalysis.latestYawnEvents - alertsAnalysis.yawnCount,
      percentDifference:
        alertsAnalysis.yawnCount > 0
          ? ((historyAnalysis.latestYawnEvents - alertsAnalysis.yawnCount) / alertsAnalysis.yawnCount) * 100
          : 0,
    },

    // เปรียบเทียบจำนวนความง่วง
    drowsinessComparison: {
      fromAlerts: alertsAnalysis.drowsinessCount,
      fromHistory: historyAnalysis.latestDrowsinessEvents,
      difference: historyAnalysis.latestDrowsinessEvents - alertsAnalysis.drowsinessCount,
      percentDifference:
        alertsAnalysis.drowsinessCount > 0
          ? ((historyAnalysis.latestDrowsinessEvents - alertsAnalysis.drowsinessCount) /
              alertsAnalysis.drowsinessCount) *
            100
          : 0,
    },

    // เปรียบเทียบจำนวนเหตุการณ์วิกฤต
    criticalComparison: {
      fromAlerts: alertsAnalysis.criticalCount,
      fromHistory: historyAnalysis.latestCriticalAlerts,
      difference: historyAnalysis.latestCriticalAlerts - alertsAnalysis.criticalCount,
      percentDifference:
        alertsAnalysis.criticalCount > 0
          ? ((historyAnalysis.latestCriticalAlerts - alertsAnalysis.criticalCount) / alertsAnalysis.criticalCount) * 100
          : 0,
    },
  }
}
