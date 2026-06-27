import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

interface StateErrorProps {
    url: string;
    onClear: () => void;
}

export function StateError({ url, onClear }: StateErrorProps) {
    const isLinkedIn = url.includes("linkedin.com");

    return (
        <div className="mt-2.5 border border-status-rejected/30 rounded-lg bg-status-rejected-bg/20 p-3 px-3.5 animate-fade-up">
            <div className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-status-rejected shrink-0 mt-0.5" />
                <div>
                    <h4 className="text-[12.5px] font-bold text-status-rejected">Couldn't read this page</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">
                        {isLinkedIn
                            ? "LinkedIn hides job details until you're logged in, so we can't scrape it automatically. Try a direct company career page or a Greenhouse/Lever link instead."
                            : "We ran into issues parsing this URL structure automatically. Please try an alternative job posting link or type values manually."}
                    </p>
                    <button
                        type="button"
                        onClick={onClear}
                        className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-status-rejected hover:underline cursor-pointer"
                    >
                        <RefreshCw className="w-3 h-3" />
                        Try a different URL
                    </button>
                </div>
            </div>
        </div>
    );
}