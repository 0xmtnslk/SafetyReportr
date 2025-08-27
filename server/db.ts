import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Production WebSocket configuration
neonConfig.webSocketConstructor = ws;

// Production ortamında WebSocket proxy'yi devre dışı bırak
if (process.env.NODE_ENV === 'production') {
  neonConfig.wsProxy = undefined;
  neonConfig.useSecureWebSocket = true;
} else {
  // Development ortamında varsayılan ayarları kullan
  neonConfig.wsProxy = undefined;
}

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Enhanced pool configuration with proper error handling
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum number of connections
  idleTimeoutMillis: 30000, // Close idle connections after 30 seconds
  connectionTimeoutMillis: 10000, // Timeout for new connections
  maxUses: 7500, // Close connections after 7500 queries to prevent memory leaks
  allowExitOnIdle: false // Keep pool alive
});

// Add error handling for the pool
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle database client:', err);
  // Don't exit the process, just log the error
});

pool.on('connect', (client) => {
  console.log('New database client connected');
});

pool.on('remove', (client) => {
  console.log('Database client removed from pool');
});

// Database operation with retry logic
async function withRetry<T>(operation: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      
      // If it's a connection error, wait before retrying
      if (error.code === '57P01' || error.message?.includes('terminating connection') || 
          error.message?.includes('connection') || error.code === 'ECONNRESET') {
        console.warn(`Database connection error (attempt ${attempt}/${maxRetries}):`, error.message);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // For non-connection errors, don't retry
      if (attempt === 1 && !error.message?.includes('connection')) {
        throw error;
      }
    }
  }
  
  console.error('All database retry attempts failed');
  throw lastError!;
}

// Wrap the drizzle instance with retry logic
const originalDb = drizzle({ client: pool, schema });

// Export the original drizzle instance directly - proxy was causing issues
export const db = originalDb;

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await withRetry(async () => {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
        return true;
      } finally {
        client.release();
      }
    });
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database pool...');
  await pool.end();
  process.exit(0);
});