"use client"

import { useEffect, useState } from "react"
import { useAuthState } from "@/lib/auth"
import { getFilteredSafetyData } from "@/lib/firebase" // FIX: Changed import from firebase-fix to firebase
import { Card } from "@/components/ui/card" // Added for structure
import { CardContent, CardHeader, CardTitle } from "@/components/ui/card" // Added for structure

export interface SafetyEvent {
  id: string
  timestamp: string
  driverId: string
  vehicleId: string
  eventType: string
  latitude: number
  longitude: number
  speed: number
  acceleration: number
  location: string
}

export interface SafetyData {
  events: SafetyEvent[]
  stats: {
    yawnEvents: number
    fatigueEvents: number
    criticalEvents: number
    averageEAR: number
  }
  safetyScore: number
}

const SafetyDashboard = ({ deviceId, viewMode }: { deviceId: string, viewMode?: 'user' | 'admin' }) => {
  const { userProfile, isLoading: authLoading } = useAuthState()
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Default date range to the last 7 days for better initial data view
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - 7)
    return {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    }
  });

  useEffect(() => {
    const loadSafetyData = async () => {
      if (!deviceId) {
        setLoading(false)
        setError("Device ID is not available.")
        return
      }

      setLoading(true)
      setError(null)

      try {
        const data = await getFilteredSafetyData(
          deviceId,
          dateRange.startDate,
          dateRange.endDate,
        )

        setSafetyData(data)
        console.log("✅ SafetyDashboard: Data loaded successfully for device:", deviceId, data)
      } catch (e: any) {
        setError(e.message || "Failed to load safety data.")
        console.error("🔥 SafetyDashboard: Error loading data:", e)
      } finally {
        setLoading(false)
      }
    }

    loadSafetyData()
  }, [deviceId, dateRange])

  if (loading || authLoading) {
    return <div>Loading safety data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Safety Score</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{safetyData?.safetyScore ?? 'N/A'}</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Event Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Yawns: {safetyData?.stats?.yawnEvents ?? 'N/A'}</p>
          <p>Fatigue Events: {safetyData?.stats?.fatigueEvents ?? 'N/A'}</p>
          <p>Critical Events: {safetyData?.stats?.criticalEvents ?? 'N/A'}</p>
          <p>Average EAR: {safetyData?.stats?.averageEAR.toFixed(4) ?? 'N/A'}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Safety Events</CardTitle>
        </CardHeader>
        <CardContent>
          {safetyData?.events && safetyData.events.length > 0 ? (
             <ul>
              {safetyData.events.slice(0, 5).map(event => (
                <li key={event.id}>{new Date(event.timestamp).toLocaleString('th-TH')} - {event.details}</li>
              ))}
             </ul>
          ) : (
            <p className="text-gray-500">No safety events found for the selected period.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default SafetyDashboard
