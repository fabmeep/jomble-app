import React from "react"
import { cn } from "@/lib/utils"

interface SettingsCardProps {
  title: string
  icon: React.ComponentType<{ className?: string }>
  iconBgClass: string
  iconColorClass: string
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function SettingsCard({
  title,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  children,
  footer,
}: SettingsCardProps) {
  return (
    <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs flex flex-col">
      {/* Premium Badge Icon Header matching FormCard style */}
      <div className="px-5 py-4 border-b border-[#E8E6E0] flex items-center gap-3 select-none">
        <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", iconBgClass, iconColorClass)}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-sm font-bold text-[#2D2D2D]">{title}</span>
      </div>
      
      {/* Body container */}
      <div className="p-5 flex flex-col gap-4.5">
        {children}
      </div>

      {/* Optional footer card bar */}
      {footer && (
        <div className="px-5 py-3.5 bg-[#F8F7F5] border-t border-[#E8E6E0] flex justify-end">
          {footer}
        </div>
      )}
    </div>
  )
}
