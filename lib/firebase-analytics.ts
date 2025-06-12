// Firebase Usage Analytics
class FirebaseUsageAnalytics {
  private readCount = 0
  private writeCount = 0
  private connectionCount = 0
  private startTime = Date.now()

  // Track reads
  trackRead(path: string, dataSize = 0) {
    this.readCount++
    console.log(`📖 Firebase Read #${this.readCount}: ${path} (${dataSize} bytes)`)
  }

  // Track writes
  trackWrite(path: string, dataSize = 0) {
    this.writeCount++
    console.log(`✍️ Firebase Write #${this.writeCount}: ${path} (${dataSize} bytes)`)
  }

  // Track connections
  trackConnection(type: "connect" | "disconnect") {
    if (type === "connect") {
      this.connectionCount++
      console.log(`🔌 Firebase Connection #${this.connectionCount}`)
    } else {
      console.log(`🔌 Firebase Disconnection`)
    }
  }

  // Get usage report
  getUsageReport() {
    const uptime = Date.now() - this.startTime
    const uptimeMinutes = Math.floor(uptime / (1000 * 60))

    return {
      reads: this.readCount,
      writes: this.writeCount,
      connections: this.connectionCount,
      uptimeMinutes,
      readsPerMinute: uptimeMinutes > 0 ? (this.readCount / uptimeMinutes).toFixed(2) : "0",
      writesPerMinute: uptimeMinutes > 0 ? (this.writeCount / uptimeMinutes).toFixed(2) : "0",
    }
  }

  // Reset counters
  reset() {
    this.readCount = 0
    this.writeCount = 0
    this.connectionCount = 0
    this.startTime = Date.now()
  }
}

export const firebaseAnalytics = new FirebaseUsageAnalytics()

// Usage monitoring hook
export const useFirebaseUsageMonitor = () => {
  const getReport = () => firebaseAnalytics.getUsageReport()
  const reset = () => firebaseAnalytics.reset()

  return { getReport, reset }
}
