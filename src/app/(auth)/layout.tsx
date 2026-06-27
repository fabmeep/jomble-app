import React from "react";
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
          {/* Client-side dynamic tabs */}
          <AuthTabs />

          {/* Page contents (login form / register form) */}
          {children}
        </div>
      </div>
    </div>
  );
}
