import 'dotenv/config';
import './src/config/redis.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// ─── API Routes ───────────────────────────────────────────────────
import devApiRoutes         from './src/modules/developer/developer.routes.js';
import authApiRoutes        from './src/modules/auth/auth.routes.js';
import webhookApiRoutes     from './src/modules/webhook/webhook.routes.js';
import auditLogApiRoutes    from './src/modules/auditLog/auditLog.routes.js';
import emailConfigApiRoutes from './src/modules/emailConfig/emailConfig.routes.js';
import adminApiRoutes       from './src/modules/admin/admin.routes.js';

// ─── Web Routes ───────────────────────────────────────────────────
import landingWebRoutes     from './webUI/routes/landing.routes.js';
import devWebRoutes         from './webUI/routes/developer.routes.js';
import adminWebRoutes       from './webUI/routes/admin.routes.js';
import webhookWebRoutes     from './webUI/routes/webhook.routes.js';
import auditLogWebRoutes    from './webUI/routes/auditLog.routes.js';
import emailConfigWebRoutes from './webUI/routes/emailConfig.routes.js';

import { generalRateLimit } from './src/middleware/rateLimit.js';

const app  = express();
const PORT = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

// ─── View Engine ──────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// ─── Security ─────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:    ["'self'"],
      scriptSrc:     ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdnjs.cloudflare.com"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc:      ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      connectSrc:    ["'self'"],
      imgSrc:        ["'self'", "data:", "https:"],
      fontSrc:       ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
    },
  },
}));

app.use(
  morgan(function (tokens, req, res) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: Number(tokens.status(req, res)),
      // responseTimeMs: Number(tokens["response-time"](req, res)),
      // userAgent: req.get("user-agent"),
      // ip: req.ip,
      body: req.body,
    });
  })
);

// ─── CORS ─────────────────────────────────────────────────────────
app.use(cors({
  origin: [process.env.CLIENT_URL || 'http://localhost:3000'],
  credentials: true,
}));

// ─── Parsers ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ─── Static Files ─────────────────────────────────────────────────
app.use(express.static(join(__dirname, 'public')));
app.use('/widget', express.static(join(__dirname, 'public')));

// ─── Silence Favicon ──────────────────────────────────────────────
app.get('/favicon.ico', (req, res) => res.status(204).end());

// ─── Rate Limiting ────────────────────────────────────────────────
app.use(generalRateLimit);

// ─── Health Check ─────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── API Routes (return JSON) ─────────────────────────────────────
app.use('/dev',              devApiRoutes);
app.use('/auth',             authApiRoutes);
app.use('/dev/webhooks',     webhookApiRoutes);
app.use('/dev/audit-logs',   auditLogApiRoutes);
app.use('/dev/email-config', emailConfigApiRoutes);
app.use('/admin/api',        adminApiRoutes);

// ─── Web Routes (render EJS or redirect) ─────────────────────────
app.use('/', landingWebRoutes);
app.use('/', devWebRoutes);
app.use('/', adminWebRoutes);
app.use('/', webhookWebRoutes);
app.use('/', auditLogWebRoutes);
app.use('/', emailConfigWebRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────
app.use((req, res) => {
  const isApiRequest = req.path.startsWith('/dev')
    || req.path.startsWith('/auth')
    || req.path.startsWith('/admin/api');

  if (isApiRequest) {
    return res.status(404).json({ error: `Route ${req.method} ${req.path} not found` });
  }
  res.status(404).render('errors/404', { title: 'Page not found — AuthKit' });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  const isApiRequest = req.path.startsWith('/dev')
    || req.path.startsWith('/auth')
    || req.path.startsWith('/admin/api');

  if (isApiRequest) {
    return res.status(500).json({ error: 'Something went wrong on our end' });
  }
  res.status(500).render('errors/500', { title: 'Server error — AuthKit' });
});

app.listen(PORT, () => {
  console.log(`AuthKit running on http://localhost:${PORT}`);
});

export default app;