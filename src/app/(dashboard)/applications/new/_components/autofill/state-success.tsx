import React from "react";
import { Check, ClipboardList, Sparkles, FileText } from "lucide-react";

interface ScrapedData {
    companyName: string;
    jobTitle: string;
    location?: string;
    workMode?: string;
    contractType?: string;
    jobUrl: string;
    jobDescription?: string;
    extractedWithLlm?: boolean;
}

interface StateSuccessProps {
    data: ScrapedData;
    onConfirm: () => void;
    onClear: () => void;
}

const formatContractType = (type?: string) => {
    if (!type) return "Not specified";
    const map: Record<string, string> = {
        FULL_TIME: "Full-time",
        PART_TIME: "Part-time",
        CONTRACT: "Contract",
        INTERN: "Internship",
        FREELANCE: "Freelance",
        TEMPORARY: "Temporary",
        OTHER: "Other",
    };
    return map[type] || type;
};

export function StateSuccess({ data, onConfirm, onClear }: StateSuccessProps) {
    const fields = [
        { label: "Company", value: data.companyName },
        { label: "Job Title", value: data.jobTitle },
        { label: "Location", value: data.location || "Not specified" },
        { label: "Work Mode", value: data.workMode || "Not specified" },
        { label: "Contract", value: formatContractType(data.contractType) },
        { label: "URL", value: data.jobUrl, isMono: true },
    ];

    return (
        <div className="mt-3 border border-status-applied/30 rounded-lg bg-status-applied-bg/10 overflow-hidden animate-fade-up">
            {/* Header */}
            <div className="p-2.5 px-3.5 border-b border-status-applied/30 flex items-center justify-between text-status-applied text-[12.5px] font-bold">
                <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Scraped successfully</span>
                    {data.extractedWithLlm && (
                        <span className="ml-1.5 inline-flex items-center gap-1 text-[10px] font-medium bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20">
                            <Sparkles className="w-2.5 h-2.5" />
                            AI Parsed
                        </span>
                    )}
                </div>
                <button
                    type="button"
                    onClick={onClear}
                    className="text-[11.5px] underline font-semibold hover:opacity-80 cursor-pointer"
                >
                    Edit before filling
                </button>
            </div>

            {/* Scraped Values Table mapping */}
            <div className="p-3 px-3.5 flex flex-col gap-2">
                {fields.map((field) => (
                    <div className="flex gap-2 items-baseline" key={field.label}>
                        <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider w-[76px] shrink-0">
                            {field.label}
                        </span>
                        <span className={`text-[13px] font-medium text-foreground truncate max-w-md ${field.isMono ? "font-mono text-[11.5px]" : ""}`}>
                            {field.value}
                        </span>
                    </div>
                ))}
                {data.jobDescription && (
                    <div className="flex gap-2 items-baseline pt-1 border-t border-status-applied/20">
                        <span className="text-[10.5px] font-bold text-muted-foreground uppercase tracking-wider w-[76px] shrink-0 flex items-center gap-1">
                            <FileText className="w-3 h-3 text-muted-foreground" />
                            JD Captured
                        </span>
                        <span className="text-[12px] text-muted-foreground">
                            {data.jobDescription.length.toLocaleString()} characters captured (ready for CV tailoring)
                        </span>
                    </div>
                )}
            </div>

            {/* Trigger Button */}
            <button
                type="button"
                onClick={onConfirm}
                className="flex items-center justify-center gap-1.5 w-full p-2.5 border-t border-status-applied/30 bg-status-applied text-white font-bold text-sm hover:bg-status-applied/90 transition-colors cursor-pointer"
            >
                <ClipboardList className="w-3.5 h-3.5" />
                Fill form with these details
            </button>
        </div>
    );
}