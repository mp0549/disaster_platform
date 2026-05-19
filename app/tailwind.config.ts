import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        // Dark theme (globe/homepage)
        dark: {
          bg: "#0a0a0f",
          surface: "#0f0f1a",
          border: "#1a1a2e",
          text: "#e5e5e5",
          muted: "#6b7280",
          accent: "#3b82f6",
        },
        // Light theme (event detail pages)
        light: {
          bg: "#fafafa",
          panel: "#ffffff",
          border: "#e5e5e5",
          divider: "#f0f0f0",
          strong: "#111827",
          text: "#1f2937",
          muted: "#6b7280",
          subtle: "#9ca3af",
          hover: "#f9fafb",
        },
        // Sky tint (AI summary panels + accents)
        sky: {
          bg: "#f0f9ff",
          edge: "#e0f2fe",
          border: "#bae6fd",
          accent: "#0ea5e9",
          text: "#0369a1",
          strong: "#0c4a6e",
          faint: "#7dd3fc",
        },
        // Disaster type colors
        earthquake: "#f97316",
        wildfire: "#ef4444",
        flood: "#3b82f6",
        storm: "#8b5cf6",
        volcano: "#f59e0b",
        drought: "#a16207",
        other: "#6b7280",
      },
      letterSpacing: {
        widest: "0.2em",
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.3s cubic-bezier(0.23, 1, 0.32, 1)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
