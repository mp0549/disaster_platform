import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Disaster Intel — Real-Time Global Disaster Intelligence",
    template: "%s | Disaster Intel",
  },
  description:
    "Real-time global disaster intelligence platform. Track earthquakes, wildfires, floods, storms, and more on a live 3D globe.",
  keywords: ["disaster", "earthquake", "wildfire", "flood", "storm", "real-time", "intelligence"],
  openGraph: {
    title: "Disaster Intel — Real-Time Global Disaster Intelligence",
    description:
      "Track active disasters worldwide on a live 3D globe. Powered by USGS, EONET, GDACS, FEMA, NOAA, and more.",
    type: "website",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Disaster Intel",
    description: "Real-time global disaster intelligence platform.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0a0a0f" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
      </head>
      <body className="bg-[#0a0a0f] text-[#e5e5e5] antialiased">{children}</body>
    </html>
  );
}
