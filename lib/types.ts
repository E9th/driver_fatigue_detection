/**
 * Type Definitions
 * Centralized type definitions for the entire application
 */

// Core Data Types
export interface DeviceData {
  critical_alerts: number
  device_id: string
  drowsiness_events: number
  ear: number
  face_detected_frames: number
  mouth_distance: number
  status: string
  system_info: {
    device_name: string
    location: string
    version: string
  }
  timestamp: string
  yawn_events: number
}

export interface HistoricalData {
  id?: string
  timestamp: string
  ear_value?: number
  ear?: number
  yawn_events: number
  drowsiness_events: number
  critical_alerts: number
  device_id: string
  status?: string
  mouth_distance?: number
  face_detected_frames?: number
}

// Statistics and Analytics Types
export interface DailyStats {
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  totalSessions: number
  averageEAR: number
  averageMouthDistance: number
  statusDistribution: { [status: string]: number }
}

export interface SystemStats {
  totalDevices: number
  activeDevices: number
  totalDrivers: number
  totalAdmins: number
  systemUptime: number
  totalEvents: {
    yawns: number
    drowsiness: number
    alerts: number
  }
  deviceComparison: DeviceStats[]
  hourlySystemActivity: HourlyActivity[]
  riskLevels: RiskLevel[]
}

export interface DeviceStats {
  deviceId: string
  userName: string
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  averageEAR: number
  riskScore: number
  lastActive: string
  status: "active" | "inactive" | "warning" | "critical"
}

export interface HourlyActivity {
  hour: string
  totalYawns: number
  totalDrowsiness: number
  totalAlerts: number
  activeDevices: number
}

export interface RiskLevel {
  level: string
  count: number
  percentage: number
  color: string
}

// User and Authentication Types
export interface UserProfile {
  uid: string
  role: "admin" | "driver"
  fullName: string
  email: string
  phone: string
  license: string
  deviceId: string | null
  registeredAt: string
  promotedToAdminAt?: string
}

export interface RegisterData {
  fullName: string
  email: string
  password: string
  phone: string
  license: string
  deviceId: string
  role?: string
}

// Component Props Types
export interface SafetyDashboardProps {
  deviceId: string
  viewMode?: "user" | "admin"
}

export interface DateRange {
  start: string
  end: string
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

export interface AuthResponse {
  success: boolean
  user?: any
  error?: string
}

// Cache and Performance Types
export interface CacheItem<T> {
  data: T
  timestamp: number
  key: string
}

export interface SubscriptionOptions {
  throttle?: number
  useCache?: boolean
  limit?: number
  pageSize?: number
}

// Chart and Visualization Types
export interface ChartDataPoint {
  timestamp: string
  ear: number
  yawns: number
  drowsiness: number
  alerts: number
}

export interface ReportData {
  stats: DailyStats
  trends: {
    yawnTrend: string
    drowsinessTrend: string
    alertnessTrend: string
  }
  recommendations: string[]
}
