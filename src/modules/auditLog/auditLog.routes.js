import { Router } from 'express';
import * as auditLogController from './auditLog.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);

router.get('/',        auditLogController.getLogs);
router.get('/summary', auditLogController.getSummary);
router.get('/actions', auditLogController.getSupportedActions);

export default router;