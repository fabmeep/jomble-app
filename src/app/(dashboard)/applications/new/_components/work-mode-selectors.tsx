import React from "react"
import { Laptop, Layers, MapPin as MapPinIcon } from "lucide-react"
import { cn } from "@/lib/utils"

type WorkMode = "REMOTE" | "HYBRID" | "ON_SITE"

interface WorkModeSelectorProps {
    value: WorkMode
    onChange: (value: WorkMode) => void
}

export function WorkModeSelector({ value, onChange }: WorkModeSelectorProps) {
    const options = [
        { label: "Remote", mode: "REMOTE" as const, icon: Laptop },
        { label: "Hybrid", mode: "HYBRID" as const, icon: Layers },
        { label: "On-site", mode: "ON_SITE" as const, icon: MapPinIcon },
    ]

    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-[12.5px] font-semibold text-[#2D2D2D]">Work mode</label>
            <div className="flex gap-2">
                {options.map(({ label, mode, icon: Icon }) => (
                    <button
                        key={mode}
                        type="button"
                        onClick={() => onChange(mode)}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#E8E6E0] rounded-lg text-xs font-semibold text-[#6B6863] bg-white hover:text-[#2D2D2D] transition-colors cursor-pointer",
                            value === mode && "border-[#FF6B6B] bg-[#FFF0F0] text-[#FF6B6B] hover:text-[#FF6B6B]"
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                    </button>
                ))}
            </div>
        </div>
    )
}
