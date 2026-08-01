import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),

  MONGO_URI: z.string().min(1, 'MONGO_URI majburiy'),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET kamida 16 belgi bo'lsin"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET kamida 16 belgi bo'lsin"),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('30d'),

  CLIENT_URL: z.string().min(1).default('http://localhost:5173'),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(5),

  TIMEZONE: z.string().default('Asia/Tashkent'),

  // Mobil ilova (v1 da bo'sh turadi, ilova chiqqanda to'ldiriladi)
  APP_MIN_VERSION: z.string().default('1.0.0'),
  APP_LATEST_VERSION: z.string().default('1.0.0'),
  APP_STORE_URL: z.string().default(''),
  PLAY_STORE_URL: z.string().default(''),
  APP_MAINTENANCE: z.coerce.boolean().default(false),
  SLOT_STEP_MIN: z.coerce.number().int().positive().default(15),
  MIN_LEAD_TIME_MIN: z.coerce.number().int().nonnegative().default(60),
  MAX_ADVANCE_DAYS: z.coerce.number().int().positive().default(60),
  CANCEL_LIMIT_MIN: z.coerce.number().int().nonnegative().default(120),
  BOOKING_HOLD_MINUTES: z.coerce.number().int().positive().max(30).default(15),

  ADMIN_PHONE: z.string().optional(),
  ADMIN_PASSWORD: z.string().optional(),
  ADMIN_NAME: z.string().default('Admin'),

  PAYME_MERCHANT_ID: z.string().default(''),
  PAYME_KEY: z.string().default(''),
  PAYME_KEY_TEST: z.string().default(''),
  PAYME_CHECKOUT_URL: z.string().default('https://checkout.paycom.uz'),
  PAYME_ACCOUNT_FIELD: z.string().default('booking_id'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ .env faylida xato:\n');
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }
  console.error('\n   apps/api/.env.example dan nusxa oling.\n');
  process.exit(1);
}

const raw = parsed.data;

export const env = {
  ...raw,
  isProd: raw.NODE_ENV === 'production',
  isDev: raw.NODE_ENV === 'development',
  isTest: raw.NODE_ENV === 'test',
  /** CORS uchun origin ro'yxati */
  clientOrigins: raw.CLIENT_URL.split(',')
    .map((s) => s.trim())
    .filter(Boolean),
  maxUploadBytes: raw.MAX_UPLOAD_MB * 1024 * 1024,
};

export default env;
