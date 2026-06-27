import { Loader2 } from "lucide-react"

interface LoadingScreenProps {
    message?: string
}

export default function LoadingScreen({ message }: LoadingScreenProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#F8F7F5] gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-[#FF6B6B]" />
            <span className="text-sm font-semibold text-[#6B6863] animate-pulse">{message}</span>
        </div>
    )
}
