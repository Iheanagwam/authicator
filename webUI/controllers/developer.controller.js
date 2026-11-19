import * as developerService from '../../services/developer.service.js';
import * as auditLogService  from '../../services/auditLog.service.js';

// ─── AUTH PAGES ───────────────────────────────────────────────────
export const showLogin = (req, res) =>
  res.render('auth/login', { error: null, title: 'Sign in — AuthKit' });

export const handleLogin = async (req, res) => {
  const { email, password } = req.body;
  console.log(req.body);
  if (!email || !password) {
    return res.render('auth/login', { error: 'Email and password are required', title: 'Sign in — AuthKit' });
  }
  try {
    const result = await developerService.loginDeveloper({ email, password });

    res.cookie('devToken', result.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 45 * 60 * 1000,
    });
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect(result.developer.isSuperAdmin ? '/admin' : '/dashboard');
  } catch (err) {
    return res.render('auth/login', { error: err.message, title: 'Sign in — AuthKit' });
  }
};

export const showRegister = (req, res) =>
  res.render('auth/register', { error: null, title: 'Create account — AuthKit' });

export const handleRegister = async (req, res) => {
  const { email, password, confirmPassword, appName } = req.body;
  if (!email || !password || !confirmPassword) {
    return res.render('auth/register', { error: 'All fields are required', title: 'Create account — AuthKit' });
  }
  if (password !== confirmPassword) {
    return res.render('auth/register', { error: 'Passwords do not match', title: 'Create account — AuthKit' });
  }
  if (password.length < 8) {
    return res.render('auth/register', { error: 'Password must be at least 8 characters', title: 'Create account — AuthKit' });
  }
  try {
    await developerService.registerDeveloper({ email, password, appName});
    return res.render('auth/verify-email', {error: null, title: 'Check your email — AuthKit', email});
  } catch (err) {
    return res.render('auth/register', { error: err.message, title: 'Create account — AuthKit' });
  }
};

export const showVerifyEmail = (req, res) =>
  res.render('auth/verify-email', { title: 'Check your email — AuthKit' });

export const handleVerifyEmail = async (req, res) => {
  const { otp1, otp2, otp3, otp4, otp5, otp6, email } = req.body;
  const accessKey = `${otp1}${otp2}${otp3}${otp4}${otp5}${otp6}`;

  try {
    await developerService.verifyDeveloperEmail(undefined, accessKey);
    return res.redirect('/login');
  }catch(err){
    console.log(err);
    return res.render('auth/verify-email', { error: err.message, title: 'Check your email — AuthKit', email });
  }
};

export const showForgotPassword = (req, res) =>
  res.render('auth/forgot-password', { error: null, success: null, title: 'Forgot password — AuthKit' });

export const handleForgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.render('auth/forgot-password', { error: 'Email is required', success: null, title: 'Forgot password — AuthKit' });
  }
  try {
    await developerService.forgotDeveloperPassword(email);
    return res.render('auth/forgot-password', {
      error: null,
      success: 'If that email exists, a reset link has been sent.',
      title: 'Forgot password — AuthKit',
    });
  } catch (err) {
    return res.render('auth/forgot-password', { error: err.message, success: null, title: 'Forgot password — AuthKit' });
  }
};

export const showResetPassword = (req, res) =>
  res.render('auth/reset-password', { error: null, success: null, token: req.params.token, title: 'Reset password — AuthKit' });

export const handleResetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, confirmPassword } = req.body;
  if (!password || password.length < 8) {
    return res.render('auth/reset-password', { error: 'Password must be at least 8 characters', success: null, token, title: 'Reset password — AuthKit' });
  }
  if (password !== confirmPassword) {
    return res.render('auth/reset-password', { error: 'Passwords do not match', success: null, token, title: 'Reset password — AuthKit' });
  }
  try {
    await developerService.resetDeveloperPassword(token, password);
    return res.render('auth/reset-password', { error: null, success: 'Password reset successfully. You can now log in.', token: null, title: 'Reset password — AuthKit' });
  } catch (err) {
    return res.render('auth/reset-password', { error: err.message, success: null, token, title: 'Reset password — AuthKit' });
  }
};

export const handleLogout = (req, res) => {
  res.clearCookie('devToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.redirect('/login');
};

// ─── DASHBOARD PAGES ──────────────────────────────────────────────
export const showDashboard = async (req, res) => {
  try {
    const [developer, users, auditSummary] = await Promise.all([
      developerService.getDeveloperProfile(req.developer.id),
      developerService.getDeveloperEndUsers(req.developer.id, 1, 5),
      auditLogService.getAuditLogSummary(req.developer.id),
    ]);
    res.render('dashboard/overview', {
      title: 'Dashboard — AuthKit',
      activeTab: 'overview',
      developer,
      recentUsers: users.users,
      userCount:   users.pagination.total,
      auditSummary,
    });
  } catch {
    res.redirect('/login');
  }
};

export const showUsers = async (req, res) => {
  try {
    const page   = parseInt(req.query.page)  || 1;
    const limit  = parseInt(req.query.limit) || 20;
    const result = await developerService.getDeveloperEndUsers(req.developer.id, page, limit);
    res.render('dashboard/users', {
      title: 'Users — AuthKit',
      activeTab: 'users',
      developer: req.developer,
      users: result.users,
      pagination: result.pagination,
    });
  } catch {
    res.redirect('/dashboard');
  }
};

export const showUserById = async (req, res) =>{
  console.log("i am here");
  try{
    const userId = req.params.id;
    const result = await developerService.getDeveloperEndUserById(req.developer.id, userId);
    console.log(result);
    res.render("dashboard/user-detail", {
      title: 'Users — AuthKit',
      activeTab: 'users',
      developer: req.developer,
      user: result
    })
  }catch(err) {
    console.log(err);
    res.redirect("/dashboard");
  };
}

export const showSettings = async (req, res) => {
  try {
    const developer = await developerService.getDeveloperProfile(req.developer.id);
    res.render('dashboard/settings', {
      title:     'Settings — AuthKit',
      activeTab: 'settings',
      developer,
      success:   req.query.success || null,
      error:     req.query.error   || null,
    });
  } catch {
    res.redirect('/dashboard');
  }
};

export const handleUpdateSettings = async (req, res) => {
  try {
    const { appName } = req.body;
    await developerService.updateDeveloperProfile(req.developer.id, { appName });
    res.redirect('/dashboard/settings?success=Settings+updated+successfully');
  } catch (err) {
    res.redirect(`/dashboard/settings?error=${encodeURIComponent(err.message)}`);
  }
};

export const handleChangePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (newPassword !== confirmPassword) {
      return res.redirect('/dashboard/settings?error=Passwords+do+not+match');
    }
    if (newPassword.length < 8) {
      return res.redirect('/dashboard/settings?error=Password+must+be+at+least+8+characters');
    }
    await developerService.changeDeveloperPassword(req.developer.id, currentPassword, newPassword);
    res.redirect('/dashboard/settings?success=Password+changed+successfully');
  } catch (err) {
    res.redirect(`/dashboard/settings?error=${encodeURIComponent(err.message)}`);
  }
};

export const showWidgetBuilder = async (req, res) => {
  try {
    const developer = await developerService.getDeveloperProfile(req.developer.id);
    res.render('dashboard/widget-builder', {
      title:     'Widget Builder — AuthKit',
      activeTab: 'widgetBuilder',
      developer,
    });
  } catch {
    res.redirect('/dashboard');
  }
};

export const handleRotateApiKey = async (req, res) =>{
  try{
    const result = await developerService.rotateApiKey(req.developer.id)
    return res.status(201).json({developer: result, message: "New API key generated.."})
  }catch(err){
    return res.status(400).json({developer: null, message: "Operation failed.."})
  };
};

export const handleSaveWidgetConfig = async (req, res) =>{
  const { fields } = req.body;
  const developerId = req.developer.id;

  console.log(fields);

  try{
    const result = await developerService.saveFieldConfig(developerId, fields);
    res.status(201).json(
      {fieldConfig: result, message: "Customization has been saved successfully"}
    );
  }catch(err) {
    return res.status(400).json({fieldConfig: null, message: "An error occured ..." + err});
  };
};