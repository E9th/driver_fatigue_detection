"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { getFilteredSafetyDataFixed as getFilteredSafetyData } from "@/lib/firebase-fix"
import { SafetyDataTable } from "./safety-data-table"
import { SafetyDataFilters } from "./safety-data-filters"
import { SafetyScoreCard } from "./safety-score-card"
import { SafetyStatsCard } from "./safety-stats-card"
import { SafetyCriticalEventsCard } from "./safety-critical-events-card"

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
  const { currentUser } = useAuth()
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
        if (!currentUser) {
          setError("User not authenticated.")
          return
        }

        const data = await getFilteredSafetyData(
          currentUser.uid,
          filters.startDate,
          filters.endDate,
          filters.driverId,
          filters.vehicleId,
        )

        setSafetyData(data)
        console.log("✅ SafetyDashboard: Data loaded successfully", {
          eventsCount: data.events?.length || 0,
          yawnEvents: data.stats.yawnEvents,
          fatigueEvents: data.stats.fatigueEvents,
          criticalEvents: data.stats.criticalEvents,
          safetyScore: data.safetyScore,
        })
      } catch (e: any) {
        setError(e.message || "Failed to load safety data.")
        console.error("🔥 SafetyDashboard: Error loading data:", e)
      } finally {
        setLoading(false)
      }
    }

    loadSafetyData()
  }, [currentUser, filters])

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

      <SafetyDataFilters onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SafetyScoreCard score={safetyData?.safetyScore || 0} />
        <SafetyStatsCard
          yawnEvents={safetyData?.stats.yawnEvents || 0}
          fatigueEvents={safetyData?.stats.fatigueEvents || 0}
        />
        <SafetyCriticalEventsCard criticalEvents={safetyData?.stats.criticalEvents || 0} />
      </div>

      {safetyData?.events && safetyData.events.length > 0 ? (
        <SafetyDataTable events={safetyData.events} />
      ) : (
        <div className="text-gray-500">No safety events found.</div>
      )}
    </div>
  )
}

export default SafetyDashboard
