import { verifyAccessToken } from '../utils/jwt.js';

// Protects routes that end users call with their own access token
// Used for /auth/me, /auth/sessions etc
export const requireEndUserAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token missing or malformed' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    // Make sure token belongs to an end user not a developer
    if (!decoded.developerId) {
      return res.status(401).json({ error: 'Invalid token type' });
    }

    req.endUser = decoded; // { id, email, developerId }
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Access token expired' });
    }
    return res.status(401).json({ error: 'Invalid access token' });
  }
};