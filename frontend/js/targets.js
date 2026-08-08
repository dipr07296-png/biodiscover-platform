/* ============================================================
   TARGETS.JS — Drug Target Explorer Page Logic
   ============================================================ */

let allTargets = [];
let affinityChart = null;

async function loadTargets() {
  try {
    allTargets = await api.get("/api/targets");
    renderTargets(allTargets);
    renderAffinityChart(allTargets);
    updateTargetStats(allTargets);
  } catch (err) {
    showToast("Failed to load targets: " + err.message, "error");
  }
}

function renderTargets(targets) {
  const grid = document.getElementById("targets-grid");
  if (!grid) return;

  if (!targets.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">🎯</div>
        <div class="empty-state-text">No drug targets found</div>
      </div>`;
    return;
  }

  grid.innerHTML = targets.map(t => {
    const affPct = Math.min(100, (t.affinity_score / 10) * 100);
    const affColor = t.affinity_score >= 8 ? "#00ff88" : t.affinity_score >= 6 ? "#ffd700" : "#ff4da6";

    return `
      <div class="glass-card tilt-card target-card animate-fade-scale">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1rem">
          <div>
            <div style="font-weight:700;font-size:1rem;color:var(--text-primary);margin-bottom:4px">${t.name}</div>
            <div style="font-size:0.8rem;color:var(--accent-purple)">${t.protein_family || "Unknown family"}</div>
          </div>
          <span class="badge-bbt ${t.status === "Active" ? "badge-approved" : "badge-screening"}">
            ${t.status}
          </span>
        </div>
        
        <div class="grid-2 mb-3" style="gap:8px">
          <div class="mol-prop">
            <div class="mol-prop-label">Organism</div>
            <div class="mol-prop-value" style="color:var(--text-secondary);font-family:var(--font-primary);font-size:0.8rem">${t.organism || "Human"}</div>
          </div>
          <div class="mol-prop">
            <div class="mol-prop-label">Molecules</div>
            <div class="mol-prop-value">${t.molecule_count}</div>
          </div>
        </div>

        <div style="margin-bottom:1rem">
          <div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px">
            <span style="color:var(--text-muted)">Binding Affinity</span>
            <span style="color:${affColor};font-weight:700">${t.affinity_score} pKd</span>
          </div>
          <div class="affinity-bar">
            <div class="affinity-fill" style="width:${affPct}%;background:linear-gradient(90deg,${affColor},${affColor}88)"></div>
          </div>
        </div>

        ${t.binding_site ? `
          <div class="glass-card-inner p-2 mb-3" style="font-size:0.78rem;color:var(--text-secondary)">
            <span style="color:var(--text-muted);font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px">Binding Site:</span>
            <span style="margin-left:6px">${t.binding_site}</span>
          </div>
        ` : ""}

        <div style="display:flex;gap:8px">
          <button class="btn-ghost-bbt" style="flex:1;justify-content:center" onclick="viewTarget(${t.id})">
            🔍 Explore
          </button>
          <button class="btn-ghost-bbt" onclick="deleteTarget(${t.id})" style="color:var(--accent-pink);border-color:rgba(255,77,166,0.2)">
            🗑
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function updateTargetStats(targets) {
  const total = targets.length;
  const active = targets.filter(t => t.status === "Active").length;
  const avgAff = total ? (targets.reduce((a, t) => a + t.affinity_score, 0) / total).toFixed(2) : 0;
  const families = new Set(targets.map(t => t.protein_family)).size;

  document.getElementById("tgt-total") && (document.getElementById("tgt-total").textContent = total);
  document.getElementById("tgt-active") && (document.getElementById("tgt-active").textContent = active);
  document.getElementById("tgt-avgaff") && (document.getElementById("tgt-avgaff").textContent = avgAff);
  document.getElementById("tgt-families") && (document.getElementById("tgt-families").textContent = families);
}

function renderAffinityChart(targets) {
  const ctx = document.getElementById("affinityChart");
  if (!ctx || !targets.length) return;
  if (affinityChart) affinityChart.destroy();

  const COLORS = ["#00d4ff", "#7c4dff", "#00ff88", "#ff4da6", "#ff8c42", "#ffd700"];

  const sorted = [...targets].sort((a, b) => b.affinity_score - a.affinity_score);

  affinityChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: sorted.map(t => t.name),
      datasets: [{
        label: "Binding Affinity (pKd)",
        data: sorted.map(t => t.affinity_score),
        backgroundColor: sorted.map((_, i) => COLORS[i % COLORS.length] + "44"),
        borderColor: sorted.map((_, i) => COLORS[i % COLORS.length]),
        borderWidth: 2,
        borderRadius: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(5,8,24,0.95)",
          borderColor: "#00d4ff",
          borderWidth: 1,
        },
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { font: { size: 10 }, maxRotation: 30 },
        },
        y: {
          grid: { color: "rgba(255,255,255,0.05)" },
          min: 0, max: 10,
          title: { display: true, text: "pKd Score", color: "#8899bb" },
        },
      },
    },
  });
}

// ---- View Target Detail ----
async function viewTarget(id) {
  const modal = document.getElementById("target-detail-modal");
  const body = document.getElementById("target-detail-body");
  if (!modal || !body) return;

  body.innerHTML = `<div class="text-center py-4"><div class="spinner-bbt mx-auto"></div></div>`;
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  try {
    const target = await api.get(`/api/targets/${id}`);
    const affPct = Math.min(100, (target.affinity_score / 10) * 100);
    const affColor = target.affinity_score >= 8 ? "#00ff88" : target.affinity_score >= 6 ? "#ffd700" : "#ff4da6";

    body.innerHTML = `
      <div style="margin-bottom:1.5rem">
        <h4 style="font-weight:700;color:var(--text-primary);margin-bottom:4px">${target.name}</h4>
        <div style="color:var(--accent-purple);font-size:0.9rem">${target.protein_family}</div>
      </div>
      
      <div class="grid-3 mb-3">
        <div class="mol-prop p-3">
          <div class="mol-prop-label">Organism</div>
          <div class="mol-prop-value" style="color:var(--text-secondary);font-family:var(--font-primary)">${target.organism}</div>
        </div>
        <div class="mol-prop p-3">
          <div class="mol-prop-label">Status</div>
          <div class="mol-prop-value" style="color:${target.status === "Active" ? "#00ff88" : "#ffd700"}">${target.status}</div>
        </div>
        <div class="mol-prop p-3">
          <div class="mol-prop-label">Molecules</div>
          <div class="mol-prop-value">${target.molecule_count}</div>
        </div>
      </div>

      <div class="glass-card-inner p-3 mb-3">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <span style="font-size:0.85rem;color:var(--text-secondary);font-weight:600">Binding Affinity</span>
          <span style="font-family:var(--font-display);font-size:1.5rem;font-weight:700;color:${affColor}">${target.affinity_score} pKd</span>
        </div>
        <div class="affinity-bar" style="height:8px">
          <div class="affinity-fill" style="width:${affPct}%;background:linear-gradient(90deg,${affColor},${affColor}88)"></div>
        </div>
      </div>

      ${target.binding_site ? `
        <div class="glass-card-inner p-3 mb-3">
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:6px">Binding Site</div>
          <div style="color:var(--text-secondary);font-size:0.9rem">${target.binding_site}</div>
        </div>
      ` : ""}

      ${target.molecules && target.molecules.length ? `
        <div>
          <div style="font-size:0.85rem;font-weight:700;color:var(--text-secondary);margin-bottom:10px;text-transform:uppercase;letter-spacing:1px">
            Associated Molecules (${target.molecules.length})
          </div>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${target.molecules.map(m => `
              <div class="glass-card-inner" style="padding:10px 14px;display:flex;justify-content:space-between;align-items:center">
                <span style="color:var(--text-primary);font-size:0.9rem">${m.name}</span>
                <span class="badge-bbt ${getStatusBadgeClass(m.status)}">${m.status}</span>
              </div>
            `).join("")}
          </div>
        </div>
      ` : ""}
    `;
  } catch (err) {
    body.innerHTML = `<div class="alert-bbt alert-error">${err.message}</div>`;
  }
}

// ---- Add Target ----
function openAddTarget() {
  const modal = new bootstrap.Modal(document.getElementById("add-target-modal"));
  modal.show();
}

async function submitTarget() {
  const btn = document.getElementById("submit-target-btn");
  const form = {
    name: document.getElementById("tgt-name-input")?.value.trim(),
    protein_family: document.getElementById("tgt-family-input")?.value.trim(),
    organism: document.getElementById("tgt-organism-input")?.value || "Human",
    binding_site: document.getElementById("tgt-bindsite-input")?.value.trim(),
    affinity_score: parseFloat(document.getElementById("tgt-affinity-input")?.value) || 0,
    status: document.getElementById("tgt-status-input")?.value || "Active",
  };

  if (!form.name) { showToast("Target name is required", "warning"); return; }

  setLoading(btn, true);
  try {
    await api.post("/api/targets", form);
    showToast(`${form.name} added!`, "success");
    bootstrap.Modal.getInstance(document.getElementById("add-target-modal"))?.hide();
    document.getElementById("add-target-modal")?.querySelectorAll("input,select").forEach(el => el.value = "");
    await loadTargets();
  } catch (err) {
    showToast("Failed to add target: " + err.message, "error");
  } finally {
    setLoading(btn, false);
  }
}

async function deleteTarget(id) {
  if (!confirm("Delete this target?")) return;
  try {
    await api.delete(`/api/targets/${id}`);
    showToast("Target deleted", "info");
    await loadTargets();
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
}

// ---- Search / Filter ----
function filterTargets() {
  const search = (document.getElementById("tgt-search")?.value || "").toLowerCase();
  const family = document.getElementById("tgt-family-filter")?.value || "";

  const filtered = allTargets.filter(t => {
    if (search && !t.name.toLowerCase().includes(search)) return false;
    if (family && t.protein_family !== family) return false;
    return true;
  });

  renderTargets(filtered);
}

document.addEventListener("DOMContentLoaded", () => {
  loadTargets();
  document.getElementById("tgt-search")?.addEventListener("input", filterTargets);
  document.getElementById("tgt-family-filter")?.addEventListener("change", filterTargets);
});

window.viewTarget = viewTarget;
window.deleteTarget = deleteTarget;
window.openAddTarget = openAddTarget;
window.submitTarget = submitTarget;
