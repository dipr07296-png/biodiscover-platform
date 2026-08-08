/* ============================================================
   API.JS — Fetch wrapper for Flask backend
   ============================================================ */

// Auto-detect backend: use relative URL (works on Netlify proxy & Render full-stack)
const API_BASE = "";

const api = {
  async get(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`GET ${endpoint} failed:`, err);
      throw err;
    }
  },

  async post(endpoint, body) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) {
      console.error(`POST ${endpoint} failed:`, err);
      throw err;
    }
  },

  async put(endpoint, body) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`PUT ${endpoint} failed:`, err);
      throw err;
    }
  },

  async delete(endpoint) {
    try {
      const res = await fetch(`${API_BASE}${endpoint}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.error(`DELETE ${endpoint} failed:`, err);
      throw err;
    }
  },
};

// ---- UI Helpers ----

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container") || createToastContainer();
  const toast = document.createElement("div");
  const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
  toast.className = `alert-bbt alert-${type} animate-slide-right`;
  toast.style.cssText = `
    position: relative; min-width: 300px; max-width: 480px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.4); cursor: pointer;
    margin-bottom: 10px;
  `;
  toast.innerHTML = `
    <span style="font-size:1.1rem;flex-shrink:0">${icons[type] || "ℹ"}</span>
    <span>${message}</span>
  `;
  toast.onclick = () => toast.remove();
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}

function createToastContainer() {
  const el = document.createElement("div");
  el.id = "toast-container";
  el.style.cssText = `
    position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
    display: flex; flex-direction: column; align-items: flex-end;
  `;
  document.body.appendChild(el);
  return el;
}

function setLoading(buttonEl, loading) {
  if (loading) {
    buttonEl.dataset.originalText = buttonEl.innerHTML;
    buttonEl.innerHTML = `<span class="spinner-border spinner-border-sm me-2" role="status"></span>Analyzing...`;
    buttonEl.disabled = true;
  } else {
    buttonEl.innerHTML = buttonEl.dataset.originalText;
    buttonEl.disabled = false;
  }
}

function animateCounter(el, target, duration = 1500, suffix = "") {
  const start = 0;
  const step = target / (duration / 16);
  let current = start;
  const timer = setInterval(() => {
    current += step;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    el.textContent = Math.round(current).toLocaleString() + suffix;
  }, 16);
}

function getStatusBadgeClass(status) {
  const map = {
    "Approved": "badge-approved",
    "Screening": "badge-screening",
    "Clinical Trial": "badge-clinical",
    "Preclinical": "badge-preclinical",
    "Lead": "badge-lead",
    "Hit": "badge-hit",
  };
  return map[status] || "badge-screening";
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric"
  });
}

window.api = api;
window.showToast = showToast;
window.setLoading = setLoading;
window.animateCounter = animateCounter;
window.getStatusBadgeClass = getStatusBadgeClass;
window.formatDate = formatDate;
