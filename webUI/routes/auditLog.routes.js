import { Router } from 'express';
import * as auditLogController from '../controllers/auditLog.controller.js';
import { requireWebAuth } from '../middleware/webAuth.middleware.js';

const router = Router();

router.get('/dashboard/audit-logs', requireWebAuth, auditLogController.showAuditLogs);

export default router;