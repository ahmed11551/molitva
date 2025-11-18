import type {
  CatalogItem,
  DuaCategoryDto,
  DuaDto,
  DuaListResponse
} from "../types/dua";
import { EReplikaClient } from "./eReplikaClient";

export interface DuaQuery {
  category?: string;
  q?: string;
  lang?: string;
  limit?: number;
  offset?: number;
  sort?: string;
}

export class DuaService {
  constructor(private readonly eReplikaClient: EReplikaClient) {}

  async getCategories(): Promise<DuaCategoryDto[]> {
    const categories = await this.eReplikaClient.getCatalogCategories();
    return categories.map((category) => ({
      id: category.id,
      code: category.code,
      title: category.title,
      itemsCount: category.itemsCount
    }));
  }

  async getDuas(params: DuaQuery): Promise<DuaListResponse> {
    const response = await this.eReplikaClient.getCatalogItems({
      category: params.category ?? "dua",
      q: params.q,
      lang: params.lang ?? "ru",
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      sort: params.sort ?? "popular"
    });

    return {
      items: response.items.map((item) => this.mapCatalogItemToDua(item)),
      total: response.total,
      limit: response.limit,
      offset: response.offset
    };
  }

  async getDuaById(id: string): Promise<DuaDto> {
    const item = await this.eReplikaClient.getCatalogItem(id);
    return this.mapCatalogItemToDua(item);
  }

  private mapCatalogItemToDua(item: CatalogItem): DuaDto {
    const meta = item.meta ?? {};

    const getString = (value?: unknown | null): string | null =>
      typeof value === "string" && value.trim().length > 0 ? value : null;

    const getNumber = (value?: unknown | null): number | null =>
      typeof value === "number" ? value : null;

    return {
      id: item.id,
      title: item.title,
      arabicText: getString(meta.text_arabic),
      translation:
        getString(meta.translation_ru) ??
        getString(meta.translation_en) ??
        null,
      transliteration: getString(meta.transliteration),
      audioUrl: getString(meta.audio_url),
      category: getString(meta.category) ?? item.category ?? null,
      occasion: getString(meta.occasion),
      popularityScore: getNumber(meta.popularity_score),
      repetitionCount: getNumber(meta.repetition_count)
    };
  }
}


