import bcrypt from 'bcryptjs';
import {prismaClient} from '../src/config/db.js';
import { generateToken } from '../src/utils/apiKey.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../src/utils/jwt.js';
import { sendEndUserVerificationEmail, sendEndUserPasswordResetEmail } from '../src/utils/email.js';
import { fireWebhookEvent } from '../src/utils/webhook.js';

// ─── Helper: validate metadata against developer's field config ───────────────
const validateMetadata = (metadata = {}, fieldConfig = []) => {
  const errors = [];
  const cleaned = {};

  for (const field of fieldConfig) {
    const value = metadata[field.name];
    const isEmpty = value === undefined || value === null || value === '';

    // Required check
    if (field.required && isEmpty) {
      errors.push(`"${field.label}" is required`);
      continue;
    }

    // Skip optional empty fields
    if (isEmpty) continue;

    // Type validation
    switch (field.type) {
      case 'email': {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          errors.push(`"${field.label}" must be a valid email`);
        }
        break;
      }
      case 'number': {
        const num = Number(value);
        if (isNaN(num)) errors.push(`"${field.label}" must be a number`);
        if (field.min !== undefined && num < field.min) errors.push(`"${field.label}" must be at least ${field.min}`);
        if (field.max !== undefined && num > field.max) errors.push(`"${field.label}" must be at most ${field.max}`);
        break;
      }
      case 'text':
      case 'tel': {
        const str = String(value);
        if (field.min !== undefined && str.length < field.min) errors.push(`"${field.label}" must be at least ${field.min} characters`);
        if (field.max !== undefined && str.length > field.max) errors.push(`"${field.label}" must be at most ${field.max} characters`);
        break;
      }
      case 'select': {
        if (!field.options.includes(value)) {
          errors.push(`"${field.label}" must be one of: ${field.options.join(', ')}`);
        }
        break;
      }
      case 'checkbox': {
        // Accept boolean or string 'true'/'false'
        cleaned[field.name] = value === true || value === 'true';
        continue;
      }
      case 'date': {
        if (isNaN(Date.parse(value))) {
          errors.push(`"${field.label}" must be a valid date`);
        }
        break;
      }
    }

    cleaned[field.name] = value;
  }

  return { errors, cleaned };
};

export const registerEndUser = async ({ email, password, developerId, appName, metadata }) => {
  // Get developer's field config for validation
  const developer = await prismaClient.developer.findUnique({
    where: { id: developerId },
    select: { fieldConfig: true },
  });

  const fieldConfig = developer?.fieldConfig || [];

  // Validate custom fields
  const { errors, cleaned } = validateMetadata(metadata, fieldConfig);
  if (errors.length > 0) throw new Error(errors.join('. '));

  const existing = await prismaClient.endUser.findUnique({
    where: { email_developerId: { email, developerId } },
  });
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 12);
  const verifyToken = generateToken();

  const user = await prismaClient.endUser.create({
    data: {
      email,
      password: hashed,
      developerId,
      verifyToken,
      metadata: Object.keys(cleaned).length > 0 ? cleaned : undefined,
    },
  });

  await sendEndUserVerificationEmail(email, verifyToken, developerId);

  // Fire webhook event (non-blocking)
  fireWebhookEvent(developerId, 'user.registered', { id: user.id, email: user.email }).catch(() => {});

  return { id: user.id, email: user.email };
};

export const verifyEndUserEmail = async (token) => {
  const user = await prismaClient.endUser.findFirst({ where: { verifyToken: token } });
  if (!user) throw new Error('Invalid or expired verification token');
  if (user.isVerified) throw new Error('Email already verified');

  await prismaClient.endUser.update({
    where: { id: user.id },
    data: { isVerified: true, verifyToken: null },
  });

  fireWebhookEvent(user.developerId, 'user.verified', { id: user.id, email: user.email }).catch(() => {});
  return true;
};

export const loginEndUser = async ({ email, password, developerId, userAgent, ipAddress }) => {
  const user = await prismaClient.endUser.findUnique({
    where: { email_developerId: { email, developerId } },
  });
  if (!user) throw new Error('Invalid email or password');

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new Error('Invalid email or password');

  if (!user.isVerified) throw new Error('Please verify your email before logging in');

  const payload = { id: user.id, email: user.email, developerId };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const hashedRefresh = await bcrypt.hash(refreshToken, 8);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prismaClient.session.create({
    data: {
      endUserId: user.id,
      refreshToken: hashedRefresh,
      userAgent: userAgent || null,
      ipAddress: ipAddress || null,
      expiresAt,
    },
  });

  fireWebhookEvent(developerId, 'user.login', { id: user.id, email: user.email }).catch(() => {});

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, metadata: user.metadata || {} },
  };
};

export const refreshEndUserToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const sessions = await prismaClient.session.findMany({
    where: { endUserId: decoded.id, expiresAt: { gt: new Date() } },
  });

  let matchedSession = null;
  for (const session of sessions) {
    const valid = await bcrypt.compare(token, session.refreshToken);
    if (valid) { matchedSession = session; break; }
  }

  if (!matchedSession) throw new Error('Invalid or expired refresh token');

  const user = await prismaClient.endUser.findUnique({ where: { id: decoded.id } });
  if (!user) throw new Error('User not found');

  const payload = { id: user.id, email: user.email, developerId: user.developerId };
  const newAccessToken = signAccessToken(payload);
  const newRefreshToken = signRefreshToken(payload);

  const hashedRefresh = await bcrypt.hash(newRefreshToken, 8);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prismaClient.session.update({
    where: { id: matchedSession.id },
    data: { refreshToken: hashedRefresh, expiresAt },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

export const logoutEndUser = async (token) => {
  if (!token) return true;
  let decoded;
  try { decoded = verifyRefreshToken(token); } catch { return true; }

  const sessions = await prismaClient.session.findMany({
    where: { endUserId: decoded.id, expiresAt: { gt: new Date() } },
  });

  for (const session of sessions) {
    const valid = await bcrypt.compare(token, session.refreshToken);
    if (valid) {
      await prismaClient.session.delete({ where: { id: session.id } });
      break;
    }
  }
  return true;
};

export const getEndUserSessions = async (userId) => {
  return prismaClient.session.findMany({
    where: { endUserId: userId, expiresAt: { gt: new Date() } },
    select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    orderBy: { createdAt: 'desc' },
  });
};

export const revokeSession = async (sessionId, userId) => {
  const session = await prismaClient.session.findUnique({ where: { id: sessionId } });
  if (!session) throw new Error('Session not found');
  if (session.endUserId !== userId) throw new Error('Unauthorized');
  await prismaClient.session.delete({ where: { id: sessionId } });
  return true;
};

export const revokeAllSessions = async (userId) => {
  await prismaClient.session.deleteMany({ where: { endUserId: userId } });
  return true;
};

export const forgotEndUserPassword = async ({ email, developerId, appName }) => {
  const user = await prismaClient.endUser.findUnique({
    where: { email_developerId: { email, developerId } },
  });
  if (!user) return true;

  const resetToken = generateToken();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000);

  await prismaClient.endUser.update({
    where: { id: user.id },
    data: { resetToken, resetExpiry },
  });

  await sendEndUserPasswordResetEmail(email, resetToken, developerId);
  return true;
};

export const resetEndUserPassword = async (token, newPassword) => {
  const user = await prismaClient.endUser.findFirst({
    where: {
      resetToken: token,
      resetExpiry: { gt: new Date() },
    },
  });
  if (!user) throw new Error('Invalid or expired reset token');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prismaClient.endUser.update({
    where: { id: user.id },
    data: {
      password: hashed,
      resetToken: null,
      resetExpiry: null,
      refreshToken: null,
    },
  });

  fireWebhookEvent(user.developerId, 'user.password_changed', { id: user.id, email: user.email }).catch(() => {});
  return true;
};

// ─── TOKEN VALIDATION ─────────────────────────────────────────────
export const verifyEndUserToken = async (token, developerId) => {
  let decoded;
  try {
    decoded = verifyAccessToken(token);
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new Error('Token expired');
    throw new Error('Invalid token');
  }

  if (decoded.developerId !== developerId) {
    throw new Error('Token does not belong to this application');
  }

  const user = await prismaClient.endUser.findUnique({
    where: { id: decoded.id },
    select: {
      id: true, email: true, isVerified: true,
      metadata: true, developerId: true, createdAt: true,
    },
  });

  if (!user) throw new Error('User not found');

  return {
    valid: true,
    user: {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      metadata: user.metadata || {},
      createdAt: user.createdAt,
    },
  };
};

// ─── END USER PROFILE ─────────────────────────────────────────────
export const getEndUserProfile = async (userId) => {
  const user = await prismaClient.endUser.findUnique({
    where: { id: userId },
    select: {
      id: true, email: true, isVerified: true,
      metadata: true, createdAt: true, updatedAt: true,
    },
  });
  if (!user) throw new Error('User not found');
  return { ...user, metadata: user.metadata || {} };
};

export const updateEndUserProfile = async (userId, updates, developerId) => {
  const user = await prismaClient.endUser.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.developerId !== developerId) throw new Error('Unauthorized');

  const updatedMetadata = { ...(user.metadata || {}), ...updates };

  const updated = await prismaClient.endUser.update({
    where: { id: userId },
    data: { metadata: updatedMetadata },
    select: {
      id: true, email: true, isVerified: true,
      metadata: true, updatedAt: true,
    },
  });

  fireWebhookEvent(developerId, 'user.updated', { id: updated.id, email: updated.email, metadata: updated.metadata }).catch(() => {});
  return { ...updated, metadata: updated.metadata || {} };
};

// ─── DELETE END USER ──────────────────────────────────────────────
export const deleteEndUser = async (userId, developerId) => {
  const user = await prismaClient.endUser.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');
  if (user.developerId !== developerId) throw new Error('Unauthorized');

  await prismaClient.endUser.delete({ where: { id: userId } });
  fireWebhookEvent(developerId, 'user.deleted', { id: userId }).catch(() => {});
  return true;
};