"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Header() {
  const pathname = usePathname();
  const isEventPage = pathname?.startsWith("/events/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-6 transition-all duration-200 ${
        isEventPage
          ? "bg-[#0a0a0f]/95 backdrop-blur-sm border-b border-[#1a1a2e]"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group interactive"
          aria-label="Disaster Intel — Home"
        >
          <div className="w-6 h-6 relative">
            {/* Globe icon — simple SVG */}
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6">
              <circle cx="12" cy="12" r="9" stroke="#3b82f6" strokeWidth="1.5" />
              <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="3" y1="12" x2="21" y2="12" stroke="#3b82f6" strokeWidth="1.5" />
              <line x1="6" y1="7" x2="18" y2="7" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
              <line x1="6" y1="17" x2="18" y2="17" stroke="#3b82f6" strokeWidth="1" strokeDasharray="2 2" />
            </svg>
          </div>
          <span
            className="text-[11px] font-bold tracking-[0.18em] text-[#e5e5e5] uppercase"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            DISASTER INTEL
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-4">
          {isEventPage && (
            <Link
              href="/"
              className="flex items-center gap-1.5 text-[12px] text-[#6b7280] hover:text-[#e5e5e5] transition-colors duration-150 interactive"
            >
              <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Live Globe
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
