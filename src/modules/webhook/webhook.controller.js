import * as webhookService from '../../../services/webhook.service.js';
import { logAction, getRequestMeta, AUDIT_ACTIONS } from '../../utils/auditLog.js';

export const createWebhook = async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const webhook = await webhookService.createWebhook(req.developer.id, { url, events });
    logAction({ developerId: req.developer.id, action: AUDIT_ACTIONS.WEBHOOK_CREATED, metadata: { url: webhook.url, events: webhook.events }, ...getRequestMeta(req) });
    res.status(201).json({
      message: 'Webhook created. Save the secret — it will not be shown again.',
      webhook,
    });
  } catch (err) {
    const status = err.message.includes('Maximum') ? 429
      : err.message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const listWebhooks = async (req, res) => {
  try {
    const webhooks = await webhookService.listWebhooks(req.developer.id);
    res.status(200).json({ webhooks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getWebhook = async (req, res) => {
  try {
    const webhook = await webhookService.getWebhook(req.params.webhookId, req.developer.id);
    res.status(200).json({ webhook });
  } catch (err) {
    const status = err.message === 'Webhook not found' ? 404
      : err.message === 'Unauthorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const updateWebhook = async (req, res) => {
  try {
    const webhook = await webhookService.updateWebhook(
      req.params.webhookId, req.developer.id, req.body
    );
    logAction({ developerId: req.developer.id, action: AUDIT_ACTIONS.WEBHOOK_UPDATED, metadata: { webhookId: req.params.webhookId }, ...getRequestMeta(req) });
    res.status(200).json({ webhook });
  } catch (err) {
    const status = err.message === 'Webhook not found' ? 404
      : err.message === 'Unauthorized' ? 403
      : err.message.includes('Invalid') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const deleteWebhook = async (req, res) => {
  try {
    await webhookService.deleteWebhook(req.params.webhookId, req.developer.id);
    logAction({ developerId: req.developer.id, action: AUDIT_ACTIONS.WEBHOOK_DELETED, metadata: { webhookId: req.params.webhookId }, ...getRequestMeta(req) });
    res.status(200).json({ message: 'Webhook deleted' });
  } catch (err) {
    const status = err.message === 'Webhook not found' ? 404
      : err.message === 'Unauthorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const rotateSecret = async (req, res) => {
  try {
    const result = await webhookService.rotateWebhookSecret(
      req.params.webhookId, req.developer.id
    );
    res.status(200).json({
      message: 'Webhook secret rotated. Update your verification logic with the new secret.',
      ...result,
    });
  } catch (err) {
    const status = err.message === 'Webhook not found' ? 404
      : err.message === 'Unauthorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const getDeliveryLogs = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await webhookService.getDeliveryLogs(
      req.params.webhookId, req.developer.id, page, limit
    );
    res.status(200).json(result);
  } catch (err) {
    const status = err.message === 'Webhook not found' ? 404
      : err.message === 'Unauthorized' ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const listSupportedEvents = (req, res) => {
  const events = webhookService.listSupportedEvents();
  res.status(200).json({ events });
};