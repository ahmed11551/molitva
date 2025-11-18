// Vercel serverless function entry point
// @vercel/node will be installed automatically by Vercel
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import { loadConfig } from "../src/config";
import { initSupabase } from "../src/db/supabase";

// Initialize Supabase on first load (lazy initialization)
let initialized = false;
if (!initialized) {
  const config = loadConfig();
  initSupabase(config.supabase);
  initialized = true;
}

// Vercel expects a default export that handles requests
export default async (req: VercelRequest, res: VercelResponse) => {
  // Convert Vercel request/response to Express format
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => {
      resolve();
    });
  });
};
