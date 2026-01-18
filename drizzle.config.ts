import type { Config } from 'drizzle-kit';

export default {
  dialect: 'sqlite',
  schema: './src/db/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || './local.db',
  },
} satisfies Config;
