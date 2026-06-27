// components/autofill/autofill-box.tsx
import React, { useState } from "react";
import { Link2, Sparkles, Loader2 } from "lucide-react";
import { StateScraping } from "./state-scraping";
import { StateSuccess } from "./state-success";
import { StateError } from "./state-error";

interface AutoFillCardProps {
    onSuccess: (data: any) => void;
}

export function AutoFillCard({ onSuccess }: AutoFillCardProps) {
    const [url, setUrl] = useState("");
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [scrapedResult, setScrapedResult] = useState<any>(null);

    // 1. Keep the submit logic, but remove the e.preventDefault() since it's no longer a real HTML form submission
    const executeAutofill = async () => {
        if (!url.trim()) return;

        setStatus("loading");
        try {
            const res = await fetch("/api/scrape", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url }),
            });

            if (!res.ok) throw new Error("Scrape mismatch failure");

            const payload = await res.json();
            setScrapedResult(payload);
            setStatus("success");
        } catch (err) {
            setStatus("error");
        }
    };

    // 2. Intercept the 'Enter' key manually so it still feels like a form
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault(); // Stop the parent Main Form from submitting!
            executeAutofill();
        }
    };

    const resetFormState = () => {
        setUrl("");
        setScrapedResult(null);
        setStatus("idle");
    };

    return (
        <div className="bg-card border border-border rounded-xl overflow-hidden shadow-2xs">
            {/* SECTION HEAD */}
            <div className="flex items-center gap-2.5 p-3.5 px-5 border-b border-border select-none">
                <div className="w-7 h-7 rounded-md flex items-center justify-center bg-primary/10 text-primary">
                    <Link2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-[14px] font-bold text-foreground">Autofill from job posting</span>
                <span className="ml-auto inline-flex items-center gap-0.5 bg-primary/10 text-primary border border-primary/20 text-[10.5px] font-bold p-0.5 px-2 rounded-full">
                    Saves you ~2 min
                </span>
            </div>

            {/* FORM BODY (Now a safe div, completely legal inside your parent form) */}
            <div className="p-4 px-5">
                <div className="flex gap-2 items-start">
                    <div className="flex-1 relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                        <input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown} // <-- Listening for Enter key here
                            disabled={status === "loading" || status === "success"}
                            placeholder="Paste a job posting URL — we'll fill in the details"
                            className={`w-full p-2 pl-9 font-mono text-[12.5px] border rounded-lg bg-card text-foreground outline-hidden focus:border-primary focus:ring-3 focus:ring-primary/10 transition-all ${status === "success" ? "border-status-applied bg-status-applied-bg/5" :
                                    status === "error" ? "border-status-rejected bg-status-rejected-bg/5" : "border-border"
                                }`}
                        />
                    </div>

                    <button
                        type="button" // <-- MUST BE type="button" so it doesn't fire the parent save action
                        onClick={executeAutofill} // <-- Explicit click submission click handler
                        disabled={status === "loading" || !url.trim()}
                        className="inline-flex items-center gap-1.5 p-2 px-4.5 bg-primary text-white text-xs font-bold rounded-lg disabled:bg-border disabled:text-muted-foreground transition-all cursor-pointer whitespace-nowrap shrink-0 hover:bg-primary/90"
                    >
                        {status === "loading" ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Scraping…</span>
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Autofill</span>
                            </>
                        )}
                    </button>
                </div>

                {/* SUPPORTED FOOTER LOGOS */}
                {status === "idle" && (
                    <div className="flex items-center gap-1.5 mt-2.5 text-[11px] text-muted-foreground select-none animate-fade-up">
                        <span>Works with</span>
                        {["Greenhouse", "Lever", "Workable"].map((site) => (
                            <span key={site} className="p-0.5 px-2 bg-secondary border border-border text-[10.5px] font-semibold rounded-[4px]">
                                {site}
                            </span>
                        ))}
                        <span>+ company paths</span>
                    </div>
                )}

                {/* CONDITIONALLY MOUNTED SUB-STATE BLOCKS */}
                {status === "loading" && <StateScraping />}
                {status === "error" && <StateError url={url} onClear={resetFormState} />}
                {status === "success" && scrapedResult && (
                    <StateSuccess
                        data={scrapedResult}
                        onClear={resetFormState}
                        onConfirm={() => {
                            onSuccess(scrapedResult);
                            resetFormState();
                        }}
                    />
                )}
            </div>
        </div>
    );
}