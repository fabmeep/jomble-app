interface FormHeaderProps {
    title: string,
    description: string
}

const FormHeader = ({ title, description }: FormHeaderProps) => {
    return (
        <div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-[-0.5px] mb-1">
                {title}
            </h2>
            <p className="text-sm text-muted-foreground mb-7">
                {description}
            </p>
        </div>
    )
}

export default FormHeader