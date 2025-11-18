export interface CatalogCategory {
  id: string;
  code: string;
  title: string;
  itemsCount: number;
}

export interface CatalogItemMeta {
  audio_url?: string | null;
  text_arabic?: string | null;
  translation_ru?: string | null;
  translation_en?: string | null;
  transliteration?: string | null;
  category?: string | null;
  occasion?: string | null;
  madhab?: string | null;
  country?: string | null;
  popularity_score?: number | null;
  repetition_count?: number | null;
  [key: string]: unknown;
}

export interface CatalogItem {
  id: string;
  type: string;
  category: string;
  title: string;
  meta: CatalogItemMeta;
  availability: string;
}

export interface CatalogItemsResponse {
  items: CatalogItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface DuaCategoryDto {
  id: string;
  code: string;
  title: string;
  itemsCount: number;
}

export interface DuaDto {
  id: string;
  title: string;
  arabicText: string | null;
  translation: string | null;
  transliteration: string | null;
  audioUrl: string | null;
  category: string | null;
  occasion: string | null;
  popularityScore: number | null;
  repetitionCount: number | null;
}

export interface DuaListResponse {
  items: DuaDto[];
  total: number;
  limit: number;
  offset: number;
}


