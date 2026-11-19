(() => {
  /* ============================================================
     SECTION 1 — CONFIG
     Read all data-* attributes from the script tag
  ============================================================ */
  const scriptTag = document.currentScript;

  const API_KEY  = scriptTag?.getAttribute('data-api-key');
  const BASE_URL = scriptTag?.getAttribute('data-base-url') || 'http://localhost:5000';
  const APP_NAME = scriptTag?.getAttribute('data-app-name') || 'AuthKit';

  // Theme tokens — every visual property the developer can override
  const THEME = {
    primary:          scriptTag?.getAttribute('data-primary')            || '#3b82f6',
    primaryHover:     scriptTag?.getAttribute('data-primary-hover')      || '#2563eb',
    primaryText:      scriptTag?.getAttribute('data-primary-text')       || '#ffffff',
    text:             scriptTag?.getAttribute('data-text')               || '#111827',
    textSecondary:    scriptTag?.getAttribute('data-text-secondary')     || '#6b7280',
    textMuted:        scriptTag?.getAttribute('data-text-muted')         || '#9ca3af',
    bg:               scriptTag?.getAttribute('data-bg')                 || '#ffffff',
    overlay:          scriptTag?.getAttribute('data-overlay')            || 'rgba(0,0,0,0.5)',
    inputBg:          scriptTag?.getAttribute('data-input-bg')           || '#ffffff',
    inputBorder:      scriptTag?.getAttribute('data-input-border')       || '#d1d5db',
    inputBorderFocus: scriptTag?.getAttribute('data-input-border-focus') || scriptTag?.getAttribute('data-primary') || '#3b82f6',
    inputText:        scriptTag?.getAttribute('data-input-text')         || '#111827',
    border:           scriptTag?.getAttribute('data-border')             || '#e5e7eb',
    errorBg:          scriptTag?.getAttribute('data-error-bg')           || '#fef2f2',
    errorBorder:      scriptTag?.getAttribute('data-error-border')       || '#fecaca',
    errorText:        scriptTag?.getAttribute('data-error-text')         || '#b91c1c',
    successBg:        scriptTag?.getAttribute('data-success-bg')         || '#f0fdf4',
    successBorder:    scriptTag?.getAttribute('data-success-border')     || '#bbf7d0',
    successText:      scriptTag?.getAttribute('data-success-text')       || '#15803d',
    radius:           scriptTag?.getAttribute('data-radius')             || '8px',
    font:             scriptTag?.getAttribute('data-font')               || "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  };

  // Custom fields — developer passes JSON array via data-fields
  let CUSTOM_FIELDS = [];
  try {
    const raw = scriptTag?.getAttribute('data-fields');
    if (raw) CUSTOM_FIELDS = JSON.parse(raw);
  } catch (e) {
    console.warn('[AuthKit] Invalid data-fields JSON.');
  }

  if (!API_KEY) {
    console.error('[AuthKit] No data-api-key found on the script tag.');
    return;
  }

  /* ============================================================
     SECTION 2 — CSS VARIABLES
     Inject theme tokens as CSS custom properties,
     then use var(--ak-*) throughout all styles
  ============================================================ */
  const injectThemeVars = () => {
    const vars = `
      #authkit-overlay {
        --ak-primary:            ${THEME.primary};
        --ak-primary-hover:      ${THEME.primaryHover};
        --ak-primary-text:       ${THEME.primaryText};
        --ak-text:               ${THEME.text};
        --ak-text-secondary:     ${THEME.textSecondary};
        --ak-text-muted:         ${THEME.textMuted};
        --ak-bg:                 ${THEME.bg};
        --ak-overlay:            ${THEME.overlay};
        --ak-input-bg:           ${THEME.inputBg};
        --ak-input-border:       ${THEME.inputBorder};
        --ak-input-border-focus: ${THEME.inputBorderFocus};
        --ak-input-text:         ${THEME.inputText};
        --ak-border:             ${THEME.border};
        --ak-error-bg:           ${THEME.errorBg};
        --ak-error-border:       ${THEME.errorBorder};
        --ak-error-text:         ${THEME.errorText};
        --ak-success-bg:         ${THEME.successBg};
        --ak-success-border:     ${THEME.successBorder};
        --ak-success-text:       ${THEME.successText};
        --ak-radius:             ${THEME.radius};
        --ak-font:               ${THEME.font};
      }
    `;

    const varEl = document.createElement('style');
    varEl.id = 'authkit-vars';
    varEl.textContent = vars;
    document.head.appendChild(varEl);
  };

  /* ============================================================
     SECTION 3 — STYLES
     All colors reference var(--ak-*) — no hardcoded values
  ============================================================ */
  const injectStyles = () => {
    const styles = `
      #authkit-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: var(--ak-overlay);
        z-index: 999998;
        align-items: center;
        justify-content: center;
        font-family: var(--ak-font);
      }
      #authkit-overlay.authkit-open {
        display: flex;
      }
      #authkit-modal {
        background: var(--ak-bg);
        border-radius: calc(var(--ak-radius) * 1.5);
        padding: 2rem;
        width: 100%;
        max-width: 400px;
        margin: 1rem;
        box-shadow: 0 20px 60px rgba(0,0,0,0.15);
        position: relative;
        box-sizing: border-box;
      }
      .authkit-close {
        position: absolute;
        top: 1rem;
        right: 1rem;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: var(--ak-text-muted);
        line-height: 1;
        padding: 4px;
        transition: color 0.15s;
      }
      .authkit-close:hover { color: var(--ak-text); }
      .authkit-logo {
        width: 40px;
        height: 40px;
        background: color-mix(in srgb, var(--ak-primary) 12%, transparent);
        border-radius: var(--ak-radius);
        display: flex;
        align-items: center;
        justify-content: center;
        margin: 0 auto 0.75rem;
      }
      .authkit-logo svg { width: 20px; height: 20px; }
      .authkit-header {
        text-align: center;
        margin-bottom: 1.5rem;
      }
      .authkit-header p {
        margin: 0;
        font-size: 13px;
        color: var(--ak-text-secondary);
      }
      .authkit-tabs {
        display: flex;
        border: 1px solid var(--ak-border);
        border-radius: var(--ak-radius);
        margin-bottom: 1.5rem;
        overflow: hidden;
      }
      .authkit-tab {
        flex: 1;
        padding: 8px;
        font-size: 13px;
        font-weight: 500;
        border: none;
        cursor: pointer;
        background: transparent;
        color: var(--ak-text-secondary);
        font-family: var(--ak-font);
        transition: all 0.15s;
      }
      .authkit-tab.active {
        background: var(--ak-primary);
        color: var(--ak-primary-text);
      }
      .authkit-tab:not(.active):hover {
        background: color-mix(in srgb, var(--ak-primary) 8%, transparent);
        color: var(--ak-text);
      }
      .authkit-field {
        margin-bottom: 14px;
      }
      .authkit-field label {
        display: block;
        font-size: 12px;
        font-weight: 500;
        color: var(--ak-text-secondary);
        margin-bottom: 5px;
      }
      .authkit-field input {
        width: 100%;
        padding: 9px 12px;
        font-size: 14px;
        border: 1px solid var(--ak-input-border);
        border-radius: var(--ak-radius);
        outline: none;
        box-sizing: border-box;
        background: var(--ak-input-bg);
        color: var(--ak-input-text);
        font-family: var(--ak-font);
        transition: border-color 0.15s, box-shadow 0.15s;
      }
      .authkit-field input::placeholder {
        color: var(--ak-text-muted);
      }
      .authkit-field input:focus {
        border-color: var(--ak-input-border-focus);
        box-shadow: 0 0 0 3px color-mix(in srgb, var(--ak-input-border-focus) 20%, transparent);
      }
      .authkit-forgot {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 5px;
      }
      .authkit-forgot a {
        font-size: 12px;
        color: var(--ak-primary);
        text-decoration: none;
        transition: opacity 0.15s;
      }
      .authkit-forgot a:hover { opacity: 0.8; text-decoration: underline; }
      .authkit-btn {
        width: 100%;
        padding: 10px;
        background: var(--ak-primary);
        color: var(--ak-primary-text);
        border: none;
        border-radius: var(--ak-radius);
        font-size: 14px;
        font-weight: 500;
        font-family: var(--ak-font);
        cursor: pointer;
        margin-top: 4px;
        transition: background 0.15s, opacity 0.15s;
      }
      .authkit-btn:hover { background: var(--ak-primary-hover); }
      .authkit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      .authkit-btn-ghost {
        background: transparent !important;
        color: var(--ak-primary) !important;
      }
      .authkit-btn-ghost:hover {
        background: color-mix(in srgb, var(--ak-primary) 8%, transparent) !important;
      }
      .authkit-error {
        background: var(--ak-error-bg);
        border: 1px solid var(--ak-error-border);
        color: var(--ak-error-text);
        border-radius: var(--ak-radius);
        padding: 10px 12px;
        font-size: 13px;
        margin-bottom: 14px;
        display: none;
      }
      .authkit-success {
        background: var(--ak-success-bg);
        border: 1px solid var(--ak-success-border);
        color: var(--ak-success-text);
        border-radius: var(--ak-radius);
        padding: 10px 12px;
        font-size: 13px;
        margin-bottom: 14px;
        display: none;
      }
      .authkit-footer {
        text-align: center;
        font-size: 12px;
        color: var(--ak-text-muted);
        margin-top: 1.25rem;
        margin-bottom: 0;
      }
      .authkit-footer span { color: var(--ak-primary); font-weight: 500; }
      .authkit-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid color-mix(in srgb, var(--ak-primary-text) 40%, transparent);
        border-top-color: var(--ak-primary-text);
        border-radius: 50%;
        animation: authkit-spin 0.7s linear infinite;
        vertical-align: middle;
        margin-right: 6px;
      }
      @keyframes authkit-spin { to { transform: rotate(360deg); } }
      .authkit-trigger {
        padding: 10px 20px;
        background: var(--ak-primary);
        color: var(--ak-primary-text);
        border: none;
        border-radius: var(--ak-radius);
        font-size: 14px;
        font-weight: 500;
        font-family: var(--ak-font);
        cursor: pointer;
        transition: background 0.15s;
      }
      .authkit-trigger:hover { background: var(--ak-primary-hover); }
    `;

    const styleEl = document.createElement('style');
    styleEl.id = 'authkit-styles';
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  };

  /* ============================================================
     SECTION 4 — HTML
     Build and inject modal — no inline color styles needed
     since everything is driven by CSS variables
  ============================================================ */
  const buildModal = () => {
    const overlay = document.createElement('div');
    overlay.id = 'authkit-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Authentication');

    overlay.innerHTML = `
      <div id="authkit-modal">

        <button class="authkit-close" id="authkit-close-btn" aria-label="Close">&#x2715;</button>

        <div class="authkit-header">
          <div class="authkit-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="var(--ak-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
          </div>
          <p id="authkit-subtitle">Sign in to continue</p>
        </div>

        <div class="authkit-tabs">
          <button class="authkit-tab active" id="tab-login">Sign in</button>
          <button class="authkit-tab" id="tab-register">Create account</button>
        </div>

        <div id="authkit-error" class="authkit-error" role="alert"></div>
        <div id="authkit-success" class="authkit-success" role="status"></div>

        <!-- LOGIN FORM -->
        <div id="authkit-form-login">
          <div class="authkit-field">
            <label for="authkit-login-email">Email</label>
            <input type="email" id="authkit-login-email" placeholder="name@example.com" autocomplete="email" />
          </div>
          <div class="authkit-field">
            <div class="authkit-forgot">
              <label for="authkit-login-password">Password</label>
              <a href="#" id="authkit-forgot-link">Forgot password?</a>
            </div>
            <input type="password" id="authkit-login-password" placeholder="••••••••" autocomplete="current-password" />
          </div>
          <button class="authkit-btn" id="authkit-login-btn">Sign in</button>
        </div>

        <!-- REGISTER FORM -->
        <div id="authkit-form-register" style="display:none;">
          <div class="authkit-field">
            <label for="authkit-reg-email">Email</label>
            <input type="email" id="authkit-reg-email" placeholder="name@example.com" autocomplete="email" />
          </div>
          <div class="authkit-field">
            <label for="authkit-reg-password">Password</label>
            <input type="password" id="authkit-reg-password" placeholder="Min. 8 characters" autocomplete="new-password" />
          </div>
          <div class="authkit-field">
            <label for="authkit-reg-confirm">Confirm password</label>
            <input type="password" id="authkit-reg-confirm" placeholder="••••••••" autocomplete="new-password" />
          </div>
          <!-- Custom fields injected here by buildCustomFields() -->
          <div id="authkit-custom-fields"></div>
          <button class="authkit-btn" id="authkit-register-btn">Create account</button>
        </div>

        <!-- FORGOT PASSWORD FORM -->
        <div id="authkit-form-forgot" style="display:none;">
          <div class="authkit-field">
            <label for="authkit-forgot-email">Email</label>
            <input type="email" id="authkit-forgot-email" placeholder="name@example.com" />
          </div>
          <button class="authkit-btn" id="authkit-forgot-btn">Send reset link</button>
          <button class="authkit-btn authkit-btn-ghost" id="authkit-back-btn" style="margin-top:8px;">
            &#8592; Back to sign in
          </button>
        </div>

        <p class="authkit-footer">Protected by <span>${APP_NAME}</span></p>
      </div>
    `;

    document.body.appendChild(overlay);
  };

  /* ============================================================
     SECTION 5 — AUTH LOGIC
  ============================================================ */
  const TOKEN_KEY = `authkit_token_${API_KEY}`;

  const api = async (endpoint, body) => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      credentials: 'include',
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Something went wrong');
    return data;
  };

  const saveToken  = (t) => localStorage.setItem(TOKEN_KEY, t);
  const getToken   = ()  => localStorage.getItem(TOKEN_KEY);
  const clearToken = ()  => localStorage.removeItem(TOKEN_KEY);

  const setLoading = (btnId, loading, label) => {
    const btn = document.getElementById(btnId);
    if (!btn) return;
    btn.disabled = loading;
    btn.innerHTML = loading
      ? `<span class="authkit-spinner"></span>${label}...`
      : label;
  };

  const showError = (msg) => {
    const el  = document.getElementById('authkit-error');
    const suc = document.getElementById('authkit-success');
    if (!el) return;
    suc.style.display = 'none';
    el.textContent    = msg;
    el.style.display  = 'block';
  };

  const showSuccess = (msg) => {
    const el  = document.getElementById('authkit-success');
    const err = document.getElementById('authkit-error');
    if (!el) return;
    err.style.display = 'none';
    el.textContent    = msg;
    el.style.display  = 'block';
  };

  const clearMessages = () => {
    const err = document.getElementById('authkit-error');
    const suc = document.getElementById('authkit-success');
    if (err) err.style.display = 'none';
    if (suc) suc.style.display = 'none';
  };

  const handleLogin = async () => {
    clearMessages();
    const email    = document.getElementById('authkit-login-email')?.value?.trim();
    const password = document.getElementById('authkit-login-password')?.value;
    if (!email || !password) return showError('Please fill in all fields');

    setLoading('authkit-login-btn', true, 'Signing in');
    try {
      const data = await api('/auth/login', { email, password });
      saveToken(data.accessToken);
      AuthKit.emit('authkit:login', { accessToken: data.accessToken, user: data.user });
      AuthKit.close();
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading('authkit-login-btn', false, 'Sign in');
    }
  };

  // Build custom field inputs into the register form
  const buildCustomFields = () => {
    const container = document.getElementById('authkit-custom-fields');
    if (!container || CUSTOM_FIELDS.length === 0) return;

    container.innerHTML = CUSTOM_FIELDS.map(f => {
      const required = f.required ? 'required' : '';
      const requiredStar = f.required ? '<span style="color:var(--ak-error-text)">*</span>' : '';
      const label = `<label style="display:block;font-size:12px;font-weight:500;color:var(--ak-text-secondary);margin-bottom:4px;">${f.label}${requiredStar}</label>`;

      if (f.type === 'checkbox') {
        return `<div class="authkit-field" style="display:flex;align-items:center;gap:8px;">
          <input type="checkbox" id="authkit-field-${f.name}" ${required} style="width:auto;"/>
          <label for="authkit-field-${f.name}" style="font-size:13px;color:var(--ak-text);margin:0;">${f.label}${requiredStar}</label>
        </div>`;
      }

      if (f.type === 'select') {
        const opts = (f.options || []).map(o => `<option value="${o}">${o}</option>`).join('');
        return `<div class="authkit-field">${label}
          <select id="authkit-field-${f.name}" ${required} style="width:100%;padding:9px 12px;font-size:14px;border:1px solid var(--ak-input-border);border-radius:var(--ak-radius);background:var(--ak-input-bg);color:var(--ak-input-text);outline:none;box-sizing:border-box;">
            <option value="">${f.placeholder || 'Select...'}</option>${opts}
          </select>
        </div>`;
      }

      return `<div class="authkit-field">${label}
        <input
          type="${f.type}"
          id="authkit-field-${f.name}"
          placeholder="${f.placeholder || ''}"
          ${required}
          autocomplete="${f.name}"
          style="width:100%;"
        />
      </div>`;
    }).join('');
  };

  // Collect custom field values from the register form
  const collectCustomFields = () => {
    const metadata = {};
    for (const f of CUSTOM_FIELDS) {
      const el = document.getElementById(`authkit-field-${f.name}`);
      if (!el) continue;
      metadata[f.name] = f.type === 'checkbox' ? el.checked : el.value;
    }
    return metadata;
  };

  const handleRegister = async () => {
    clearMessages();
    const email    = document.getElementById('authkit-reg-email')?.value?.trim();
    const password = document.getElementById('authkit-reg-password')?.value;
    const confirm  = document.getElementById('authkit-reg-confirm')?.value;

    if (!email || !password || !confirm) return showError('Please fill in all fields');
    if (password !== confirm)            return showError('Passwords do not match');
    if (password.length < 8)            return showError('Password must be at least 8 characters');

    // Validate required custom fields
    for (const f of CUSTOM_FIELDS) {
      if (!f.required) continue;
      const el = document.getElementById(`authkit-field-${f.name}`);
      if (!el) continue;
      const val = f.type === 'checkbox' ? el.checked : el.value?.trim();
      if (!val) return showError(`${f.label} is required`);
    }

    const metadata = collectCustomFields();

    setLoading('authkit-register-btn', true, 'Creating account');
    try {
      const data = await api('/auth/register', { email, password, ...metadata });
      AuthKit.emit('authkit:register', { user: data.user });
      showSuccess('Account created! Check your email to verify your account.');
      document.getElementById('authkit-reg-email').value    = '';
      document.getElementById('authkit-reg-password').value = '';
      document.getElementById('authkit-reg-confirm').value  = '';
      // Clear custom fields
      for (const f of CUSTOM_FIELDS) {
        const el = document.getElementById(`authkit-field-${f.name}`);
        if (el) el.type === 'checkbox' ? el.checked = false : el.value = '';
      }
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading('authkit-register-btn', false, 'Create account');
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    const email = document.getElementById('authkit-forgot-email')?.value?.trim();
    if (!email) return showError('Please enter your email');

    setLoading('authkit-forgot-btn', true, 'Sending');
    try {
      await api('/auth/forgot-password', { email });
      showSuccess('If that email exists, a reset link has been sent.');
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading('authkit-forgot-btn', false, 'Send reset link');
    }
  };

  /* ============================================================
     SECTION 6 — TAB SWITCHING + EVENT BINDING
  ============================================================ */
  const switchTab = (tab) => {
    clearMessages();
    const isLogin  = tab === 'login';
    const isForgot = tab === 'forgot';

    document.getElementById('authkit-form-login').style.display   = isLogin ? 'block' : 'none';
    document.getElementById('authkit-form-register').style.display = (!isLogin && !isForgot) ? 'block' : 'none';
    document.getElementById('authkit-form-forgot').style.display  = isForgot ? 'block' : 'none';

    const tabsEl = document.querySelector('.authkit-tabs');
    if (tabsEl) tabsEl.style.display = isForgot ? 'none' : 'flex';

    document.getElementById('tab-login')?.classList.toggle('active', isLogin);
    document.getElementById('tab-register')?.classList.toggle('active', !isLogin && !isForgot);

    const subtitle = document.getElementById('authkit-subtitle');
    if (subtitle) {
      subtitle.textContent = isLogin
        ? 'Sign in to continue'
        : isForgot
        ? 'Reset your password'
        : 'Create your account';
    }
  };

  const bindEvents = () => {
    document.getElementById('authkit-close-btn')
      ?.addEventListener('click', () => AuthKit.close());

    document.getElementById('authkit-overlay')
      ?.addEventListener('click', (e) => {
        if (e.target.id === 'authkit-overlay') AuthKit.close();
      });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') AuthKit.close();
    });

    document.getElementById('tab-login')?.addEventListener('click', () => switchTab('login'));
    document.getElementById('tab-register')?.addEventListener('click', () => switchTab('register'));

    document.getElementById('authkit-forgot-link')
      ?.addEventListener('click', (e) => { e.preventDefault(); switchTab('forgot'); });

    document.getElementById('authkit-back-btn')
      ?.addEventListener('click', () => switchTab('login'));

    document.getElementById('authkit-login-btn')?.addEventListener('click', handleLogin);
    document.getElementById('authkit-register-btn')?.addEventListener('click', handleRegister);
    document.getElementById('authkit-forgot-btn')?.addEventListener('click', handleForgotPassword);

    document.getElementById('authkit-login-password')
      ?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleLogin(); });
    document.getElementById('authkit-reg-confirm')
      ?.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleRegister(); });

    // Auto-bind any element with data-authkit-open attribute
    // Lets developers do: <button data-authkit-open="login">Login</button>
    document.querySelectorAll('[data-authkit-open]').forEach((el) => {
      el.addEventListener('click', () => {
        const tab = el.getAttribute('data-authkit-open') || 'login';
        AuthKit.open(tab);
      });
    });
  };

  /* ============================================================
     SECTION 7 — PUBLIC API
  ============================================================ */
  window.AuthKit = {
    open(tab = 'login') {
      const overlay = document.getElementById('authkit-overlay');
      if (overlay) {
        overlay.classList.add('authkit-open');
        switchTab(tab);
        setTimeout(() => {
          document.getElementById(
            tab === 'login' ? 'authkit-login-email' : 'authkit-reg-email'
          )?.focus();
        }, 50);
      }
    },

    close() {
      document.getElementById('authkit-overlay')?.classList.remove('authkit-open');
      clearMessages();
    },

    logout() {
      clearToken();
      this.emit('authkit:logout', {});
    },

    getToken()    { return getToken(); },
    isLoggedIn()  { return !!getToken(); },
    getTheme()    { return { ...THEME }; },

    emit(eventName, detail = {}) {
      window.dispatchEvent(new CustomEvent(eventName, { detail }));
    },
  };

  /* ============================================================
     INIT
  ============================================================ */

  // Expose internals for the dynamic fields extension
  window.__authkit_api_key__  = API_KEY;
  window.__authkit_base_url__ = BASE_URL;
  window.__authkit_helpers__  = { showError, showSuccess, clearMessages, setLoading, api };

  const init = () => {
    injectThemeVars();
    injectStyles();
    buildModal();
    buildCustomFields();
    bindEvents();
    window.AuthKit.emit('authkit:ready', {});
    console.log(`[AuthKit] Widget loaded for: ${APP_NAME}`);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

// ─── DYNAMIC FIELDS EXTENSION ─────────────────────────────────────────────────
// This block patches the widget with dynamic field support.
// It overwrites buildModal, handleRegister, and init.

(function extendWithDynamicFields() {
  // Store fetched field config
  let FIELD_CONFIG = [];

  // ── Fetch field config from server ────────────────────────────
  const fetchFieldConfig = async () => {
    try {
      const res = await fetch(`${window.__authkit_base_url__}/dev/fields/public`, {
        headers: { 'x-api-key': window.__authkit_api_key__ },
      });
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data.fields) ? data.fields : [];
    } catch {
      return [];
    }
  };

  // ── Build one dynamic input field ─────────────────────────────
  const buildField = (field) => {
    const wrap = document.createElement('div');
    wrap.className = 'authkit-field';
    wrap.dataset.fieldName = field.name;

    const label = document.createElement('label');
    label.htmlFor = `authkit-custom-${field.name}`;
    label.textContent = field.label + (field.required ? ' *' : '');
    wrap.appendChild(label);

    if (field.type === 'select') {
      const select = document.createElement('select');
      select.id = `authkit-custom-${field.name}`;
      select.style.cssText = `
        width:100%; padding:9px 12px; font-size:14px;
        border:1px solid var(--ak-input-border); border-radius:var(--ak-radius);
        background:var(--ak-input-bg); color:var(--ak-input-text);
        outline:none; box-sizing:border-box; font-family:var(--ak-font);
      `;
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = `Select ${field.label}`;
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);

      (field.options || []).forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        select.appendChild(option);
      });
      wrap.appendChild(select);

    } else if (field.type === 'checkbox') {
      const checkWrap = document.createElement('div');
      checkWrap.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px;';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.id = `authkit-custom-${field.name}`;
      input.style.width = 'auto';
      const checkLabel = document.createElement('span');
      checkLabel.textContent = field.placeholder || field.label;
      checkLabel.style.cssText = `font-size:13px;color:var(--ak-text-secondary);`;
      checkWrap.appendChild(input);
      checkWrap.appendChild(checkLabel);
      wrap.appendChild(checkWrap);

    } else {
      const input = document.createElement('input');
      input.type = field.type || 'text';
      input.id = `authkit-custom-${field.name}`;
      input.placeholder = field.placeholder || '';
      if (field.min !== undefined) input.min = field.min;
      if (field.max !== undefined) input.max = field.max;
      wrap.appendChild(input);
    }

    return wrap;
  };

  // ── Inject dynamic fields into the register form ──────────────
  const injectDynamicFields = (fields) => {
    const form = document.getElementById('authkit-form-register');
    if (!form) return;

    // Remove any previously injected fields
    form.querySelectorAll('[data-field-name]').forEach(el => el.remove());

    // Insert after email field, before password
    const emailField = form.querySelector('.authkit-field');
    let insertAfter = emailField;

    fields.forEach(field => {
      // showOn: 'register' (default) or 'both'
      if (field.showOn === 'login') return; // skip login-only fields
      const el = buildField(field);
      if (insertAfter && insertAfter.nextSibling) {
        form.insertBefore(el, insertAfter.nextSibling);
      } else {
        form.appendChild(el);
      }
      insertAfter = el;
    });
  };

  // ── Collect custom field values from form ─────────────────────
  const collectMetadata = (fields) => {
    const metadata = {};
    fields.forEach(field => {
      if (field.showOn === 'login') return;
      const el = document.getElementById(`authkit-custom-${field.name}`);
      if (!el) return;
      if (field.type === 'checkbox') {
        metadata[field.name] = el.checked;
      } else {
        metadata[field.name] = el.value;
      }
    });
    return metadata;
  };

  // ── Validate required custom fields client-side ───────────────
  const validateCustomFields = (fields, metadata) => {
    for (const field of fields) {
      if (field.showOn === 'login') continue;
      if (field.required) {
        const val = metadata[field.name];
        if (val === undefined || val === null || val === '' || val === false) {
          return `"${field.label}" is required`;
        }
      }
    }
    return null;
  };

  // ── Patch handleRegister to include metadata ──────────────────
  const patchedHandleRegister = async (showError, showSuccess, setLoading, api) => {
    const email    = document.getElementById('authkit-reg-email')?.value?.trim();
    const password = document.getElementById('authkit-reg-password')?.value;
    const confirm  = document.getElementById('authkit-reg-confirm')?.value;

    if (!email || !password || !confirm) return showError('Please fill in all fields');
    if (password !== confirm)            return showError('Passwords do not match');
    if (password.length < 8)            return showError('Password must be at least 8 characters');

    // Collect and validate custom fields
    const metadata = collectMetadata(FIELD_CONFIG);
    const fieldError = validateCustomFields(FIELD_CONFIG, metadata);
    if (fieldError) return showError(fieldError);

    setLoading('authkit-register-btn', true, 'Creating account');
    try {
      const payload = { email, password, ...metadata };
      const data = await api('/auth/register', payload);
      window.AuthKit.emit('authkit:register', { user: data.user });
      showSuccess('Account created! Check your email to verify your account.');
      document.getElementById('authkit-reg-email').value    = '';
      document.getElementById('authkit-reg-password').value = '';
      document.getElementById('authkit-reg-confirm').value  = '';
      // Clear custom fields
      FIELD_CONFIG.forEach(field => {
        const el = document.getElementById(`authkit-custom-${field.name}`);
        if (el) el.type === 'checkbox' ? (el.checked = false) : (el.value = '');
      });
    } catch (err) {
      showError(err.message);
    } finally {
      setLoading('authkit-register-btn', false, 'Create account');
    }
  };

  // ── Expose so the main widget can call it ─────────────────────
  window.__authkit_dynamic__ = {
    fetchFieldConfig,
    injectDynamicFields,
    patchedHandleRegister,
    getFieldConfig: () => FIELD_CONFIG,
    setFieldConfig: (cfg) => { FIELD_CONFIG = cfg; },
  };
})();