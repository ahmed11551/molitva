import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import api from '../utils/api';
import type { UserPrayerDebt } from '../types';
import './Layout.css';

interface LayoutProps {
  children: ReactNode;
}

const tabs = [
  { path: '/', label: 'Расчёт', icon: '📅' },
  { path: '/debt', label: 'Мой долг', icon: '🕌' },
  { path: '/travel', label: 'Сафар', icon: '✈️' },
  { path: '/plan', label: 'План', icon: '📊' },
  { path: '/reports', label: 'Отчёты', icon: '📈' },
  { path: '/goals', label: 'Цели', icon: '🎯' },
  { path: '/calendar', label: 'Календарь', icon: '📅' },
  { path: '/duas', label: 'Ду\'а', icon: '📖' },
  { path: '/glossary', label: 'Глоссарий', icon: '📚' },
  { path: '/friends', label: 'Друзья', icon: '👥' },
];

const getMadhabText = (madhab?: string): string => {
  if (madhab === 'shafii') {
    return 'Расчёт по шафиитскому мазхабу';
  }
  return 'Расчёт по ханафитскому мазхабу';
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [madhabText, setMadhabText] = useState<string>('Расчёт по ханафитскому мазхабу');

  useEffect(() => {
    // Пытаемся загрузить текущий мазхаб пользователя
    api.get('/prayer-debt/snapshot')
      .then((response) => {
        const debt: UserPrayerDebt = response.data;
        setMadhabText(getMadhabText(debt.madhab));
      })
      .catch(() => {
        // Если расчёт не выполнен, оставляем дефолтный текст
      });
  }, []);

  return (
    <div className="layout">
      <header className="layout-header">
        <h1>Пропущенные намазы (Каза)</h1>
        <p className="layout-subtitle">{madhabText}</p>
      </header>

      <main className="layout-main">{children}</main>

      <nav className="layout-nav">
        {tabs.map((tab) => (
          <Link
            key={tab.path}
            to={tab.path}
            className={`nav-item ${location.pathname === tab.path ? 'active' : ''}`}
          >
            <span className="nav-icon">{tab.icon}</span>
            <span className="nav-label">{tab.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

