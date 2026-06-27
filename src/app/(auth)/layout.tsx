import React from "react";
import Image from "next/image";
import LeftPanel from "./_components/left-panel";
import AuthTabs from "./_components/auth-tabs";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 min-h-screen">
      {/* ── LEFT PANEL ── */}
      <LeftPanel />

      {/* ── RIGHT PANEL ── */}
      <div className="flex items-center justify-center p-6 md:p-10 bg-white relative">
        <div
          className="w-full max-w-[380px] animate-fade-up"
          style={{ animationDelay: "0.1s", animationDuration: "0.5s" }}
        >
          {/* Logo only on mobile */}
          <div className="flex md:hidden items-center justify-center gap-2 mb-8 select-none">
            <div className="w-8 h-8 relative shrink-0">
              <Image
                src="/icons/logo-coral.png"
                alt="Jomble Logo"
                fill
                sizes="32px"
                className="rounded-[8px] object-contain"
                priority
              />
            </div>
            <span className="text-[18.5px] font-extrabold text-[#2D2D2D] tracking-[-0.4px]">
              Jomble
            </span>
          </div>

          {/* Client-side dynamic tabs */}
          <AuthTabs />

          {/* Page contents (login form / register form) */}
          {children}
        </div>
      </div>
    </div>
  );
}
