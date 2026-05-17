import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
      <div className="text-center">
        <p className="text-[11px] font-bold tracking-[0.2em] text-[#3b82f6] uppercase mb-4">
          404
        </p>
        <h1
          className="text-[48px] font-bold text-[#e5e5e5] mb-3"
          style={{ letterSpacing: "-0.03em", lineHeight: "1.1" }}
        >
          Not Found
        </h1>
        <p className="text-[14px] text-[#6b7280] mb-8 max-w-sm mx-auto">
          This event doesn&apos;t exist or may have been removed from our records.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3b82f6] text-white text-[13px] font-semibold rounded-lg transition-all duration-150 hover:bg-[#2563eb] interactive"
        >
          <svg viewBox="0 0 16 16" fill="none" className="w-4 h-4">
            <path d="M2 8h12M8 2l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Globe
        </Link>
      </div>
    </div>
  );
}
