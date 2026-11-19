import { verifyAccessToken, verifyRefreshToken, signAccessToken } from '../../src/utils/jwt.js';

export const requireWebAuth = (req, res, next) => {
  try {
    const token = req.cookies?.devToken;

    // Debug log — remove after fixing
    console.log(`[WebAuth] ${req.method} ${req.path}`);
    console.log(`[WebAuth] Cookies present:`, Object.keys(req.cookies || {}));
    console.log(`[WebAuth] devToken exists:`, !!token);

    if (!token) {
      console.log('[WebAuth] No devToken — redirecting to /login');
      return res.redirect('/login');
    }

    try {
      const decoded = verifyAccessToken(token);
      req.developer = decoded;
      console.log('[WebAuth] Token valid — proceeding');
      return next();
    } catch (err) {
      console.log('[WebAuth] Token error:', err.name);

      if (err.name !== 'TokenExpiredError') {
        console.log('[WebAuth] Invalid token — redirecting to /login');
        return res.redirect('/login');
      }

      // Try silent refresh
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        console.log('[WebAuth] No refresh token — redirecting to /login');
        return res.redirect('/login');
      }

      try {
        const decoded = verifyRefreshToken(refreshToken);
        const newToken = signAccessToken({ id: decoded.id, email: decoded.email });

        res.cookie('devToken', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 45 * 60 * 1000,
        });

        req.developer = decoded;
        console.log('[WebAuth] Token refreshed silently — proceeding');
        return next();
      } catch {
        res.clearCookie('devToken', { path: '/' });
        res.clearCookie('refreshToken', { path: '/' });
        console.log('[WebAuth] Refresh failed — redirecting to /login');
        return res.redirect('/login');
      }
    }
  } catch {
    return res.redirect('/login');
  }
};

export const redirectIfAuthenticated = (req, res, next) => {
  const token = req.cookies?.devToken;
  if (!token) return next();
  try {
    verifyAccessToken(token);
    return res.redirect('/dashboard');
  } catch {
    return next();
  }
};