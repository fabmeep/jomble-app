import React, { useState, forwardRef } from "react";
import { LucideIcon, Eye, EyeOff } from "lucide-react";

interface AuthInputFieldsProps extends React.InputHTMLAttributes<HTMLInputElement> {
    labelName: string;
    id: string;
    placeholder: string;
    icon?: LucideIcon;
    type?: "text" | "email" | "password"; // Specific types
    bottomElement?: React.ReactNode; // Optional slot for rendering details beneath input
    error?: string;
}

const AuthInputFields = forwardRef<HTMLInputElement, AuthInputFieldsProps>(({
    labelName,
    id,
    placeholder,
    icon: Icon,
    type = "text",
    bottomElement,
    error,
    ...rest
}, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    // Determine actual input type (if password, check internal visibility state)
    const actualType = type === "password" && showPassword ? "text" : type;

    return (
        <div className="flex flex-col gap-1.25">
            <label htmlFor={id} className="text-[12.5px] font-semibold text-foreground">
                {labelName}
            </label>

            <div className="relative flex items-center">
                {/* Render the left icon if passed */}
                {Icon && (
                    <div className="absolute left-3 text-muted-foreground pointer-events-none flex items-center justify-center">
                        <Icon size={15} strokeWidth={1.8} />
                    </div>
                )}

                <input
                    ref={ref}
                    type={actualType}
                    id={id}
                    placeholder={placeholder}
                    // Dynamically adjust padding-left (if icon exists) and padding-right (if password toggle exists)
                    className={`w-full py-2.5 border-[1.5px] border-border rounded-[9px] text-sm text-foreground bg-white outline-none transition-all duration-150 placeholder-[#C0BCB8] focus:border-primary focus:ring-3 focus:ring-primary/10 ${Icon ? "pl-9" : "pl-3"
                        } ${type === "password" ? "pr-10" : "pr-3"}`}
                    {...rest}
                />

                {/* If type is password, show the visibility eye toggle button */}
                {type === "password" && (
                    <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="absolute right-3 bg-none border-none cursor-pointer text-muted-foreground flex items-center p-0 hover:text-foreground"
                    >
                        {showPassword ? (
                            <EyeOff size={15} strokeWidth={1.8} />
                        ) : (
                            <Eye size={15} strokeWidth={1.8} />
                        )}
                    </button>
                )}
            </div>

            {/* Error message */}
            {error && (
                <span className="text-xs text-primary font-medium mt-1">
                    {error}
                </span>
            )}

            {/* Render any bottom slots (like password strength bars) */}
            {bottomElement}
        </div>
    );
});

AuthInputFields.displayName = "AuthInputFields";

export default AuthInputFields;
