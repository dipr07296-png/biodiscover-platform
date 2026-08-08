/* ============================================================
   SEQUENCE.JS — Sequence Analysis Page Logic
   ============================================================ */

let gcChart = null;
let compositionChart = null;
let ssChart = null;

Chart.defaults.color = "#8899bb";

// ---- Sample sequences ----
const SAMPLE_SEQUENCES = {
  dna: "ATGGCTTCTTGGCAGATCTTGAGAGCCCAAGCAGCAGCAGCAGCAGCGGCAGGAGGATCATCATCATCATCGCCATGGAGCTGGAGAACATGAAGATCAGCATCAACATCAAGCAGTTCTACAACATTCAGAAGCCCCACAACCTGGACCTCAAGGAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGCAGTAA",
  protein: "MAEGEITTFTALTEKFNLPPGNYKKPKLLYCSNGGHFLRILPDGTVDGTRDRSDQHIQLQLSAESVGEVYIKSTETGQYLAMDTDGLLYGSQTPNEECLFLERLEENHYNTYISKKHAEKNWFVGLKKNGSCKRGPRTHYGQKAILFLPLPV",
  rna: "AUGGCUUCUUGGCAGAUCUUGAGAGCCCAAGCAGCAGCAGCAGCAGCGGCAGGAGGAUCAUCAUCAUCAUCGCCAUGGAGCUGGAGAACAUGAAGAUCAGCAUCAACAUCAAGCAGUUCUACAACAUUCAGAAGCCCCACAACCUGGACCUCAAGGAG",
};

function insertSample(type) {
  const input = document.getElementById("seq-input");
  const nameInput = document.getElementById("seq-name");
  if (input) input.value = SAMPLE_SEQUENCES[type] || "";
  if (nameInput) nameInput.value = `Sample ${type.toUpperCase()} Sequence`;
  showToast(`Loaded sample ${type.toUpperCase()} sequence`, "info");
}

function clearForm() {
  document.getElementById("seq-input").value = "";
  document.getElementById("seq-name").value = "";
  document.getElementById("results-section").style.display = "none";
}

// ---- Main Analyze ----
async function analyzeSequence() {
  const seqInput = document.getElementById("seq-input");
  const nameInput = document.getElementById("seq-name");
  const analyzeBtn = document.getElementById("analyze-btn");

  const sequence = seqInput.value.trim();
  const name = nameInput.value.trim() || "Unnamed Sequence";

  if (!sequence) {
    showToast("Please enter a sequence", "warning");
    return;
  }

  setLoading(analyzeBtn, true);
  document.getElementById("results-section").style.display = "none";

  try {
    const data = await api.post("/api/sequences/analyze", { sequence, name });
    renderResults(data);
    showToast("Analysis complete!", "success");
  } catch (err) {
    showToast("Analysis failed: " + err.message, "error");
  } finally {
    setLoading(analyzeBtn, false);
  }
}

function renderResults(data) {
  const section = document.getElementById("results-section");
  section.style.display = "block";
  section.classList.add("animate-slide-up");

  // Sequence Type badge
  const typeEl = document.getElementById("seq-type-badge");
  if (typeEl) {
    const colors = { DNA: "#00ff88", RNA: "#00d4ff", Protein: "#7c4dff" };
    const type = data.sequence_type || "Unknown";
    typeEl.style.cssText = `
      display:inline-flex;align-items:center;gap:6px;padding:6px 16px;
      border-radius:20px;background:${(colors[type] || "#8899bb") + "22"};
      color:${colors[type] || "#8899bb"};border:1px solid ${(colors[type] || "#8899bb") + "44"};
      font-weight:700;font-size:0.85rem;text-transform:uppercase;letter-spacing:1px;
    `;
    typeEl.textContent = `🧬 ${type} Sequence`;
  }

  if (data.sequence_type === "DNA" || data.sequence_type === "RNA") {
    renderDNAResults(data);
  } else {
    renderProteinResults(data);
  }

  scrollToResults();
}

function renderDNAResults(data) {
  // Basic metrics
  setMetric("res-length", data.length ? `${data.length.toLocaleString()} bp` : "—");
  setMetric("res-gc", data.gc_content ? `${data.gc_content}%` : "—");
  setMetric("res-atgc", data.at_gc_ratio ? data.at_gc_ratio : "—");
  setMetric("res-tm", data.melting_temperature ? `${data.melting_temperature}°C` : "—");
  setMetric("res-orfs", data.orfs_found !== undefined ? data.orfs_found : "—");

  // Sequences
  setCode("res-complement", data.complement);
  setCode("res-revcomp", data.reverse_complement);
  setCode("res-mrna", data.mrna);
  setCode("res-protein", data.protein_translation);

  // GC Content Gauge
  renderGCGauge(data.gc_content || 0);

  // Nucleotide composition bar chart
  if (data.composition) renderCompositionChart(data.composition);

  // Codon usage
  if (data.codon_usage) renderCodonUsage(data.codon_usage);

  // ORFs table
  if (data.orfs) renderORFTable(data.orfs);

  // Show DNA section, hide protein section
  toggleSection("dna-section", true);
  toggleSection("protein-section", false);
}

function renderProteinResults(data) {
  setMetric("res-length", data.length ? `${data.length} aa` : "—");
  setMetric("res-mw", data.molecular_weight ? `${data.molecular_weight.toLocaleString()} Da` : "—");
  setMetric("res-pi", data.isoelectric_point ? data.isoelectric_point : "—");
  setMetric("res-instab", data.instability_index !== undefined
    ? `${data.instability_index} (${data.stability})`
    : "—");
  setMetric("res-gravy", data.gravy !== undefined ? data.gravy : "—");
  setMetric("res-charge", data.charge_at_ph7 !== undefined ? data.charge_at_ph7 : "—");

  // Secondary structure
  if (data.secondary_structure) renderSSChart(data.secondary_structure);

  // Amino acid composition
  if (data.amino_acid_composition) renderAAComp(data.amino_acid_composition);

  toggleSection("dna-section", false);
  toggleSection("protein-section", true);
}

// ---- Pairwise Alignment ----
async function runAlignment() {
  const seq1 = document.getElementById("align-seq1").value.trim();
  const seq2 = document.getElementById("align-seq2").value.trim();
  const btn = document.getElementById("align-btn");

  if (!seq1 || !seq2) {
    showToast("Please enter both sequences", "warning");
    return;
  }

  setLoading(btn, true);
  try {
    const data = await api.post("/api/sequences/align", { seq1, seq2 });
    renderAlignResult(data);
    showToast("Alignment complete!", "success");
  } catch (err) {
    showToast("Alignment failed: " + err.message, "error");
  } finally {
    setLoading(btn, false);
  }
}

function renderAlignResult(data) {
  const section = document.getElementById("align-result");
  if (!section) return;
  section.style.display = "block";

  const identityColor = data.identity_percent > 80 ? "#00ff88"
    : data.identity_percent > 50 ? "#ffd700" : "#ff4da6";

  section.innerHTML = `
    <div class="glass-card glass-card-inner p-4 animate-fade-scale">
      <h6 class="text-uppercase text-muted mb-3" style="letter-spacing:2px;font-size:0.75rem">Alignment Results</h6>
      <div class="grid-3 mb-3">
        <div class="mol-prop">
          <div class="mol-prop-label">Identity</div>
          <div class="mol-prop-value" style="color:${identityColor};font-size:1.2rem">${data.identity_percent}%</div>
        </div>
        <div class="mol-prop">
          <div class="mol-prop-label">Score</div>
          <div class="mol-prop-value">${data.score}</div>
        </div>
        <div class="mol-prop">
          <div class="mol-prop-label">Align Length</div>
          <div class="mol-prop-value">${data.alignment_length}</div>
        </div>
      </div>
      <div class="mb-2" style="font-size:0.75rem;text-transform:uppercase;letter-spacing:1px;color:var(--text-muted)">Alignment</div>
      <pre style="font-family:var(--font-mono);font-size:0.75rem;color:var(--accent-cyan);background:rgba(0,0,0,0.3);border-radius:8px;padding:1rem;overflow-x:auto;line-height:1.6;white-space:pre-wrap;word-break:break-all">${escapeHtml(data.formatted || data.aligned_seq1 + "\n" + data.aligned_seq2)}</pre>
    </div>
  `;
}

// ---- History ----
async function loadHistory() {
  try {
    const records = await api.get("/api/sequences");
    const tbody = document.getElementById("history-tbody");
    if (!tbody) return;

    if (!records.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4" style="color:var(--text-muted)">No sequences analyzed yet</td></tr>`;
      return;
    }

    tbody.innerHTML = records.slice(0, 20).map(r => `
      <tr>
        <td><code style="color:var(--accent-cyan);font-size:0.8rem">#${r.id}</code></td>
        <td>${r.name}</td>
        <td><span class="badge-bbt" style="background:${seqTypeBg(r.sequence_type)};color:${seqTypeColor(r.sequence_type)}">${r.sequence_type}</span></td>
        <td class="text-mono">${r.length?.toLocaleString() || "—"}</td>
        <td class="text-mono">${r.gc_content || "—"}%</td>
        <td style="color:var(--text-muted);font-size:0.8rem">${formatDate(r.created_at)}</td>
      </tr>
    `).join("");
  } catch (err) {
    console.error("History load error:", err);
  }
}

// ---- Chart Helpers ----
function renderGCGauge(gc) {
  const ctx = document.getElementById("gcChart");
  if (!ctx) return;
  if (gcChart) { gcChart.destroy(); }

  const gcColor = gc < 40 ? "#ff4da6" : gc > 65 ? "#ff8c42" : "#00ff88";

  gcChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["GC Content", "AT Content"],
      datasets: [{
        data: [gc, 100 - gc],
        backgroundColor: [gcColor + "44", "rgba(255,255,255,0.05)"],
        borderColor: [gcColor, "transparent"],
        borderWidth: 3,
      }],
    },
    options: {
      responsive: true,
      cutout: "75%",
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.toFixed(1)}%` } },
      },
    },
    plugins: [{
      id: "centerText",
      afterDraw(chart) {
        const { ctx, chartArea: { left, right, top, bottom } } = chart;
        const cx = (left + right) / 2;
        const cy = (top + bottom) / 2;
        ctx.save();
        ctx.fillStyle = gcColor;
        ctx.font = "bold 28px Orbitron, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(gc.toFixed(1) + "%", cx, cy - 6);
        ctx.fillStyle = "#8899bb";
        ctx.font = "11px Inter, sans-serif";
        ctx.fillText("GC Content", cx, cy + 18);
        ctx.restore();
      },
    }],
  });
}

function renderCompositionChart(comp) {
  const ctx = document.getElementById("compositionChart");
  if (!ctx) return;
  if (compositionChart) compositionChart.destroy();

  const labels = Object.keys(comp).filter(k => k !== "N");
  const values = labels.map(k => comp[k]);
  const colors = ["#00d4ff", "#ff4da6", "#00ff88", "#7c4dff"];

  compositionChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors.map(c => c + "44"),
        borderColor: colors,
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: "rgba(255,255,255,0.05)" } },
        y: { grid: { color: "rgba(255,255,255,0.05)" }, beginAtZero: true },
      },
    },
  });
}

function renderSSChart(ss) {
  const ctx = document.getElementById("ssChart");
  if (!ctx) return;
  if (ssChart) ssChart.destroy();

  ssChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: ["α-Helix", "β-Turn", "β-Sheet"],
      datasets: [{
        data: [ss.helix, ss.turn, ss.sheet],
        backgroundColor: ["#00d4ff44", "#7c4dff44", "#00ff8844"],
        borderColor: ["#00d4ff", "#7c4dff", "#00ff88"],
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      cutout: "60%",
      plugins: { legend: { position: "bottom" } },
    },
  });
}

function renderCodonUsage(codons) {
  const el = document.getElementById("codon-display");
  if (!el) return;
  el.innerHTML = Object.entries(codons).map(([codon, count]) => `
    <div class="codon-item">${codon}<span>${count}</span></div>
  `).join("");
}

function renderORFTable(orfs) {
  const tbody = document.getElementById("orf-tbody");
  if (!tbody) return;

  if (!orfs.length) {
    tbody.innerHTML = `<tr><td colspan="3" style="color:var(--text-muted);padding:12px">No ORFs detected</td></tr>`;
    return;
  }

  tbody.innerHTML = orfs.map(orf => `
    <tr>
      <td>${orf.start}</td>
      <td>${orf.end}</td>
      <td>${orf.length} bp</td>
    </tr>
  `).join("");
}

function renderAAComp(aaComp) {
  const el = document.getElementById("aa-comp-display");
  if (!el) return;
  const sorted = Object.entries(aaComp).sort((a, b) => b[1] - a[1]).slice(0, 20);
  el.innerHTML = sorted.map(([aa, pct]) => `
    <div style="margin-bottom:6px">
      <div style="display:flex;justify-content:space-between;font-size:0.8rem;margin-bottom:3px">
        <span style="font-family:var(--font-mono);color:var(--accent-purple)">${aa}</span>
        <span style="color:var(--text-muted)">${pct.toFixed(1)}%</span>
      </div>
      <div style="height:4px;background:rgba(255,255,255,0.05);border-radius:2px">
        <div style="width:${pct}%;max-width:100%;height:100%;background:linear-gradient(90deg,#7c4dff,#00d4ff);border-radius:2px;transition:width 1s ease"></div>
      </div>
    </div>
  `).join("");
}

// ---- Utilities ----
function setMetric(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? "—";
}

function setCode(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val ?? "—";
}

function toggleSection(id, show) {
  const el = document.getElementById(id);
  if (el) el.style.display = show ? "block" : "none";
}

function scrollToResults() {
  const el = document.getElementById("results-section");
  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}

function seqTypeColor(t) {
  return { DNA: "#00ff88", RNA: "#00d4ff", Protein: "#7c4dff" }[t] || "#8899bb";
}

function seqTypeBg(t) {
  return { DNA: "#00ff8822", RNA: "#00d4ff22", Protein: "#7c4dff22" }[t] || "#8899bb22";
}

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ---- Init ----
document.addEventListener("DOMContentLoaded", () => {
  loadHistory();

  // Keyboard shortcut: Ctrl+Enter to analyze
  document.getElementById("seq-input")?.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "Enter") analyzeSequence();
  });
});

window.insertSample = insertSample;
window.clearForm = clearForm;
window.analyzeSequence = analyzeSequence;
window.runAlignment = runAlignment;
