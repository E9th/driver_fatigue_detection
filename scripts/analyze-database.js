/**
 * Script สำหรับวิเคราะห์ข้อมูลใน Firebase Realtime Database
 * ใช้สำหรับตรวจสอบความถูกต้องของข้อมูลและการคำนวณ
 */

// ข้อมูลจาก Firebase
const data = require("../driver-fatigue-detection-default-rtdb-export.json")

// ฟังก์ชันสำหรับวิเคราะห์ข้อมูล alerts
function analyzeAlerts(deviceId) {
  const alerts = data.alerts
  const deviceAlerts = Object.values(alerts).filter((alert) => alert.device_id === deviceId)

  // นับจำนวนเหตุการณ์แต่ละประเภท
  const yawnCount = deviceAlerts.filter((alert) => alert.alert_type === "yawn_detected").length
  const drowsinessCount = deviceAlerts.filter((alert) => alert.alert_type === "drowsiness_detected").length
  const criticalCount = deviceAlerts.filter((alert) => alert.alert_type === "critical_drowsiness").length

  console.log(`\n=== ข้อมูลจาก alerts สำหรับ ${deviceId} ===`)
  console.log(`จำนวนการหาว: ${yawnCount}`)
  console.log(`จำนวนความง่วง: ${drowsinessCount}`)
  console.log(`จำนวนเหตุการณ์วิกฤต: ${criticalCount}`)
  console.log(`จำนวนเหตุการณ์ทั้งหมด: ${deviceAlerts.length}`)

  return { yawnCount, drowsinessCount, criticalCount, totalAlerts: deviceAlerts.length }
}

// ฟังก์ชันสำหรับวิเคราะห์ข้อมูล history
function analyzeHistory(deviceId) {
  const deviceData = data.devices[deviceId]
  if (!deviceData || !deviceData.history) {
    console.log(`\n=== ไม่พบข้อมูล history สำหรับ ${deviceId} ===`)
    return null
  }

  const history = deviceData.history
  const historyEntries = Object.values(history)

  // ดึงข้อมูลล่าสุด
  const latestEntry = historyEntries.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })[0]

  console.log(`\n=== ข้อมูลล่าสุดจาก history สำหรับ ${deviceId} ===`)
  console.log(`เวลา: ${latestEntry.timestamp}`)
  console.log(`สถานะ: ${latestEntry.status}`)
  console.log(`ค่า EAR: ${latestEntry.ear}`)
  console.log(`จำนวนการหาว: ${latestEntry.yawn_events}`)
  console.log(`จำนวนความง่วง: ${latestEntry.drowsiness_events}`)
  console.log(`จำนวนเหตุการณ์วิกฤต: ${latestEntry.critical_alerts}`)

  // คำนวณค่าเฉลี่ย EAR
  let totalEAR = 0
  let validEARCount = 0

  historyEntries.forEach((entry) => {
    if (entry.ear && entry.ear > 0) {
      totalEAR += entry.ear
      validEARCount++
    }
  })

  const averageEAR = validEARCount > 0 ? totalEAR / validEARCount : 0
  console.log(`ค่าเฉลี่ย EAR: ${averageEAR.toFixed(4)}`)

  return {
    latestEntry,
    averageEAR,
    historyCount: historyEntries.length,
  }
}

// ฟังก์ชันสำหรับคำนวณคะแนนความปลอดภัย
function calculateSafetyScore(yawnCount, drowsinessCount, criticalCount, averageEAR) {
  let score = 100

  // หักคะแนนตามจำนวนเหตุการณ์
  const yawnDeduction = Math.min(yawnCount * 2, 30)
  const drowsinessDeduction = Math.min(drowsinessCount * 5, 40)
  const criticalDeduction = Math.min(criticalCount * 10, 50)

  // หักคะแนนตามค่า EAR เฉลี่ย
  let earDeduction = 0
  if (averageEAR < 0.25) {
    earDeduction = 20
  } else if (averageEAR < 0.3) {
    earDeduction = 10
  }

  score -= yawnDeduction + drowsinessDeduction + criticalDeduction + earDeduction

  // ปรับคะแนนให้อยู่ในช่วง 0-100
  score = Math.max(0, Math.min(100, score))

  console.log(`\n=== การคำนวณคะแนนความปลอดภัย ===`)
  console.log(`คะแนนเริ่มต้น: 100`)
  console.log(`หักคะแนนจากการหาว: -${yawnDeduction} (${yawnCount} ครั้ง x 2, สูงสุด 30)`)
  console.log(`หักคะแนนจากความง่วง: -${drowsinessDeduction} (${drowsinessCount} ครั้ง x 5, สูงสุด 40)`)
  console.log(`หักคะแนนจากเหตุการณ์วิกฤต: -${criticalDeduction} (${criticalCount} ครั้ง x 10, สูงสุด 50)`)
  console.log(`หักคะแนนจากค่า EAR เฉลี่ย: -${earDeduction} (${averageEAR.toFixed(4)})`)
  console.log(`คะแนนความปลอดภัยสุทธิ: ${score}`)

  return score
}

// ฟังก์ชันสำหรับเปรียบเทียบข้อมูลจาก alerts และ history
function compareData(alertsData, historyData) {
  if (!historyData) return

  const latestEntry = historyData.latestEntry

  console.log(`\n=== เปรียบเทียบข้อมูลจาก alerts และ history ===`)
  console.log(`จำนวนการหาวจาก alerts: ${alertsData.yawnCount}`)
  console.log(`จำนวนการหาวจาก history: ${latestEntry.yawn_events}`)
  console.log(`ความแตกต่าง: ${latestEntry.yawn_events - alertsData.yawnCount}`)

  console.log(`จำนวนความง่วงจาก alerts: ${alertsData.drowsinessCount}`)
  console.log(`จำนวนความง่วงจาก history: ${latestEntry.drowsiness_events}`)
  console.log(`ความแตกต่าง: ${latestEntry.drowsiness_events - alertsData.drowsinessCount}`)

  console.log(`จำนวนเหตุการณ์วิกฤตจาก alerts: ${alertsData.criticalCount}`)
  console.log(`จำนวนเหตุการณ์วิกฤตจาก history: ${latestEntry.critical_alerts}`)
  console.log(`ความแตกต่าง: ${latestEntry.critical_alerts - alertsData.criticalCount}`)
}

// วิเคราะห์ข้อมูลสำหรับ device_01
console.log("\n========== วิเคราะห์ข้อมูลสำหรับ device_01 ==========")
const alertsData_device01 = analyzeAlerts("device_01")
const historyData_device01 = analyzeHistory("device_01")
compareData(alertsData_device01, historyData_device01)

// คำนวณคะแนนความปลอดภัยจากข้อมูล alerts
const safetyScore_alerts = calculateSafetyScore(
  alertsData_device01.yawnCount,
  alertsData_device01.drowsinessCount,
  alertsData_device01.criticalCount,
  historyData_device01.averageEAR,
)

// คำนวณคะแนนความปลอดภัยจากข้อมูล history
const safetyScore_history = calculateSafetyScore(
  historyData_device01.latestEntry.yawn_events,
  historyData_device01.latestEntry.drowsiness_events,
  historyData_device01.latestEntry.critical_alerts,
  historyData_device01.averageEAR,
)

console.log(`\n=== เปรียบเทียบคะแนนความปลอดภัย ===`)
console.log(`คะแนนความปลอดภัยจาก alerts: ${safetyScore_alerts}`)
console.log(`คะแนนความปลอดภัยจาก history: ${safetyScore_history}`)
console.log(`ความแตกต่าง: ${safetyScore_history - safetyScore_alerts}`)

// วิเคราะห์ข้อมูลสำหรับ device_02
console.log("\n========== วิเคราะห์ข้อมูลสำหรับ device_02 ==========")
const alertsData_device02 = analyzeAlerts("device_02")
const historyData_device02 = analyzeHistory("device_02")
compareData(alertsData_device02, historyData_device02)
