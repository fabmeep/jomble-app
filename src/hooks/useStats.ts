import { useState, useEffect, useCallback } from "react"
import { JobApplication } from "@prisma/client"


export interface DashboardApp {
  id: string
  companyName: string
  jobTitle: string
  status: string
  appliedAt: string
  lastActivityAt: string
}

export interface Stats {
  apps: DashboardApp[]
  addedLast7Days: number
  total: number
  responseRate: number
  ghostedRate: number
  byStatus: Record<string, number>
  avgDaysToReply: number
}

export interface WeeklyActivity {
  label: string
  start: string
  end: string
  count: number
}

export interface StatsData {
  stats: Stats
  hottestLeads: JobApplication[]
  weeklyActivity: WeeklyActivity[]
}

export function useStats() {
  const [data, setData] = useState<StatsData | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchStats = useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/stats")
      if (!res.ok) {
        throw new Error("Failed to fetch stats")
      }
      const json = await res.json()
      setData(json)
      setError(null)
    } catch (err: unknown) {
      const errorObject = err instanceof Error ? err : new Error(String(err))
      console.error("Error in useStats hook:", errorObject)
      setError(errorObject)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Defer execution to prevent synchronous state updates inside the effect
    Promise.resolve().then(() => {
      fetchStats()
    })
  }, [fetchStats])

  return {
    data,
    isLoading,
    error,
    mutate: fetchStats,
  }
}
