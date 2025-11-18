// Vercel serverless function entry point
// @vercel/node will be installed automatically by Vercel
import type { VercelRequest, VercelResponse } from "@vercel/node";
import app from "../src/app";
import { loadConfig } from "../src/config";
import { initSupabase } from "../src/db/supabase";

// Initialize Supabase on module load (singleton pattern)
let initialized = false;
function ensureInitialized() {
  if (!initialized) {
    try {
      const config = loadConfig();
      initSupabase(config.supabase);
      initialized = true;
    } catch (error) {
      console.error("Failed to initialize Supabase:", error);
      // Continue without Supabase (will use in-memory storage)
    }
  }
}

// Initialize immediately when module loads
ensureInitialized();

// Vercel expects a default export that handles requests
export default async (req: VercelRequest, res: VercelResponse) => {
  // Ensure initialization (in case module was reloaded)
  ensureInitialized();
  
  // Convert Vercel request/response to Express format
  return new Promise<void>((resolve) => {
    app(req as any, res as any, () => {
      resolve();
    });
  });
};
