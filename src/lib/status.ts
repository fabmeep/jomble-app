export const statusMap: Record<string, { label: string; bg: string; text: string }> = {
    APPLIED: { label: "Just applied", bg: "bg-[#E8F5E9]", text: "text-[#2E7D32]" },
    SCREENING: { label: "Screening", bg: "bg-[#FFF3E0]", text: "text-[#F57C00]" },
    INTERVIEW: { label: "Interviewing", bg: "bg-[#E3F2FD]", text: "text-[#1565C0]" },
    OFFER: { label: "Offer received", bg: "bg-[#EDE7F6]", text: "text-[#512DA8]" },
    ACCEPTED: { label: "Accepted", bg: "bg-[#F3E5F5]", text: "text-[#7B1FA2]" },
    REJECTED: { label: "Rejected", bg: "bg-[#FBE9E7]", text: "text-[#D84315]" },
    WITHDRAWN: { label: "Withdrawn", bg: "bg-[#ECEFF1]", text: "text-[#546E7A]" },
    GHOSTED: { label: "Ghosted", bg: "bg-[#F5F5F5]", text: "text-[#9E9E9E]" },
}