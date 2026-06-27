import React from "react"
import { cn, getBgColor, getInitials } from "@/lib/utils"

interface CompanyLogoProps {
  companyName: string
  className?: string
  size?: "sm" | "md" | "lg"
}

export default function CompanyLogo({ companyName, className, size = "md" }: CompanyLogoProps) {
  const bg = getBgColor(companyName)
  const initials = getInitials(companyName)

  const sizeClasses = {
    sm: "w-7 h-7 rounded-md text-[11px]",
    md: "w-[30px] h-[30px] rounded-[7px] text-[11px]",
    lg: "w-14 h-14 rounded-xl text-lg",
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center text-white font-bold shrink-0 select-none",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: bg }}
    >
      {initials}
    </div>
  )
}
