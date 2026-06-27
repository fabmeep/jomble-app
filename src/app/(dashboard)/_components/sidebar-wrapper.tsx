"use client"

import React, { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useSidebar } from "@/components/sidebar-context"
import { cn } from "@/lib/utils"

export default function SidebarWrapper({ children }: { children: React.ReactNode }) {
  const { isOpen, setIsOpen } = useSidebar()
  const pathname = usePathname()

  // Close sidebar automatically when navigating on mobile
  useEffect(() => {
    setIsOpen(false)
  }, [pathname, setIsOpen])

  return (
    <>
      {/* Mobile backdrop/overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 backdrop-blur-xs transition-opacity duration-300 md:hidden",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar container */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-[220px] bg-white border-r border-[#E8E6E0] transition-transform duration-300 ease-in-out md:static md:translate-x-0 md:z-auto h-full flex-shrink-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {children}
      </div>
    </>
  )
}
