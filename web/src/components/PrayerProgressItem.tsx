import ProgressBar from './ProgressBar';
import './PrayerProgressItem.css';

interface PrayerProgressItemProps {
  icon: string;
  name: string;
  completed: number;
  total: number;
  showCount?: boolean;
}

export default function PrayerProgressItem({
  icon,
  name,
  completed,
  total,
  showCount = true,
}: PrayerProgressItemProps) {
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="prayer-progress-item">
      <div className="prayer-progress-header">
        <span className="prayer-icon">{icon}</span>
        <span className="prayer-name">{name}</span>
        <span className="prayer-percent">{percent}%</span>
      </div>
      <ProgressBar value={completed} max={total} size="medium" color="primary" />
      {showCount && (
        <p className="prayer-count">
          {completed.toLocaleString()} / {total.toLocaleString()}
        </p>
      )}
    </div>
  );
}

