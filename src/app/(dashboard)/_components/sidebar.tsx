import React from "react"
import { auth, signOut } from "@/auth"
import { prisma } from "@/lib/prisma"
import { LayoutDashboard, Briefcase, Settings, LogOut } from "lucide-react"
import NavItem from "./nav-item"

export default async function Sidebar() {
  const session = await auth()

  const userId = session?.user?.id
  const name = session?.user?.name || "User"
  const email = session?.user?.email || ""
  const avatar = session?.user?.image

  // Get application count for current user
  let appCount = 0
  if (userId) {
    appCount = await prisma.jobApplication.count({
      where: { userId },
    })
  }

  return (
    <aside className="flex flex-col h-full w-full bg-white">
      {/* Logo area */}
      <div className="flex items-center gap-2.5 px-4.5 py-4 border-b border-[#E8E6E0]">
        <img
          src="/icons/logo-coral.png"
          alt="Jomble"
          className="w-8 h-8 object-contain flex-shrink-0"
        />
        <span className="font-bold text-[17px] tracking-[-0.3px] text-[#2D2D2D]">Jomble</span>
      </div>

      {/* Navigation list */}
      <nav className="flex-1 px-2.5 py-3 flex flex-col gap-0.5 animate-fade-in">
        <div className="text-[10px] font-semibold text-[#6B6863] tracking-[0.08em] uppercase px-2 py-1.5 mb-1 select-none">
          Tracker
        </div>
        <NavItem
          href="/dashboard"
          label="Dashboard"
          icon={<LayoutDashboard className="w-4 h-4" />}
        />
        <NavItem
          href="/applications"
          label="Applications"
          icon={<Briefcase className="w-4 h-4" />}
          badgeCount={appCount}
        />

        <div className="text-[10px] font-semibold text-[#6B6863] tracking-[0.08em] uppercase px-2 py-1.5 mt-4 mb-1 select-none">
          Account
        </div>
        <NavItem
          href="/settings"
          label="Settings"
          icon={<Settings className="w-4 h-4" />}
        />
      </nav>

      {/* User Card */}
      <div className="p-3 border-t border-[#E8E6E0] bg-white flex items-center justify-between gap-2.5 group">
        <div className="flex items-center gap-2 min-w-0">
          {avatar ? (
            <img
              src={avatar}
              alt={name}
              className="w-[30px] h-[30px] rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-[30px] h-[30px] rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] text-white text-[11px] font-bold flex items-center justify-center flex-shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-[12.5px] font-semibold text-[#2D2D2D] truncate max-w-[110px]" title={name}>
              {name}
            </div>
            <div className="text-[10px] text-[#6B6863] truncate max-w-[110px]" title={email}>
              {email}
            </div>
          </div>
        </div>

        <form
          action={async () => {
            "use server"
            await signOut({ redirectTo: "/login" })
          }}
          className="flex items-center"
        >
          <button
            type="submit"
            className="p-1.5 text-[#6B6863] hover:text-[#FF6B6B] hover:bg-[#FFF0F0] rounded-md transition-colors cursor-pointer"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </aside>
  )
}
