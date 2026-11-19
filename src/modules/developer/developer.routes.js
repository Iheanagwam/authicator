import { Router } from 'express';
import * as developerController from './developer.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { authRateLimit, passwordResetRateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// ─── Public routes ────────────────────────────────────────────────
router.post('/register', authRateLimit, developerController.register);
router.post('/login', authRateLimit, developerController.login);
router.get('/verify-email/:token', developerController.verifyEmail);
router.post('/verify-email', authRateLimit, developerController.verifyEmailCode);
router.post('/forgot-password', passwordResetRateLimit, developerController.forgotPassword);
router.post('/reset-password/:token', developerController.resetPassword);

// ─── Token management ─────────────────────────────────────────────
router.post('/refresh', developerController.refresh);
router.post('/logout', developerController.logout);

// ─── Protected routes (require valid access token) ────────────────
router.get('/profile',      requireAuth, developerController.getProfile);
router.post('/rotate-key',  requireAuth, developerController.rotateApiKey);
router.get('/fields',       requireAuth, developerController.getFieldConfig);
router.post('/fields',      requireAuth, developerController.saveFieldConfig);
router.get('/users',        requireAuth, developerController.getEndUsers);

export default router;