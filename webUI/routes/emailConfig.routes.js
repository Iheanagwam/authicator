import { Router } from 'express';
import * as emailConfigController from '../controllers/emailConfig.controller.js';
import { requireWebAuth } from '../middleware/webAuth.middleware.js';

const router = Router();

router.post('/dashboard/settings/email',         requireWebAuth, emailConfigController.handleSaveEmailConfig);
router.get('/dashboard/settings/email/preview',  requireWebAuth, emailConfigController.showEmailPreview);

export default router;