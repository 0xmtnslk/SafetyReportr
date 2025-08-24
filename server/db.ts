import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Production WebSocket configuration
neonConfig.webSocketConstructor = ws;

// Production ortamında WebSocket proxy'yi devre dışı bırak
if (process.env.NODE_ENV === 'production') {
  neonConfig.wsProxy = (host, port) => ({ host, port });
  neonConfig.useSecureWebSocket = true;
  neonConfig.pipelineHost = undefined; // Production'da pipeline host kullanma
  neonConfig.pipelinePath = undefined;
} else {
  // Development ortamında varsayılan ayarları kullan
  neonConfig.wsProxy = undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });