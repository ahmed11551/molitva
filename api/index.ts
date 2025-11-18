// Vercel serverless function entry point
// @vercel/node will be installed automatically by Vercel
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";

// Vercel expects a default export that handles requests
export default async (req: VercelRequest, res: VercelResponse) => {
  // Convert Vercel request/response to Express format
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => {
      resolve();
    });
  });
};
