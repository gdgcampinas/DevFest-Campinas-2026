/** As linhas do resultado da limpeza local: [texto, quantas coisas foram removidas]. Compartilhado pela página reset-teste.html e pela seção "Antes do evento" do admin. */
function localResetRows(result) {
  return [
    ["Check-ins, avaliações, nome e favoritos", result.local + result.session],
    ["Usuário anônimo do Firebase", result.databases],
    ["Caches do site", result.caches],
    ["Service workers", result.workers],
  ];
}

/** Resultado da limpeza local (só template): quantas coisas foram removidas, e o próximo passo. */
function localResetResultMarkup(result) {
  const rows = localResetRows(result).map(([label, count]) => `<li><span>${label}</span><strong>${count}</strong></li>`).join("");
  return `<p class="rt-done">Pronto. Este navegador está limpo.</p>
    <ul class="rt-list">${rows}</ul>
    <a class="rt-link" href="index.html">Abrir o site</a>`;
}
