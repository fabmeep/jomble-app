import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const AVATAR_COLORS = [
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
  const code = name.charCodeAt(0) || 0
  return AVATAR_COLORS[code % AVATAR_COLORS.length]
}
export function getInitials(name: string): string {
  const words = name.trim().split(/\s+/)
  if (words.length >= 2) {
    return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}