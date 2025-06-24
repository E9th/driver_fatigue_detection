/**
 * Monitoring System
 * Provides logging, debugging, and performance monitoring tools
 */

interface LogData {
  timestamp: number
  component?: string
  action: string
  data?: any
  error?: Error
}

class MonitoringService {
  private logs: LogData[] = []
  private maxLogs = 1000
  private isDebugMode = false

  constructor() {
    if (typeof window !== "undefined") {
      // Add global debug access
      ;(window as any).debugDriver = {
        enableDebug: this.enableDebug.bind(this),
        disableDebug: this.disableDebug.bind(this),
        getLogs: this.getLogs.bind(this),
        clearLogs: this.clearLogs.bind(this),
        printFunction: this.printFunction.bind(this),
        checkHealth: this.checkHealth.bind(this),
        testFirebase: this.testFirebase.bind(this),
        testCache: this.testCache.bind(this),
        analyzeFunctionPerformance: this.analyzeFunctionPerformance.bind(this),
        generateReport: this.generateReport.bind(this),
      }
    }
  }

  /**
   * Enable debug mode
   */
  enableDebug(): void {
    this.isDebugMode = true
    console.log("🐛 Debug mode enabled")
  }

  /**
   * Disable debug mode
   */
  disableDebug(): void {
    this.isDebugMode = false
    console.log("🐛 Debug mode disabled")
  }

  /**
   * Log component render
   */
  logComponentRender(component: string, data?: any): void {
    this.addLog({
      timestamp: Date.now(),
      component,
      action: "render",
      data,
    })

    if (this.isDebugMode) {
      console.log(`🔄 ${component} rendered:`, data)
    }
  }

  /**
   * Log successful operation
   */
  logSuccess(action: string, data?: any): void {
    this.addLog({
      timestamp: Date.now(),
      action,
      data,
    })

    if (this.isDebugMode) {
      console.log(`✅ ${action} succeeded:`, data)
    }
  }

  /**
   * Log error
   */
  logError(action: string, error: any, data?: any): void {
    this.addLog({
      timestamp: Date.now(),
      action,
      error,
      data,
    })

    console.error(`❌ ${action} failed:`, error, data)
  }

  /**
   * Log debug information
   */
  logDebug(action: string, data?: any): void {
    this.addLog({
      timestamp: Date.now(),
      action,
      data,
    })

    if (this.isDebugMode) {
      console.log(`🐛 ${action}:`, data)
    }
  }

  /**
   * Add log entry
   */
  private addLog(log: LogData): void {
    this.logs.push(log)

    // Keep logs under the maximum size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogData[] {
    return [...this.logs]
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = []
    console.log("🧹 Logs cleared")
  }

  /**
   * Print function details
   */
  printFunction(functionName: string): void {
    console.log(`📝 Function details for: ${functionName}`)
    console.log("This is a placeholder. Implement with actual function mapping.")
  }

  /**
   * Check system health
   */
  checkHealth(): void {
    console.log("🏥 System Health Check")
    console.log("This is a placeholder. Implement with actual health checks.")
  }

  /**
   * Test Firebase connection
   */
  testFirebase(): void {
    console.log("🔥 Testing Firebase Connection")
    console.log("This is a placeholder. Implement with actual Firebase tests.")
  }

  /**
   * Test cache performance
   */
  testCache(): void {
    console.log("📦 Testing Cache Performance")
    console.log("This is a placeholder. Implement with actual cache tests.")
  }

  /**
   * Analyze function performance
   */
  analyzeFunctionPerformance(functionName: string): void {
    console.log(`⚡ Performance Analysis for: ${functionName}`)
    console.log("This is a placeholder. Implement with actual performance analysis.")
  }

  /**
   * Generate debug report
   */
  generateReport(): void {
    console.log("📊 Generating Debug Report")

    const errorCount = this.logs.filter((log) => log.error).length
    const componentRenders = this.logs.filter((log) => log.action === "render")
    const uniqueComponents = new Set(componentRenders.map((log) => log.component))

    console.log(`Total logs: ${this.logs.length}`)
    console.log(`Error count: ${errorCount}`)
    console.log(`Components rendered: ${uniqueComponents.size}`)

    if (errorCount > 0) {
      console.log("Recent errors:")
      const recentErrors = this.logs
        .filter((log) => log.error)
        .slice(-5)
        .map((log) => ({
          action: log.action,
          timestamp: new Date(log.timestamp).toLocaleTimeString(),
          error: log.error?.message || "Unknown error",
        }))

      console.table(recentErrors)
    }
  }
}

export const monitoring = new MonitoringService()
export const monitoringService = monitoring // Add this line for compatibility
console.log("🔍 Monitoring service initialized")
