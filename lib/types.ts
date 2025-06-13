// ไฟล์นี้กำหนด type ต่างๆ สำหรับใช้ในแอปพลิเคชัน

// ข้อมูลผู้ใช้
export interface UserProfile {
  id: string
  name: string
  email: string
  role: string
  deviceId: string
  created: string
  lastLogin: string
  company?: string
  position?: string
  companyName?: string
}

// ข้อมูลอุปกรณ์ปัจจุบัน
export interface DeviceData {
  device_id: string
  timestamp: string
  ear: number
  mouth_distance: number
  status: string
  yawn_events: number
  drowsiness_events: number
  critical_alerts: number
  face_detected_frames: number
  system_info?: {
    device_name: string
    version: string
    location: string
  }
}

// ข้อมูลประวัติ
export interface HistoricalData {
  id: string
  timestamp: string
  ear: number
  ear_value: number
  mouth_distance: number
  status: string
  yawn_events: number
  drowsiness_events: number
  critical_alerts: number
  device_id: string
  face_detected_frames: number
}

// ข้อมูลสถิติรายวัน
export interface DailyStats {
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  totalSessions: number
  averageEAR: number
  averageMouthDistance: number
  statusDistribution: { [key: string]: number }
}

// ข้อมูลรายงาน
export interface ReportData {
  stats: DailyStats
  trends: {
    yawnTrend: string
    drowsinessTrend: string
    alertnessTrend: string
  }
  recommendations: string[]
}

// ข้อมูล cache
export interface CacheItem<T> {
  data: T
  timestamp: number
  key: string
}

// ข้อมูลสถิติระบบ
export interface SystemStats {
  totalDevices: number
  activeDevices: number
  totalUsers: number
  adminUsers: number
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  systemUptime: number
  hourlyActivity: {
    hour: number
    yawns: number
    drowsiness: number
    alerts: number
    activeDevices: number
  }[]
  riskDistribution: {
    safe: number
    warning: number
    danger: number
    critical: number
  }
}

// ข้อมูลความปลอดภัย
export interface SafetyData {
  deviceId: string
  events: {
    id: string
    timestamp: string
    type: string
    severity: number
    details?: string
  }[]
  safetyScore: number
  startDate: string
  endDate: string
  stats: {
    yawnEvents: number
    fatigueEvents: number
    criticalEvents: number
    averageEAR: number
  }
}
