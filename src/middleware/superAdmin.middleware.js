import {prismaClient} from '../config/db.js';
import { verifyAccessToken } from '../utils/jwt.js';

// Requires developer to be logged in AND have isSuperAdmin = true
export const requireSuperAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Access token expired' });
      }
      return res.status(401).json({ error: 'Invalid access token' });
    }

    // Fetch fresh from DB — never trust JWT alone for admin status
    const developer = await prismaClient.developer.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, isSuperAdmin: true },
    });

    if (!developer) {
      return res.status(401).json({ error: 'Account not found' });
    }

    if (!developer.isSuperAdmin) {
      return res.status(403).json({ error: 'Forbidden — super admin access required' });
    }

    req.developer = developer;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};