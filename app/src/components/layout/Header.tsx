"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

function SunIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
      <circle cx="7" cy="7" r="2.8" />
      <line x1="7" y1="1" x2="7" y2="2.6" />
      <line x1="7" y1="11.4" x2="7" y2="13" />
      <line x1="1" y1="7" x2="2.6" y2="7" />
      <line x1="11.4" y1="7" x2="13" y2="7" />
      <line x1="3.05" y1="3.05" x2="4.18" y2="4.18" />
      <line x1="9.82" y1="9.82" x2="10.95" y2="10.95" />
      <line x1="10.95" y1="3.05" x2="9.82" y2="4.18" />
      <line x1="4.18" y1="9.82" x2="3.05" y2="10.95" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 14 14" fill="none" className="w-3.5 h-3.5 shrink-0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11.5 8.5A5.5 5.5 0 0 1 5.5 2.5a6 6 0 1 0 6 6z" />
    </svg>
  );
}

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("event-theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored === "dark" || (!stored && prefersDark);
    setIsDark(dark);
    setMounted(true);
    document.documentElement.setAttribute("data-event-theme", dark ? "dark" : "light");

    return () => {
      document.documentElement.removeAttribute("data-event-theme");
    };
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("event-theme", next ? "dark" : "light");
    document.documentElement.setAttribute("data-event-theme", next ? "dark" : "light");
  }

  if (!mounted) return <div className="w-16 h-6" />;

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors duration-150 active:scale-[0.97] text-dark-muted hover:text-dark-text border border-dark-border hover:border-dark-text/30"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
      {isDark ? "Light" : "Dark"}
    </button>
  );
}

export default function Header() {
  const pathname = usePathname();
  const isEventPage = pathname?.startsWith("/events/");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-6 transition-all duration-200 ${
        isEventPage
          ? "bg-dark-bg/95 backdrop-blur-sm border-b border-dark-border"
          : "bg-transparent"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="Disaster Intel — Home"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-6 h-6 transition-transform duration-300 ease-out group-hover:rotate-12"
          >
            <circle cx="12" cy="12" r="9" stroke="#EF9F27" strokeWidth="1.5" />
            <ellipse cx="12" cy="12" rx="4" ry="9" stroke="#EF9F27" strokeWidth="1.5" />
            <line x1="3" y1="12" x2="21" y2="12" stroke="#EF9F27" strokeWidth="1.5" />
            <line x1="6" y1="7" x2="18" y2="7" stroke="#EF9F27" strokeWidth="1" strokeDasharray="2 2" />
            <line x1="6" y1="17" x2="18" y2="17" stroke="#EF9F27" strokeWidth="1" strokeDasharray="2 2" />
          </svg>
          <span className="text-[11px] font-bold tracking-[0.18em] text-dark-text uppercase">
            Disaster Intel
          </span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-3">
          {isEventPage && (
            <>
              <ThemeToggle />
              <Link
                href="/"
                className="flex items-center gap-1.5 text-[12px] text-dark-muted hover:text-dark-text transition-colors duration-150 group"
              >
                <svg
                  viewBox="0 0 16 16"
                  fill="none"
                  className="w-3.5 h-3.5 transition-transform duration-150 group-hover:-translate-x-1"
                >
                  <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                Live Globe
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
