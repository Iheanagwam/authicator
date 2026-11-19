import * as auditLogService from '../../../services/auditLog.service.js';
import { AUDIT_ACTIONS } from '../../utils/auditLog.js';

export const getLogs = async (req, res) => {
  try {
    const page      = parseInt(req.query.page)   || 1;
    const limit     = parseInt(req.query.limit)  || 20;
    const endUserId = req.query.endUserId        || null;
    const action    = req.query.action           || null;

    const result = await auditLogService.getAuditLogs(
      req.developer.id,
      { page, limit, endUserId, action }
    );

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSummary = async (req, res) => {
  try {
    const summary = await auditLogService.getAuditLogSummary(req.developer.id);
    res.status(200).json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSupportedActions = (req, res) => {
  res.status(200).json({ actions: Object.values(AUDIT_ACTIONS) });
};