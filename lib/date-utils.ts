/**
 * Date Utilities
 * Specialized date handling functions for the application
 */

import { APP_CONFIG } from "./config"

/**
 * Get current date and time in Thailand timezone
 * @returns Date object adjusted for Thailand timezone
 */
export const getThailandTime = (): Date => {
  const now = new Date()
  const utc = now.getTime() + now.getTimezoneOffset() * 60000
  return new Date(utc + APP_CONFIG.THAILAND_TIMEZONE_OFFSET * 60000)
}

/**
 * Get today's date range for data filtering
 * @returns Object with start and end ISO strings for today
 */
export const getTodayDateRange = () => {
  const thailandTime = getThailandTime()

  const startDate = new Date(thailandTime.getFullYear(), thailandTime.getMonth(), thailandTime.getDate(), 0, 0, 0, 0)

  const endDate = new Date(thailandTime.getFullYear(), thailandTime.getMonth(), thailandTime.getDate(), 23, 59, 59, 999)

  return {
    start: startDate.toISOString(),
    end: endDate.toISOString(),
  }
}

/**
 * Get date range for the current week
 * @returns Object with start and end ISO strings for current week
 */
export const getThisWeekDateRange = () => {
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
 * Get date range for the current month
 * @returns Object with start and end ISO strings for current month
 */
export const getThisMonthDateRange = () => {
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
 * Format date for display in Thai locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatThaiDate = (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
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
 * Format time for display in Thai locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted time string
 */
export const formatThaiTime = (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
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
 * Format date and time for display in Thai locale
 * @param date - Date to format
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date and time string
 */
export const formatThaiDateTime = (date: Date | string, options: Intl.DateTimeFormatOptions = {}): string => {
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
 * Get relative time string (e.g., "2 hours ago")
 * @param date - Date to compare
 * @returns Relative time string in Thai
 */
export const getRelativeTime = (date: Date | string): string => {
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
 * Check if date is today
 * @param date - Date to check
 * @returns Boolean indicating if date is today
 */
export const isToday = (date: Date | string): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const today = getTodayDateRange()
  const dateTime = dateObj.getTime()

  return dateTime >= new Date(today.start).getTime() && dateTime <= new Date(today.end).getTime()
}

/**
 * Check if date is within the last N days
 * @param date - Date to check
 * @param days - Number of days to check
 * @returns Boolean indicating if date is within range
 */
export const isWithinLastDays = (date: Date | string, days: number): boolean => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const now = getThailandTime()
  const daysAgo = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

  return dateObj >= daysAgo && dateObj <= now
}

/**
 * Format date for file names and general use
 * @param date - Date to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export const formatDate = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toISOString().split("T")[0]
}

/**
 * Format date and time for file names
 * @param date - Date to format
 * @returns Formatted date and time string (YYYY-MM-DD_HH-mm-ss)
 */
export const formatDateTimeForFile = (date: Date | string): string => {
  const dateObj = typeof date === "string" ? new Date(date) : date
  return dateObj.toISOString().replace(/[:.]/g, "-").split(".")[0]
}

console.log("📅 Date utilities loaded")
