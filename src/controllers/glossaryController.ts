import { Request, Response } from "express";
import { GlossaryService } from "../services/glossaryService";
import { asyncHandler } from "../utils/asyncHandler";

export class GlossaryController {
  constructor(private readonly glossaryService: GlossaryService) {}

  /**
   * GET /api/glossary
   * Получает весь глоссарий
   */
  getGlossary = asyncHandler(async (req: Request, res: Response) => {
    const terms = await this.glossaryService.getGlossary();
    res.json({
      terms,
      total: terms.length,
    });
  });

  /**
   * GET /api/glossary/:term
   * Получает конкретный термин
   */
  getTerm = asyncHandler(async (req: Request, res: Response) => {
    const { term } = req.params;
    const glossaryTerm = await this.glossaryService.getTerm(term);

    if (!glossaryTerm) {
      return res.status(404).json({
        message: `Термин "${term}" не найден`,
      });
    }

    res.json(glossaryTerm);
  });
}

