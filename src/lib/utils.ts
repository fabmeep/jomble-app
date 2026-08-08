import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const AVATAR_COLORS = [
  "#FF6B6B", // Coral
  "#FF8C42", // Amber
  "#3A86FF", // Blue
  "#8338EC", // Purple
  "#06D6A0", // Green
  "#118AB2", // Teal
  "#FFD166", // Yellow
  "#F15BB5", // Pink
]

export function getBgColor(name: string): string {
  if (!name) return AVATAR_COLORS[0]
  const code = name.charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}

export function getInitials(name: string): string {
  if (!name) return "?";
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

export function formatDate(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "—"
  const date = new Date(dateInput)
  if (isNaN(date.getTime())) return "—"
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

export function timeAgo(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "—"
  const now = new Date()
  const updated = new Date(dateInput)
  if (isNaN(updated.getTime())) return "—"
  const diffTime = Math.abs(now.getTime() - updated.getTime())
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}