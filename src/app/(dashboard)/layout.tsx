import React from "react"
import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Sidebar from "./_components/sidebar"
import Topbar from "./_components/topbar"
import { SidebarProvider } from "@/components/sidebar-context"
import SidebarWrapper from "./_components/sidebar-wrapper"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <SidebarProvider>
      <div className="fixed inset-0 flex overflow-hidden bg-[#F8F7F5] font-sans">
        {/* Sidebar navigation */}
        <SidebarWrapper>
          <Sidebar />
        </SidebarWrapper>

        {/* Main workspace layout */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Dynamic global header */}
          <Topbar />

          {children}
        </main>
      </div>
    </SidebarProvider>
  )
}
