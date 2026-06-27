interface AuthDividerProps {
    label?: string;
}

export default function AuthDivider({ label }: AuthDividerProps) {
    return (
        <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-[1px] bg-border" />
            <span className="text-xs text-muted-foreground whitespace-nowrap">
                {"or " + label}
            </span>
            <div className="flex-1 h-[1px] bg-border" />
        </div>
    );
}
