import { Router } from 'express';
import * as emailConfigController from './emailConfig.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/',        emailConfigController.getEmailConfig);
router.post('/',       emailConfigController.saveEmailConfig);
router.get('/preview', emailConfigController.previewEmail);

export default router;