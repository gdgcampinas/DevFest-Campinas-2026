/** Moldura fixa do mural: rodapé com a marca, o aviso de "sem internet" (só quando precisa) e o relógio do evento. */
function muralFooterMarkup({ logoSrc, name }) {
  return `<img class="mf-logo" src="${escapeHtml(logoSrc)}" alt=""><span class="mf-name">${escapeHtml(name)}</span><span class="mf-status" data-status hidden>Sem internet, mostrando o que já temos</span><span class="mf-clock" data-clock></span>`;
}

function updateMuralFooter(footerEl, { time, online }) {
  footerEl.querySelector("[data-clock]").textContent = time;
  footerEl.querySelector("[data-status]").hidden = online;
}

/** Painel de diagnóstico (`?diag=1`, só pro ensaio): saúde do mural numa olhada. `snapshot` vem pronto de pages/mural.js. */
function muralDiagMarkup(snapshot) {
  const row = (label, value) => `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(String(value))}</td></tr>`;
  return `<table>${[
    row("Cena", snapshot.scene ?? "-"),
    row("No ar há", `${snapshot.sceneSeconds ?? 0}s`),
    row("Cenas mostradas", snapshot.shown),
    row("Falhas seguidas", snapshot.failures),
    row("De castigo", snapshot.cooling.join(", ") || "nenhuma"),
    row("Último erro", snapshot.lastError ?? "nenhum"),
    row("Internet", snapshot.online ? "ok" : `fora desde ${snapshot.offlineFor}s`),
    row("Fontes ao vivo", Object.entries(snapshot.sources).map(([id, status]) => `${id}: ${status.state}`).join(" | ") || "nenhuma"),
    row("Ligado há", `${snapshot.uptimeMin} min`),
    row("Recargas (10 min)", snapshot.reloads),
    row("Pendente", snapshot.pending.join(", ") || "nada"),
    row("Degradado", snapshot.degraded ? "SIM (trava anti-laço)" : "não"),
    row("Palco", snapshot.stage),
  ].join("")}</table>`;
}
