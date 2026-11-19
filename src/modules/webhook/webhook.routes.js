import { Router } from 'express';
import * as webhookController from './webhook.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { webhookRateLimit } from '../../middleware/rateLimit.js';

const router = Router();

// All webhook routes require developer JWT (dashboard routes)
router.use(requireAuth);
router.use(webhookRateLimit);

// Supported events list — useful for dashboard UI
router.get('/events', webhookController.listSupportedEvents);

// CRUD
router.post('/', webhookController.createWebhook);
router.get('/', webhookController.listWebhooks);
router.get('/:webhookId', webhookController.getWebhook);
router.patch('/:webhookId', webhookController.updateWebhook);
router.delete('/:webhookId', webhookController.deleteWebhook);

// Secret rotation
router.post('/:webhookId/rotate-secret', webhookController.rotateSecret);

// Delivery logs
router.get('/:webhookId/deliveries', webhookController.getDeliveryLogs);

export default router;