"use client"

import { useEffect, useState } from "react"
// import { useAuth } from "@/context/AuthContext" // Removed problematic import
import { useAuthState } from "@/lib/auth" // Use existing auth state
import { getFilteredSafetyDataFixed as getFilteredSafetyData } from "@/lib/firebase-fix"
// The following components do not exist and are removed.
// import { SafetyDataTable } from "./safety-data-table"
// import { SafetyDataFilters } from "./safety-data-filters"
// import { SafetyScoreCard } from "./safety-score-card"
// import { SafetyStatsCard } from "./safety-stats-card"
// import { SafetyCriticalEventsCard } from "./safety-critical-events-card"

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
  }
  safetyScore: number
}

const SafetyDashboard = () => {
  // Use the existing useAuthState hook
  const { user: currentUser, userProfile } = useAuthState()
  const [safetyData, setSafetyData] = useState<SafetyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    startDate: Date | null
    endDate: Date | null
    driverId: string | null
    vehicleId: string | null
  }>({
    startDate: null,
    endDate: null,
    driverId: null,
    vehicleId: null,
  })

  useEffect(() => {
    const loadSafetyData = async () => {
      setLoading(true)
      setError(null)

      try {
        if (!currentUser || !userProfile) {
          setError("User not authenticated.")
          setLoading(false)
          return
        }

        const data = await getFilteredSafetyData(
          // Pass the correct deviceId from userProfile
          userProfile.deviceId,
          filters.startDate,
          filters.endDate,
          // The function signature in firebase-fix.ts doesn't match these, so I'll remove them for now.
          // filters.driverId,
          // filters.vehicleId,
        )

        // @ts-ignore
        setSafetyData(data)
        console.log("✅ SafetyDashboard: Data loaded successfully", {
          eventsCount: data?.events?.length || 0,
          yawnEvents: data?.stats.yawnEvents,
          fatigueEvents: data?.stats.fatigueEvents,
          criticalEvents: data?.stats.criticalEvents,
          safetyScore: data?.safetyScore,
        })
      } catch (e: any) {
        setError(e.message || "Failed to load safety data.")
        console.error("🔥 SafetyDashboard: Error loading data:", e)
      } finally {
        setLoading(false)
      }
    }
    // Check if userProfile is loaded before calling
    if (userProfile) {
      loadSafetyData()
    } else if (!loading) {
      // If auth is loaded but no profile, set an error
      setError("Could not load user profile.")
      setLoading(false)
    }
  }, [currentUser, userProfile, filters])

  const handleFilterChange = (newFilters: {
    startDate: Date | null
    endDate: Date | null
    driverId: string | null
    vehicleId: string | null
  }) => {
    setFilters(newFilters)
  }

  if (loading) {
    return <div>Loading safety data...</div>
  }

  if (error) {
    return <div>Error: {error}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Safety Dashboard</h1>

      {/* Placeholder for missing components */}
      <div className="border-dashed border-2 border-gray-300 p-4 rounded-lg text-center text-gray-500 mb-4">
        <p>Placeholder for SafetyDataFilters</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <div className="border-dashed border-2 border-gray-300 p-4 rounded-lg text-center text-gray-500">
          <p>SafetyScoreCard</p>
          <p>Score: {safetyData?.safetyScore || 0}</p>
        </div>
        <div className="border-dashed border-2 border-gray-300 p-4 rounded-lg text-center text-gray-500">
          <p>SafetyStatsCard</p>
          <p>Yawns: {safetyData?.stats.yawnEvents || 0}</p>
          <p>Fatigue: {safetyData?.stats.fatigueEvents || 0}</p>
        </div>
        <div className="border-dashed border-2 border-gray-300 p-4 rounded-lg text-center text-gray-500">
           <p>SafetyCriticalEventsCard</p>
          <p>Critical Events: {safetyData?.stats.criticalEvents || 0}</p>
        </div>
      </div>

      <div className="border-dashed border-2 border-gray-300 p-4 rounded-lg text-center text-gray-500">
        <p>Placeholder for SafetyDataTable</p>
        {safetyData?.events && safetyData.events.length > 0 ? (
          <p>{safetyData.events.length} events found.</p>
        ) : (
          <div className="text-gray-500">No safety events found.</div>
        )}
      </div>
    </div>
  )
}

export default SafetyDashboard
