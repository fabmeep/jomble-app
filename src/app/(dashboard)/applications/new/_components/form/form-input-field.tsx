import React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormInputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string
    placeholder?: string
    icon?: LucideIcon
    type?: "text"
    error?: string
    required?: boolean
    optional?: boolean
}

const FormInputField = React.forwardRef<HTMLInputElement, FormInputFieldProps>((
    {
        label,
        placeholder,
        icon: Icon,
        type,
        error,
        required = false,
        optional = false,
        className, ...props },
    ref) => {
    return (
        <div className="flex flex-col gap-1.5 w-full">
            <label className="text-[12.5px] font-semibold text-[#2D2D2D]">
                {label}
                {required && <span className="text-[#FF6B6B] ml-0.5">*</span>}
                {optional && <span className="text-xs font-normal text-[#6B6863] ml-1">(optional)</span>}
            </label>
            <div className="relative flex items-center">
                {Icon && (
                    <Icon className="absolute left-3 w-4 h-4 text-[#6B6863] pointer-events-none" />
                )}
                <input
                    ref={ref}
                    type={type}
                    placeholder={placeholder}
                    className={cn(
                        "w-full pr-3 py-2 border border-[#E8E6E0] rounded-lg text-[13.5px] text-[#2D2D2D] bg-white placeholder-[#C0BCB8] outline-none focus:border-[#FF6B6B] focus:ring-3 focus:ring-[#FF6B6B]/10 transition-all",
                        Icon ? "pl-9" : "pl-3",
                        error && "border-red-500 focus:border-red-500 focus:ring-red-500/10",
                        className
                    )}
                    {...props}
                />
            </div>
            {error && (
                <span className="text-[11px] text-red-500 font-semibold">{error}</span>
            )}
        </div>
    )
}
)

FormInputField.displayName = "FormInputField"

export default FormInputField