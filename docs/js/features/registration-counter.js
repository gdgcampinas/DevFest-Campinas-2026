/**
 * Contador de inscritos. O total vem de `event-stats/<edição>`, gravado
 * pelo job do Sympla; aqui só se lê e mostra. Tudo injetado:
 *   getStatsRepository → função (o repository só existe depois dos módulos do Firebase)
 *   minToShow          → não mostra número baixo (EVENT.tickets.counterMin)
 *   enabled            → só com vendas abertas (EVENT.tickets.salesOpen)
 * Qualquer falha (sem rede, sem documento ainda) deixa o contador escondido:
 * a página segue normal.
 */
function initRegistrationCounter({ mountEl, getStatsRepository, edition, minToShow = 0, enabled = true }) {
  if (!mountEl || !enabled) return;
  runAfterModules(async () => {
    try {
      const stats = await getStatsRepository().get(edition);
      if (!stats || stats.total < minToShow) return;
      mountEl.innerHTML = registrationCounterMarkup({ count: stats.total });
      mountEl.hidden = false;
    } catch {
      /* sem contador */
    }
  });
}
