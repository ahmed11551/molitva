import { Routes, Route } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Layout from './components/Layout';
import CalculationTab from './pages/CalculationTab';
import MyDebtTab from './pages/MyDebtTab';
import TravelPrayersTab from './pages/TravelPrayersTab';
import RepaymentPlanTab from './pages/RepaymentPlanTab';
import ReportsTab from './pages/ReportsTab';
import DuasTab from './pages/DuasTab';
import GoalsTab from './pages/GoalsTab';
import GlossaryTab from './pages/GlossaryTab';
import PrayerCalendarTab from './pages/PrayerCalendarTab';
import FriendsTab from './pages/FriendsTab';
import ConsentModal from './components/ConsentModal';
import { initTelegramWebApp } from './utils/telegram';

const CONSENT_STORAGE_KEY = 'prayer_debt_consent';

function App() {
  const [showConsent, setShowConsent] = useState(false);

  useEffect(() => {
    initTelegramWebApp();
    
    // Проверяем, дал ли пользователь согласие
    const consent = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!consent) {
      setShowConsent(true);
    }
  }, []);

  const handleConsentAccept = () => {
    localStorage.setItem(CONSENT_STORAGE_KEY, 'accepted');
    localStorage.setItem(`${CONSENT_STORAGE_KEY}_date`, new Date().toISOString());
    setShowConsent(false);
  };

  const handleConsentDecline = () => {
    // При отклонении можно показать сообщение или перенаправить
    alert('Для работы приложения необходимо согласие на обработку данных.');
    // Можно также закрыть приложение или показать информационную страницу
  };

  return (
    <>
      <ConsentModal
        isOpen={showConsent}
        onAccept={handleConsentAccept}
        onDecline={handleConsentDecline}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<CalculationTab />} />
          <Route path="/debt" element={<MyDebtTab />} />
          <Route path="/travel" element={<TravelPrayersTab />} />
          <Route path="/plan" element={<RepaymentPlanTab />} />
          <Route path="/reports" element={<ReportsTab />} />
          <Route path="/duas" element={<DuasTab />} />
          <Route path="/goals" element={<GoalsTab />} />
          <Route path="/glossary" element={<GlossaryTab />} />
          <Route path="/calendar" element={<PrayerCalendarTab />} />
          <Route path="/friends" element={<FriendsTab />} />
        </Routes>
      </Layout>
    </>
  );
}

export default App;

