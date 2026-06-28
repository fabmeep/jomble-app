"use client"

import React, { useState, useEffect } from "react"
import { User, Palette, Loader2, Flag, Plus, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import SettingsCard from "./settings-cards"
import SettingsRow from "./settings-rows"

interface SettingsClientProps {
  name: string
  email: string
  avatar: string | null | undefined
  initialGhostThresholdDays: number
}

interface RedFlagItem {
  id: string
  label: string
  emoji: string
}

// ── MAIN CLIENT COMPONENT ──

export default function SettingsClient({
  name,
  email,
  avatar,
  initialGhostThresholdDays,
}: SettingsClientProps) {
  // Account & App Preferences state
  const [ghostThresholdDays, setGhostThresholdDays] = useState<number>(
    initialGhostThresholdDays
  )
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Red Flags management state
  const [redFlags, setRedFlags] = useState<RedFlagItem[]>([])
  const [isLoadingFlags, setIsLoadingFlags] = useState(true)
  const [newFlagLabel, setNewFlagLabel] = useState("")
  const [newFlagEmoji, setNewFlagEmoji] = useState("🚩")
  const [isAddingFlag, setIsAddingFlag] = useState(false)

  // Fetch red flags on mount
  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch("/api/red-flags")
        if (res.ok) {
          const data = await res.json()
          setRedFlags(data)
        }
      } catch (err) {
        console.error("Error loading red flags:", err)
      } finally {
        setIsLoadingFlags(false)
      }
    }
    fetchFlags()
  }, [])

  const handleSave = async () => {
    setIsSubmitting(true)

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

      toast.success("Preferences saved successfully!")
    } catch (err) {
      toast.error((err as Error).message || "An unexpected error occurred.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddFlag = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFlagLabel.trim()) return

    setIsAddingFlag(true)
    try {
      const res = await fetch("/api/red-flags", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          label: newFlagLabel.trim(),
          emoji: newFlagEmoji.trim() || "🚩",
        }),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to add red flag.")
      }

      const flag = await res.json()
      setRedFlags((prev) => [flag, ...prev])
      setNewFlagLabel("")
      setNewFlagEmoji("🚩")
      toast.success(`Created red flag "${flag.label}" successfully!`)
    } catch (err) {
      toast.error((err as Error).message || "Failed to create red flag.")
    } finally {
      setIsAddingFlag(false)
    }
  }

  const handleDeleteFlag = async (id: string) => {
    try {
      const res = await fetch(`/api/red-flags/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to delete red flag.")
      }

      setRedFlags((prev) => prev.filter((f) => f.id !== id))
      toast.success("Red flag deleted successfully")
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete red flag.")
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

        {/* RED FLAGS MANAGEMENT SECTION */}
        <SettingsCard
          title="Manage Red Flags"
          icon={Flag}
          iconBgClass="bg-[#FFF0F0]"
          iconColorClass="text-[#FF6B6B]"
        >
          <div className="flex flex-col gap-4">
            <p className="text-xs text-[#6B6863] leading-normal">
              Define custom warning flags (e.g., "Low Salary", "Bad Glassdoor reviews", "Micromanagement"). 
              You can attach these tags to applications to easily mark potential issues.
            </p>

            {/* Current Red Flags List */}
            {isLoadingFlags ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-[#FF6B6B]" />
              </div>
            ) : redFlags.length === 0 ? (
              <div className="text-xs text-[#6B6863]/60 italic text-center py-6 border border-dashed border-[#E8E6E0] rounded-xl bg-[#F8F7F5]">
                No custom red flags defined yet. Add your first warning flag below!
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {redFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className="group bg-[#FFF0F0] text-[#FF6B6B] border border-[#FF6B6B]/15 pl-2.5 pr-1.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-[#FFE5E5] transition-all cursor-default select-none animate-in fade-in duration-150"
                  >
                    <span className="text-sm">{flag.emoji}</span>
                    <span>{flag.label}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteFlag(flag.id)}
                      className="text-[#FF6B6B]/40 hover:text-[#FF6B6B] p-0.5 rounded-md hover:bg-white/60 transition-colors cursor-pointer"
                      title="Delete flag"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <hr className="border-[#E8E6E0]" />

            {/* Inline Creation Form */}
            <form onSubmit={handleAddFlag} className="flex gap-2.5 items-end">
              <div className="flex flex-col gap-1 w-16">
                <label className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wide">Emoji</label>
                <input
                  type="text"
                  maxLength={4}
                  value={newFlagEmoji}
                  onChange={(e) => setNewFlagEmoji(e.target.value)}
                  placeholder="🚩"
                  className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs text-center font-medium rounded-lg p-2 text-[#2D2D2D] outline-none focus:border-[#FF6B6B] transition-colors"
                />
              </div>
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-bold text-[#6B6863] uppercase tracking-wide">Warning label</label>
                <input
                  type="text"
                  required
                  value={newFlagLabel}
                  onChange={(e) => setNewFlagLabel(e.target.value)}
                  placeholder="e.g., Low Salary, No remote option"
                  className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg p-2 text-[#2D2D2D] outline-none focus:border-[#FF6B6B] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={isAddingFlag || !newFlagLabel.trim()}
                className="inline-flex items-center gap-1 px-3.5 py-2 bg-[#FF6B6B] hover:bg-[#e85555] disabled:bg-[#E8E6E0] disabled:text-[#6B6863] disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold transition-all duration-150 shadow-sm cursor-pointer h-9"
              >
                {isAddingFlag ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </>
                )}
              </button>
            </form>
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
