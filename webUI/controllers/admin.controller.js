import * as adminService from '../../services/admin.service.js';

export const showAdminDashboard = async (req, res) => {
  try {
    const stats = await adminService.getPlatformStats();
    res.render('admin/overview', {
      title:     'Admin — AuthKit',
      developer: req.developer,
      stats,
    });
  } catch {
    res.redirect('/login');
  }
};

export const showDevelopers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const search = req.query.search          || null;
    const result = await adminService.getAllDevelopers({ page, limit: 20, search });
    res.render('admin/developers', {
      title:       'Developers — AuthKit Admin',
      developer:   req.developer,
      developers:  result.developers,
      pagination:  result.pagination,
      search,
    });
  } catch {
    res.redirect('/admin');
  }
};

export const showDeveloperDetail = async (req, res) => {
  try {
    const target = await adminService.getDeveloperById(req.params.developerId);
    res.render('admin/developer-detail', {
      title:     `${target.email} — AuthKit Admin`,
      developer: req.developer,
      target,
    });
  } catch {
    res.redirect('/admin/developers');
  }
};

export const handleDeleteDeveloper = async (req, res) => {
  try {
    await adminService.deleteDeveloper(req.params.developerId);
    res.redirect('/admin/developers?success=Developer+deleted+successfully');
  } catch (err) {
    res.redirect(`/admin/developers?error=${encodeURIComponent(err.message)}`);
  }
};

export const showAllUsers = async (req, res) => {
  try {
    const page        = parseInt(req.query.page)  || 1;
    const search      = req.query.search          || null;
    const developerId = req.query.developerId     || null;
    const result      = await adminService.getAllEndUsers({ page, limit: 20, search, developerId });
    res.render('admin/users', {
      title:       'All Users — AuthKit Admin',
      developer:   req.developer,
      users:       result.users,
      pagination:  result.pagination,
      search,
    });
  } catch {
    res.redirect('/admin');
  }
};

export const handleDeleteUser = async (req, res) => {
  try {
    await adminService.deleteEndUserAdmin(req.params.userId);
    res.redirect('/admin/users?success=User+deleted');
  } catch (err) {
    res.redirect(`/admin/users?error=${encodeURIComponent(err.message)}`);
  }
};

export const showAuditLogs = async (req, res) => {
  try {
    const page        = parseInt(req.query.page)  || 1;
    const action      = req.query.action          || null;
    const developerId = req.query.developerId     || null;
    const result      = await adminService.getPlatformAuditLogs({ page, limit: 20, action, developerId });
    res.render('admin/audit-logs', {
      title:      'Audit Logs — AuthKit Admin',
      developer:  req.developer,
      logs:       result.logs,
      pagination: result.pagination,
      filters: { action, developerId },
    });
  } catch {
    res.redirect('/admin');
  }
};

export const showSettings = (req, res) => {
  res.render('admin/settings', {
    title:     'Platform Settings — AuthKit Admin',
    developer: req.developer,
    success:   req.query.success || null,
    error:     req.query.error   || null,
  });
};