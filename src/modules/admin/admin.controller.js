import * as adminService from '../../../services/admin.service.js';

export const getStats = async (req, res) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllDevelopers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const search = req.query.search          || null;

    const result = await adminService.getAllDevelopers({ page, limit, search });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getDeveloper = async (req, res) => {
  try {
    const developer = await adminService.getDeveloperById(req.params.developerId);
    res.status(200).json({ developer });
  } catch (err) {
    const status = err.message === 'Developer not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const deleteDeveloper = async (req, res) => {
  try {
    await adminService.deleteDeveloper(req.params.developerId);
    res.status(200).json({ message: 'Developer and all associated data deleted' });
  } catch (err) {
    const status = err.message === 'Developer not found' ? 404
      : err.message.includes('Cannot delete') ? 403 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const page        = parseInt(req.query.page)  || 1;
    const limit       = parseInt(req.query.limit) || 20;
    const search      = req.query.search          || null;
    const developerId = req.query.developerId     || null;

    const result = await adminService.getAllEndUsers({ page, limit, search, developerId });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await adminService.deleteEndUserAdmin(req.params.userId);
    res.status(200).json({ message: 'User deleted' });
  } catch (err) {
    const status = err.message === 'User not found' ? 404 : 500;
    res.status(status).json({ error: err.message });
  }
};

export const getPlatformAuditLogs = async (req, res) => {
  try {
    const page        = parseInt(req.query.page)  || 1;
    const limit       = parseInt(req.query.limit) || 20;
    const developerId = req.query.developerId     || null;
    const action      = req.query.action          || null;

    const result = await adminService.getPlatformAuditLogs({ page, limit, developerId, action });
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};