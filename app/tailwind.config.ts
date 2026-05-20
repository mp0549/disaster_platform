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
        // Light theme (event detail pages) — values via CSS custom properties so dark mode flips automatically
        light: {
          bg:      "rgb(var(--light-bg)      / <alpha-value>)",
          panel:   "rgb(var(--light-panel)   / <alpha-value>)",
          border:  "rgb(var(--light-border)  / <alpha-value>)",
          divider: "rgb(var(--light-divider) / <alpha-value>)",
          strong:  "rgb(var(--light-strong)  / <alpha-value>)",
          text:    "rgb(var(--light-text)    / <alpha-value>)",
          muted:   "rgb(var(--light-muted)   / <alpha-value>)",
          subtle:  "rgb(var(--light-subtle)  / <alpha-value>)",
          hover:   "rgb(var(--light-hover)   / <alpha-value>)",
        },
        // Sky tint (AI summary panels + accents) — also theme-responsive
        sky: {
          bg:     "rgb(var(--sky-bg)     / <alpha-value>)",
          edge:   "rgb(var(--sky-edge)   / <alpha-value>)",
          border: "rgb(var(--sky-border) / <alpha-value>)",
          accent: "rgb(var(--sky-accent) / <alpha-value>)",
          text:   "rgb(var(--sky-text)   / <alpha-value>)",
          strong: "rgb(var(--sky-strong) / <alpha-value>)",
          faint:  "rgb(var(--sky-faint)  / <alpha-value>)",
        },
        // Disaster type colors (map markers / StatsBar dots)
        earthquake: "#f97316",
        wildfire: "#ef4444",
        flood: "#3b82f6",
        storm: "#8b5cf6",
        volcano: "#f59e0b",
        drought: "#a16207",
        other: "#6b7280",
        // GRIP domain ramps (50=light-fill / 400=mid-globe / 600=dark-border / 800=text-on-light)
        grip: {
          natural:      { 50: "#FAEEDA", 400: "#EF9F27", 600: "#BA7517", 800: "#633806" },
          biological:   { 50: "#EAF3DE", 400: "#97C459", 600: "#3B6D11", 800: "#173404" },
          tech:         { 50: "#FAECE7", 400: "#F0997B", 600: "#993C1D", 800: "#4A1B0C" },
          geo:          { 50: "#EEEDFE", 400: "#AFA9EC", 600: "#534AB7", 800: "#26215C" },
          cyber:        { 50: "#E1F5EE", 400: "#5DCAA5", 600: "#0F6E56", 800: "#04342C" },
          infra:        { 50: "#E6F1FB", 400: "#85B7EB", 600: "#185FA5", 800: "#042C53" },
        },
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
