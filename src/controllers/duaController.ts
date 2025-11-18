import type { Request, Response } from "express";
import { DuaService } from "../services/duaService";
import { ValidationError } from "../errors/appError";

const parseNumber = (
  value?: string | string[],
  options: { min?: number; max?: number } = {}
): number | undefined => {
  if (!value || Array.isArray(value)) {
    return undefined;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new ValidationError(`Параметр должен быть числом: ${value}`);
  }
  if (options.min !== undefined && parsed < options.min) {
    throw new ValidationError(`Значение должно быть ≥ ${options.min}`);
  }
  if (options.max !== undefined && parsed > options.max) {
    throw new ValidationError(`Значение должно быть ≤ ${options.max}`);
  }
  return parsed;
};

export class DuaController {
  constructor(private readonly duaService: DuaService) {}

  getCategories = async (_req: Request, res: Response) => {
    const categories = await this.duaService.getCategories();
    res.json({ categories });
  };

  getDuas = async (req: Request, res: Response) => {
    const { category, q, lang, sort } = req.query;
    const limit = parseNumber(req.query.limit as string | undefined, {
      min: 1,
      max: 100
    });
    const offset = parseNumber(req.query.offset as string | undefined, {
      min: 0
    });

    const response = await this.duaService.getDuas({
      category: typeof category === "string" ? category : undefined,
      q: typeof q === "string" ? q : undefined,
      lang: typeof lang === "string" ? lang : undefined,
      sort: typeof sort === "string" ? sort : undefined,
      limit,
      offset
    });

    res.json(response);
  };

  getDua = async (req: Request, res: Response) => {
    const dua = await this.duaService.getDuaById(req.params.id);
    res.json(dua);
  };
}


