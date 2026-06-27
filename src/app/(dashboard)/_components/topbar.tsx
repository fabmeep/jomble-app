"use client"

import { useState, useEffect } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Search, Plus, Menu } from "lucide-react"
import { useSidebar } from "@/components/sidebar-context"

export default function Topbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toggle } = useSidebar()

  const [searchValue, setSearchValue] = useState("")

  // Sync search input with URL params
  useEffect(() => {
    setSearchValue(searchParams.get("search") || "")
  }, [searchParams])

  const isMainRoute =
    pathname === "/dashboard" ||
    pathname === "/applications" ||
    pathname === "/settings"

  if (!isMainRoute) {
    return null
  }

  const showSearchAndAdd = pathname === "/dashboard" || pathname === "/applications"

  const getTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname === "/applications") return "Applications"
    if (pathname === "/settings") return "Settings"
    return ""
  }

  const handleSearchChange = (val: string) => {
    setSearchValue(val)
    const params = new URLSearchParams(searchParams.toString())
    if (val) {
      params.set("search", val)
    } else {
      params.delete("search")
    }
    // Update url search param
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="bg-white border-b border-[#E8E6E0] h-[54px] flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-20 select-none">
      <div className="flex items-center gap-3">
        {/* Toggle Sidebar Button for Mobile */}
        <button
          onClick={toggle}
          className="p-1.5 -ml-1.5 text-[#6B6863] hover:text-[#2D2D2D] hover:bg-[#F8F7F5] rounded-md md:hidden transition-colors cursor-pointer"
          title="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-base font-bold tracking-tight text-[#2D2D2D] md:text-lg">
          {getTitle()}
        </h1>
      </div>

      {showSearchAndAdd && (
        <div className="flex items-center gap-3">
          {/* Search bar */}
          {pathname === "/applications" && (
            <div className="relative flex items-center max-w-[120px] focus-within:max-w-[180px] sm:max-w-[240px] w-full transition-all duration-300">
              <Search className="absolute left-3 w-3.5 h-3.5 text-[#6B6863] pointer-events-none" />
              <input
                type="text"
                placeholder="Search..."
                value={searchValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full bg-[#F8F7F5] border border-[#E8E6E0] rounded-lg pl-9 pr-3 py-1.5 text-[13px] text-[#2D2D2D] placeholder-[#6B6863] outline-none focus:border-[#FF6B6B] focus:bg-white transition-all duration-300"
              />
            </div>
          )}

          {/* Add button */}
          <Link
            href="/applications/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 bg-[#FF6B6B] hover:bg-[#e85555] text-white rounded-lg text-[13px] font-semibold transition-all duration-150 shadow-sm cursor-pointer whitespace-nowrap flex-shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add application</span>
            <span className="sm:hidden">Add</span>
          </Link>
        </div>
      )}
    </div>
  )
}
