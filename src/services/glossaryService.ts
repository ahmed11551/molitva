import { EReplikaClient } from "./eReplikaClient";
import type { GlossaryTerm, GlossaryResponse } from "../types/glossary";
import { logger } from "../utils/logger";

export class GlossaryService {
  constructor(private readonly eReplikaClient: EReplikaClient) {}

  /**
   * Получает глоссарий терминов из e-Replika
   */
  async getGlossary(): Promise<GlossaryTerm[]> {
    try {
      const response = await this.eReplikaClient.getGlossary();
      return response.terms || [];
    } catch (error: any) {
      logger.error("Failed to fetch glossary from e-Replika", {
        error: error.message,
      });
      // Возвращаем базовый глоссарий
      return this.getDefaultGlossary();
    }
  }

  /**
   * Получает термин по названию
   */
  async getTerm(term: string): Promise<GlossaryTerm | null> {
    const glossary = await this.getGlossary();
    const found = glossary.find(
      (t) => t.term.toLowerCase() === term.toLowerCase()
    );
    return found || null;
  }

  /**
   * Базовый глоссарий (fallback)
   */
  private getDefaultGlossary(): GlossaryTerm[] {
    return [
      {
        term: "Булюг",
        definition:
          "Наступление совершеннолетия. По умолчанию 15 лет (хиджра).",
        transliteration: "Bulugh",
        arabic: "بلوغ",
        category: "Основные термины",
      },
      {
        term: "Хайд",
        definition:
          "Ежемесячный женский период, не требующий срока для молитв.",
        transliteration: "Haid",
        arabic: "حيض",
        category: "Женские периоды",
      },
      {
        term: "Нифас",
        definition: "Послеродовой период, по умолчанию 40 дней.",
        transliteration: "Nifas",
        arabic: "نفاس",
        category: "Женские периоды",
      },
      {
        term: "Сафар",
        definition: "Путешествие, когда допускается кыср-намаз.",
        transliteration: "Safar",
        arabic: "سفر",
        category: "Путешествия",
      },
      {
        term: "Каза",
        definition: "Восполнение пропущенных обязательных намазов.",
        transliteration: "Qada",
        arabic: "قضاء",
        category: "Основные термины",
      },
      {
        term: "Витр",
        definition:
          "Обязательный (вāджиб) намаз в ханафитском мазхабе. В шафиитском мазхабе считается нафилью.",
        transliteration: "Witr",
        arabic: "وتر",
        category: "Намазы",
      },
    ];
  }
}

