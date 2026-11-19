import transporter from '../config/mailer.js';
import {prismaClient} from '../config/db.js';

// ─── FETCH EMAIL CONFIG ───────────────────────────────────────────
const getConfig = async (developerId) => {
  if (!developerId) {
    return { brandColor: '#3b82f6', fromName: 'AuthKit', logoUrl: null, supportEmail: null, footerText: null };
  }

  const dev = await prismaClient.developer.findUnique({
    where: { id: developerId },
    select: { emailConfig: true, appName: true },
  });

  return {
    brandColor: '#3b82f6',
    fromName: dev?.appName || 'AuthKit',
    logoUrl: null,
    supportEmail: null,
    footerText: null,
    ...(dev?.emailConfig || {}),
  };
};

// ─── BASE TEMPLATE ────────────────────────────────────────────────
const baseTemplate = ({ config, title, subtitle, bodyHtml, buttonText, buttonUrl }) => {
  const { brandColor, fromName, logoUrl, supportEmail, footerText } = config;

  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${fromName}" style="max-height:40px;max-width:160px;margin-bottom:8px;" />`
    : `<div style="font-size:20px;font-weight:700;color:${brandColor};">${fromName}</div>`;

  const supportHtml = supportEmail
    ? `<p style="margin:8px 0 0;">Need help? <a href="mailto:${supportEmail}" style="color:${brandColor};text-decoration:none;">${supportEmail}</a></p>`
    : '';

  const footerHtml = footerText
    ? `<p style="margin:8px 0 0;color:#9ca3af;">${footerText}</p>`
    : `<p style="margin:8px 0 0;color:#9ca3af;">Powered by <a href="#" style="color:${brandColor};text-decoration:none;">AuthKit</a></p>`;

  return `<!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">

            <!-- Logo / App name -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                ${logoHtml}
              </td>
            </tr>

            <!-- Card -->
            <tr>
              <td style="background:#ffffff;border-radius:12px;padding:40px 36px;box-shadow:0 1px 3px rgba(0,0,0,0.08);">

                <!-- Title -->
                <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;text-align:center;">
                  ${title}
                </h1>

                <!-- Subtitle -->
                <p style="margin:0 0 28px;font-size:15px;color:#6b7280;text-align:center;line-height:1.5;">
                  ${subtitle}
                </p>

                <!-- Body content -->
                ${bodyHtml}

                <!-- Button -->
                ${buttonText && buttonUrl ? `
                <table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0;">
                  <tr>
                    <td align="center">
                      <a href="${buttonUrl}"
                        style="display:inline-block;padding:13px 32px;background:${brandColor};color:#ffffff;text-decoration:none;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.01em;">
                        ${buttonText}
                      </a>
                    </td>
                  </tr>
                </table>
                ` : ''}

                <!-- Fallback link -->
                ${buttonUrl ? `
                <p style="margin:0;font-size:13px;color:#9ca3af;text-align:center;line-height:1.5;">
                  If the button doesn't work, copy and paste this link:<br/>
                  <a href="${buttonUrl}" style="color:${brandColor};word-break:break-all;">${buttonUrl}</a>
                </p>
                ` : ''}

              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:24px;font-size:13px;color:#9ca3af;text-align:center;line-height:1.6;">
                ${supportHtml}
                ${footerHtml}
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>`;
};

// ─── SEND HELPER ──────────────────────────────────────────────────
const send = async ({ to, subject, html, fromName }) => {
  await transporter.sendMail({
    from: `"${fromName || 'AuthKit'}" <${process.env.MAIL_USER}>`,
    to,
    subject,
    html,
  });
};

// ─── DEVELOPER EMAILS (no developer emailConfig, use defaults) ────

export const sendVerificationEmail = async (to, token, key) => {
  const url = `${process.env.BASE_URL}/dev/verify-email/${token}`;
  const config = await getConfig(null);

  const html = baseTemplate({
    config,
    title: 'Verify your email',
    subtitle: 'Welcome to AuthKit. Enter the 6 digit code below to verify your email address and activate your account.',
    bodyHtml: `
              <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">
              Your verification code is: ${key}
              </p>
              <h4 style="margin:0 0 4px;font-size:16px;color:#111827;text-align:center;">
              or click the button below to verify your email address:
              </h4>
              <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">
              This link expires in 24 hours.
              </p>
              `,
    buttonText: 'Verify Email',
    buttonUrl: url,
  });

  await send({ to, subject: 'Verify your AuthKit account', html, fromName: 'AuthKit' });
};

export const sendPasswordResetEmail = async (to, token) => {
  const url = `${process.env.BASE_URL}/dev/reset-password/${token}`;
  const config = await getConfig(null);

  const html = baseTemplate({
    config,
    title: 'Reset your password',
    subtitle: 'We received a request to reset your AuthKit password. Click below to set a new one.',
    bodyHtml: `<p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
    buttonText: 'Reset Password',
    buttonUrl: url,
  });

  await send({ to, subject: 'Reset your AuthKit password', html, fromName: 'AuthKit' });
};

// ─── END USER EMAILS (use developer's emailConfig) ────────────────

export const sendEndUserVerificationEmail = async (to, token, developerId) => {
  const url = `${process.env.BASE_URL}/auth/verify-email/${token}`;
  const config = await getConfig(developerId);

  const html = baseTemplate({
    config,
    title: 'Confirm your email',
    subtitle: `Thanks for signing up to ${config.fromName}. Click below to verify your email address.`,
    bodyHtml: `<p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">This link expires in 24 hours.</p>`,
    buttonText: 'Verify Email',
    buttonUrl: url,
  });

  await send({ to, subject: `Verify your ${config.fromName} email`, html, fromName: config.fromName });
};

export const sendEndUserPasswordResetEmail = async (to, token, developerId) => {
  const url = `${process.env.BASE_URL}/widget/reset-password.html?token=${token}`;
  const config = await getConfig(developerId);

  const html = baseTemplate({
    config,
    title: 'Reset your password',
    subtitle: `We received a request to reset your password for ${config.fromName}.`,
    bodyHtml: `<p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
    buttonText: 'Reset Password',
    buttonUrl: url,
  });

  await send({ to, subject: `Reset your ${config.fromName} password`, html, fromName: config.fromName });
};

// ─── EMAIL PREVIEW ────────────────────────────────────────────────
// Returns raw HTML so developer can see what their users will receive
export const buildEmailPreview = async (developerId, type = 'verification') => {
  const config = await getConfig(developerId);

  if (type === 'reset') {
    return baseTemplate({
      config,
      title: 'Reset your password',
      subtitle: `We received a request to reset your password for ${config.fromName}.`,
      bodyHtml: `<p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">This link expires in 1 hour.</p>`,
      buttonText: 'Reset Password',
      buttonUrl: '#preview',
    });
  }

  return baseTemplate({
    config,
    title: 'Confirm your email',
    subtitle: `Thanks for signing up to ${config.fromName}. Click below to verify your email address.`,
    bodyHtml: `<p style="margin:0 0 4px;font-size:13px;color:#9ca3af;text-align:center;">This link expires in 24 hours.</p>`,
    buttonText: 'Verify Email',
    buttonUrl: '#preview',
  });
};