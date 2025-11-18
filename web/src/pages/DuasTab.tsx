import { useState, useEffect } from 'react';
import DuaCard from '../components/DuaCard';
import type { Dua, DuaCategory, DuaListResponse } from '../types';
import api from '../utils/api';
import './DuasTab.css';

const DEFAULT_CATEGORY = 'dua';
const CATEGORY_ICONS: Record<string, string> = {
  all: '⭐',
  dua: '📖',
  dhikr: '🕯',
  kalima: '📜',
  salawat: '🤲',
  nashid: '🎶',
  surah: '📘',
  ayah: '🕋'
};

export default function DuasTab() {
  const [duas, setDuas] = useState<Dua[]>([]);
  const [categories, setCategories] = useState<DuaCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(DEFAULT_CATEGORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState({ total: 0, limit: 20, offset: 0 });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery.trim());
    }, 400);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadDuas(selectedCategory, debouncedQuery);
  }, [selectedCategory, debouncedQuery]);

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await api.get<{ categories: DuaCategory[] }>('/duas/categories');
      const allOption: DuaCategory = {
        id: 'all',
        code: 'all',
        title: 'Все',
        itemsCount: response.data.categories.reduce((acc, cat) => acc + cat.itemsCount, 0)
      };
      setCategories([allOption, ...response.data.categories]);
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить категории ду\'а');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const loadDuas = async (category: string, query: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<DuaListResponse>('/duas', {
        params: {
          category: category === 'all' ? undefined : category,
          q: query || undefined,
          lang: 'ru',
          limit: 20
        }
      });
      setDuas(response.data.items);
      setMeta({
        total: response.data.total,
        limit: response.data.limit,
        offset: response.data.offset
      });
    } catch (err) {
      console.error(err);
      setError('Не удалось загрузить ду\'а');
      setDuas([]);
      setMeta({ total: 0, limit: 20, offset: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (code: string) => CATEGORY_ICONS[code] ?? '📗';

  return (
    <div className="duas-tab">
      <div className="duas-header">
        <h1>📖 Ду'а</h1>
        <p className="duas-subtitle">Мольбы, зикры, калимы и салаваты из каталога e-Replika</p>
      </div>

      <div className="duas-search">
        <input
          type="text"
          placeholder="Поиск по названию, переводу или транскрипции"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {categoriesLoading ? (
        <div className="loading">Загрузка категорий...</div>
      ) : (
        categories.length > 0 && (
          <div className="duas-categories">
            {categories.map((category) => (
              <button
                key={category.code}
                className={`category-btn ${selectedCategory === category.code ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category.code)}
              >
                <span className="category-icon">{getCategoryIcon(category.code)}</span>
                <span className="category-name">{category.title}</span>
                {category.itemsCount > 0 && (
                  <span className="category-count">{category.itemsCount}</span>
                )}
              </button>
            ))}
          </div>
        )
      )}

      {error && <div className="error-banner">{error}</div>}

      {loading ? (
        <div className="loading">Загрузка ду'а...</div>
      ) : (
        <>
          <div className="duas-meta">
            <span>Найдено: {meta.total}</span>
            {selectedCategory !== 'all' && (
              <span>Категория: {categories.find((c) => c.code === selectedCategory)?.title}</span>
            )}
            {debouncedQuery && <span>Поиск: «{debouncedQuery}»</span>}
          </div>

          <div className="duas-list">
            {duas.length > 0 ? (
              duas.map((dua, index) => <DuaCard key={dua.id} dua={dua} index={index} />)
            ) : (
              <div className="empty-state">
                <p>Ду'а не найдены. Попробуйте изменить категорию или запрос.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

