import crypto from 'crypto';
import {prismaClient} from '../src/config/db.js';
import { WEBHOOK_EVENTS } from '../src/utils/webhook.js';

// ─── CREATE WEBHOOK ───────────────────────────────────────────────
export const createWebhook = async (developerId, { url, events }) => {
  // Validate URL
  try { new URL(url); } catch {
    throw new Error('Invalid webhook URL');
  }

  // Validate events
  if (!events || !Array.isArray(events) || events.length === 0) {
    throw new Error('At least one event is required');
  }

  const invalidEvents = events.filter((e) => !WEBHOOK_EVENTS.includes(e));
  if (invalidEvents.length > 0) {
    throw new Error(`Invalid events: ${invalidEvents.join(', ')}. Valid events: ${WEBHOOK_EVENTS.join(', ')}`);
  }

  // Limit to 5 webhooks per developer
  const count = await prismaClient.webhook.count({ where: { developerId } });
  if (count >= 5) throw new Error('Maximum 5 webhooks allowed per account');

  // Generate a secret for signing payloads
  const secret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  const webhook = await prismaClient.webhook.create({
    data: { developerId, url, events, secret },
    select: {
      id: true, url: true, events: true,
      secret: true, isActive: true, createdAt: true,
    },
  });

  return webhook;
};

// ─── LIST WEBHOOKS ────────────────────────────────────────────────
export const listWebhooks = async (developerId) => {
  return await prismaClient.$transaction([
    prismaClient.webhook.findMany({
      where: { developerId },
      select: {
        id: true, url: true, events: true,
        isActive: true, createdAt: true,
        // Never return the secret in list — only shown on creation
        deliveries: {
          select: { 
            success: true, 
            createdAt: true, 
            deliveredAt: true, 
            statusCode: true, 
            attempts: true
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prismaClient.webhook.count()
  ]);
};

// ─── GET SINGLE WEBHOOK ───────────────────────────────────────────
export const getWebhook = async (webhookId, developerId) => {
  const webhook = await prismaClient.webhook.findUnique({
    where: { id: webhookId },
    include: {
      deliveries: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!webhook) throw new Error('Webhook not found');
  if (webhook.developerId !== developerId) throw new Error('Unauthorized');

  return webhook;
};

// ─── UPDATE WEBHOOK ───────────────────────────────────────────────
export const updateWebhook = async (webhookId, developerId, updates) => {
  const webhook = await prismaClient.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) throw new Error('Webhook not found');
  if (webhook.developerId !== developerId) throw new Error('Unauthorized');

  const { url, events, isActive } = updates;

  if (url) {
    try { new URL(url); } catch { throw new Error('Invalid webhook URL'); }
  }

  if (events) {
    const invalid = events.filter((e) => !WEBHOOK_EVENTS.includes(e));
    if (invalid.length > 0) throw new Error(`Invalid events: ${invalid.join(', ')}`);
  }

  return prismaClient.webhook.update({
    where: { id: webhookId },
    data: {
      ...(url && { url }),
      ...(events && { events }),
      ...(typeof isActive === 'boolean' && { isActive }),
    },
    select: {
      id: true, url: true, events: true,
      isActive: true, updatedAt: true,
    },
  });
};

// ─── DELETE WEBHOOK ───────────────────────────────────────────────
export const deleteWebhook = async (webhookId, developerId) => {
  const webhook = await prismaClient.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) throw new Error('Webhook not found');
  if (webhook.developerId !== developerId) throw new Error('Unauthorized');

  await prismaClient.webhook.delete({ where: { id: webhookId } });
  return true;
};

// ─── ROTATE WEBHOOK SECRET ────────────────────────────────────────
export const rotateWebhookSecret = async (webhookId, developerId) => {
  const webhook = await prismaClient.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) throw new Error('Webhook not found');
  if (webhook.developerId !== developerId) throw new Error('Unauthorized');

  const newSecret = `whsec_${crypto.randomBytes(24).toString('hex')}`;

  return prismaClient.webhook.update({
    where: { id: webhookId },
    data: { secret: newSecret },
    select: { id: true, secret: true },
  });
};

// ─── GET DELIVERY LOGS ────────────────────────────────────────────
export const getDeliveryLogs = async (webhookId, developerId, page = 1, limit = 20) => {
  const webhook = await prismaClient.webhook.findUnique({ where: { id: webhookId } });
  if (!webhook) throw new Error('Webhook not found');
  if (webhook.developerId !== developerId) throw new Error('Unauthorized');

  const skip = (page - 1) * limit;
  const [deliveries, total] = await Promise.all([
    prismaClient.webhookDelivery.findMany({
      where: { webhookId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaClient.webhookDelivery.count({ where: { webhookId } }),
  ]);

  return {
    deliveries,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

// ─── LIST ALL SUPPORTED EVENTS ────────────────────────────────────
export const listSupportedEvents = () => WEBHOOK_EVENTS;