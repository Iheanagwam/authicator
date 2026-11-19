import { act } from 'react';
import * as auditLogService from '../../services/auditLog.service.js';
import { AUDIT_ACTIONS }    from '../../src/utils/auditLog.js';

export const showAuditLogs = async (req, res) => {
  try {
    const page      = parseInt(req.query.page)   || 1;
    const limit     = parseInt(req.query.limit)  || 50;
    const action    = req.query.action           || null;
    const endUserId = req.query.endUserId        || null;

    const result = await auditLogService.getAuditLogs(
      req.developer.id,
      { page, limit, action, endUserId }
    );

    console.log(result);

    res.render('dashboard/audit-logs', {
      title:      'Audit Logs — AuthKit',
      activeTab:  'auditLogs',
      developer:  req.developer,
      logs:       result.logs,
      pagination: result.pagination,
      actions:    Object.values(AUDIT_ACTIONS),
      filters: { action, endUserId },
    });
  } catch {
    res.redirect('/dashboard');
  }
};