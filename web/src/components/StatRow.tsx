import './StatRow.css';

interface StatRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
  icon?: string;
}

export default function StatRow({ label, value, highlight = false, icon }: StatRowProps) {
  return (
    <div className={`stat-row ${highlight ? 'highlight' : ''}`}>
      <span className="stat-label">
        {icon && <span className="stat-icon">{icon}</span>}
        {label}
      </span>
      <span className="stat-value">{value}</span>
    </div>
  );
}

