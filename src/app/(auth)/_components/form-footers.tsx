import Link from "next/link"

interface FormFooterProps {
  plainText: string;
  linkText: string;
  href: string;
}

const FormFooter = ({ plainText, linkText, href }: FormFooterProps) => {
  return (
    <p className="text-center text-xs text-muted-foreground mt-5">
      {plainText}{" "}
      <Link
        href={href}
        className="text-primary font-bold cursor-pointer hover:underline"
      >
        {linkText}
      </Link>
    </p>
  )
}

export default FormFooter