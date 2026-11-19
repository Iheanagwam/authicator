import {prismaClient} from '../src/config/db.js';

const DEFAULT_CONFIG = {
  brandColor: '#3b82f6',
  logoUrl: null,
  fromName: 'AuthKit',
  supportEmail: null,
  footerText: null,
};

export const getEmailConfig = async (developerId) => {
  const developer = await prismaClient.developer.findUnique({
    where: { id: developerId },
    select: { emailConfig: true, appName: true },
  });

  if (!developer) throw new Error('Developer not found');

  return {
    ...DEFAULT_CONFIG,
    fromName: developer.appName || DEFAULT_CONFIG.fromName,
    ...(developer.emailConfig || {}),
  };
};

export const saveEmailConfig = async (developerId, config) => {
  const allowed = ['brandColor', 'logoUrl', 'fromName', 'supportEmail', 'footerText'];
  const sanitized = {};

  for (const key of allowed) {
    if (config[key] !== undefined) sanitized[key] = config[key];
  }

  if (sanitized.brandColor && !/^#[0-9a-fA-F]{6}$/.test(sanitized.brandColor)) {
    throw new Error('brandColor must be a valid hex color e.g. #3b82f6');
  }

  if (sanitized.logoUrl) {
    try { new URL(sanitized.logoUrl); } catch {
      throw new Error('logoUrl must be a valid URL');
    }
  }

  await prismaClient.developer.update({
    where: { id: developerId },
    data: { emailConfig: sanitized },
  });

  return getEmailConfig(developerId);
};