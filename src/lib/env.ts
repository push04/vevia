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
  return EnvSchema.parse(process.env);
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
