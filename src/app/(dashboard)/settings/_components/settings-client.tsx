"use client"

import React, { useState } from "react"
import { User, Palette, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import SettingsCard from "./settings-cards"
import SettingsRow from "./settings-rows"

interface SettingsClientProps {
  name: string
  email: string
  avatar: string | null | undefined
  initialGhostThresholdDays: number
}

// ── MAIN CLIENT COMPONENT ──

export default function SettingsClient({
  name,
  email,
  avatar,
  initialGhostThresholdDays,
}: SettingsClientProps) {
  const [ghostThresholdDays, setGhostThresholdDays] = useState<number>(
    initialGhostThresholdDays
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const handleSave = async () => {
    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch("/api/user/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ghostThresholdDays }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save settings.")
      }

      setMessage({
        type: "success",
        text: "Preferences saved successfully!",
      })
      
      setTimeout(() => {
        setMessage(null)
      }, 3000)
    } catch (err) {
      setMessage({
        type: "error",
        text: (err as Error).message || "An unexpected error occurred.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex-1 overflow-y-auto w-full p-6 scroll-smooth bg-[#F8F7F5]">
      <div className="max-w-3xl mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
        
        {/* Title */}
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">Account settings</h2>
          <p className="text-sm text-[#6B6863]">Manage your profile details and app preferences.</p>
        </div>

        {/* FEEDBACK BANNERS */}
        {message && (
          <div
            className={cn(
              "p-3.5 rounded-xl text-xs font-semibold text-center border animate-in fade-in slide-in-from-top-1 duration-200",
              message.type === "success"
                ? "bg-[#E8F5E9] border-[#2E7D32]/25 text-[#2E7D32]"
                : "bg-[#FFF0F0] border-red-200 text-red-700"
            )}
          >
            {message.text}
          </div>
        )}

        {/* PROFILE SECTION */}
        <SettingsCard
          title="Profile Info"
          icon={User}
          iconBgClass="bg-[#FFF0F0]"
          iconColorClass="text-[#FF6B6B]"
        >
          <div className="flex items-center gap-4">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="w-16 h-16 rounded-full object-cover border border-[#E8E6E0]"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] text-white text-xl font-bold flex items-center justify-center">
                {name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex flex-col">
              <span className="font-semibold text-sm text-[#2D2D2D]">{name}</span>
              <span className="text-xs text-[#6B6863]">{email}</span>
              <span className="text-[10px] bg-[#FFF0F0] text-[#FF6B6B] font-semibold px-2 py-0.5 rounded-full mt-1.5 self-start">
                Free Plan
              </span>
            </div>
          </div>
        </SettingsCard>

        {/* PREFERENCES SECTION */}
        <SettingsCard
          title="App Preferences"
          icon={Palette}
          iconBgClass="bg-[#FFF3E0]"
          iconColorClass="text-[#FF8C42]"
          footer={
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all duration-150 shadow-sm cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save preferences"
              )}
            </button>
          }
        >
          {/* THEME (Static mock option) */}
          <SettingsRow title="Theme" description="Switch between light and dark modes">
            <select className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg px-2.5 py-1.5 text-[#2D2D2D] outline-none cursor-pointer hover:border-[#FF6B6B] transition-colors">
              <option>Light (Default)</option>
              <option>Dark</option>
              <option>System</option>
            </select>
          </SettingsRow>

          <hr className="border-[#E8E6E0]" />

          {/* CURRENCY (Static mock option) */}
          <SettingsRow title="Currency" description="Default currency for salary tracking">
            <select className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg px-2.5 py-1.5 text-[#2D2D2D] outline-none cursor-pointer hover:border-[#FF6B6B] transition-colors">
              <option>IDR</option>
              <option>USD</option>
              <option>SGD</option>
              <option>EUR</option>
            </select>
          </SettingsRow>

          <hr className="border-[#E8E6E0]" />

          {/* AUTO-GHOST THRESHOLD SETTING */}
          <SettingsRow
            title="Inactivity Threshold"
            description="Auto-mark active applications as Ghosted after no updates"
          >
            <select
              value={ghostThresholdDays}
              onChange={(e) => setGhostThresholdDays(Number(e.target.value))}
              className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg px-2.5 py-1.5 text-[#2D2D2D] outline-none cursor-pointer hover:border-[#FF6B6B] transition-colors"
            >
              <option value={0}>Disabled</option>
              <option value={7}>7 days (1 week)</option>
              <option value={14}>14 days (2 weeks)</option>
              <option value={30}>30 days (1 month)</option>
              <option value={60}>60 days (2 months)</option>
              <option value={90}>90 days (3 months)</option>
            </select>
          </SettingsRow>
        </SettingsCard>

      </div>
    </div>
  )
}
