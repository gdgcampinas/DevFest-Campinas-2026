/**
 * Feature: "Realização" — reaproveita EVENT.hosts (mesmo dado do
 * header), só que num bloco maior/dedicado. Não duplica a lista de
 * organizadores em outro arquivo. O logo completo (`logo`) já traz o nome; o nome em texto
 * só aparece quando só existe o ícone. `by` (data/realization-by.js) acrescenta, no fim de cada
 * item, "by <logo da marca que apresenta>"; sem `by` o item fica só com o organizador.
 */
function realizacaoByMarkup(by) {
  if (!by) return "";
  return `
      <span class="realizacao-by-word">${by.word}</span>
      <a class="realizacao-by-logo" href="${by.link}" target="_blank" rel="noopener" title="${by.name}"><img src="${by.logo}" alt="${by.name}"></a>`;
}

function renderRealizacao(hosts, mountEl, { by = null } = {}) {
  mountEl.innerHTML = hosts.map(host => `
    <div class="realizacao-item">
      <img class="realizacao-host" src="${host.logo ?? host.icon}" alt="${host.name}">
      ${host.logo ? "" : `<span>${host.name}</span>`}${realizacaoByMarkup(by)}
    </div>`).join("");
}
