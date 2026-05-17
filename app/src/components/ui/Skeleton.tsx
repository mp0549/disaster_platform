interface SkeletonProps {
  width?: string;
  height?: string;
  className?: string;
  light?: boolean;
}

export default function Skeleton({ width, height, className = "", light = false }: SkeletonProps) {
  return (
    <div
      className={`rounded ${light ? "skeleton-light" : "skeleton"} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({ lines = 3, light = false }: { lines?: number; light?: boolean }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={i === lines - 1 ? "65%" : "100%"}
          light={light}
        />
      ))}
    </div>
  );
}
