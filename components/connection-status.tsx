"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Wifi, WifiOff, Clock } from "lucide-react"

interface ConnectionStatusProps {
  isConnected: boolean
  lastUpdate?: string
}

export function ConnectionStatus({ isConnected, lastUpdate }: ConnectionStatusProps) {
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("")

  useEffect(() => {
    if (lastUpdate) {
      setLastUpdateTime(new Date(lastUpdate).toLocaleTimeString("th-TH"))
    }
  }, [lastUpdate])

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
      {/* Connection Status */}
      <div className="flex items-center space-x-2">
        {isConnected ? (
          <Wifi className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
        ) : (
          <WifiOff className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
        )}
        <Badge variant={isConnected ? "default" : "destructive"} className="text-xs">
          {isConnected ? "เชื่อมต่อแล้ว" : "ไม่ได้เชื่อมต่อ"}
        </Badge>
      </div>

      {/* Last Update */}
      {lastUpdateTime && (
        <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
          <Clock className="h-3 w-3" />
          <span>อัปเดตล่าสุด: {lastUpdateTime}</span>
        </div>
      )}
    </div>
  )
}
