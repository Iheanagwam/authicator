import {prismaClient} from '../config/db.js';

export const requireApiKey = async (req, res, next) => {
  try {
    const key = req.headers['x-api-key'];

    if (!key) {
      return res.status(401).json({ error: 'API key is required in x-api-key header' });
    }

    const developer = await prismaClient.developer.findUnique({
      where: { apiKey: key },
      select: {
        id: true,
        email: true,
        appName: true,
        isVerified: true,
      },
    });

    if (!developer) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    if (!developer.isVerified) {
      return res.status(403).json({ error: 'Developer account not verified' });
    }

    req.developer = developer;
    next();
  } catch (err) {
    return res.status(500).json({ error: 'Failed to validate API key' });
  }
};