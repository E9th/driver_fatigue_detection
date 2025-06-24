/**
 * Debug Utilities
 * Helper functions for debugging and troubleshooting
 */

import { monitoringService } from "./monitoring"
import { printFunctionDoc } from "./function-map"
import { dataService } from "./data-service"

interface DebugInfo {
  timestamp: string
  component: string
  function: string
  parameters: any
  result?: any
  error?: string
  duration?: number
}

class DebugUtils {
  private debugLogs: DebugInfo[] = []
  private readonly MAX_DEBUG_LOGS = 50

  /**
   * Log function call with parameters and result
   */
  logFunctionCall(
    component: string,
    functionName: string,
    parameters: any,
    result?: any,
    error?: string,
    duration?: number,
  ) {
    const debugInfo: DebugInfo = {
      timestamp: new Date().toISOString(),
      component,
      function: functionName,
      parameters,
      result,
      error,
      duration,
    }

    this.debugLogs.unshift(debugInfo)

    if (this.debugLogs.length > this.MAX_DEBUG_LOGS) {
      this.debugLogs = this.debugLogs.slice(0, this.MAX_DEBUG_LOGS)
    }

    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(`🐛 ${component}.${functionName}:`, {
        parameters,
        result: result ? "Success" : "No result",
        error,
        duration: duration ? `${duration}ms` : "N/A",
      })
    }
  }

  /**
   * Get recent debug logs
   */
  getDebugLogs(limit = 10): DebugInfo[] {
    return this.debugLogs.slice(0, limit)
  }

  /**
   * Get debug logs for specific function
   */
  getLogsForFunction(functionName: string): DebugInfo[] {
    return this.debugLogs.filter((log) => log.function === functionName)
  }

  /**
   * Get debug logs for specific component
   */
  getLogsForComponent(component: string): DebugInfo[] {
    return this.debugLogs.filter((log) => log.component === component)
  }

  /**
   * Analyze function performance
   */
  analyzeFunctionPerformance(functionName: string) {
    const logs = this.getLogsForFunction(functionName)
    const durations = logs.filter((log) => log.duration).map((log) => log.duration!)

    if (durations.length === 0) {
      console.log(`📊 No performance data for ${functionName}`)
      return
    }

    const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const min = Math.min(...durations)
    const max = Math.max(...durations)

    console.log(`📊 Performance Analysis for ${functionName}:`)
    console.log(`   Average: ${avg.toFixed(2)}ms`)
    console.log(`   Min: ${min}ms`)
    console.log(`   Max: ${max}ms`)
    console.log(`   Calls: ${durations.length}`)
  }

  /**
   * Check system health
   */
  checkSystemHealth() {
    const metrics = monitoringService.getMetrics()
    const errors = monitoringService.getErrorLogs(5)
    const cacheHitRate = monitoringService.getCacheHitRate()

    console.log("🏥 System Health Check:")
    console.log(`   Firebase Reads: ${metrics.firebaseReads}`)
    console.log(`   Firebase Writes: ${metrics.firebaseWrites}`)
    console.log(`   Cache Hit Rate: ${cacheHitRate.toFixed(1)}%`)
    console.log(`   Active Listeners: ${metrics.activeListeners}`)
    console.log(`   Error Count: ${metrics.errorCount}`)
    console.log(`   Recent Errors: ${errors.length}`)

    if (errors.length > 0) {
      console.log("   Latest Errors:")
      errors.forEach((error) => {
        console.log(`     - ${error.component}.${error.function}: ${error.error}`)
      })
    }
  }

  /**
   * Test Firebase connection
   */
  async testFirebaseConnection() {
    console.log("🔥 Testing Firebase connection...")

    try {
      // Test with a simple device count query
      const { getDeviceCount } = await import("./firebase")
      const startTime = Date.now()
      const count = await getDeviceCount()
      const duration = Date.now() - startTime

      console.log(`✅ Firebase connection OK - ${count} devices found in ${duration}ms`)
      return true
    } catch (error) {
      console.error("❌ Firebase connection failed:", error)
      return false
    }
  }

  /**
   * Test data service cache
   */
  testDataServiceCache() {
    console.log("💾 Testing data service cache...")
    console.log(`   Cache size: ${dataService.getCacheSize()}`)
    console.log(`   Active listeners: ${dataService.getActiveListenersCount()}`)

    const metrics = monitoringService.getMetrics()
    const hitRate = monitoringService.getCacheHitRate()

    console.log(`   Cache hit rate: ${hitRate.toFixed(1)}%`)
    console.log(`   Cache hits: ${metrics.cacheHits}`)
    console.log(`   Cache misses: ${metrics.cacheMisses}`)
  }

  /**
   * Generate debug report
   */
  generateDebugReport() {
    const report = {
      timestamp: new Date().toISOString(),
      systemHealth: monitoringService.getPerformanceSummary(),
      recentErrors: monitoringService.getErrorLogs(10),
      recentDebugLogs: this.getDebugLogs(10),
      cacheStatus: {
        size: dataService.getCacheSize(),
        activeListeners: dataService.getActiveListenersCount(),
        hitRate: monitoringService.getCacheHitRate(),
      },
    }

    console.log("📋 Debug Report Generated:", report)
    return report
  }

  /**
   * Clear debug logs
   */
  clearDebugLogs() {
    this.debugLogs = []
    console.log("🗑️ Debug logs cleared")
  }
}

// Export singleton instance
export const debugUtils = new DebugUtils()

// Global debug functions for console access
if (typeof window !== "undefined") {
  ;(window as any).debugDriver = {
    checkHealth: () => debugUtils.checkSystemHealth(),
    testFirebase: () => debugUtils.testFirebaseConnection(),
    testCache: () => debugUtils.testDataServiceCache(),
    generateReport: () => debugUtils.generateDebugReport(),
    printFunction: (name: string) => printFunctionDoc(name),
    analyzeFunctionPerformance: (name: string) => debugUtils.analyzeFunctionPerformance(name),
    clearLogs: () => debugUtils.clearDebugLogs(),
  }

  console.log("🐛 Debug utilities available at window.debugDriver")
  console.log("   Commands: checkHealth(), testFirebase(), testCache(), generateReport()")
  console.log('   Function docs: printFunction("functionName")')
  console.log('   Performance: analyzeFunctionPerformance("functionName")')
}

console.log("🐛 Debug utilities initialized")
