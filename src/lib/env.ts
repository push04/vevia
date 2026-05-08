import { z } from "zod";

const NonEmpty = z.string().min(1);

const EnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  GROQ_API_KEY: z.string().optional(),
  GROQ_MODEL_LARGE: z.string().optional(),
  GROQ_MODEL_FAST: z.string().optional(),
  GROQ_MODEL_WHISPER: z.string().optional(),

  TRANSFORMERS_CACHE_DIR: z.string().optional(),

  RESEND_API_KEY: z.string().optional(),
  RESEND_WEBHOOK_SECRET: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().optional(),
  RESEND_FROM_NAME: z.string().optional(),

  VEVIA_API_TOKEN: z.string().optional(),
  CRON_SECRET: z.string().optional(),

  WHATSAPP_PHONE_NUMBER_ID: z.string().optional(),
  WHATSAPP_ACCESS_TOKEN: z.string().optional(),
  WHATSAPP_VERIFY_TOKEN: z.string().optional(),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional(),
});

export type Env = z.infer<typeof EnvSchema>;

export function getEnv(): Env {
  return EnvSchema.parse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GROQ_API_KEY: process.env.GROQ_API_KEY,
    GROQ_MODEL_LARGE: process.env.GROQ_MODEL_LARGE,
    GROQ_MODEL_FAST: process.env.GROQ_MODEL_FAST,
    GROQ_MODEL_WHISPER: process.env.GROQ_MODEL_WHISPER,
    TRANSFORMERS_CACHE_DIR: process.env.TRANSFORMERS_CACHE_DIR,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_WEBHOOK_SECRET: process.env.RESEND_WEBHOOK_SECRET,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    RESEND_FROM_NAME: process.env.RESEND_FROM_NAME,
    VEVIA_API_TOKEN: process.env.VEVIA_API_TOKEN,
    CRON_SECRET: process.env.CRON_SECRET,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_VERIFY_TOKEN: process.env.WHATSAPP_VERIFY_TOKEN,
    WHATSAPP_BUSINESS_ACCOUNT_ID: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
  });
}

export function requireEnv(key: keyof Env): string {
  const env = getEnv();
  const value = env[key];
  const parsed = NonEmpty.safeParse(value);
  if (!parsed.success) {
    throw new Error(`Missing required environment variable: ${String(key)}`);
  }
  return parsed.data;
}
