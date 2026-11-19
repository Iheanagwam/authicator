import { Router } from 'express';
import * as adminController from './admin.controller.js';
import { requireSuperAdmin } from '../../middleware/superAdmin.middleware.js';

const router = Router();

// Every route in here requires super admin
router.use(requireSuperAdmin);

// Platform stats
router.get('/stats',                        adminController.getStats);

// Developers
router.get('/developers',                   adminController.getAllDevelopers);
router.get('/developers/:developerId',      adminController.getDeveloper);
router.delete('/developers/:developerId',   adminController.deleteDeveloper);

// End users
router.get('/users',                        adminController.getAllUsers);
router.delete('/users/:userId',             adminController.deleteUser);

// Platform audit logs
router.get('/audit-logs',                   adminController.getPlatformAuditLogs);

export default router;