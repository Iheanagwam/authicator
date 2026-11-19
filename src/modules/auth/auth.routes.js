import { Router } from 'express';
import * as authController from './auth.controller.js';
import { requireApiKey } from '../../middleware/apiKey.middleware.js';
import { requireEndUserAuth } from '../../middleware/endUserAuth.middleware.js';
import {
  authRateLimit,
  passwordResetRateLimit,
  perApiKeyRateLimit,
} from '../../middleware/rateLimit.js';

const router = Router();

// ─── Public routes (email links — no API key needed) ──────────────
router.get('/verify-email/:token', authController.verifyEmail);
router.post('/reset-password/:token', authController.resetPassword);
router.post('/reset-password', async (req, res) => {
  const token = req.query.token;
  if (!token) return res.status(400).json({ error: 'Reset token is required' });
  req.params = { token };
  return authController.resetPassword(req, res);
});

// ─── API key routes (widget calls these) ──────────────────────────
// perApiKeyRateLimit runs first — per developer bucket
// authRateLimit runs second — per IP brute force protection
router.post('/register',       requireApiKey, perApiKeyRateLimit, authRateLimit, authController.register);
router.post('/login',          requireApiKey, perApiKeyRateLimit, authRateLimit, authController.login);
router.post('/refresh',        requireApiKey, perApiKeyRateLimit, authController.refresh);
router.post('/logout',         requireApiKey, perApiKeyRateLimit, authController.logout);
router.post('/forgot-password',requireApiKey, perApiKeyRateLimit, passwordResetRateLimit, authController.forgotPassword);

// ─── Token validation ──────────────────────────────────────────────
router.post('/verify-token',   requireApiKey, perApiKeyRateLimit, authController.verifyToken);

// ─── End user profile ──────────────────────────────────────────────
router.get('/me',     requireApiKey, perApiKeyRateLimit, requireEndUserAuth, authController.getMe);
router.patch('/me',   requireApiKey, perApiKeyRateLimit, requireEndUserAuth, authController.updateMe);
router.delete('/me',  requireApiKey, perApiKeyRateLimit, requireEndUserAuth, authController.deleteMe);

// ─── Session management ───────────────────────────────────────────
router.get('/sessions',               requireApiKey, perApiKeyRateLimit, requireEndUserAuth, authController.getSessions);
router.delete('/sessions',            requireApiKey, perApiKeyRateLimit, requireEndUserAuth, authController.revokeAllSessions);
router.delete('/sessions/:sessionId', requireApiKey, perApiKeyRateLimit, requireEndUserAuth, authController.revokeSession);

export default router;