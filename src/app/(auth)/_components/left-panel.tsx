import React from "react";
import Image from "next/image";

export default function LeftPanel() {
  return (
    <div className="hidden md:flex md:flex-col justify-between relative overflow-hidden bg-[#2D2D2D] p-10 px-12 min-h-screen">
      {/* Animated decorative circles */}
      <div className="absolute w-[480px] h-[480px] rounded-full bg-primary opacity-12 -top-[120px] -right-[140px] pointer-events-none animate-pulse-subtle" />
      <div className="absolute w-[240px] h-[240px] rounded-full bg-accent opacity-8 bottom-[60px] -left-[80px] pointer-events-none animate-pulse-subtle-slow" />

      {/* Dot grid texture */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* Logo */}
      <div className="flex items-center gap-2.5 relative z-10">
        <div className="w-9 h-9 relative shrink-0">
          <Image
            src="/icons/logo-coral.png"
            alt="Jomble Logo"
            fill
            sizes="36px"
            className="rounded-[9px] object-contain"
            priority
          />
        </div>
        <span className="text-[20px] font-extrabold text-white tracking-[-0.4px]">
          Jomble
        </span>
      </div>

      {/* Hero copy */}
      <div className="relative z-10 my-auto py-12">
        <h1 className="text-[36px] font-extrabold text-white leading-[1.15] tracking-[-0.8px] mb-4">
          Your job hunt,
          <br />
          <em className="not-italic text-primary">
            <span className="relative inline-block after:content-[''] after:absolute after:bottom-[-2px] after:left-0 after:w-full after:h-[3px] after:bg-primary after:rounded-[2px] after:origin-left after:animate-underline-in">
              finally
            </span>{" "}
            organized.
          </em>
        </h1>
        <p className="text-[15px] text-white/50 leading-relaxed max-w-[340px]">
          Track every application, follow up at the right time, and never wonder
          what happened to that dream role again.
        </p>
      </div>

      {/* Stat cards */}
      {/* <div className="relative z-10 flex flex-col gap-2.5 mb-8"> */}
      {/* Card 1 */}
      {/* <div
          className="bg-white/6 border border-white/10 rounded-xl p-3.5 px-4.5 flex items-center gap-3.5 backdrop-blur-[4px] animate-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,107,107,0.15)" }}
          >
            <svg fill="none" viewBox="0 0 16 16" className="w-4 h-4">
              <rect
                x="1"
                y="3"
                width="14"
                height="11"
                rx="1.5"
                stroke="#FF6B6B"
                strokeWidth="1.4"
              />
              <path d="M1 7h14" stroke="#FF6B6B" strokeWidth="1.4" />
              <path
                d="M5 1v3M11 1v3"
                stroke="#FF6B6B"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-[18px] font-bold text-white font-mono tracking-[-0.5px] leading-none">
              42
            </div>
            <div className="text-[11.5px] text-white/40 mt-1">
              Applications tracked
            </div>
          </div>
        </div> */}

      {/* Card 2 */}
      {/* <div
          className="bg-white/6 border border-white/10 rounded-xl p-3.5 px-4.5 flex items-center gap-3.5 backdrop-blur-[4px] animate-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(255,140,66,0.15)" }}
          >
            <svg fill="none" viewBox="0 0 16 16" className="w-4 h-4">
              <path
                d="M2 12L5.5 8L8.5 10.5L12 5.5L14.5 7.5"
                stroke="#FF8C42"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-[18px] font-bold text-white font-mono tracking-[-0.5px] leading-none">
              34%
            </div>
            <div className="text-[11.5px] text-white/40 mt-1">
              Response rate
            </div>
          </div>
        </div> */}

      {/* Card 3 */}
      {/* <div
          className="bg-white/6 border border-white/10 rounded-xl p-3.5 px-4.5 flex items-center gap-3.5 backdrop-blur-[4px] animate-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "rgba(46,125,50,0.15)" }}
          >
            <svg fill="none" viewBox="0 0 16 16" className="w-4 h-4">
              <circle cx="8" cy="8" r="6.5" stroke="#2E7D32" strokeWidth="1.4" />
              <path
                d="M8 5v4l2.5 2"
                stroke="#2E7D32"
                strokeWidth="1.4"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="text-[18px] font-bold text-white font-mono tracking-[-0.5px] leading-none">
              8.2d
            </div>
            <div className="text-[11.5px] text-white/40 mt-1">
              Avg. days to reply
            </div>
          </div>
        </div> */}
      {/* </div> */}

      {/* Bottom quote */}
      <div className="relative z-10 border-t border-white/10 pt-5">
        <p className="text-[13px] text-white/35 italic leading-relaxed">
          &quot;By far the best job application tracker I've ever used&quot;
        </p>
        <span className="block text-[12px] text-white/25 mt-1.5 not-italic">
          — Probably some User in the near future
        </span>
      </div>
    </div>
  );
}
