"use client"

import { useState, useEffect, useCallback } from "react"

export interface BackendHealthState {
  isConnected: boolean
  isChecking: boolean
  lastChecked: Date | null
  error: string | null
  checkConnection: () => Promise<boolean>
}

export function useBackendHealth(pollIntervalMs = 5000): BackendHealthState {
  const [isConnected, setIsConnected] = useState<boolean>(false)
  const [isChecking, setIsChecking] = useState<boolean>(true)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const checkConnection = useCallback(async (): Promise<boolean> => {
    setIsChecking(true)
    const backendUrl = process.env.NEXT_PUBLIC_FASTAPI_URL || "http://localhost:8000"

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const res = await fetch(`${backendUrl}/health`, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      })

      clearTimeout(timeoutId)

      if (res.ok) {
        setIsConnected(true)
        setError(null)
        setLastChecked(new Date())
        setIsChecking(false)
        return true
      } else {
        setIsConnected(false)
        setError(`Backend returned status ${res.status}`)
        setLastChecked(new Date())
        setIsChecking(false)
        return false
      }
    } catch (err: any) {
      setIsConnected(false)
      setError("Unable to reach FastAPI backend at " + backendUrl)
      setLastChecked(new Date())
      setIsChecking(false)
      return false
    }
  }, [])

  // Initial check on mount
  useEffect(() => {
    checkConnection()
  }, [checkConnection])

  // Polling loop when disconnected to auto-recover seamlessly
  useEffect(() => {
    if (isConnected) return

    const timer = setInterval(() => {
      checkConnection()
    }, pollIntervalMs)

    return () => clearInterval(timer)
  }, [isConnected, pollIntervalMs, checkConnection])

  return {
    isConnected,
    isChecking,
    lastChecked,
    error,
    checkConnection,
  }
}
