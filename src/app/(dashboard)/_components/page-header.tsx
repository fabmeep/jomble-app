"use client"

import React from "react"
import { Menu } from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"

interface PageHeaderProps {
  children?: React.ReactNode // Breadcrumbs / Left content
  actions?: React.ReactNode  // Action buttons / Right content
}

export default function PageHeader({ children, actions }: PageHeaderProps) {
  const { toggle } = useSidebar()

  return (
    <div className="bg-white border-b border-[#E8E6E0] h-[54px] flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10 select-none">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button for Mobile */}
        <button
          onClick={toggle}
          className="p-1.5 -ml-1.5 text-[#6B6863] hover:text-[#2D2D2D] hover:bg-[#F8F7F5] rounded-md md:hidden transition-colors cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-[13px] text-[#6B6863] [&>*:nth-child(n+2)]:hidden sm:[&>*:nth-child(n+2)]:inline-flex">
          {children}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}
