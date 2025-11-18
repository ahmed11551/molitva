import { useEffect, useState } from 'react';
import api from '../utils/api';
import LoadingState from '../components/LoadingState';
import Card from '../components/Card';
import SectionHeader from '../components/SectionHeader';
import './GlossaryTab.css';

interface GlossaryTerm {
  term: string;
  definition: string;
  transliteration?: string;
  arabic?: string;
  category?: string;
  source?: string;
}

export default function GlossaryTab() {
  const [terms, setTerms] = useState<GlossaryTerm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadGlossary();
  }, []);

  const loadGlossary = async () => {
    try {
      const response = await api.get('/glossary');
      setTerms(response.data.terms || []);
    } catch (error: any) {
      console.error('Failed to load glossary:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(terms.map(t => t.category).filter(Boolean))) as string[];
  const filteredTerms = terms.filter(term => {
    const matchesSearch = !searchQuery || 
      term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.definition.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingState message="Загрузка глоссария..." />;
  }

  return (
    <div className="glossary-tab">
      <SectionHeader
        title="Глоссарий"
        icon="📚"
        subtitle="Термины и определения"
      />

      <div className="glossary-search">
        <input
          type="text"
          placeholder="Поиск по термину или определению"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
      </div>

      {categories.length > 0 && (
        <div className="glossary-categories">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Все
          </button>
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="glossary-list">
        {filteredTerms.length === 0 ? (
          <Card variant="outlined" padding="medium">
            <p>Термины не найдены</p>
          </Card>
        ) : (
          filteredTerms.map((term, index) => (
            <Card key={index} variant="outlined" padding="medium" className="term-card">
              <div className="term-header">
                <h3 className="term-name">{term.term}</h3>
                {term.transliteration && (
                  <span className="term-transliteration">{term.transliteration}</span>
                )}
              </div>
              {term.arabic && (
                <div className="term-arabic">{term.arabic}</div>
              )}
              <p className="term-definition">{term.definition}</p>
              {term.category && (
                <div className="term-category">
                  <small>Категория: {term.category}</small>
                </div>
              )}
              {term.source && (
                <div className="term-source">
                  <small>Источник: {term.source}</small>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

