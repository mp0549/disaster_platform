"use client";

import { useState, useEffect } from "react";
import { fetchWeather } from "@/lib/weather";
import type { WeatherData } from "@/lib/types";
import Skeleton from "@/components/ui/Skeleton";

interface WeatherPanelProps {
  lat: number;
  lon: number;
}

function getWeatherEmoji(code: number): string {
  if (code === 0) return "☀️";
  if (code <= 2) return "🌤️";
  if (code === 3) return "☁️";
  if (code <= 48) return "🌫️";
  if (code <= 55) return "🌦️";
  if (code <= 65) return "🌧️";
  if (code <= 77) return "🌨️";
  if (code <= 82) return "🌧️";
  if (code <= 86) return "🌨️";
  return "⛈️";
}

export default function WeatherPanel({ lat, lon }: WeatherPanelProps) {
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
      <h2 className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#9ca3af] mb-3">
        Current Conditions
      </h2>

      <div className="rounded-lg border border-[#e5e5e5] bg-white p-5">
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
            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl">{getWeatherEmoji(weather.weatherCode)}</span>
              <div>
                <p className="text-[13px] font-medium text-[#1f2937]">{weather.weatherLabel}</p>
                <p className="text-[11px] text-[#6b7280]">At event coordinates</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <WeatherStat
                label="Temperature"
                value={`${weather.temperature}°C`}
                icon="🌡️"
              />
              <WeatherStat
                label="Wind"
                value={`${weather.windSpeed} km/h`}
                icon="💨"
              />
              <WeatherStat
                label="Precipitation"
                value={`${weather.precipitation} mm`}
                icon="🌧️"
              />
            </div>
          </div>
        ) : (
          <p className="text-[13px] text-[#6b7280]">Weather data unavailable for this location.</p>
        )}
      </div>
    </div>
  );
}

function WeatherStat({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <span className="text-sm">{icon}</span>
        <dt className="text-[10px] font-semibold tracking-[0.08em] uppercase text-[#9ca3af]">
          {label}
        </dt>
      </div>
      <dd className="text-[18px] font-semibold text-[#111827] tabular-nums">{value}</dd>
    </div>
  );
}
