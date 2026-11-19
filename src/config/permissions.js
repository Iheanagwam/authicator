/*
  ═══════════════════════════════════════════════════════════════
  AUTHKIT — COMPLETE ROLE PERMISSION MAP
  ═══════════════════════════════════════════════════════════════

  ROLES:
    PUBLIC      → No auth required. Anyone can call these.
    END_USER    → Requires x-api-key (developer's app) + Bearer token (end user JWT)
    DEVELOPER   → Requires Bearer token (developer JWT)
    SUPER_ADMIN → Requires Bearer token (developer JWT) + isSuperAdmin = true

  ═══════════════════════════════════════════════════════════════
*/

export const PERMISSIONS = {

  // ─── PUBLIC ROUTES ───────────────────────────────────────────
  // No authentication required
  // Used by email links, widget, and anonymous visitors

  PUBLIC: [
    'GET  /health',
    'GET  /widget/*',                          // serves widget.js, test.html etc
    'GET  /auth/verify-email/:token',          // email verification link
    'POST /auth/reset-password/:token',        // reset password from email link
    'POST /auth/reset-password?token=xxx',     // reset password (query string version)
    'POST /dev/register',                      // developer sign up
    'POST /dev/login',                         // developer login
    'GET  /dev/verify-email/:token',           // developer email verification
    'POST /dev/verify-email',                  // developer OTP verification
    'POST /dev/forgot-password',               // developer forgot password
    'POST /dev/reset-password/:token',         // developer reset password
    'POST /dev/refresh',                       // refresh developer token (uses cookie)

    // EJS pages (served by Express for the dashboard frontend)
    'GET  /',                                  // landing page
    'GET  /pricing',
    'GET  /docs',
    'GET  /login',
    'GET  /register',
    'GET  /verify-email',
    'GET  /forgot-password',
    'GET  /reset-password',
  ],

  // ─── END USER ROUTES ─────────────────────────────────────────
  // Who:    People using a developer's app via the widget
  // Auth:   x-api-key header (identifies the developer's app)
  //         Authorization: Bearer <endUserToken> (for protected routes)
  // Cannot: Access /dashboard, /admin, or any developer routes

  END_USER: [
    'POST /auth/register',                     // register as end user of an app
    'POST /auth/login',                        // login to an app
    'POST /auth/logout',                       // logout from an app
    'POST /auth/refresh',                      // refresh end user token
    'POST /auth/forgot-password',              // forgot password
    'POST /auth/verify-token',                 // verify token (called by dev's backend)

    // These require x-api-key + Bearer token
    'GET  /auth/me',                           // get own profile
    'PATCH /auth/me',                          // update own profile metadata
    'DELETE /auth/me',                         // delete own account

    'GET  /auth/sessions',                     // list own active sessions
    'DELETE /auth/sessions',                   // logout from all devices
    'DELETE /auth/sessions/:sessionId',        // logout from one device
  ],

  // ─── DEVELOPER ROUTES ────────────────────────────────────────
  // Who:    Developers who signed up to use AuthKit
  // Auth:   Authorization: Bearer <developerToken>
  // Can:    Only see and manage THEIR OWN data
  // Cannot: See other developers' data or access /admin

  DEVELOPER: [
    'POST /dev/logout',                        // logout
    'GET  /dev/profile',                       // get own profile

    // API key
    'POST /dev/rotate-key',                    // rotate own API key

    // Field config
    'GET  /dev/fields',                        // get own field config
    'POST /dev/fields',                        // save own field config

    // End users (only their own)
    'GET  /dev/users',                         // list own end users
    'GET  /dev/users/:id',                     // get one of own end users (future route)

    // Webhooks (only their own)
    'GET  /dev/webhooks/events',               // list supported events
    'POST /dev/webhooks',                      // create webhook
    'GET  /dev/webhooks',                      // list own webhooks
    'GET  /dev/webhooks/:id',                  // get own webhook
    'PATCH /dev/webhooks/:id',                 // update own webhook
    'DELETE /dev/webhooks/:id',                // delete own webhook
    'POST /dev/webhooks/:id/rotate-secret',    // rotate own webhook secret
    'GET  /dev/webhooks/:id/deliveries',       // view own delivery logs

    // Audit logs (only their own)
    'GET  /dev/audit-logs',                    // list own audit logs
    'GET  /dev/audit-logs/summary',            // own audit log summary
    'GET  /dev/audit-logs/actions',            // list supported actions

    // Email config
    'GET  /dev/email-config',                  // get own email config
    'POST /dev/email-config',                  // save own email config
    'GET  /dev/email-config/preview',          // preview own branded email

    // Dashboard EJS pages
    'GET  /dashboard',
    'GET  /dashboard/users',
    'GET  /dashboard/users/:id',
    'GET  /dashboard/webhooks',
    'GET  /dashboard/webhooks/:id',
    'GET  /dashboard/audit-logs',
    'GET  /dashboard/widget',
    'GET  /dashboard/settings',
  ],

  // ─── SUPER ADMIN ROUTES ───────────────────────────────────────
  // Who:    You — the platform owner
  // Auth:   Bearer <developerToken> WHERE isSuperAdmin = true
  // Can:    See and manage ALL data across ALL developers
  // Cannot: Nothing is off limits

  SUPER_ADMIN: [
    // Platform overview
    'GET  /admin',                             // admin dashboard overview
    'GET  /admin/stats',                       // platform-wide stats

    // All developers
    'GET  /admin/developers',                  // list all developers
    'GET  /admin/developers/:id',              // get one developer
    'PATCH /admin/developers/:id',             // update developer (suspend etc)
    'DELETE /admin/developers/:id',            // delete developer + all their data

    // All end users (across all apps)
    'GET  /admin/users',                       // list all end users
    'GET  /admin/users/:id',                   // get one end user
    'DELETE /admin/users/:id',                 // delete end user

    // Platform audit logs (everything)
    'GET  /admin/audit-logs',                  // all audit logs platform wide
    'GET  /admin/audit-logs/summary',          // platform audit summary

    // Platform settings
    'GET  /admin/settings',                    // get platform settings
    'POST /admin/settings',                    // update platform settings

    // Admin EJS pages
    'GET  /admin',
    'GET  /admin/developers',
    'GET  /admin/developers/:id',
    'GET  /admin/users',
    'GET  /admin/audit-logs',
    'GET  /admin/settings',
  ],
};

/*
  ═══════════════════════════════════════════════════════════════
  WHAT EACH ROLE CAN NEVER DO
  ═══════════════════════════════════════════════════════════════

  END USER can never:
    - Access /dashboard or /admin
    - See other end users' data
    - See the developer's API key or webhooks
    - Call /dev/* routes
    - Access another developer's user pool (enforced by x-api-key)

  DEVELOPER can never:
    - Access /admin routes
    - See another developer's users, webhooks, or audit logs
    - See another developer's API key or email config
    - Set isSuperAdmin on any account

  SUPER ADMIN note:
    - Super admin status is NEVER included in the JWT payload
    - It is ALWAYS fetched fresh from the database on every request
    - This means revoking super admin access takes effect immediately
    - Even with a valid JWT, a revoked super admin gets 403
*/