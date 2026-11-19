(function () {
  "use strict";

  const toPayload = (form) => {
    const fd = new FormData(form);
    const out = {};
    for (const [key, value] of fd.entries()) {
      if (Object.prototype.hasOwnProperty.call(out, key)) {
        if (!Array.isArray(out[key])) out[key] = [out[key]];
        out[key].push(value);
      } else {
        out[key] = value;
      }
    }
    return out;
  };

  const toast = (msg, type = "info", ms = 2200) => {
    const fn = window.AuthKit?.toast || window.toast;
    if (typeof fn === "function") fn(msg, type, ms);
    else alert(msg);
  };

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("form[data-fetch]");
    if (!form) return;

    event.preventDefault();
    toast("Login in");

    const endpoint = form.getAttribute("data-endpoint") || form.getAttribute("action") || location.href;
    const method = (form.getAttribute("method") || "POST").toUpperCase();
    const isFileUpload = Array.from(form.elements).some((el) => el.type === "file");
    const payload = toPayload(form);
    const successText = form.getAttribute("data-success") || "Success";
    const errorText = form.getAttribute("data-error") || "Something went wrong";
    const redirect = form.getAttribute("data-redirect");
    const delay = Number(form.getAttribute("data-toast-delay") || 2200);

    try {
      const response = await fetch(endpoint, {
        method,
        credentials: "same-origin",
        headers: {
          Accept: "application/json",
          ...(isFileUpload ? {} : { "Content-Type": "application/json" }),
        },
        body: isFileUpload ? new FormData(form) : JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("application/json") ? await response.json() : await response.text();

      if (!response.ok) {
        const msg = data?.message || data?.error || errorText;
        alertMessage(msg, "error");
        form.dispatchEvent(new CustomEvent("form:error", { detail: data, bubbles: true }));
        return;
      }

      const msg = data?.message || successText;
      alertMessage(msg, "success");
      form.dispatchEvent(new CustomEvent("form:success", { detail: data, bubbles: true }));

    } catch (error) {
      alertMessage(errorText, "error");
      form.dispatchEvent(new CustomEvent("form:error", { detail: error, bubbles: true }));
    }
  });
})();

function alertMessage(msg, status) {
 let wrap = document.querySelector(".alert-wrap");
 if(!wrap) {
  wrap = document.createElement("div");
  wrap.className = "alert-wrap";
  document.body.appendChild(wrap);
 };

 const el = document.createElement("div");
 const innerEl = document.createElement("span");
 el.className = "alert";

 if(status == "info") {
  innerEl.className = "alert-info";
  el.classList.add("info");
}
 else if(status == "error") {
  innerEl.className = "alert-danger";
  el.classList.add("danger");
}
 else {
  innerEl.className = "alert-success";
  el.classList.add("success");
};

 innerEl.textContent = msg;

 el.appendChild(innerEl);
 wrap.appendChild(el);

 setTimeout(() => {
    el.style.opacity = 0;
    el.style.transition ="opacity .80s linear";
  }, 2500);
  setTimeout(() => wrap.remove(), 2500);
};