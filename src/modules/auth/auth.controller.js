import * as authService from '../../../services/auth.service.js';
import { logAction, getRequestMeta, AUDIT_ACTIONS } from '../../utils/auditLog.js';

export const register = async (req, res) => {
  try {
    const { email, password, ...metadata } = req.body;
    const { id: developerId, appName } = req.developer;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const user = await authService.registerEndUser({ email, password, developerId, appName, metadata });
    logAction({ developerId, endUserId: user.id, action: AUDIT_ACTIONS.USER_REGISTERED, ...getRequestMeta(req) });
    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      user,
    });
  } catch (err) {
    const status = err.message.includes('already registered') ? 409 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    await authService.verifyEndUserEmail(token);
    res.status(200).json({ message: 'Email verified. You can now log in.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password, ...metadata } = req.body;
    const { id: developerId } = req.developer;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userAgent = req.headers['user-agent'];
    const ipAddress = req.ip || req.connection?.remoteAddress;
    const result = await authService.loginEndUser({ email, password, developerId, userAgent, ipAddress });

    res.cookie('endUserRefreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logAction({ developerId: req.developer.id, endUserId: result.user.id, action: AUDIT_ACTIONS.USER_LOGGED_IN, ...getRequestMeta(req) });
    res.status(200).json({
      message: 'Login successful',
      accessToken: result.accessToken,
      user: result.user,
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
    const token = req.cookies?.endUserRefreshToken;
    if (!token) return res.status(401).json({ error: 'Refresh token missing' });

    const result = await authService.refreshEndUserToken(token);

    // Rotate cookie too
    res.cookie('endUserRefreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({ accessToken: result.accessToken });
  } catch (err) {
    res.clearCookie('endUserRefreshToken');
    res.status(401).json({ error: err.message });
  }
};

export const logout = async (req, res) => {
  try {
    const token = req.cookies?.endUserRefreshToken;
    await authService.logoutEndUser(token);
    if (req.endUser) logAction({ developerId: req.developer.id, endUserId: req.endUser.id, action: AUDIT_ACTIONS.USER_LOGGED_OUT, ...getRequestMeta(req) });
    res.clearCookie('endUserRefreshToken');
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const { id: developerId, appName } = req.developer;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    await authService.forgotEndUserPassword({ email, developerId, appName });
    res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
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

    const resetUser = await authService.resetEndUserPassword(token, password);
    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ─── TOKEN VALIDATION ─────────────────────────────────────────────
export const verifyToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'token is required in request body' });

    const result = await authService.verifyEndUserToken(token, req.developer.id);
    res.status(200).json(result);
  } catch (err) {
    const status = err.message === 'Token expired' ? 401
      : err.message.includes('does not belong') ? 403
      : 401;
    res.status(status).json({ valid: false, error: err.message });
  }
};

// ─── END USER PROFILE ─────────────────────────────────────────────
export const getMe = async (req, res) => {
  try {
    // req.endUser is set by a new endUserAuth middleware (added below)
    const user = await authService.getEndUserProfile(req.endUser.id);
    res.status(200).json({ user });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

export const updateMe = async (req, res) => {
  try {
    const { password, email, isVerified, refreshToken, ...metadata } = req.body;
    // Strip system fields — only metadata updates allowed

    if (Object.keys(metadata).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    const updated = await authService.updateEndUserProfile(
      req.endUser.id,
      metadata,
      req.developer.id
    );
    logAction({ developerId: req.developer.id, endUserId: req.endUser.id, action: AUDIT_ACTIONS.USER_PROFILE_UPDATED, ...getRequestMeta(req) });
    res.status(200).json({ user: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const deleteMe = async (req, res) => {
  try {
    await authService.deleteEndUser(req.endUser.id, req.developer.id);
    logAction({ developerId: req.developer.id, endUserId: req.endUser.id, action: AUDIT_ACTIONS.USER_DELETED, ...getRequestMeta(req) });
    res.clearCookie('endUserRefreshToken');
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ─── SESSION MANAGEMENT ───────────────────────────────────────────
export const getSessions = async (req, res) => {
  try {
    const sessions = await authService.getEndUserSessions(req.endUser.id);
    res.status(200).json({ sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const revokeSession = async (req, res) => {
  try {
    await authService.revokeSession(req.params.sessionId, req.endUser.id);
    logAction({ developerId: req.developer.id, endUserId: req.endUser.id, action: AUDIT_ACTIONS.USER_SESSION_REVOKED, ...getRequestMeta(req) });
    res.status(200).json({ message: 'Session revoked' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const revokeAllSessions = async (req, res) => {
  try {
    await authService.revokeAllSessions(req.endUser.id);
    logAction({ developerId: req.developer.id, endUserId: req.endUser.id, action: AUDIT_ACTIONS.USER_ALL_SESSIONS_REVOKED, ...getRequestMeta(req) });
    res.clearCookie('endUserRefreshToken');
    res.status(200).json({ message: 'All sessions revoked. You have been logged out everywhere.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};