import type { EventSource } from "@/lib/types";

export function extractSourceUrl(source: EventSource, rawData: Record<string, unknown>): string | null {
  switch (source) {
    case "USGS": {
      const props = rawData?.properties as Record<string, unknown> | undefined;
      return (props?.url as string) ?? null;
    }
    case "RELIEFWEB":
      return (rawData?.url as string) ?? null;
    case "EONET": {
      const sources = rawData?.sources as Array<{ url?: string }> | undefined;
      return sources?.[0]?.url ?? null;
    }
    case "NOAA":
      return (rawData?.["@id"] as string) ?? (rawData?.url as string) ?? null;
    case "FEMA": {
      const num = rawData?.disasterNumber as string | number | undefined;
      return num ? `https://www.fema.gov/disaster/${num}` : null;
    }
    case "GDACS": {
      const guid = rawData?.guid as string | undefined;
      if (!guid || guid.length < 3) return null;
      const type = guid.slice(0, 2);
      const id = guid.slice(2);
      return `https://www.gdacs.org/report.aspx?eventid=${id}&eventtype=${type}`;
    }
    default:
      return null;
  }
}
