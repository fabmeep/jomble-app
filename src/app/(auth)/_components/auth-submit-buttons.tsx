interface AuthSubmitProps {
    buttonTitle: string
}

const AuthSubmitButton = ({
    buttonTitle
}: AuthSubmitProps) => {
    return (
        <button
            type="submit"
            className="w-full py-3 bg-primary text-white border-none rounded-[9px] text-[14.5px] font-bold cursor-pointer transition-all duration-150 tracking-[-0.1px] mt-1 relative overflow-hidden hover:bg-[#e85555] hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(255,107,107,0.35)] active:translate-y-0 active:shadow-none"
        >
            {buttonTitle}
        </button>
    )
}

export default AuthSubmitButton