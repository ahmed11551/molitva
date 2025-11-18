import http from "node:http";
import app from "./app";
import { loadConfig } from "./config";
import { initSupabase } from "./db/supabase";
import { logger } from "./utils/logger";

const config = loadConfig();

// Initialize Supabase
initSupabase(config.supabase);

const server = http.createServer(app);

server.listen(config.port, () => {
  logger.info(
    `Prayer-debt API is running on port ${config.port} (calc ${config.calcVersion})`
  );
});


