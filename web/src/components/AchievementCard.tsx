import { useState } from 'react';
import Card from './Card';
import Button from './Button';
import './AchievementCard.css';

interface AchievementCardProps {
  title: string;
  message: string;
  target: number;
  completed: number;
  onShare?: () => void;
}

export default function AchievementCard({
  title,
  message,
  target,
  completed,
  onShare,
}: AchievementCardProps) {
  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    if (onShare) {
      onShare();
    } else {
      const shareText = `🎉 ${title}\n\n${message}\n\nВосполнено: ${completed.toLocaleString()} из ${target.toLocaleString()} намазов\n\nПусть Аллах примет наши молитвы! 🤲`;

      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: shareText,
          });
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        } catch (err: any) {
          if (err.name !== 'AbortError') {
            console.error('Share error:', err);
          }
        }
      } else {
        try {
          await navigator.clipboard.writeText(shareText);
          setShared(true);
          setTimeout(() => setShared(false), 3000);
        } catch (err) {
          prompt('Скопируйте текст:', shareText);
        }
      }
    }
  };

  return (
    <Card variant="elevated" padding="large" className="achievement-card">
      <div className="achievement-header">
        <div className="achievement-icon">🏆</div>
        <div className="achievement-content">
          <h3 className="achievement-title">{title}</h3>
          <p className="achievement-message">{message}</p>
        </div>
      </div>
      <div className="achievement-progress">
        <div className="achievement-stats">
          <span className="achievement-completed">{completed.toLocaleString()}</span>
          <span className="achievement-separator">/</span>
          <span className="achievement-target">{target.toLocaleString()}</span>
        </div>
      </div>
      <Button
        variant="primary"
        size="medium"
        fullWidth
        onClick={handleShare}
        icon={shared ? "✅" : "📤"}
        disabled={shared}
      >
        {shared ? "Поделено!" : "Поделиться достижением"}
      </Button>
    </Card>
  );
}

