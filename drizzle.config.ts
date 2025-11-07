import type { Config } from 'drizzle-kit';

export default {
  schema: './apps/desktop/src/main/database/schema.ts',
  out: './apps/desktop/src/main/database/migrations',
  driver: 'better-sqlite',
  dbCredentials: {
    url: './blackia.db', // Chemin temporaire pour génération
  },
} satisfies Config;
