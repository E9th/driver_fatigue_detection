/**
 * ============================================================================
 * TYPE DEFINITIONS - การกำหนดประเภทข้อมูลทั้งระบบ
 * ============================================================================
 *
 * ไฟล์นี้รวบรวม Type Definitions ทั้งหมดที่ใช้ในระบบ
 * เพื่อให้ TypeScript สามารถตรวจสอบประเภทข้อมูลได้อย่างถูกต้อง
 *
 * CATEGORIES:
 * - Sensor Data Types: ข้อมูลจากเซ็นเซอร์
 * - User Data Types: ข้อมูลผู้ใช้
 * - Dashboard Types: ข้อมูลสำหรับแสดงผล
 * - Utility Types: ประเภทข้อมูลเสริม
 *
 * USED BY:
 * - ทุกไฟล์ในระบบที่ต้องการ type safety
 * - Components สำหรับ props validation
 * - API functions สำหรับ parameter และ return types
 */

/**
 * ข้อมูลจากเซ็นเซอร์ตรวจจับความเหนื่อยล้า
 *
 * SENSOR VALUES:
 * - ear: ระดับการเปิด-ปิดตา (0 = ปิดสนิท, 1 = เปิดเต็มที่)
 * - mouth: ระดับการเปิดปาก (0 = ปิดสนิท, 1 = เปิดเต็มที่)
 * - safety_score: คะแนนความปลอดภัย (0-100, 100 = ปลอดภัยที่สุด)
 * - timestamp: เวลาที่บันทึกข้อมูล (Unix timestamp)
 *
 * DATA SOURCE: Raspberry Pi + OpenCV
 * FIREBASE PATH: /sensor_data/{deviceId}/{timestamp}/
 */
export interface SensorData {
  timestamp: number
  ear: number // 0.0 - 1.0
  mouth: number // 0.0 - 1.0
  safety_score: number // 0 - 100
}

/**
 * ข้อมูลผู้ใช้ในระบบ
 *
 * USER ROLES:
 * - 'user': ผู้ใช้ทั่วไป (ผู้ขับขี่)
 * - 'admin': ผู้ดูแลระบบ
 *
 * FIREBASE PATH: /users/{uid}/
 */
export interface UserData {
  uid: string
  email: string
  fullName: string
  phone: string
  license: string // เลขใบขับขี่
  deviceId: string // device_01, device_02, etc.
  role: "user" | "admin"
  createdAt: number
  lastLogin: number
}

/**
 * สถิติสำหรับแสดงใน Dashboard
 *
 * METRICS EXPLANATION:
 * - averageSafetyScore: คะแนนความปลอดภัยเฉลี่ยในช่วงเวลาที่เลือก
 * - totalAlerts: จำนวนการแจ้งเตือนทั้งหมด
 * - fatigueEvents: จำนวนครั้งที่ตรวจพบความเหนื่อยล้าระดับสูง
 * - activeTime: เวลาที่ใช้งานระบบ (นาที)
 * - lastUpdate: เวลาที่อัปเดตข้อมูลล่าสุด
 *
 * USED BY: Dashboard components
 */
export interface DashboardStats {
  averageSafetyScore: number // 0-100
  totalAlerts: number
  fatigueEvents: number
  activeTime: number // minutes
  lastUpdate: number // timestamp
}

/**
 * ช่วงเวลาสำหรับการแสดงข้อมูล
 *
 * TIME RANGES:
 * - '1h': 1 ชั่วโมงที่ผ่านมา
 * - '6h': 6 ชั่วโมงที่ผ่านมา
 * - '24h': 24 ชั่วโมงที่ผ่านมา (1 วัน)
 * - '7d': 7 วันที่ผ่านมา
 *
 * USED BY: Chart components, Data filtering
 */
export type TimeRange = "1h" | "6h" | "24h" | "7d"

/**
 * ระดับความเสี่ยงจากการวิเคราะห์
 *
 * RISK LEVELS:
 * - 'low': ความเสี่ยงต่ำ (Safety Score > 70)
 * - 'medium': ความเสี่ยงปานกลาง (Safety Score 50-70)
 * - 'high': ความเสี่ยงสูง (Safety Score < 50)
 *
 * COLOR CODING:
 * - low: เขียว (#10B981)
 * - medium: เหลือง (#F59E0B)
 * - high: แดง (#EF4444)
 */
export type RiskLevel = "low" | "medium" | "high"

/**
 * ข้อมูลการแจ้งเตือน
 *
 * ALERT TYPES:
 * - 'fatigue': ตรวจพบความเหนื่อยล้า
 * - 'eye_closure': ตาปิดนานเกินไป
 * - 'yawning': หาวบ่อยเกินไป
 * - 'low_safety': คะแนนความปลอดภัยต่ำ
 *
 * FIREBASE PATH: /alerts/{deviceId}/{timestamp}/
 */
export interface AlertData {
  id: string
  deviceId: string
  type: "fatigue" | "eye_closure" | "yawning" | "low_safety"
  severity: RiskLevel
  message: string
  timestamp: number
  acknowledged: boolean // ผู้ใช้รับทราบแล้วหรือไม่
}

/**
 * คำสั่งส่งไปยังอุปกรณ์
 *
 * COMMAND TYPES:
 * - 'alert': เล่นเสียงแจ้งเตือน
 * - 'call': โทรหาผู้ใช้
 * - 'notification': ส่งการแจ้งเตือน
 * - 'restart': รีสตาร์ทระบบ
 *
 * FIREBASE PATH: /device_commands/{deviceId}/
 */
export interface DeviceCommand {
  id: string
  deviceId: string
  command: "alert" | "call" | "notification" | "restart"
  parameters?: Record<string, any>
  timestamp: number
  status: "pending" | "executing" | "completed" | "failed"
  response?: string
}

/**
 * การตั้งค่าของผู้ใช้
 *
 * SETTINGS CATEGORIES:
 * - alertThreshold: เกณฑ์การแจ้งเตือน
 * - soundEnabled: เปิด/ปิดเสียงแจ้งเตือน
 * - autoCall: โทรอัตโนมัติเมื่อตรวจพบความเสี่ยงสูง
 * - dataRetention: ระยะเวลาเก็บข้อมูล (วัน)
 *
 * FIREBASE PATH: /user_settings/{uid}/
 */
export interface UserSettings {
  uid: string
  alertThreshold: number // 0-100, แจ้งเตือนเมื่อ safety_score ต่ำกว่านี้
  soundEnabled: boolean
  autoCall: boolean
  dataRetention: number // วัน
  updatedAt: number
}

/**
 * ข้อมูลสำหรับกราฟและชาร์ต
 *
 * CHART TYPES:
 * - 'line': กราฟเส้น
 * - 'bar': กราฟแท่ง
 * - 'area': กราฟพื้นที่
 * - 'pie': กราฟวงกลม
 *
 * USED BY: Chart components
 */
export interface ChartDataPoint {
  timestamp: number
  value: number
  label?: string
  color?: string
}

export interface ChartConfig {
  type: "line" | "bar" | "area" | "pie"
  title: string
  xAxisLabel?: string
  yAxisLabel?: string
  colors?: string[]
  showLegend?: boolean
  showGrid?: boolean
}

/**
 * ข้อมูลสำหรับรายงาน
 *
 * REPORT TYPES:
 * - 'daily': รายงานประจำวัน
 * - 'weekly': รายงานประจำสัปดาห์
 * - 'monthly': รายงานประจำเดือน
 * - 'custom': รายงานช่วงเวลาที่กำหนดเอง
 *
 * USED BY: Report generation components
 */
export interface ReportData {
  id: string
  type: "daily" | "weekly" | "monthly" | "custom"
  deviceId: string
  startDate: number
  endDate: number
  stats: DashboardStats
  alerts: AlertData[]
  generatedAt: number
  generatedBy: string // uid ของผู้สร้างรายงาน
}

/**
 * การตอบสนองจาก API
 *
 * STANDARD API RESPONSE FORMAT:
 * - success: สถานะความสำเร็จ
 * - data: ข้อมูลที่ส่งคืน (ถ้ามี)
 * - error: ข้อความแสดงข้อผิดพลาด (ถ้ามี)
 * - timestamp: เวลาที่ตอบสนอง
 *
 * USED BY: API functions และ error handling
 */
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

/**
 * ข้อมูลการเชื่อมต่อของอุปกรณ์
 *
 * CONNECTION STATUS:
 * - 'online': เชื่อมต่ออยู่
 * - 'offline': ไม่ได้เชื่อมต่อ
 * - 'unknown': ไม่ทราบสถานะ
 *
 * USED BY: Connection monitoring components
 */
export interface DeviceStatus {
  deviceId: string
  status: "online" | "offline" | "unknown"
  lastSeen: number // timestamp ของข้อมูลล่าสุด
  batteryLevel?: number // 0-100 (ถ้ามี)
  signalStrength?: number // 0-100 (ถ้ามี)
}

/**
 * ข้อมูลสำหรับการส่งออก (Export)
 *
 * EXPORT FORMATS:
 * - 'csv': Comma-separated values
 * - 'json': JavaScript Object Notation
 * - 'pdf': Portable Document Format
 * - 'xlsx': Excel spreadsheet
 *
 * USED BY: Data export components
 */
export interface ExportConfig {
  format: "csv" | "json" | "pdf" | "xlsx"
  dateRange: {
    start: number
    end: number
  }
  includeAlerts: boolean
  includeStats: boolean
  deviceIds: string[]
}

/**
 * ข้อมูลการใช้งาน Firebase
 *
 * USAGE METRICS:
 * - reads: จำนวนการอ่านข้อมูล
 * - writes: จำนวนการเขียนข้อมูล
 * - storage: ขนาดข้อมูลที่ใช้ (bytes)
 * - bandwidth: ปริมาณข้อมูลที่ถ่ายโอน (bytes)
 *
 * USED BY: Usage monitoring components
 */
export interface FirebaseUsage {
  date: string // YYYY-MM-DD
  reads: number
  writes: number
  storage: number // bytes
  bandwidth: number // bytes
  cost?: number // USD (ถ้าคำนวณได้)
}
