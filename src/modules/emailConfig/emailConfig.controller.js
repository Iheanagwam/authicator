import * as emailConfigService from '../../../services/emailConfig.service.js';
import { buildEmailPreview } from '../../utils/email.js';
import { logAction, getRequestMeta, AUDIT_ACTIONS } from '../../utils/auditLog.js';

export const getEmailConfig = async (req, res) => {
  try {
    const config = await emailConfigService.getEmailConfig(req.developer.id);
    res.status(200).json({ config });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const saveEmailConfig = async (req, res) => {
  try {
    const config = await emailConfigService.saveEmailConfig(req.developer.id, req.body);
    logAction({
      developerId: req.developer.id,
      action: AUDIT_ACTIONS.EMAIL_CONFIG_UPDATED,
      ...getRequestMeta(req),
    });
    res.status(200).json({ message: 'Email config saved', config });
  } catch (err) {
    const status = err.message.includes('valid') ? 400 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const previewEmail = async (req, res) => {
  try {
    const type = req.query.type || 'verification';
    const html = await buildEmailPreview(req.developer.id, type);
    // Return as HTML so browser renders it directly
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(html);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};