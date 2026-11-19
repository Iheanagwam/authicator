/* AuthKit — Application shell interactions (sidebar, dropdowns, theme, modals, copy, toasts) */
(function () {
  "use strict";

  /* --- Theme --- */
  const THEME_KEY = "authkit-theme";
  const applyTheme = (t) => {
    document.documentElement.setAttribute("data-theme", t);
    localStorage.setItem(THEME_KEY, t);
  };
  const saved = localStorage.getItem(THEME_KEY);
  if (saved) applyTheme(saved);
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-theme-toggle]");
    if (!btn) return;
    const now = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(now);
  });

  /* --- Sidebar collapse / mobile --- */
  document.addEventListener("click", (e) => {
    const collapse = e.target.closest("[data-sidebar-collapse]");
    if (collapse) document.querySelector(".app")?.classList.toggle("collapsed");
    const mobile = e.target.closest("[data-sidebar-mobile]");
    if (mobile) document.querySelector(".app")?.classList.add("mobile-open");
  });
  document.body.addEventListener("click", (e) => {
    if (!e.target.closest(".sidebar") && !e.target.closest("[data-sidebar-mobile]")) {
      document.querySelector(".app")?.classList.remove("mobile-open");
    }
  });

  /* --- Dropdowns --- */
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-dropdown]");
    document.querySelectorAll(".dropdown.open").forEach((d) => {
      if (!trigger || !d.contains(trigger)) d.classList.remove("open");
    });
    if (trigger) {
      const dd = trigger.closest(".dropdown");
      dd?.classList.toggle("open");
    }
  });

  /* --- Modals --- */
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-modal-open]");
    if (open) {
      const id = open.getAttribute("data-modal-open");
      document.getElementById(id)?.classList.add("open");
    }
    const close = e.target.closest("[data-modal-close]");
    if (close) close.closest(".modal-backdrop")?.classList.remove("open");
    if (e.target.classList?.contains("modal-backdrop")) e.target.classList.remove("open");
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") document.querySelectorAll(".modal-backdrop.open").forEach((m) => m.classList.remove("open"));
  });

  /* --- Copy buttons --- */
  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    const sel = btn.getAttribute("data-copy");
    let text = "";
    if (sel.startsWith("#")) text = document.querySelector(sel)?.innerText || "";
    else text = sel;
    try {
      await navigator.clipboard.writeText(text.trim());
      const orig = btn.innerText;
      btn.innerText = "Copied";
      setTimeout(() => (btn.innerText = orig), 1200);
      toastCopy("Copied to clipboard");
    } catch { toastCopy("Copy failed"); }
  });

  /* --- Password toggle --- */
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-pw-toggle]");
    if (!btn) return;
    const input = btn.parentElement.querySelector("input");
    if (!input) return;
    input.type = input.type === "password" ? "text" : "password";
    btn.setAttribute("aria-pressed", input.type === "text");
  });

  /* --- Password strength --- */
  document.addEventListener("input", (e) => {
    const inp = e.target.closest("[data-pw-strength]");
    if (!inp) return;
    const meter = document.querySelector(inp.getAttribute("data-pw-strength"));
    if (!meter) return;
    const v = inp.value;
    let score = 0;
    if (v.length >= 8) score++;
    if (/[A-Z]/.test(v) && /[a-z]/.test(v)) score++;
    if (/\d/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    meter.setAttribute("data-score", String(score));
  });

  /* --- Switches --- */
  document.addEventListener("click", (e) => {
    const s = e.target.closest(".switch");
    if (!s) return;
    s.classList.toggle("on");
  });

  /* --- Tabs --- */
  document.addEventListener("click", (e) => {
    const t = e.target.closest("[data-tab]");
    if (!t) return;
    const group = t.closest(".tabs")?.getAttribute("data-tabs-group") || "";
    document.querySelectorAll(`[data-tab][data-group="${group}"], [data-tab-panel][data-group="${group}"]`).forEach((el) => el.classList.remove("active"));
    t.classList.add("active");
    const target = t.getAttribute("data-tab");
    document.querySelector(`[data-tab-panel="${target}"]`)?.classList.add("active");

    const targetBody = t.getAttribute("data-tab");
    document.querySelectorAll(`[data-tabs-body]`).forEach((el) => el.classList.remove("active-tab"));
    document.querySelectorAll(`[data-tabs-body]`).forEach((el) => el.classList.add("close-tab"));
    document.querySelectorAll(`[data-tabs-body]`).forEach((el) => {
      if (el.getAttribute("data-tabs-body") === targetBody) {
        el.classList.toggle("close-tab");
      }
    });
  });

  /* --- OTP inputs --- */
  document.querySelectorAll(".otp").forEach((otp) => {
    const inputs = [...otp.querySelectorAll("input")];
    inputs.forEach((inp, i) => {
      inp.addEventListener("input", () => {
        inp.value = inp.value.replace(/[^0-9]/g, "").slice(0, 1);
        if (inp.value && inputs[i + 1]) inputs[i + 1].focus();
      });
      inp.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !inp.value && inputs[i - 1]) inputs[i - 1].focus();
      });
    });
  });

  /* --- Toasts --- */
  function toast(msg) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    const elImg = document.createElement("img");
    const elMessage = document.createElement("span");
    elImg.src = "/assets/images/loading-96.gif";
    elImg.alt = "loading gif";
    elImg.className = "toast-img";
    el.className = "toast";
    elMessage.textContent = msg;
    el.appendChild(elMessage);
    el.appendChild(elImg);
    wrap.appendChild(el);
  }
  window.AuthKit = window.AuthKit || {};
  window.AuthKit.toast = toast;

  function toastCopy(msg) {
    let wrap = document.querySelector(".toast-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "toast-wrap";
      document.body.appendChild(wrap);
    }
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    wrap.appendChild(el);
    setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity .2s ease"; }, 2200);
    setTimeout(() => el.remove(), 2500);
  }
  window.AuthKit = window.AuthKit || {};
  window.AuthKit.toastCopy = toastCopy;

  /* --- Confirm dialogs (data-confirm) --- */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-confirm]");
    if (!el) return;
    if (!window.confirm(el.getAttribute("data-confirm"))) e.preventDefault();
  });

  /* --- Simple table search --- */
  document.querySelectorAll("[data-table-search]").forEach((inp) => {
    inp.addEventListener("input", () => {
      const q = inp.value.toLowerCase();
      const table = document.querySelector(inp.getAttribute("data-table-search"));
      if (!table) return;
      table.querySelectorAll("tbody tr").forEach((r) => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none";
      });
    });
  });
})();
