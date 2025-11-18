import './SectionHeader.css';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export default function SectionHeader({ title, icon, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header-content">
        {icon && <span className="section-header-icon">{icon}</span>}
        <div className="section-header-text">
          <h2 className="section-header-title">{title}</h2>
          {subtitle && <p className="section-header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="section-header-action">{action}</div>}
    </div>
  );
}

