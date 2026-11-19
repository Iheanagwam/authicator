import { act } from 'react';
import * as webhookService from '../../services/webhook.service.js';

export const showWebhooks = async (req, res) => {
  try {
    const [webhooks, count] = await webhookService.listWebhooks(req.developer.id);
    
    res.render('dashboard/webhooks', {
      title:     'Webhooks — AuthKit',
      activeTab: 'webhooks',
      developer: req.developer,
      webhooks,
      count,
      success:   req.query.success || null,
      error:     req.query.error   || null,
    });
  } catch(err) {
    console.log(err);
    res.redirect('/dashboard');
  }
};

export const showWebhookDetail = async (req, res) => {
  try {
    const page    = parseInt(req.query.page) || 1;
    const webhook = await webhookService.getWebhook(req.params.webhookId, req.developer.id);
    const logs    = await webhookService.getDeliveryLogs(req.params.webhookId, req.developer.id, page, 20);
    res.render('dashboard/webhook-detail', {
      title:     `${webhook.url} — AuthKit`,
      activeTab: 'webhookDetails',
      developer: req.developer,
      webhook,
      deliveries:  logs.deliveries,
      pagination:  logs.pagination,
    });
  } catch {
    res.redirect('/dashboard/webhooks');
  }
};

export const handleCreateWebhook = async (req, res) => {
  try {
    // events comes as comma-separated string from form checkbox group
    const events = Array.isArray(req.body.events)
      ? req.body.events
      : [req.body.events].filter(Boolean);

    await webhookService.createWebhook(req.developer.id, { url: req.body.url, events });
    res.redirect('/dashboard/webhooks?success=Webhook+created+successfully');
  } catch (err) {
    res.redirect(`/dashboard/webhooks?error=${encodeURIComponent(err.message)}`);
  }
};

export const handleDeleteWebhook = async (req, res) => {
  try {
    await webhookService.deleteWebhook(req.params.webhookId, req.developer.id);
    res.redirect('/dashboard/webhooks?success=Webhook+deleted');
  } catch (err) {
    res.redirect(`/dashboard/webhooks?error=${encodeURIComponent(err.message)}`);
  }
};

export const handleToggleWebhook = async (req, res) => {
  try {
    const webhook = await webhookService.getWebhook(req.params.webhookId, req.developer.id);
    await webhookService.updateWebhook(req.params.webhookId, req.developer.id, {
      isActive: !webhook.isActive,
    });
    res.redirect('/dashboard/webhooks?success=Webhook+updated');
  } catch (err) {
    res.redirect(`/dashboard/webhooks?error=${encodeURIComponent(err.message)}`);
  }
};

export const handleRotateSecret = async (req, res) => {
  try {
    const result = await webhookService.rotateWebhookSecret(req.params.webhookId, req.developer.id);
    res.redirect(`/dashboard/webhooks/${req.params.webhookId}?success=Secret+rotated.+New+secret:+${result.secret}`);
  } catch (err) {
    res.redirect(`/dashboard/webhooks/${req.params.webhookId}?error=${encodeURIComponent(err.message)}`);
  }
};