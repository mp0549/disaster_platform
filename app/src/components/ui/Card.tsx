interface CardProps {
  children: React.ReactNode;
  className?: string;
  dark?: boolean;
}

export default function Card({ children, className = "", dark = false }: CardProps) {
  if (dark) {
    return (
      <div className={`card-dark ${className}`}>{children}</div>
    );
  }
  return (
    <div className={`card ${className}`}>{children}</div>
  );
}
