"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

interface NavItemProps {
  href: string
  label: string
  icon: React.ReactNode
  badgeCount?: number
}

export default function NavItem({ href, label, icon, badgeCount }: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all duration-150 text-[#6B6863] hover:bg-[#F8F7F5] hover:text-[#2D2D2D]",
        isActive && "bg-[#FFF0F0] text-[#FF6B6B] font-semibold hover:bg-[#FFF0F0] hover:text-[#FF6B6B]"
      )}
    >
      <span className={cn("w-4 h-4 flex-shrink-0 opacity-75", isActive && "opacity-100")}>
        {icon}
      </span>
      <span>{label}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="ml-auto bg-[#FF6B6B] text-white font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full">
          {badgeCount}
        </span>
      )}
    </Link>
  )
}
