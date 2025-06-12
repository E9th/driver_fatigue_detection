/**
 * Date utility functions for the driver fatigue detection system
 */

/**
 * Get today's date range with full day coverage (00:00:00 to 23:59:59)
 */
export function getTodayDateRange(): { start: string; end: string } {
  const today = new Date()

  // Start of day: 00:00:00
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)

  // End of day: 23:59:59
  const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  }
}

/**
 * Get current date range with full day coverage for charts and statistics
 */
export function getCurrentDayFullRange(): { start: string; end: string } {
  const today = new Date()

  // Start: 12:00 AM (00:00:00)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)

  // End: 11:59 PM (23:59:59)
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)

  console.log("📅 Current day full range:", {
    start: start.toISOString(),
    end: end.toISOString(),
    startLocal: start.toLocaleString("th-TH"),
    endLocal: end.toLocaleString("th-TH"),
  })

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Format date for display
 */
export function formatDateForDisplay(date: Date): string {
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

/**
 * Format time for display
 */
export function formatTimeForDisplay(date: Date): string {
  return date.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date()
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  )
}

/**
 * Get date range for a specific number of days back
 */
export function getDateRangeBack(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - days)

  // Set to start of day for start date
  start.setHours(0, 0, 0, 0)
  // Set to end of day for end date
  end.setHours(23, 59, 59, 999)

  return {
    start: start.toISOString(),
    end: end.toISOString(),
  }
}

/**
 * Format date for file names and general use (YYYY-MM-DD)
 */
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toISOString().split("T")[0]
}

/**
 * Format date and time for file names (YYYY-MM-DD_HH-mm-ss)
 */
export function formatDateTimeForFile(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toISOString().replace(/[:.]/g, "-").split(".")[0]
}

/**
 * Get Thailand time
 */
export function getThailandTime(): Date {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + 7 * 60 * 60 * 1000) // UTC+7 for Thailand
}

/**
 * Get this week date range
 */
export function getThisWeekDateRange(): { start: string; end: string } {
  const thailandTime = getThailandTime()
  const dayOfWeek = thailandTime.getDay()

  // Start of week (Sunday)
  const startDate = new Date(thailandTime)
  startDate.setDate(thailandTime.getDate() - dayOfWeek)
  startDate.setHours(0, 0, 0, 0)

  // End of week (Saturday)
  const endDate = new Date(startDate)
  endDate.setDate(startDate.getDate() + 6)
  endDate.setHours(23, 59, 59, 999)

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

/**
 * Get this month date range
 */
export function getThisMonthDateRange(): { start: string; end: string } {
  const thailandTime = getThailandTime()

  // Start of month
  const startDate = new Date(thailandTime.getFullYear(), thailandTime.getMonth(), 1, 0, 0, 0, 0)

  // End of month
  const endDate = new Date(thailandTime.getFullYear(), thailandTime.getMonth() + 1, 0, 23, 59, 59, 999)

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

/**
 * Format Thai date
 */
export function formatThaiDate(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  }

  return dateObj.toLocaleDateString("th-TH", defaultOptions)
}

/**
 * Format Thai time
 */
export function formatThaiTime(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    ...options,
  }

  return dateObj.toLocaleTimeString("th-TH", defaultOptions)
}

/**
 * Format Thai date time
 */
export function formatThaiDateTime(date: Date | string, options: Intl.DateTimeFormatOptions = {}): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  }

  return dateObj.toLocaleString("th-TH", defaultOptions)
}

/**
 * Get relative time
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = getThailandTime()
  const diffMs = now.getTime() - dateObj.getTime()

  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return "เมื่อสักครู่"
  } else if (diffMinutes < 60) {
    return `${diffMinutes} นาทีที่แล้ว`
  } else if (diffHours < 24) {
    return `${diffHours} ชั่วโมงที่แล้ว`
  } else if (diffDays < 7) {
    return `${diffDays} วันที่แล้ว`
  } else {
    return formatThaiDate(dateObj, { month: "short", day: "numeric" })
  }
}

/**
 * Check if date is within last N days
 */
export function isWithinLastDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = getThailandTime()
  const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return dateObj >= daysAgo && dateObj <= now
}

console.log("📅 Date utilities loaded")
