/**
 * Feature: "Realização" — reaproveita EVENT.hosts (mesmo dado do
 * header), só que num bloco maior/dedicado. Não duplica a lista de
 * organizadores em outro arquivo. O logo completo (`logo`) já traz o nome; o nome em texto
 * só aparece quando só existe o ícone.
 */
function renderRealizacao(hosts, mountEl) {
  mountEl.innerHTML = hosts.map(host => `
    <div class="realizacao-item">
      <img src="${host.logo ?? host.icon}" alt="${host.name}">
      ${host.logo ? "" : `<span>${host.name}</span>`}
    </div>`).join("");
}
