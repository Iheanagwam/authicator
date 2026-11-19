import crypto from 'crypto';
import {prismaClient} from '../config/db.js';

// ─── SUPPORTED EVENTS ─────────────────────────────────────────────
export const WEBHOOK_EVENTS = [
  'user.registered',
  'user.verified',
  'user.login',
  'user.logout',
  'user.password_changed',
  'user.deleted',
  'user.updated',
];

// ─── SIGN PAYLOAD ─────────────────────────────────────────────────
// Developer uses this signature to verify the request is really from us
export const signPayload = (payload, secret) => {
  const body = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
};

// ─── DELIVER ONE WEBHOOK ──────────────────────────────────────────
const deliverOne = async (webhook, event, payload) => {
  const body = JSON.stringify(payload);
  const signature = signPayload(body, webhook.secret);
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS = [0, 5000, 30000]; // immediate, 5s, 30s

  // Create delivery record
  const delivery = await prismaClient.webhookDelivery.create({
    data: {
      webhookId: webhook.id,
      event,
      payload,
    },
  });

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // Wait before retry (first attempt has no delay)
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-authkit-event': event,
          'x-authkit-signature': signature,
          'x-authkit-timestamp': String(Date.now()),
          'user-agent': 'AuthKit-Webhooks/1.0',
        },
        body,
        signal: controller.signal,
      });

      clearTimeout(timeout);

      // Read response body (truncate to 500 chars for logging)
      let responseText = '';
      try { responseText = (await res.text()).slice(0, 500); } catch {}

      const success = res.status >= 200 && res.status < 300;

      // Update delivery record
      await prismaClient.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          success,
          statusCode: res.status,
          response: responseText,
          attempts: attempt + 1,
          deliveredAt: success ? new Date() : undefined,
        },
      });

      if (success) return; // Delivered successfully — stop retrying

    } catch (err) {
      // Network error or timeout
      await prismaClient.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          success: false,
          response: err.message?.slice(0, 500) || 'Network error',
          attempts: attempt + 1,
        },
      });
    }
  }
};

// ─── FIRE EVENT ───────────────────────────────────────────────────
// Call this wherever an event happens in the system
// It finds all matching webhooks and delivers to each one
export const fireWebhookEvent = async (developerId, event, data) => {
  if (!WEBHOOK_EVENTS.includes(event)) {
    console.warn(`[Webhook] Unknown event: ${event}`);
    return;
  }

  // Find all active webhooks for this developer that subscribe to this event
  const webhooks = await prismaClient.webhook.findMany({
    where: {
      developerId,
      isActive: true,
      events: { has: event },
    },
  });

  if (webhooks.length === 0) return;

  const payload = {
    event,
    data,
    timestamp: new Date().toISOString(),
  };

  // Fire all deliveries in parallel — don't await so it doesn't block the response
  webhooks.forEach((webhook) => {
    deliverOne(webhook, event, payload).catch((err) => {
      console.error(`[Webhook] Delivery failed for ${webhook.id}:`, err.message);
    });
  });
};