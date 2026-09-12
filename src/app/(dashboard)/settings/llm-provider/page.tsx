import { redirect } from "next/navigation"
import { isCvTailorEnabled } from "@/lib/feature-flags"

export default function LlmProviderRedirectPage() {
  if (!isCvTailorEnabled()) {
    redirect("/settings")
  }
  redirect("/settings?tab=llm-provider")
}

