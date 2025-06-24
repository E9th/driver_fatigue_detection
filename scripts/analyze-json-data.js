// วิเคราะห์ข้อมูล JSON เพื่อหาจำนวนที่แท้จริง
const jsonData = {
  alerts: {
    // มี 44 alerts ทั้งหมด
    "20250608_184213_079764": { alert_type: "yawn_detected", device_id: "device_01" },
    // ... (รวม 44 รายการ)
  },
  devices: {
    device_01: {
      current_data: {
        critical_alerts: 4,
        drowsiness_events: 16,
        yawn_events: 14,
        ear: 0.23998149030529695,
      },
    },
  },
  users: {
    // มี 3 users: 2 drivers, 1 admin
    REOkc2ja2keQSeoJgibxNjiKsrz2: { role: "driver", deviceId: "device_02" },
    sS1hDJhxOYXAmkvtpv5ysKNZCWx2: { role: "driver", deviceId: "device_01" },
    v8Mj0kz30ve0iULCBT73uK6DgAi2: { role: "admin", deviceId: "null" },
  },
}

console.log("=== การวิเคราะห์ข้อมูล JSON ===")

// นับ alerts
const alertsCount = Object.keys(jsonData.alerts).length
const yawnAlerts = Object.values(jsonData.alerts).filter((alert) => alert.alert_type === "yawn_detected").length
const drowsinessAlerts = Object.values(jsonData.alerts).filter(
  (alert) => alert.alert_type === "drowsiness_detected",
).length
const criticalAlerts = Object.values(jsonData.alerts).filter(
  (alert) => alert.alert_type === "critical_drowsiness",
).length

console.log("📊 Alerts Analysis:")
console.log(`- Total alerts: ${alertsCount}`)
console.log(`- Yawn alerts: ${yawnAlerts}`)
console.log(`- Drowsiness alerts: ${drowsinessAlerts}`)
console.log(`- Critical alerts: ${criticalAlerts}`)

// นับ devices
const devicesCount = Object.keys(jsonData.devices).length
const activeDevices = Object.values(jsonData.devices).filter(
  (device) => (device.current_data && device.current_data.yawn_events > 0) || device.current_data.drowsiness_events > 0,
).length

console.log("\n🔧 Devices Analysis:")
console.log(`- Total devices in Firebase: ${devicesCount}`)
console.log(`- Active devices with data: ${activeDevices}`)

// นับ users
const usersCount = Object.keys(jsonData.users).length
const drivers = Object.values(jsonData.users).filter((user) => user.role === "driver").length
const admins = Object.values(jsonData.users).filter((user) => user.role === "admin").length

console.log("\n👥 Users Analysis:")
console.log(`- Total users: ${usersCount}`)
console.log(`- Drivers: ${drivers}`)
console.log(`- Admins: ${admins}`)

// Current data analysis
const device01Data = jsonData.devices.device_01.current_data
console.log("\n📈 Current Data (device_01):")
console.log(`- Yawn events: ${device01Data.yawn_events}`)
console.log(`- Drowsiness events: ${device01Data.drowsiness_events}`)
console.log(`- Critical alerts: ${device01Data.critical_alerts}`)
console.log(`- Average EAR: ${device01Data.ear.toFixed(3)}`)

console.log("\n❌ ปัญหาที่พบ:")
console.log("1. Admin analytics service ไม่ได้ใช้ current_data")
console.log("2. ไม่ได้นับ alerts จาก alerts collection")
console.log("3. ไม่ได้ตรวจสอบ devices ที่มีข้อมูลจริงใน Firebase")
console.log("4. การคำนวณ risk score ไม่ถูกต้อง")
