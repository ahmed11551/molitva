import type { ErrorRequestHandler } from "express";
import { AppError } from "../errors/appError";
import { logger } from "../utils/logger";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    return res
      .status(err.statusCode)
      .json({ message: err.message, details: err.details });
  }

  logger.error("Unhandled error", err);
  return res.status(500).json({ message: "Internal Server Error" });
};


