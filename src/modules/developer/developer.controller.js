import * as developerService from '../../../services/developer.service.js';
import { logAction, getRequestMeta, AUDIT_ACTIONS } from '../../utils/auditLog.js';

export const register = async (req, res) => {
  try {
    const { email, password, appName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const developer = await developerService.registerDeveloper({ email, password, appName });
    logAction({ developerId: developer.id, action: AUDIT_ACTIONS.DEVELOPER_REGISTERED, ...getRequestMeta(req) });
    res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      developer,
    });
  } catch (err) {
    const status = err.message.includes('already registered') ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    await developerService.verifyDeveloperEmail(token, undefined);
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const verifyEmailCode = async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }
    if (!/^\d{6}$/.test(String(code))) {
      return res.status(400).json({ error: 'Verification code must be 6 digits' });
    }

    await developerService.verifyDeveloperEmail(undefined, String(code), email);
    res.status(200).json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await developerService.loginDeveloper({ email, password });

    // Send refresh token as HttpOnly cookie (more secure than returning it in body)
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    logAction({ developerId: result.developer.id, action: AUDIT_ACTIONS.DEVELOPER_LOGGED_IN, ...getRequestMeta(req) });
    res.status(200).json({
      message: 'Login successful',
      accessToken: result.accessToken,
      developer: result.developer,
    });
  } catch (err) {
    const status = err.message.includes('Invalid email') ? 401
      : err.message.includes('verify') ? 403
      : 500;
    res.status(status).json({ error: err.message });
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      return res.status(401).json({ error: 'Refresh token missing' });
    }

    const result = await developerService.refreshDeveloperToken(token);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    await developerService.forgotDeveloperPassword(email);
    // Always same message — security best practice
    res.status(200).json({
      message: 'If that email exists, a reset link has been sent.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    await developerService.resetDeveloperPassword(token, password);
    res.status(200).json({ message: 'Password reset successfully. You can now log in.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const developer = await developerService.getDeveloperProfile(req.developer.id);
    res.status(200).json({ developer });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

export const saveFields = async (req, res) => {
  try {
    const { fields } = req.body;
    if (!fields) return res.status(400).json({ error: 'Fields array is required' });

    const result = await developerService.saveFieldConfig(req.developer.id, fields);
    res.status(200).json({ message: 'Field configuration saved', fields: result });
  } catch (err) {
    const status = err.message.includes('reserved') || err.message.includes('invalid') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const getFields = async (req, res) => {
  try {
    const fields = await developerService.getFieldConfig(req.developer.id);
    res.status(200).json({ fields });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Public endpoint — called by the widget using API key (no JWT needed)
export const getFieldsByApiKey = async (req, res) => {
  try {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: 'API key required' });

    const result = await developerService.getFieldConfigByApiKey(apiKey);
    res.status(200).json(result);
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
};

// ─── API KEY ROTATION ─────────────────────────────────────────────
export const rotateApiKey = async (req, res) => {
  try {
    const developer = await developerService.rotateApiKey(req.developer.id);
    logAction({ developerId: req.developer.id, action: AUDIT_ACTIONS.APIKEY_ROTATED, ...getRequestMeta(req) });
    res.status(200).json({
      message: 'API key rotated successfully. Update your embed code with the new key.',
      apiKey: developer.apiKey,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── FIELD CONFIG ─────────────────────────────────────────────────
export const saveFieldConfig = async (req, res) => {
  try {
    const { fieldConfig } = req.body;
    if (!fieldConfig) {
      return res.status(400).json({ error: 'fieldConfig array is required' });
    }
    const result = await developerService.saveFieldConfig(req.developer.id, fieldConfig);
    logAction({ developerId: req.developer.id, action: AUDIT_ACTIONS.FIELD_CONFIG_UPDATED, ...getRequestMeta(req) });
    res.status(200).json({ message: 'Field config saved', fieldConfig: result.fieldConfig });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFieldConfig = async (req, res) => {
  try {
    const fieldConfig = await developerService.getFieldConfig(req.developer.id);
    res.status(200).json({ fieldConfig });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── END USERS LIST ───────────────────────────────────────────────
export const getEndUsers = async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await developerService.getDeveloperEndUsers(
      req.developer.id, page, limit
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};