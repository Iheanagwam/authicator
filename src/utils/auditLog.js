import {prismaClient} from '../config/db.js';

// ─── ALL SUPPORTED ACTIONS ─────────────────────────────────────────
export const AUDIT_ACTIONS = {
  // Developer actions
  DEVELOPER_REGISTERED:      'developer.registered',
  DEVELOPER_LOGGED_IN:       'developer.login',
  DEVELOPER_LOGGED_OUT:      'developer.logout',
  DEVELOPER_PASSWORD_RESET:  'developer.password_reset',
  APIKEY_ROTATED:            'developer.apikey_rotated',
  FIELD_CONFIG_UPDATED:      'developer.field_config_updated',
  WEBHOOK_CREATED:           'developer.webhook_created',
  WEBHOOK_DELETED:           'developer.webhook_deleted',
  WEBHOOK_UPDATED:           'developer.webhook_updated',
  EMAIL_CONFIG_UPDATED:      'developer.email_config_updated',

  // End user actions
  USER_REGISTERED:           'user.registered',
  USER_VERIFIED:             'user.verified',
  USER_LOGGED_IN:            'user.login',
  USER_LOGGED_OUT:           'user.logout',
  USER_PASSWORD_CHANGED:     'user.password_changed',
  USER_PROFILE_UPDATED:      'user.updated',
  USER_DELETED:              'user.deleted',
  USER_SESSION_REVOKED:      'user.session_revoked',
  USER_ALL_SESSIONS_REVOKED: 'user.all_sessions_revoked',
};

// ─── LOG AN ACTION ────────────────────────────────────────────────
// Fire and forget — never blocks the main request
export const logAction = ({
  developerId,
  endUserId = null,
  action,
  ipAddress = null,
  userAgent = null,
  metadata = null,
}) => {
  prismaClient.auditLog.create({
    data: {
      developerId,
      endUserId,
      action,
      ipAddress,
      userAgent,
      metadata,
    },
  }).catch((err) => {
    console.error('[AuditLog] Failed to write log:', err.message);
  });
};

// ─── HELPER — extract ip and userAgent from request ───────────────
export const getRequestMeta = (req) => ({
  ipAddress: req.ip || req.connection?.remoteAddress || null,
  userAgent: req.headers?.['user-agent'] || null,
});