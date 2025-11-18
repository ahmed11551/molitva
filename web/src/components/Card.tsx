import { ReactNode } from 'react';
import './Card.css';

interface CardProps {
  children: ReactNode;
  title?: string;
  icon?: string;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'small' | 'medium' | 'large';
  className?: string;
}

export default function Card({
  children,
  title,
  icon,
  variant = 'default',
  padding = 'medium',
  className = '',
}: CardProps) {
  return (
    <div className={`card card-${variant} card-padding-${padding} ${className}`}>
      {title && (
        <div className="card-header">
          {icon && <span className="card-icon">{icon}</span>}
          <h3 className="card-title">{title}</h3>
        </div>
      )}
      <div className="card-content">{children}</div>
    </div>
  );
}

