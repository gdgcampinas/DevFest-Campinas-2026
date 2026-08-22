/** Feature: números da última edição. Some sozinha se não houver itens. */
function renderStats(stats, sectionEl, gridEl) {
  sectionEl.hidden = !stats.items.length;
  if (!stats.items.length) return;
  sectionEl.querySelector("h2").textContent = stats.title;
  gridEl.innerHTML = stats.items.map(item => `
    <div class="stat">
      <div class="stat-value">${item.value}</div>
      <div class="stat-label">${item.label}</div>
      ${item.sub ? `<div class="stat-sub">${item.sub}</div>` : ""}
    </div>`).join("");
}
