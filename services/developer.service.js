import bcrypt from 'bcryptjs';
import {prismaClient} from '../src/config/db.js';
import { generateApiKey, generateToken } from '../src/utils/apiKey.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../src/utils/jwt.js';
import { sendVerificationEmail, sendPasswordResetEmail } from '../src/utils/email.js';
import { genKey } from '../src/middleware/keyGen.js';
import { error } from 'node:console';

export const registerDeveloper = async ({ email, password, appName }) => {
  const existing = await prismaClient.developer.findUnique({ where: { email } });
  if (existing) throw new Error('Email already registered');

  const hashed = await bcrypt.hash(password, 12);
  const apiKey = generateApiKey();
  const verifyToken = generateToken();
  const key = genKey();

  const developer = await prismaClient.developer.create({
    data: {
      email,
      password: hashed,
      appName,
      apiKey,
      verifyToken,
      accessKey: key,
    },
  });

  await sendVerificationEmail(email, verifyToken, key);

  return { id: developer.id, email: developer.email, appName: developer.appName };
};

export const verifyDeveloperEmail = async (token, accessKey, email) => {
  let developer;

  if(token === undefined && accessKey === undefined) throw new Error('Token or access key is required');
  if(token !== undefined){
    developer = await prismaClient.developer.findFirst({
      where: { verifyToken: token},
    });
  }else{
    developer = await prismaClient.developer.findFirst({
      where: { accessKey, ...(email ? { email } : {}) },
    });
  };

  if (!developer) throw new Error('Invalid access key or expired verification token');
  if (developer.isVerified) throw new Error('Email already verified');

  await prismaClient.developer.update({
    where: { id: developer.id },
    data: { isVerified: true, verifyToken: null, accessKey: null },
  });

  return true;
};

export const loginDeveloper = async ({ email, password }) => {
  const developer = await prismaClient.developer.findUnique({ where: { email } });
  if (!developer) throw new Error('Invalid email or password');

  const match = await bcrypt.compare(password, developer.password);
  if (!match) throw new Error('Invalid email or password');

  if (!developer.isVerified) throw new Error('Please verify your email before logging in');

  const payload = { id: developer.id, email: developer.email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return {
    accessToken,
    refreshToken,
    developer: {
      id: developer.id,
      email: developer.email,
      appName: developer.appName,
      apiKey: developer.apiKey,
    },
  };
};

export const refreshDeveloperToken = async (token) => {
  let decoded;
  try {
    decoded = verifyRefreshToken(token);
  } catch {
    throw new Error('Invalid or expired refresh token');
  }

  const developer = await prismaClient.developer.findUnique({
    where: { id: decoded.id },
  });
  if (!developer) throw new Error('Developer not found');

  const accessToken = signAccessToken({ id: developer.id, email: developer.email });
  return { accessToken };
};

export const forgotDeveloperPassword = async (email) => {
  const developer = await prismaClient.developer.findUnique({ where: { email } });

  // Always respond the same way — don't reveal if email exists
  if (!developer) return true;

  const resetToken = generateToken();
  const resetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prismaClient.developer.update({
    where: { id: developer.id },
    data: { resetToken, resetExpiry },
  });

  await sendPasswordResetEmail(email, resetToken);
  return true;
};

export const resetDeveloperPassword = async (token, newPassword) => {
  const developer = await prismaClient.developer.findFirst({
    where: {
      resetToken: token,
      resetExpiry: { gt: new Date() },
    },
  });

  if (!developer) throw new Error('Invalid or expired reset token');

  const hashed = await bcrypt.hash(newPassword, 12);

  await prismaClient.developer.update({
    where: { id: developer.id },
    data: {
      password: hashed,
      resetToken: null,
      resetExpiry: null,
    },
  });

  return true;
};

export const getDeveloperProfile = async (id) => {
  const developer = await prismaClient.developer.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      appName: true,
      apiKey: true,
      createdAt: true,
      _count: { select: { endUsers: true } },
    },
  });

  if (!developer) throw new Error('Developer not found');
  return developer;
};

export const saveFieldConfig = async (developerId, fields) => {
  // Allowed field types
  const ALLOWED_TYPES = ['text', 'email', 'tel', 'number', 'select', 'checkbox', 'date'];

  // Validate the fields array
  if (!Array.isArray(fields)) throw new Error('Fields must be an array');
  if (fields.length > 15) throw new Error('Maximum of 15 custom fields allowed');

  if(fields.length === 0){
    throw new Error("At least 1 field i required ...");
  };

  fields.forEach(field =>{
    if (!field.name || typeof field.name !== 'string') {
      throw new Error('Each field must have a name');
    }
    if (!field.label || typeof field.label !== 'string') {
      throw new Error(`Field "${field.name}" must have a label`);
    }
    if (!ALLOWED_TYPES.includes(field.type)) {
      throw new Error(`Field "${field.name}" has invalid type. Allowed: ${ALLOWED_TYPES.join(', ')}`);
    }
    if (field.type === 'select' && (!Array.isArray(field.options) || field.options.length === 0)) {
      throw new Error(`Field "${field.name}" of type select must have options`);
    }
    // Reserved names — can't override core auth fields
    if (['email', 'password', 'confirmPassword'].includes(field.name)) {
      throw new Error(`"${field.name}" is a reserved field name`);
    }
  });

  const developer = await prismaClient.developer.update({
    where: { id: developerId },
    data: { fieldConfig: fields },
    select: { id: true, fieldConfig: true },
  });

  return developer.fieldConfig;
};

// Called by the widget via API key — returns field config publicly
export const getFieldConfigByApiKey = async (apiKey) => {
  const developer = await prismaClient.developer.findUnique({
    where: { apiKey },
    select: { fieldConfig: true, appName: true },
  });
  if (!developer) throw new Error('Invalid API key');
  return {
    fields: developer.fieldConfig || [],
    appName: developer.appName,
  };
};

// ─── API KEY ROTATION ─────────────────────────────────────────────
export const rotateApiKey = async (developerId) => {
  const newKey = generateApiKey();

  const developer = await prismaClient.developer.update({
    where: { id: developerId },
    data: { apiKey: newKey },
    select: { id: true, email: true, appName: true, apiKey: true },
  });

  return developer;
};

// ─── GET FIELD CONFIG ─────────────────────────────────────────────
export const getFieldConfig = async (developerId) => {
  const developer = await prismaClient.developer.findUnique({
    where: { id: developerId },
    select: { fieldConfig: true },
  });

  if (!developer) throw new Error('Developer not found');
  return developer.fieldConfig || [];
};

// ─── GET END USERS LIST ───────────────────────────────────────────
export const getDeveloperEndUsers = async (developerId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prismaClient.endUser.findMany({
      where: { developerId },
      select: {
        id: true,
        email: true,
        isVerified: true,
        metadata: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prismaClient.endUser.count({ where: { developerId } }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

// ----- GET A USER BY ID -------------------------------------
export const getDeveloperEndUserById = async (developerId, userId) => {
  if(!developerId || !userId) throw new Error("Both user and developer ID is required");
  
  const user = await prismaClient.endUser.findFirst({
    where: {developerId, id:userId},
    select: {
      id: true,
      email: true,
      isVerified: true,
      metadata: true,
      createdAt: true,
    },
  })

  return user;
};

// ─── UPDATE DEVELOPER PROFILE ─────────────────────────────────────
export const updateDeveloperProfile = async (developerId, { appName }) => {
  const developer = await prismaClient.developer.update({
    where: { id: developerId },
    data: { ...(appName && { appName }) },
    select: { id: true, email: true, appName: true },
  });
  return developer;
};

// ─── CHANGE DEVELOPER PASSWORD ────────────────────────────────────
export const changeDeveloperPassword = async (developerId, currentPassword, newPassword) => {
  const developer = await prismaClient.developer.findUnique({ where: { id: developerId } });
  if (!developer) throw new Error('Developer not found');

  const match = await bcrypt.compare(currentPassword, developer.password);
  if (!match) throw new Error('Current password is incorrect');

  const hashed = await bcrypt.hash(newPassword, 12);
  await prismaClient.developer.update({
    where: { id: developerId },
    data: { password: hashed },
  });
  return true;
};