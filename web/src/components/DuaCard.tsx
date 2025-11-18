import type { Dua } from '../types';
import AudioPlayer from './AudioPlayer';
import './DuaCard.css';

interface DuaCardProps {
  dua: Dua;
  index?: number;
}

const formatLabel = (value: string | null) => {
  if (!value) return null;
  return value
    .split('_')
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

export default function DuaCard({ dua, index }: DuaCardProps) {
  const occasion = formatLabel(dua.occasion);
  const numberLabel = typeof index === 'number' ? index + 1 : null;

  return (
    <div className="dua-card">
      <div className="dua-header">
        <div className="dua-title-block">
          {numberLabel && <span className="dua-number">#{numberLabel}</span>}
          <div>
            <p className="dua-title">{dua.title}</p>
            {occasion && <p className="dua-occasion">{occasion}</p>}
          </div>
        </div>
        {dua.category && <span className="dua-category-chip">{formatLabel(dua.category)}</span>}
      </div>

      {dua.transliteration && (
        <div className="dua-transcription">{dua.transliteration}</div>
      )}

      {dua.arabicText && <div className="dua-arabic">{dua.arabicText}</div>}

      {dua.audioUrl && (
        <div className="dua-audio">
          <AudioPlayer audioUrl={dua.audioUrl} />
        </div>
      )}

      {dua.translation && <div className="dua-translation">{dua.translation}</div>}

      <div className="dua-meta">
        {dua.popularityScore !== null && (
          <span>Популярность: {Math.round(dua.popularityScore)}</span>
        )}
        {dua.repetitionCount && dua.repetitionCount > 1 && (
          <span>Повторить {dua.repetitionCount} раз</span>
        )}
      </div>
    </div>
  );
}

