import './ProgressBar.css';

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  showLabel?: boolean;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  color?: 'primary' | 'success' | 'warning' | 'error';
  animated?: boolean;
}

export default function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  label,
  size = 'medium',
  color = 'primary',
  animated = true,
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  const displayLabel = label || `${Math.round(percentage)}%`;

  return (
    <div className={`progress-bar-wrapper ${size}`}>
      {showLabel && (
        <div className="progress-label">
          <span>{displayLabel}</span>
        </div>
      )}
      <div className="progress-bar-container">
        <div
          className={`progress-bar progress-bar-${color} ${animated ? 'animated' : ''}`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Прогресс: ${percentage}%`}
        />
      </div>
    </div>
  );
}

