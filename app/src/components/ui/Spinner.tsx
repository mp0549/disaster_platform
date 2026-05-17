interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "w-4 h-4 border",
  md: "w-6 h-6 border-2",
  lg: "w-8 h-8 border-2",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`${SIZE_CLASSES[size]} border-[#3b82f6] border-t-transparent rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
