import { verifyAccessToken } from '../../src/utils/jwt.js';
import {prismaClient} from '../../src/config/db.js';

export const requireWebSuperAdmin = async (req, res, next) => {
  try {
    const token = req.cookies?.devToken;
    if (!token) return res.redirect('/login');

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch {
      return res.redirect('/login');
    }

    // Always check DB — never trust JWT for admin
    const developer = await prismaClient.developer.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, appName: true, isSuperAdmin: true },
    });

    if (!developer) return res.redirect('/login');
    if (!developer.isSuperAdmin) return res.redirect('/dashboard');

    req.developer = developer;
    next();
  } catch {
    return res.redirect('/login');
  }
};