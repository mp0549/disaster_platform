interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  light?: boolean;
}

export default function EmptyState({ title, description, icon, light = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
      {icon && <div className="mb-3 opacity-40 text-3xl">{icon}</div>}
      <p className={`text-sm font-medium ${light ? "text-light-muted" : "text-[#9ca3af]"}`}>
        {title}
      </p>
      {description && (
        <p className={`text-xs mt-1 ${light ? "text-light-subtle" : "text-[#6b7280]"}`}>
          {description}
        </p>
      )}
    </div>
  );
}
