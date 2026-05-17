import { WMO_WEATHER_CODES } from "./constants";
import type { WeatherData } from "./types";

export async function fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
  try {
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", lat.toFixed(6));
    url.searchParams.set("longitude", lon.toFixed(6));
    url.searchParams.set(
      "current",
      "temperature_2m,precipitation,wind_speed_10m,weather_code"
    );

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) return null;

    const data = await res.json();
    const current = data?.current;
    if (!current) return null;

    const weatherCode: number = current.weather_code ?? 0;
    const weatherLabel = WMO_WEATHER_CODES[weatherCode] ?? "Unknown conditions";

    return {
      temperature: Math.round(current.temperature_2m ?? 0),
      precipitation: current.precipitation ?? 0,
      windSpeed: Math.round(current.wind_speed_10m ?? 0),
      weatherCode,
      weatherLabel,
    };
  } catch {
    return null;
  }
}
