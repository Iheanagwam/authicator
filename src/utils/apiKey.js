import crypto from 'crypto';

export const generateApiKey = () => {
  // Format: ak_live_<32 random hex chars>
  return `ak_live_${crypto.randomBytes(16).toString('hex')}`;
};

export const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};