import { Router } from 'express';
import * as devController from '../controllers/developer.controller.js';
import { requireWebAuth, redirectIfAuthenticated } from '../middleware/webAuth.middleware.js';

const router = Router();

// ─── Auth pages (redirect if already logged in) ───────────────────
router.get('/login',            redirectIfAuthenticated, devController.showLogin);
router.post('/login',           devController.handleLogin);
router.get('/register',         redirectIfAuthenticated, devController.showRegister);
router.post('/register',        devController.handleRegister);
router.get('/verify-email',     devController.showVerifyEmail);
router.post('/verify-email',     devController.handleVerifyEmail);
router.get('/forgot-password',  devController.showForgotPassword);
router.post('/forgot-password', devController.handleForgotPassword);
router.get('/reset-password/:token',  devController.showResetPassword);
router.post('/reset-password/:token', devController.handleResetPassword);
router.get('/logout',          devController.handleLogout);

// ─── Dashboard pages (require login) ─────────────────────────────
router.get('/dashboard',               requireWebAuth, devController.showDashboard);
router.get('/dashboard/users',         requireWebAuth, devController.showUsers);
router.get('/dashboard/user/:id',         requireWebAuth, devController.showUserById);
router.get('/dashboard/widget',        requireWebAuth, devController.showWidgetBuilder);
router.get('/dashboard/settings',      requireWebAuth, devController.showSettings);
router.post('/dashboard/settings',     requireWebAuth, devController.handleUpdateSettings);
router.post('/dashboard/settings/password', requireWebAuth, devController.handleChangePassword)

router.get("/dashboard/rotateApiKey",  requireWebAuth, devController.handleRotateApiKey);
router.post("/dashboard/saveWidgetConfig",  requireWebAuth, devController.handleSaveWidgetConfig);

export default router;