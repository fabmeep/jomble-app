"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AuthTabs() {
  const pathname = usePathname();
  const isLoginActive = pathname.startsWith("/login");
  const isRegisterActive = pathname.startsWith("/register");

  return (
    <div className="flex bg-secondary border border-border rounded-[10px] p-1 mb-7">
      <Link
        href="/login"
        className={`flex-1 py-2 text-center rounded-[7px] text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${
          isLoginActive
            ? "bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className={`flex-1 py-2 text-center rounded-[7px] text-[13.5px] font-semibold transition-all duration-200 cursor-pointer ${
          isRegisterActive
            ? "bg-white text-foreground shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        Create account
      </Link>
    </div>
  );
}
