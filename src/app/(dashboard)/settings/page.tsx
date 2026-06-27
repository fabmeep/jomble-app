import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { User, Bell, Shield, Palette } from "lucide-react"

export default async function SettingsPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const name = session.user?.name || "User"
  const email = session.user?.email || ""
  const avatar = session.user?.image

  return (
    <>
      {/* ── MAIN CONTENT AREA ── */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 max-w-3xl">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold tracking-tight text-[#2D2D2D]">Account settings</h2>
          <p className="text-sm text-[#6B6863]">Manage your profile details and app preferences.</p>
        </div>

        {/* PROFILE SECTION */}
        <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E8E6E0] flex items-center gap-2">
            <User className="w-4 h-4 text-[#FF6B6B]" />
            <h3 className="text-sm font-bold text-[#2D2D2D]">Profile Info</h3>
          </div>
          <div className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {avatar ? (
                <img src={avatar} alt={name} className="w-16 h-16 rounded-full object-cover border border-[#E8E6E0]" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FF8C42] text-white text-xl font-bold flex items-center justify-center">
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-[#2D2D2D]">{name}</span>
                <span className="text-xs text-[#6B6863]">{email}</span>
                <span className="text-[10px] bg-[#FFF0F0] text-[#FF6B6B] font-semibold px-2 py-0.5 rounded-full mt-1.5 self-start">
                  Free Plan
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* PREFERENCES SECTION */}
        <div className="bg-white border border-[#E8E6E0] rounded-xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#E8E6E0] flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#FF8C42]" />
            <h3 className="text-sm font-bold text-[#2D2D2D]">App Preferences</h3>
          </div>
          <div className="p-5 flex flex-col gap-4.5">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-[#2D2D2D]">Theme</span>
                <span className="text-[11px] text-[#6B6863]">Switch between light and dark modes</span>
              </div>
              <select className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg px-2.5 py-1.5 text-[#2D2D2D] outline-none">
                <option>Light (Default)</option>
                <option>Dark</option>
                <option>System</option>
              </select>
            </div>

            <hr className="border-[#E8E6E0]" />

            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs font-semibold text-[#2D2D2D]">Currency</span>
                <span className="text-[11px] text-[#6B6863]">Default currency for salary tracking</span>
              </div>
              <select className="bg-[#F8F7F5] border border-[#E8E6E0] text-xs font-medium rounded-lg px-2.5 py-1.5 text-[#2D2D2D] outline-none">
                <option>IDR</option>
                <option>USD</option>
                <option>SGD</option>
                <option>EUR</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
