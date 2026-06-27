import { ReactNode } from "react"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react";

interface FormCardProps {
  title: string
  icon: LucideIcon
  iconBgClass?: string
  iconColorClass?: string
  badgeText?: string
  children: ReactNode
  bodyClassName?: string
}

export default function FormCard({
  title,
  icon: Icon,
  iconBgClass,
  iconColorClass,
  badgeText,
  children,
  bodyClassName,
}: FormCardProps) {
  return (
    <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs">
      <div className="px-5 py-4 border-b border-[#E8E6E0] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className={cn("w-7 h-7 rounded-md flex items-center justify-center", iconBgClass, iconColorClass)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold text-[#2D2D2D]">{title}</span>
        </div>
        {badgeText && (
          <span className="text-[11px] text-[#6B6863] font-medium uppercase tracking-wider select-none">
            {badgeText}
          </span>
        )}
      </div>
      <div className={cn("p-5 flex flex-col gap-4", bodyClassName)}>
        {children}
      </div>
    </div>
  )
}
