import { statusMap } from "@/lib/status"
import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: string
  className?: string
  dot?: boolean
}

export default function StatusBadge({ status, className, dot = true }: StatusBadgeProps) {
  const normalizedStatus = status.toUpperCase()
  const statusDetail = statusMap[normalizedStatus] || {
    label: status,
    bg: "bg-[#F8F7F5]",
    text: "text-[#2D2D2D]",
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold whitespace-nowrap",
        statusDetail.bg,
        statusDetail.text,
        className
      )}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {statusDetail.label}
    </span>
  )
}
