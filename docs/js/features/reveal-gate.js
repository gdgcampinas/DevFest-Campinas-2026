/**
 * Gate genérico pra qualquer seção mock: com `reveal` falso (PROD, sem
 * `?lineup=1`), troca o conteúdo da seção por um aviso de "em
 * construção" em vez de rodar a função de render de verdade — nenhuma
 * seção mostra patrocinador/pessoa/preço fictício como se fosse real.
 * Reusado por patrocinadores, comunidades parceiras, time e ingressos;
 * cada chamada só passa a seção e a mensagem certas (a Grade, por ter
 * conteúdo inteiro interligado, usa a mesma constructionNoticeMarkup()
 * direto em `<main>`, ver js/pages/grade.js).
 */
function renderOrConstruction(reveal, sectionEl, render, message) {
  if (reveal) {
    render();
    return;
  }
  if (!sectionEl) return;
  sectionEl.hidden = false;
  sectionEl.innerHTML = constructionNoticeMarkup(message);
}
