import { z } from 'zod';

const envSchema = z.object({
    BOT_TOKEN: z.string().min(1),
    OWNER_ID: z.string().min(1),
    DATABASE_URL: z.url().optional(),
    NODE_ENV: z.enum(['development', 'production']).default('development'),
});

export const env = envSchema.parse(process.env);