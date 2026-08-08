/* ============================================================
   DASHBOARD.JS — Chart.js Dashboard Charts
   ============================================================ */

Chart.defaults.color = "#8899bb";
Chart.defaults.font.family = "'Inter', sans-serif";
Chart.defaults.plugins.legend.labels.boxWidth = 12;
Chart.defaults.plugins.legend.labels.padding = 16;

const COLORS = {
  cyan: "#00d4ff",
  purple: "#7c4dff",
  green: "#00ff88",
  pink: "#ff4da6",
  orange: "#ff8c42",
  yellow: "#ffd700",
  grid: "rgba(255,255,255,0.05)",
};

const chartInstances = {};

function destroyChart(id) {
  if (chartInstances[id]) {
    chartInstances[id].destroy();
    delete chartInstances[id];
  }
}

// ---- Status Distribution (Doughnut) ----
function renderStatusChart(statusData) {
  destroyChart("statusChart");
  const ctx = document.getElementById("statusChart");
  if (!ctx) return;

  const labels = Object.keys(statusData);
  const values = Object.values(statusData);
  const palette = [COLORS.green, COLORS.cyan, COLORS.yellow, COLORS.orange, COLORS.purple, COLORS.pink];

  chartInstances.statusChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [{
        data: values,
        backgroundColor: palette.slice(0, labels.length).map(c => c + "33"),
        borderColor: palette.slice(0, labels.length),
        borderWidth: 2,
        hoverOffset: 8,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          backgroundColor: "rgba(5,8,24,0.95)",
          borderColor: COLORS.cyan,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.label}: ${ctx.parsed} molecules`,
          },
        },
      },
      cutout: "65%",
    },
  });
}

// ---- Target Family (Horizontal Bar) ----
function renderTargetFamilyChart(familyData) {
  destroyChart("targetFamilyChart");
  const ctx = document.getElementById("targetFamilyChart");
  if (!ctx) return;

  const labels = Object.keys(familyData);
  const values = Object.values(familyData);

  chartInstances.targetFamilyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Targets",
        data: values,
        backgroundColor: labels.map((_, i) =>
          [COLORS.cyan, COLORS.purple, COLORS.green, COLORS.pink, COLORS.orange][i % 5] + "33"
        ),
        borderColor: labels.map((_, i) =>
          [COLORS.cyan, COLORS.purple, COLORS.green, COLORS.pink, COLORS.orange][i % 5]
        ),
        borderWidth: 2,
        borderRadius: 6,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: {
          grid: { color: COLORS.grid },
          ticks: { stepSize: 1 },
        },
        y: { grid: { color: COLORS.grid } },
      },
    },
  });
}

// ---- Pipeline (Line) ----
function renderPipelineChart(pipelineData) {
  destroyChart("pipelineChart");
  const ctx = document.getElementById("pipelineChart");
  if (!ctx) return;

  const labels = Object.keys(pipelineData);
  const values = Object.values(pipelineData);

  chartInstances.pipelineChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Compounds",
        data: values,
        borderColor: COLORS.cyan,
        backgroundColor: "rgba(0,212,255,0.1)",
        borderWidth: 2.5,
        pointBackgroundColor: COLORS.cyan,
        pointRadius: 5,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.4,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: COLORS.grid } },
        y: {
          grid: { color: COLORS.grid },
          ticks: { stepSize: 1 },
          beginAtZero: true,
        },
      },
    },
  });
}

// ---- Lipinski Radar ----
function renderLipinskiRadar(data) {
  destroyChart("lipinskiChart");
  const ctx = document.getElementById("lipinskiChart");
  if (!ctx) return;

  // Mock distribution data for demo
  const ideal = [100, 100, 100, 100, 100];
  const actual = data;

  chartInstances.lipinskiChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels: ["MW ≤ 500", "LogP ≤ 5", "HBD ≤ 5", "HBA ≤ 10", "TPSA ≤ 140"],
      datasets: [
        {
          label: "Ideal",
          data: ideal,
          borderColor: COLORS.green + "88",
          backgroundColor: COLORS.green + "11",
          borderWidth: 1.5,
          pointBackgroundColor: COLORS.green,
          pointRadius: 3,
        },
        {
          label: "Library Average",
          data: actual,
          borderColor: COLORS.cyan,
          backgroundColor: COLORS.cyan + "22",
          borderWidth: 2,
          pointBackgroundColor: COLORS.cyan,
          pointRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        r: {
          min: 0, max: 100,
          grid: { color: COLORS.grid },
          angleLines: { color: COLORS.grid },
          ticks: {
            backdropColor: "transparent",
            color: "#445577",
            stepSize: 25,
          },
          pointLabels: { color: "#8899bb", font: { size: 11 } },
        },
      },
      plugins: {
        legend: { position: "bottom" },
      },
    },
  });
}

// ---- Affinity Scatter ----
function renderAffinityScatter(targetsData) {
  destroyChart("affinityChart");
  const ctx = document.getElementById("affinityChart");
  if (!ctx) return;

  if (!targetsData || !targetsData.length) return;

  const families = [...new Set(targetsData.map(t => t.protein_family))];
  const familyColors = [COLORS.cyan, COLORS.purple, COLORS.green, COLORS.pink, COLORS.orange, COLORS.yellow];

  const datasets = families.map((fam, fi) => ({
    label: fam,
    data: targetsData
      .filter(t => t.protein_family === fam)
      .map((t, i) => ({ x: i + 1 + fi * 0.2, y: t.affinity_score, label: t.name })),
    backgroundColor: familyColors[fi % familyColors.length] + "88",
    borderColor: familyColors[fi % familyColors.length],
    borderWidth: 2,
    pointRadius: 8,
    pointHoverRadius: 12,
  }));

  chartInstances.affinityChart = new Chart(ctx, {
    type: "scatter",
    data: { datasets },
    options: {
      responsive: true,
      plugins: {
        legend: { position: "bottom" },
        tooltip: {
          backgroundColor: "rgba(5,8,24,0.95)",
          borderColor: COLORS.purple,
          borderWidth: 1,
          callbacks: {
            label: (ctx) => ` ${ctx.raw.label}: ${ctx.raw.y}`,
          },
        },
      },
      scales: {
        x: { display: false },
        y: {
          grid: { color: COLORS.grid },
          min: 0, max: 10,
          title: { display: true, text: "Binding Affinity (pKd)", color: "#8899bb" },
        },
      },
    },
  });
}

// ---- Main init ----
async function initDashboard() {
  try {
    const [stats, targets] = await Promise.all([
      api.get("/api/dashboard/stats"),
      api.get("/api/targets"),
    ]);

    // Update stat widgets
    animateCounter(document.getElementById("sw-molecules"), stats.totals.molecules);
    animateCounter(document.getElementById("sw-targets"), stats.totals.targets);
    animateCounter(document.getElementById("sw-sequences"), stats.totals.sequences);
    animateCounter(document.getElementById("sw-approved"), stats.totals.approved);
    animateCounter(document.getElementById("sw-pass"), stats.totals.lipinski_pass);
    animateCounter(document.getElementById("sw-rate"), stats.success_rate, 800, "%");
    animateCounter(document.getElementById("sw-affinity"), stats.avg_affinity_score * 10, 1000);

    // Pipeline items
    Object.entries(stats.pipeline).forEach(([stage, count]) => {
      const el = document.querySelector(`[data-stage="${stage}"]`);
      if (el) { el.textContent = count; }
    });

    // Render charts
    renderStatusChart(stats.status_distribution);
    renderTargetFamilyChart(stats.target_families);
    renderPipelineChart(stats.pipeline);

    // Lipinski radar — mock compliance percentages from real data
    const lipinskiData = [
      Math.min(100, (stats.totals.lipinski_pass / (stats.totals.molecules || 1)) * 100 + 10),
      85, 92, 88, 78
    ];
    renderLipinskiRadar(lipinskiData);

    // Affinity scatter
    renderAffinityScatter(targets);

    // Recent activity
    loadRecentActivity();

  } catch (err) {
    showToast("Failed to load dashboard data: " + err.message, "error");
  }
}

async function loadRecentActivity() {
  try {
    const [molecules, sequences] = await Promise.all([
      api.get("/api/molecules"),
      api.get("/api/sequences"),
    ]);

    const feed = document.getElementById("activity-feed");
    if (!feed) return;

    const activities = [
      ...molecules.slice(0, 4).map(m => ({
        icon: "⚗️", type: "molecule",
        text: `<strong>${m.name}</strong> added to library`,
        sub: `Status: ${m.status} • ${formatDate(m.created_at)}`,
        color: "cyan",
      })),
      ...sequences.slice(0, 3).map(s => ({
        icon: "🧬", type: "sequence",
        text: `Sequence <strong>${s.name}</strong> analyzed`,
        sub: `${s.sequence_type} • ${s.length} bp • GC: ${s.gc_content}%`,
        color: "green",
      })),
    ].sort(() => Math.random() - 0.5).slice(0, 6);

    feed.innerHTML = activities.map(a => `
      <div style="display:flex;gap:12px;align-items:flex-start;padding:12px 0;border-bottom:1px solid rgba(255,255,255,0.05)">
        <div style="font-size:1.5rem;flex-shrink:0">${a.icon}</div>
        <div>
          <div style="font-size:0.9rem;color:var(--text-primary)">${a.text}</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">${a.sub}</div>
        </div>
      </div>
    `).join("");

  } catch (err) {
    console.error("Activity feed error:", err);
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);
