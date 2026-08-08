/* ============================================================
   MOLECULES.JS — Molecule Library Page Logic
   ============================================================ */

let allMolecules = [];
let allTargets = [];

async function loadMolecules() {
  try {
    [allMolecules, allTargets] = await Promise.all([
      api.get("/api/molecules"),
      api.get("/api/targets"),
    ]);
    populateTargetFilter();
    renderMolecules(allMolecules);
    updateMolStats(allMolecules);
  } catch (err) {
    showToast("Failed to load molecules: " + err.message, "error");
  }
}

function populateTargetFilter() {
  const sel = document.getElementById("filter-target");
  if (!sel) return;
  sel.innerHTML = `<option value="">All Targets</option>` +
    allTargets.map(t => `<option value="${t.id}">${t.name}</option>`).join("");
}

function renderMolecules(molecules) {
  const grid = document.getElementById("mol-grid");
  if (!grid) return;

  if (!molecules.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1">
        <div class="empty-state-icon">⚗️</div>
        <div class="empty-state-text">No molecules found</div>
      </div>`;
    return;
  }

  grid.innerHTML = molecules.map(mol => `
    <div class="glass-card tilt-card molecule-card animate-fade-scale" id="mol-${mol.id}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">
        <div class="mol-name">${mol.name}</div>
        <span class="badge-bbt ${getStatusBadgeClass(mol.status)}">${mol.status}</span>
      </div>
      ${mol.smiles ? `<div class="mol-smiles">${mol.smiles.substring(0, 60)}${mol.smiles.length > 60 ? "..." : ""}</div>` : ""}
      <div class="mol-props">
        <div class="mol-prop">
          <div class="mol-prop-label">MW</div>
          <div class="mol-prop-value">${mol.molecular_weight ? mol.molecular_weight.toFixed(1) : "—"}</div>
        </div>
        <div class="mol-prop">
          <div class="mol-prop-label">LogP</div>
          <div class="mol-prop-value">${mol.log_p !== null ? mol.log_p.toFixed(2) : "—"}</div>
        </div>
        <div class="mol-prop">
          <div class="mol-prop-label">HBD</div>
          <div class="mol-prop-value">${mol.hbd ?? "—"}</div>
        </div>
        <div class="mol-prop">
          <div class="mol-prop-label">HBA</div>
          <div class="mol-prop-value">${mol.hba ?? "—"}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:1rem">
        <span class="badge-bbt ${mol.lipinski_pass ? "badge-pass" : "badge-fail-lip"}">
          ${mol.lipinski_pass ? "✓ Lipinski Pass" : "✕ Lipinski Fail"}
        </span>
        ${mol.target_name ? `<span style="font-size:0.75rem;color:var(--text-muted)">→ ${mol.target_name}</span>` : ""}
      </div>
      <div style="display:flex;gap:8px;margin-top:1rem">
        <button class="btn-ghost-bbt" style="flex:1;justify-content:center" onclick="viewMolecule(${mol.id})">
          🔬 Details
        </button>
        <button class="btn-ghost-bbt" onclick="deleteMolecule(${mol.id})" style="color:var(--accent-pink);border-color:rgba(255,77,166,0.2)">
          🗑
        </button>
      </div>
    </div>
  `).join("");
}

function updateMolStats(molecules) {
  const total = molecules.length;
  const passCount = molecules.filter(m => m.lipinski_pass).length;
  const approved = molecules.filter(m => m.status === "Approved").length;
  const avgMW = total ? (molecules.reduce((a, m) => a + (m.molecular_weight || 0), 0) / total).toFixed(1) : 0;

  document.getElementById("mol-total") && (document.getElementById("mol-total").textContent = total);
  document.getElementById("mol-pass") && (document.getElementById("mol-pass").textContent = passCount);
  document.getElementById("mol-approved") && (document.getElementById("mol-approved").textContent = approved);
  document.getElementById("mol-avgmw") && (document.getElementById("mol-avgmw").textContent = avgMW);
}

// ---- Filters ----
function applyFilters() {
  const search = (document.getElementById("mol-search")?.value || "").toLowerCase();
  const status = document.getElementById("filter-status")?.value || "";
  const targetId = document.getElementById("filter-target")?.value || "";
  const lipinski = document.getElementById("filter-lipinski")?.value || "";

  let filtered = allMolecules.filter(m => {
    if (search && !m.name.toLowerCase().includes(search)) return false;
    if (status && m.status !== status) return false;
    if (targetId && String(m.target_id) !== targetId) return false;
    if (lipinski === "pass" && !m.lipinski_pass) return false;
    if (lipinski === "fail" && m.lipinski_pass) return false;
    return true;
  });

  renderMolecules(filtered);
}

// ---- View Molecule Detail ----
async function viewMolecule(id) {
  const modal = document.getElementById("mol-detail-modal");
  const body = document.getElementById("mol-detail-body");
  if (!modal || !body) return;

  body.innerHTML = `<div class="text-center py-4"><div class="spinner-bbt mx-auto"></div></div>`;
  const bsModal = new bootstrap.Modal(modal);
  bsModal.show();

  try {
    const mol = await api.get(`/api/molecules/${id}`);
    const lip = mol.lipinski || {};
    const score = mol.drug_score || 0;

    const scoreColor = score >= 80 ? "#00ff88" : score >= 50 ? "#ffd700" : "#ff4da6";

    body.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:1.5rem;flex-wrap:wrap;gap:10px">
        <div>
          <h4 style="color:var(--text-primary);font-weight:700;margin:0">${mol.name}</h4>
          <div style="color:var(--text-muted);font-size:0.85rem;margin-top:4px">${mol.target_name ? "Target: " + mol.target_name : "No target assigned"}</div>
        </div>
        <div style="text-align:center">
          <div style="font-family:var(--font-display);font-size:2.5rem;font-weight:700;color:${scoreColor};line-height:1">${score}</div>
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Drug Score</div>
        </div>
      </div>
      
      ${mol.smiles ? `
        <div class="glass-card-inner p-3 mb-3">
          <div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted);margin-bottom:6px">SMILES</div>
          <code style="font-family:var(--font-mono);font-size:0.8rem;color:var(--accent-cyan);word-break:break-all">${mol.smiles}</code>
        </div>
      ` : ""}

      <div class="grid-4 mb-3">
        ${[
          ["MW", mol.molecular_weight ? mol.molecular_weight.toFixed(2) + " Da" : "—"],
          ["LogP", mol.log_p !== null ? mol.log_p.toFixed(2) : "—"],
          ["HBD", mol.hbd ?? "—"],
          ["HBA", mol.hba ?? "—"],
          ["TPSA", mol.tpsa ? mol.tpsa.toFixed(1) + " Ų" : "—"],
          ["Status", mol.status],
        ].map(([label, val]) => `
          <div class="mol-prop" style="padding:10px">
            <div class="mol-prop-label">${label}</div>
            <div class="mol-prop-value">${val}</div>
          </div>
        `).join("")}
      </div>

      <div class="glass-card-inner p-3 mb-3">
        <div style="font-weight:700;font-size:0.85rem;margin-bottom:12px;color:var(--text-secondary)">⚖️ Lipinski Rule of Five</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span class="badge-bbt ${mol.lipinski_pass ? "badge-pass" : "badge-fail-lip"}">
            ${mol.lipinski_pass ? "✓ PASSES" : "✕ FAILS"}
          </span>
          <span style="font-size:0.85rem;color:var(--text-muted)">${lip.assessment || ""}</span>
        </div>
        ${lip.violations && lip.violations.length ? `
          <div style="font-size:0.8rem;color:#ff5050;margin-top:8px">
            Violations: ${lip.violations.join(", ")}
          </div>
        ` : `<div style="font-size:0.8rem;color:#00ff88">No violations found ✓</div>`}
      </div>
      <div style="font-size:0.75rem;color:var(--text-muted)">Added: ${formatDate(mol.created_at)}</div>
    `;
  } catch (err) {
    body.innerHTML = `<div class="alert-bbt alert-error">${err.message}</div>`;
  }
}

// ---- Add Molecule Modal ----
function openAddMolecule() {
  const modal = new bootstrap.Modal(document.getElementById("add-mol-modal"));
  modal.show();
}

async function submitMolecule() {
  const btn = document.getElementById("submit-mol-btn");
  const form = {
    name: document.getElementById("mol-name-input")?.value.trim(),
    smiles: document.getElementById("mol-smiles-input")?.value.trim(),
    molecular_weight: parseFloat(document.getElementById("mol-mw-input")?.value) || 0,
    log_p: parseFloat(document.getElementById("mol-logp-input")?.value) || 0,
    hbd: parseInt(document.getElementById("mol-hbd-input")?.value) || 0,
    hba: parseInt(document.getElementById("mol-hba-input")?.value) || 0,
    tpsa: parseFloat(document.getElementById("mol-tpsa-input")?.value) || 0,
    status: document.getElementById("mol-status-input")?.value || "Screening",
    target_id: parseInt(document.getElementById("mol-target-input")?.value) || null,
  };

  if (!form.name) { showToast("Molecule name is required", "warning"); return; }

  setLoading(btn, true);
  try {
    await api.post("/api/molecules", form);
    showToast(`${form.name} added to library!`, "success");
    bootstrap.Modal.getInstance(document.getElementById("add-mol-modal"))?.hide();
    document.getElementById("add-mol-modal")?.querySelectorAll("input,select").forEach(el => el.value = "");
    await loadMolecules();
  } catch (err) {
    showToast("Failed to add molecule: " + err.message, "error");
  } finally {
    setLoading(btn, false);
  }
}

async function deleteMolecule(id) {
  if (!confirm("Delete this molecule?")) return;
  try {
    await api.delete(`/api/molecules/${id}`);
    showToast("Molecule deleted", "info");
    await loadMolecules();
  } catch (err) {
    showToast("Delete failed: " + err.message, "error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  loadMolecules();
  document.getElementById("mol-search")?.addEventListener("input", applyFilters);
  document.getElementById("filter-status")?.addEventListener("change", applyFilters);
  document.getElementById("filter-target")?.addEventListener("change", applyFilters);
  document.getElementById("filter-lipinski")?.addEventListener("change", applyFilters);
});

window.viewMolecule = viewMolecule;
window.deleteMolecule = deleteMolecule;
window.openAddMolecule = openAddMolecule;
window.submitMolecule = submitMolecule;
