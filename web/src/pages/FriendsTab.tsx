import { useEffect, useState } from 'react';
import api from '../utils/api';
import LoadingState from '../components/LoadingState';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import Button from '../components/Button';
import ProgressBar from '../components/ProgressBar';
import StatRow from '../components/StatRow';
import './FriendsTab.css';

interface Friend {
  id: string;
  friend_user_id: string;
  status: string;
}

interface FriendStats {
  friend_user_id: string;
  total_completed: number;
  total_debt: number;
  progress_percent: number;
  rank?: number;
}

interface LeaderboardEntry {
  user_id: string;
  total_completed: number;
  total_debt: number;
  progress_percent: number;
  rank: number;
}

export default function FriendsTab() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsStats, setFriendsStats] = useState<FriendStats[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'friends' | 'leaderboard'>('friends');
  const [friendRequestId, setFriendRequestId] = useState('');

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'friends') {
        const [friendsRes, statsRes] = await Promise.all([
          api.get('/friends').catch(() => ({ data: { friends: [] } })),
          api.get('/friends/stats').catch(() => ({ data: { stats: [] } })),
        ]);
        setFriends(friendsRes.data.friends || []);
        setFriendsStats(statsRes.data.stats || []);
      } else {
        const leaderboardRes = await api.get('/friends/leaderboard', {
          params: { limit: 20 },
        });
        setLeaderboard(leaderboardRes.data.leaderboard || []);
      }
    } catch (error: any) {
      console.error('Error loading friends data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!friendRequestId.trim()) {
      alert('Введите ID пользователя');
      return;
    }

    try {
      await api.post('/friends/request', {
        to_user_id: friendRequestId.trim(),
      });
      alert('Запрос на дружбу отправлен!');
      setFriendRequestId('');
      await loadData();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Ошибка отправки запроса');
    }
  };

  if (loading) {
    return <LoadingState message="Загрузка..." />;
  }

  return (
    <div className="friends-tab">
      <div className="friends-tabs">
        <button
          className={`tab-button ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          👥 Друзья
        </button>
        <button
          className={`tab-button ${activeTab === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('leaderboard')}
        >
          🏆 Лидерборд
        </button>
      </div>

      {activeTab === 'friends' ? (
        <>
          <Card variant="outlined" padding="medium" className="add-friend-card">
            <SectionHeader title="Добавить друга" icon="➕" />
            <div className="friend-request-form">
              <input
                type="text"
                placeholder="ID пользователя Telegram"
                value={friendRequestId}
                onChange={(e) => setFriendRequestId(e.target.value)}
                className="friend-input"
              />
              <Button
                variant="primary"
                size="medium"
                onClick={handleSendFriendRequest}
                icon="📤"
              >
                Отправить запрос
              </Button>
            </div>
          </Card>

          {friendsStats.length > 0 ? (
            <Card variant="elevated" padding="large">
              <SectionHeader title="Сравнение с друзьями" icon="📊" />
              <div className="friends-comparison">
                {friendsStats.map((stat, idx) => (
                  <Card key={idx} variant="outlined" padding="medium" className="friend-stat-card">
                    <div className="friend-stat-header">
                      <span className="friend-rank">#{stat.rank || idx + 1}</span>
                      <span className="friend-id">{stat.friend_user_id.slice(0, 8)}...</span>
                    </div>
                    <ProgressBar
                      value={stat.total_completed}
                      max={stat.total_debt}
                      showLabel
                      label={`${stat.progress_percent}%`}
                      size="medium"
                      color="primary"
                    />
                    <div className="friend-stat-details">
                      <StatRow
                        label="Восполнено"
                        value={stat.total_completed.toLocaleString()}
                        icon="✅"
                      />
                      <StatRow
                        label="Всего"
                        value={stat.total_debt.toLocaleString()}
                        icon="📊"
                      />
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          ) : (
            <Card variant="outlined" padding="medium">
              <p>У вас пока нет друзей. Добавьте друзей для сравнения прогресса!</p>
            </Card>
          )}
        </>
      ) : (
        <Card variant="elevated" padding="large">
          <SectionHeader title="Топ пользователей" icon="🏆" />
          <div className="leaderboard-list">
            {leaderboard.length > 0 ? (
              leaderboard.map((entry, idx) => (
                <Card key={idx} variant="outlined" padding="medium" className="leaderboard-entry">
                  <div className="leaderboard-rank">#{entry.rank}</div>
                  <div className="leaderboard-info">
                    <div className="leaderboard-user">{entry.user_id.slice(0, 12)}...</div>
                    <ProgressBar
                      value={entry.total_completed}
                      max={entry.total_debt}
                      showLabel
                      label={`${entry.progress_percent}%`}
                      size="small"
                      color="primary"
                    />
                  </div>
                  <div className="leaderboard-stats">
                    <span className="leaderboard-completed">{entry.total_completed.toLocaleString()}</span>
                  </div>
                </Card>
              ))
            ) : (
              <p>Лидерборд пуст</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

