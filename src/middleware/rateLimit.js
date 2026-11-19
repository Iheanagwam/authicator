import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import redisClient from '../config/redis.js';

// ─── HELPER — build a limiter with redis store ─────────────────────
const buildLimiter = ({ windowMs, max, message, keyPrefix }) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      // ioredis uses a different send command signature
      sendCommand: (...args) => redisClient.call(...args),
      prefix: keyPrefix,
    }),
  });
};

// ─── GLOBAL LIMITER ────────────────────────────────────────────────
export const generalRateLimit = buildLimiter({
  windowMs: 60 * 1000,
  max: 60,
  message: 'Too many requests. Slow down.',
  keyPrefix: 'rl:global:',
});

// ─── AUTH LIMITER ──────────────────────────────────────────────────
export const authRateLimit = buildLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many attempts. Please try again in 15 minutes.',
  keyPrefix: 'rl:auth:',
});

// ─── PASSWORD RESET LIMITER ────────────────────────────────────────
export const passwordResetRateLimit = buildLimiter({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: 'Too many password reset requests. Try again in 1 hour.',
  keyPrefix: 'rl:reset:',
});

// ─── PER-API-KEY LIMITER ───────────────────────────────────────────
export const perApiKeyRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Rate limit exceeded for this API key. Max 100 requests per minute.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const apiKey = req.headers['x-api-key'];
    return apiKey ? `rl:apikey:${apiKey}` : undefined;
  },
  store: new RedisStore({
    sendCommand: (...args) => redisClient.call(...args),
    prefix: '',
  }),
  skip: (req) => !req.headers['x-api-key'],
});

// ─── WEBHOOK RATE LIMITER ──────────────────────────────────────────
export const webhookRateLimit = buildLimiter({
  windowMs: 60 * 1000,
  max: 30,
  message: 'Too many webhook requests. Slow down.',
  keyPrefix: 'rl:webhook:',
});