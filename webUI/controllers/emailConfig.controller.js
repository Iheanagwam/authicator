import * as emailConfigService from '../../services/emailConfig.service.js';
import { buildEmailPreview }   from '../../src/utils/email.js';

export const handleSaveEmailConfig = async (req, res) => {
  try {
    await emailConfigService.saveEmailConfig(req.developer.id, req.body);
    res.redirect('/dashboard/settings?success=Email+branding+saved+successfully');
  } catch (err) {
    res.redirect(`/dashboard/settings?error=${encodeURIComponent(err.message)}`);
  }
};

export const showEmailPreview = async (req, res) => {
  try {
    const type = req.query.type || 'verification';
    const html = await buildEmailPreview(req.developer.id, type);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).send(`<p>Error generating preview: ${err.message}</p>`);
  }
};