import LoadingSpinner from './LoadingSpinner';
import './LoadingState.css';

interface LoadingStateProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

export default function LoadingState({
  message = 'Загрузка...',
  size = 'medium',
  fullScreen = false,
}: LoadingStateProps) {
  return (
    <div className={`loading-state ${fullScreen ? 'loading-state-fullscreen' : ''}`}>
      <LoadingSpinner size={size} />
      {message && <p className="loading-state-message">{message}</p>}
    </div>
  );
}

