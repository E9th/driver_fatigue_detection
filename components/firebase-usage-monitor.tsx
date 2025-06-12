"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { firebaseUsageMonitor } from "@/lib/firebase-optimized-service"
import { Activity, Database, Wifi, Clock } from "lucide-react"

export function FirebaseUsageMonitor() {
  const [stats, setStats] = useState({
    listeners: 0,
    reads: 0,
    writes: 0,
    cacheSize: 0,
    lastUpdated: new Date(),
  })

  useEffect(() => {
    // Update stats every 2 seconds
    const interval = setInterval(() => {
      setStats(firebaseUsageMonitor.getStats())
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  // Format bytes to human readable
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Format time ago
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

    if (seconds < 60) return `${seconds} วินาทีที่แล้ว`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes} นาทีที่แล้ว`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours} ชั่วโมงที่แล้ว`
    const days = Math.floor(hours / 24)
    return `${days} วันที่แล้ว`
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Firebase Usage Monitor</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center">
            <Wifi className="h-4 w-4 mr-2 text-blue-500" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Active Listeners</p>
              <p className="text-sm font-medium">{stats.listeners}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Database className="h-4 w-4 mr-2 text-green-500" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Database Reads</p>
              <p className="text-sm font-medium">{stats.reads}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Activity className="h-4 w-4 mr-2 text-orange-500" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Cache Size</p>
              <p className="text-sm font-medium">{formatBytes(stats.cacheSize)}</p>
            </div>
          </div>

          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-purple-500" />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Last Updated</p>
              <p className="text-sm font-medium">{timeAgo(stats.lastUpdated)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
