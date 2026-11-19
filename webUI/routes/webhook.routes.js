import { Router } from 'express';
import * as webhookController from '../controllers/webhook.controller.js';
import { requireWebAuth } from '../middleware/webAuth.middleware.js';

const router = Router();

router.get('/dashboard/webhooks',                    requireWebAuth, webhookController.showWebhooks);
router.post('/dashboard/createWebhooks',                   requireWebAuth, webhookController.handleCreateWebhook);
router.get('/dashboard/webhooks/:webhookId',          requireWebAuth, webhookController.showWebhookDetail);
router.post('/dashboard/webhooks/:webhookId/delete',  requireWebAuth, webhookController.handleDeleteWebhook);
router.post('/dashboard/webhooks/:webhookId/toggle',  requireWebAuth, webhookController.handleToggleWebhook);
router.post('/dashboard/webhooks/:webhookId/rotate',  requireWebAuth, webhookController.handleRotateSecret);

export default router;