import React from "react";
import { Clock } from "lucide-react";

export function StateScraping() {
    return (
        <div className="mt-3.5 animate-fade-up">
            {/* Bar loading track container */}
            <div className="h-[3px] w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-linear-to-r from-primary to-accent rounded-full animate-pulse" style={{ width: '85%' }} />
            </div>

            {/* Label context string notification */}
            <div className="text-xs font-semibold text-accent mt-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 animate-spin [animation-duration:3s]" />
                <span>Reading job posting…</span>
            </div>
        </div>
    );
}