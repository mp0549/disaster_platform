"use client";

import { useState, useEffect } from "react";
import { fetchWeather } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";
import Skeleton from "@/components/ui/Skeleton";
import SectionHeader from "@/components/ui/SectionHeader";
import Card from "@/components/ui/Card";

interface WeatherPanelProps {
  lat: number;
  lon: number;
  accentColor?: string;
}

// SVG weather condition icon based on WMO code
function WeatherIcon({ code, className = "" }: { code: number; className?: string }) {
  const cls = `${className} stroke-current`;
  // Clear
  if (code === 0) return (
    <svg viewBox="0 0 32 32" fill="none" className={cls} strokeWidth="1.5" strokeLinecap="round">
      <circle cx="16" cy="16" r="6" />
      <line x1="16" y1="3" x2="16" y2="7" />
      <line x1="16" y1="25" x2="16" y2="29" />
      <line x1="3" y1="16" x2="7" y2="16" />
      <line x1="25" y1="16" x2="29" y2="16" />
      <line x1="7.5" y1="7.5" x2="10.3" y2="10.3" />
      <line x1="21.7" y1="21.7" x2="24.5" y2="24.5" />
      <line x1="24.5" y1="7.5" x2="21.7" y2="10.3" />
      <line x1="10.3" y1="21.7" x2="7.5" y2="24.5" />
    </svg>
  );
  // Partly cloudy
  if (code <= 2) return (
    <svg viewBox="0 0 32 32" fill="none" className={cls} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13" cy="14" r="5" />
      <path d="M10 22h12a5 5 0 0 0 0-10h-1a7 7 0 0 0-13 3" />
    </svg>
  );
  // Overcast / fog / drizzle
  if (code <= 55) return (
    <svg viewBox="0 0 32 32" fill="none" className={cls} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 22h18a6 6 0 0 0 0-12h-1a8 8 0 0 0-15 3" />
      <line x1="10" y1="26" x2="10" y2="28" />
      <line x1="16" y1="26" x2="16" y2="28" />
      <line x1="22" y1="26" x2="22" y2="28" />
    </svg>
  );
  // Snow
  if (code <= 77) return (
    <svg viewBox="0 0 32 32" fill="none" className={cls} strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 18h18a6 6 0 0 0 0-12h-1a8 8 0 0 0-15 3" strokeLinejoin="round" />
      <circle cx="10" cy="25" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="25" r="1" fill="currentColor" stroke="none" />
      <circle cx="22" cy="25" r="1" fill="currentColor" stroke="none" />
      <circle cx="13" cy="28" r="1" fill="currentColor" stroke="none" />
      <circle cx="19" cy="28" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
  // Rain / showers
  if (code <= 82) return (
    <svg viewBox="0 0 32 32" fill="none" className={cls} strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 18h18a6 6 0 0 0 0-12h-1a8 8 0 0 0-15 3" strokeLinejoin="round" />
      <line x1="10" y1="24" x2="9" y2="28" />
      <line x1="16" y1="24" x2="15" y2="28" />
      <line x1="22" y1="24" x2="21" y2="28" />
    </svg>
  );
  // Thunderstorm
  return (
    <svg viewBox="0 0 32 32" fill="none" className={cls} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 18h18a6 6 0 0 0 0-12h-1a8 8 0 0 0-15 3" />
      <polyline points="15,23 12,27 17,27 14,31" />
    </svg>
  );
}

// Minimal SVG icons for each stat
function TempIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <line x1="8" y1="2" x2="8" y2="9.5" />
      <circle cx="8" cy="12" r="2" fill="currentColor" stroke="none" />
      <line x1="10" y1="4.5" x2="12" y2="4.5" />
      <line x1="10" y1="6.5" x2="12" y2="6.5" />
    </svg>
  );
}

function WindIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 7h8a2 2 0 0 0 0-4" />
      <path d="M2 10h5a2 2 0 0 1 0 4" />
    </svg>
  );
}

function RainIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M3 9a5 5 0 1 1 10 0" strokeLinejoin="round" />
      <line x1="5" y1="12" x2="4.5" y2="14" />
      <line x1="8" y1="12" x2="7.5" y2="14" />
      <line x1="11" y1="12" x2="10.5" y2="14" />
    </svg>
  );
}

export default function WeatherPanel({ lat, lon, accentColor }: WeatherPanelProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchWeather(lat, lon).then((data) => {
      setWeather(data);
      setIsLoading(false);
    });
  }, [lat, lon]);

  return (
    <div>
      <SectionHeader title="Current Conditions" accent={accentColor} />

      <Card>
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton height="10px" width="60px" light />
                <Skeleton height="22px" width="80px" light />
              </div>
            ))}
          </div>
        ) : weather ? (
          <div>
            {/* Condition header */}
            <div className="flex items-center gap-3 mb-5">
              <div className="text-light-subtle">
                <WeatherIcon code={weather.weatherCode} className="w-9 h-9" />
              </div>
              <div>
                <p className="text-[14px] font-semibold text-light-strong">{weather.weatherLabel}</p>
                <p className="text-[11px] text-light-subtle">At event coordinates</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <WeatherStat
                label="Temp"
                value={`${weather.temperature}°C`}
                icon={<TempIcon />}
              />
              <WeatherStat
                label="Wind"
                value={`${weather.windSpeed}`}
                unit="km/h"
                icon={<WindIcon />}
              />
              <WeatherStat
                label="Precip"
                value={`${weather.precipitation}`}
                unit="mm"
                icon={<RainIcon />}
              />
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-light-muted">Weather data unavailable for this location.</p>
        )}
      </Card>
    </div>
  );
}

function WeatherStat({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-light-subtle">
        {icon}
        <dt className="text-[10px] font-semibold tracking-[0.08em] uppercase text-light-subtle">
          {label}
        </dt>
      </div>
      <dd className="text-[18px] font-semibold text-light-strong tabular-nums">
        {value}
        {unit && <span className="text-[12px] font-normal text-light-subtle ml-0.5">{unit}</span>}
      </dd>
    </div>
  );
}
