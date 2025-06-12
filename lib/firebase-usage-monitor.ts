"use client"

// Firebase Usage Monitor
class FirebaseUsageMonitor {
  private readCount = 0
  private writeCount = 0
  private listenerCount = 0
  private startTime = Date.now()

  // Track reads
  trackRead(path: string, size = 1) {
    this.readCount += size
    console.log(`📖 Firebase Read: ${path} (+${size}) Total: ${this.readCount}`)
  }

  // Track writes
  trackWrite(path: string, size = 1) {
    this.writeCount += size
    console.log(`✍️ Firebase Write: ${path} (+${size}) Total: ${this.writeCount}`)
  }

  // Track listeners
  trackListener(action: "add" | "remove", path: string) {
    if (action === "add") {
      this.listenerCount++
      console.log(`👂 Firebase Listener Added: ${path} Total: ${this.listenerCount}`)
    } else {
      this.listenerCount--
      console.log(`🚫 Firebase Listener Removed: ${path} Total: ${this.listenerCount}`)
    }
  }

  // Get usage stats
  getUsageStats() {
    const runtime = Date.now() - this.startTime
    return {
      reads: this.readCount,
      writes: this.writeCount,
      activeListeners: this.listenerCount,
      runtime: Math.round(runtime / 1000), // seconds
      readsPerMinute: Math.round((this.readCount / runtime) * 60000),
    }
  }

  // Reset stats
  reset() {
    this.readCount = 0
    this.writeCount = 0
    this.listenerCount = 0
    this.startTime = Date.now()
    console.log("📊 Firebase usage stats reset")
  }

  // Warning thresholds
  checkThresholds() {
    const stats = this.getUsageStats()

    if (stats.reads > 1000) {
      console.warn(`⚠️ High read count: ${stats.reads}`)
    }

    if (stats.activeListeners > 10) {
      console.warn(`⚠️ Too many listeners: ${stats.activeListeners}`)
    }

    if (stats.readsPerMinute > 100) {
      console.warn(`⚠️ High read rate: ${stats.readsPerMinute}/min`)
    }
  }
}

export const firebaseUsageMonitor = new FirebaseUsageMonitor()

// Auto-check every 30 seconds
if (typeof window !== "undefined") {
  setInterval(() => {
    firebaseUsageMonitor.checkThresholds()
  }, 30000)
}
