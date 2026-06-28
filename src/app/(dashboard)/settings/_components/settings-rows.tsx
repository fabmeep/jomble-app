import React from "react"

interface SettingsRowProps {
  title: string
  description: string
  children: React.ReactNode
}

export default function SettingsRow({ title, description, children }: SettingsRowProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-semibold text-[#2D2D2D]">{title}</span>
        <span className="text-[11px] text-[#6B6863] leading-normal">{description}</span>
      </div>
      {children}
    </div>
  )
}
