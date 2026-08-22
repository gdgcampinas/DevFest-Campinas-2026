/**
 * Feature: "Realização" — reaproveita EVENT.hosts (mesmo dado do
 * header), só que num bloco maior/dedicado. Não duplica a lista de
 * organizadores em outro arquivo.
 */
function renderRealizacao(hosts, mountEl) {
  mountEl.innerHTML = hosts.map(host => `
    <div class="realizacao-item">
      <img src="${host.icon}" alt="${host.name}">
      <span>${host.name}</span>
    </div>`).join("");
}
