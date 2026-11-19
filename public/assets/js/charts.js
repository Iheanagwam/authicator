/* AuthKit — Dashboard charts (Chart.js) */
(function () {
  if (typeof Chart === "undefined") return;

  const isLight = () => document.documentElement.getAttribute("data-theme") === "light";
  const T = () => ({
    text: isLight() ? "#334155" : "#94a3b8",
    grid: isLight() ? "#e2e8f0" : "#1e293b",
    primary: "#2563eb",
    primarySoft: "rgba(37,99,235,0.18)",
    accent: "#7c3aed",
    accentSoft: "rgba(124,58,237,0.18)",
    success: "#22c55e",
  });

  Chart.defaults.font.family = 'Inter, ui-sans-serif, system-ui, sans-serif';
  Chart.defaults.font.size = 11;
  Chart.defaults.color = T().text;
  Chart.defaults.borderColor = T().grid;

  function line(ctx, labels, data, color, softColor) {
    const gradient = ctx.getContext("2d").createLinearGradient(0, 0, 0, 220);
    gradient.addColorStop(0, softColor);
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    return new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data, borderColor: color, backgroundColor: gradient,
          borderWidth: 2, fill: true, tension: 0.35, pointRadius: 0, pointHoverRadius: 4,
        }],
      },
      options: {
        maintainAspectRatio: false, responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: T().text } },
          y: { grid: { color: T().grid, drawBorder: false }, ticks: { color: T().text } },
        },
      },
    });
  }

  function bar(ctx, labels, data) {
    return new Chart(ctx, {
      type: "bar",
      data: { labels, datasets: [{ data, backgroundColor: T().primary, borderRadius: 6, barThickness: 14 }] },
      options: {
        maintainAspectRatio: false, responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: T().text } },
          y: { grid: { color: T().grid }, ticks: { color: T().text } },
        },
      },
    });
  }

  function doughnut(ctx, labels, data) {
    return new Chart(ctx, {
      type: "doughnut",
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: [T().primary, T().accent, T().success, "#f59e0b", "#64748b"],
          borderWidth: 0,
        }],
      },
      options: {
        maintainAspectRatio: false, cutout: "72%",
        plugins: { legend: { position: "bottom", labels: { color: T().text, boxWidth: 10 } } },
      },
    });
  }

  window.AuthKitCharts = { line, bar, doughnut };

  // Auto-init charts declared via data-chart
  const days = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  const weeks = ["W1","W2","W3","W4","W5","W6","W7","W8"];

  const initMap = {
    "chart-users": (c) => line(c, weeks, [420, 512, 640, 705, 812, 998, 1122, 1284], "#2563eb", "rgba(37,99,235,0.25)"),
    "chart-auth":  (c) => bar(c, days, [1240, 1580, 1720, 1610, 1890, 1330, 1120]),
    "chart-sessions": (c) => line(c, days, [812, 933, 890, 1120, 1204, 980, 1040], "#7c3aed", "rgba(124,58,237,0.22)"),
    "chart-webhooks": (c) => line(c, days, [98, 128, 142, 118, 156, 172, 165], "#22c55e", "rgba(34,197,94,0.22)"),
    "chart-methods": (c) => doughnut(c, ["Password","Google","GitHub","Magic Link","SSO"], [42, 24, 16, 12, 6]),
    "chart-usage": (c) => bar(c, days, [42, 58, 71, 63, 89, 34, 27]),
    "chart-platform-users": (c) => line(c, weeks, [8210, 9010, 10120, 11840, 13012, 14200, 15804, 17311], "#7c3aed", "rgba(124,58,237,0.22)"),
    "chart-platform-devs":  (c) => bar(c, weeks, [22, 34, 41, 58, 63, 78, 92, 104]),
  };
  Object.keys(initMap).forEach((id) => {
    const el = document.getElementById(id);
    if (el) initMap[id](el);
  });
})();
