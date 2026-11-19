import { Router } from 'express';
import * as adminController from '../controllers/admin.controller.js';
import { requireWebSuperAdmin } from '../middleware/webSuperAdmin.middleware.js';

const router = Router();

router.get('/admin',                                  requireWebSuperAdmin, adminController.showAdminDashboard);
router.get('/admin/developers',                       requireWebSuperAdmin, adminController.showDevelopers);
router.get('/admin/developers/:developerId',           requireWebSuperAdmin, adminController.showDeveloperDetail);
router.post('/admin/developers/:developerId/delete',   requireWebSuperAdmin, adminController.handleDeleteDeveloper);
router.get('/admin/users',                            requireWebSuperAdmin, adminController.showAllUsers);
router.post('/admin/users/:userId/delete',            requireWebSuperAdmin, adminController.handleDeleteUser);
router.get('/admin/audit-logs',                       requireWebSuperAdmin, adminController.showAuditLogs);
router.get('/admin/settings',                         requireWebSuperAdmin, adminController.showSettings);

export default router;