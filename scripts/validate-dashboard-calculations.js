/**
 * ============================================================================
 * DASHBOARD VALIDATION SCRIPT - ตรวจสอบความถูกต้องของการคำนวณใน Dashboard
 * ============================================================================
 *
 * สคริปต์นี้จะวิเคราะห์ข้อมูลจริงจาก Firebase และตรวจสอบว่า:
 * 1. การคำนวณสถิติใน dashboard ถูกต้องหรือไม่
 * 2. การแสดงผลข้อมูลตรงกับข้อมูลจริงหรือไม่
 * 3. สูตรการคำนวณ Safety Score ถูกต้องหรือไม่
 */

import fs from "fs"

// อ่านข้อมูลจากไฟล์ JSON
const databaseData = JSON.parse(fs.readFileSync("./scripts/database-export.json", "utf8"))

console.log("🔍 เริ่มต้นการวิเคราะห์ข้อมูล Dashboard...\n")

// ============================================================================
// 1. วิเคราะห์ข้อมูล Alerts
// ============================================================================
function analyzeAlerts() {
  console.log("📊 === การวิเคราะห์ Alerts ===")

  const alerts = databaseData.alerts || {}
  const alertsArray = Object.values(alerts)

  console.log(`📈 จำนวน Alerts ทั้งหมด: ${alertsArray.length}`)

  // แยกตาม device
  const device01Alerts = alertsArray.filter((alert) => alert.device_id === "device_01")
  const device02Alerts = alertsArray.filter((alert) => alert.device_id === "device_02")

  console.log(`📱 Device 01 Alerts: ${device01Alerts.length}`)
  console.log(`📱 Device 02 Alerts: ${device02Alerts.length}`)

  // แยกตามประเภท
  const alertTypes = {
    yawn_detected: alertsArray.filter((a) => a.alert_type === "yawn_detected").length,
    drowsiness_detected: alertsArray.filter((a) => a.alert_type === "drowsiness_detected").length,
    critical_drowsiness: alertsArray.filter((a) => a.alert_type === "critical_drowsiness").length,
  }

  console.log("📋 แยกตามประเภท:")
  console.log(`   🥱 Yawn Detected: ${alertTypes.yawn_detected}`)
  console.log(`   😴 Drowsiness Detected: ${alertTypes.drowsiness_detected}`)
  console.log(`   🚨 Critical Drowsiness: ${alertTypes.critical_drowsiness}`)

  // แยกตาม severity
  const severityCount = {
    low: alertsArray.filter((a) => a.severity === "low").length,
    medium: alertsArray.filter((a) => a.severity === "medium").length,
    high: alertsArray.filter((a) => a.severity === "high").length,
  }

  console.log("⚠️ แยกตาม Severity:")
  console.log(`   🟢 Low: ${severityCount.low}`)
  console.log(`   🟡 Medium: ${severityCount.medium}`)
  console.log(`   🔴 High: ${severityCount.high}`)

  return { alertsArray, device01Alerts, device02Alerts, alertTypes, severityCount }
}

// ============================================================================
// 2. วิเคราะห์ข้อมูล History
// ============================================================================
function analyzeHistory() {
  console.log("\n📊 === การวิเคราะห์ History Data ===")

  const devices = databaseData.devices || {}

  Object.keys(devices).forEach((deviceId) => {
    const device = devices[deviceId]
    const history = device.history || {}
    const historyArray = Object.values(history)

    console.log(`\n📱 ${deviceId.toUpperCase()}:`)
    console.log(`   📈 จำนวน History Records: ${historyArray.length}`)

    if (historyArray.length > 0) {
      // คำนวณค่าเฉลี่ย EAR
      const validEARRecords = historyArray.filter((h) => h.ear && h.ear > 0)
      const avgEAR =
        validEARRecords.length > 0 ? validEARRecords.reduce((sum, h) => sum + h.ear, 0) / validEARRecords.length : 0

      // รวมจำนวน events
      const totalYawns = historyArray.reduce((sum, h) => sum + (h.yawn_events || 0), 0)
      const totalDrowsiness = historyArray.reduce((sum, h) => sum + (h.drowsiness_events || 0), 0)
      const totalCritical = historyArray.reduce((sum, h) => sum + (h.critical_alerts || 0), 0)

      console.log(`   👁️ ค่าเฉลี่ย EAR: ${avgEAR.toFixed(4)}`)
      console.log(`   🥱 รวม Yawn Events: ${totalYawns}`)
      console.log(`   😴 รวม Drowsiness Events: ${totalDrowsiness}`)
      console.log(`   🚨 รวม Critical Alerts: ${totalCritical}`)

      // ข้อมูลล่าสุด
      const latestRecord = historyArray.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      )[0]

      console.log(`   📅 ข้อมูลล่าสุด: ${new Date(latestRecord.timestamp).toLocaleString("th-TH")}`)
      console.log(`   📊 สถานะล่าสุด: ${latestRecord.status}`)
    }
  })
}

// ============================================================================
// 3. คำนวณ Safety Score ตามสูตรจริง
// ============================================================================
function calculateSafetyScore(yawnCount, drowsinessCount, criticalCount, averageEAR) {
  let score = 100

  // หักคะแนนตามจำนวนเหตุการณ์ (ตามสูตรใน data-analyzer.ts)
  score -= Math.min(yawnCount * 2, 30) // หักสูงสุด 30 คะแนนสำหรับการหาว
  score -= Math.min(drowsinessCount * 5, 40) // หักสูงสุด 40 คะแนนสำหรับความง่วง
  score -= Math.min(criticalCount * 10, 50) // หักสูงสุด 50 คะแนนสำหรับเหตุการณ์วิกฤต

  // หักคะแนนตามค่า EAR เฉลี่ย
  if (averageEAR < 0.25 && averageEAR > 0) {
    score -= 20
  } else if (averageEAR < 0.3 && averageEAR > 0) {
    score -= 10
  }

  // ปรับคะแนนให้อยู่ในช่วง 0-100
  return Math.max(0, Math.min(100, score))
}

// ============================================================================
// 4. ตรวจสอบความถูกต้องของการคำนวณ
// ============================================================================
function validateCalculations() {
  console.log("\n🔍 === การตรวจสอบความถูกต้องของการคำนวณ ===")

  const { alertsArray, alertTypes } = analyzeAlerts()
  const devices = databaseData.devices || {}

  // ตรวจสอบแต่ละ device
  Object.keys(devices).forEach((deviceId) => {
    console.log(`\n📱 ตรวจสอบ ${deviceId.toUpperCase()}:`)

    const device = devices[deviceId]
    const history = device.history || {}
    const historyArray = Object.values(history)

    // ข้อมูลจาก alerts
    const deviceAlerts = alertsArray.filter((alert) => alert.device_id === deviceId)
    const alertYawns = deviceAlerts.filter((a) => a.alert_type === "yawn_detected").length
    const alertDrowsiness = deviceAlerts.filter((a) => a.alert_type === "drowsiness_detected").length
    const alertCritical = deviceAlerts.filter((a) => a.alert_type === "critical_drowsiness").length

    // ข้อมูลจาก history
    const validEARRecords = historyArray.filter((h) => h.ear && h.ear > 0)
    const avgEAR =
      validEARRecords.length > 0 ? validEARRecords.reduce((sum, h) => sum + h.ear, 0) / validEARRecords.length : 0

    const historyYawns = historyArray.reduce((sum, h) => sum + (h.yawn_events || 0), 0)
    const historyDrowsiness = historyArray.reduce((sum, h) => sum + (h.drowsiness_events || 0), 0)
    const historyCritical = historyArray.reduce((sum, h) => sum + (h.critical_alerts || 0), 0)

    // คำนวณ Safety Score
    const safetyScoreFromAlerts = calculateSafetyScore(alertYawns, alertDrowsiness, alertCritical, avgEAR)
    const safetyScoreFromHistory = calculateSafetyScore(historyYawns, historyDrowsiness, historyCritical, avgEAR)

    console.log("📊 เปรียบเทียบข้อมูล:")
    console.log("   📈 จาก Alerts Collection:")
    console.log(`      🥱 Yawns: ${alertYawns}`)
    console.log(`      😴 Drowsiness: ${alertDrowsiness}`)
    console.log(`      🚨 Critical: ${alertCritical}`)
    console.log(`      🎯 Safety Score: ${safetyScoreFromAlerts}`)

    console.log("   📈 จาก History Collection:")
    console.log(`      🥱 Yawns: ${historyYawns}`)
    console.log(`      😴 Drowsiness: ${historyDrowsiness}`)
    console.log(`      🚨 Critical: ${historyCritical}`)
    console.log(`      🎯 Safety Score: ${safetyScoreFromHistory}`)

    console.log(`   👁️ ค่าเฉลี่ย EAR: ${avgEAR.toFixed(4)}`)

    // ตรวจสอบความสอดคล้อง
    const isConsistent = Math.abs(safetyScoreFromAlerts - safetyScoreFromHistory) <= 10
    console.log(
      `   ✅ ความสอดคล้อง: ${isConsistent ? "ผ่าน" : "ไม่ผ่าน"} (ต่างกัน ${Math.abs(safetyScoreFromAlerts - safetyScoreFromHistory)} คะแนน)`,
    )
  })
}

// ============================================================================
// 5. ตรวจสอบข้อมูลผู้ใช้
// ============================================================================
function analyzeUsers() {
  console.log("\n👥 === การวิเคราะห์ข้อมูลผู้ใช้ ===")

  const users = databaseData.users || {}
  const usersArray = Object.values(users)

  console.log(`📈 จำนวนผู้ใช้ทั้งหมด: ${usersArray.length}`)

  const drivers = usersArray.filter((u) => u.role === "driver")
  const admins = usersArray.filter((u) => u.role === "admin")

  console.log(`🚗 ผู้ขับขี่: ${drivers.length}`)
  console.log(`👨‍💼 ผู้ดูแลระบบ: ${admins.length}`)

  console.log("\n📋 รายละเอียดผู้ใช้:")
  usersArray.forEach((user) => {
    console.log(`   👤 ${user.fullName} (${user.role})`)
    console.log(`      📧 Email: ${user.email}`)
    console.log(`      📱 Device: ${user.deviceId || "ไม่ได้กำหนด"}`)
    if (user.lastLogin) {
      console.log(`      🕐 เข้าสู่ระบบล่าสุด: ${new Date(user.lastLogin).toLocaleString("th-TH")}`)
    }
  })
}

// ============================================================================
// 6. สรุปผลการตรวจสอบ
// ============================================================================
function generateSummary() {
  console.log("\n📋 === สรุปผลการตรวจสอบ ===")

  const alerts = Object.values(databaseData.alerts || {})
  const devices = Object.keys(databaseData.devices || {})
  const users = Object.values(databaseData.users || {})

  console.log("📊 ภาพรวมระบบ:")
  console.log(`   📱 จำนวนอุปกรณ์: ${devices.length}`)
  console.log(`   👥 จำนวนผู้ใช้: ${users.length}`)
  console.log(`   🚨 จำนวน Alerts: ${alerts.length}`)

  // ช่วงเวลาข้อมูล
  const timestamps = alerts.map((a) => new Date(a.timestamp).getTime())
  if (timestamps.length > 0) {
    const minTime = new Date(Math.min(...timestamps))
    const maxTime = new Date(Math.max(...timestamps))
    console.log(`   📅 ช่วงเวลาข้อมูล: ${minTime.toLocaleDateString("th-TH")} - ${maxTime.toLocaleDateString("th-TH")}`)
  }

  console.log("\n✅ ข้อเสนอแนะสำหรับ Dashboard:")
  console.log("   1. ควรใช้ข้อมูลจาก History Collection เป็นหลัก เพราะมีข้อมูลครบถ้วนกว่า")
  console.log("   2. ข้อมูลจาก Alerts Collection ใช้สำหรับแสดงเหตุการณ์ล่าสุด")
  console.log("   3. การคำนวณ Safety Score ควรพิจารณาจากข้อมูลสะสมใน History")
  console.log("   4. ควรมีการ sync ข้อมูลระหว่าง Alerts และ History ให้สอดคล้องกัน")
}

// ============================================================================
// เรียกใช้งานฟังก์ชันทั้งหมด
// ============================================================================
try {
  analyzeAlerts()
  analyzeHistory()
  validateCalculations()
  analyzeUsers()
  generateSummary()

  console.log("\n🎉 การวิเคราะห์เสร็จสิ้น!")
} catch (error) {
  console.error("❌ เกิดข้อผิดพลาดในการวิเคราะห์:", error.message)
}
