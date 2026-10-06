/**
 * Peças de template do destaque de sessão (data/talk-highlights.js): chip, bloco do card (frase, pódio, aviso) e seções do
 * modal (etapas, pódio, regras). Puro template: recebe o destaque pronto e devolve HTML, sem saber de Coding Jam. A cor vem de
 * --highlight-color, herdada do card/modal.
 */
function talkHighlightChipMarkup(highlight) {
  return `<span class="talk-format talk-format--highlight">${iconMarkup(highlight.icon)}${highlight.label}</span>`;
}

/**
 * 1º, 2º e 3º lugar. O prêmio só aparece quando está preenchido no dado; `winners` ([{ place, project, name }], o pódio que o
 * moderador publicou) preenche cada lugar com o projeto e a pessoa. Nome e projeto vêm da plateia: passam por escapeHtml.
 */
function talkPodiumMarkup(podium = [], winners = []) {
  const slots = podium.map(({ place, prize }, index) => {
    const winner = winners.find(candidate => candidate.place === index + 1);
    const who = winner ? `<span class="talk-podium-project">${escapeHtml(winner.project)}</span><span class="talk-podium-winner">${escapeHtml(winner.name)}</span>` : "";
    return `<li class="talk-podium-slot${winner ? " talk-podium-slot--won" : ""}"><b>${place}</b>${who}${prize ? `<span>${prize}</span>` : ""}</li>`;
  }).join("");
  return slots ? `<ol class="talk-podium">${slots}</ol>` : "";
}

/** Faixa no topo do card (primeiro filho, sangra até as bordas): rótulo de modalidade do destaque, ex.: "Competição". */
function talkHighlightRibbonMarkup(highlight) {
  return highlight.ribbon ? `<div class="talk-ribbon">${iconMarkup(highlight.icon)}${highlight.ribbon}</div>` : "";
}

/** Marca d'água (o ícone do destaque, grande e translúcido): só decoração, fica atrás do texto. */
function talkHighlightMarkMarkup(highlight) {
  return `<span class="talk-highlight-mark" aria-hidden="true">${iconMarkup(highlight.icon, "talk-highlight-mark-icon")}</span>`;
}

/** Corpo do card: marca d'água, frase, pódio e aviso curto (cada parte só aparece se o dado tiver). */
function talkHighlightBodyMarkup(highlight) {
  const note = highlight.note ? `<div class="talk-highlight-note">${highlight.noteIcon ? iconMarkup(highlight.noteIcon) : ""}${highlight.note}</div>` : "";
  return `<div class="talk-highlight">
    ${talkHighlightMarkMarkup(highlight)}
    ${highlight.tagline ? `<p class="talk-highlight-tagline">${highlight.tagline}</p>` : ""}
    ${talkPodiumMarkup(highlight.podium)}
    ${note}
  </div>`;
}

/** Seções do modal de detalhe; seção sem dado não aparece. */
function talkHighlightDetailMarkup(highlight) {
  const section = (title, body) => (body ? `<section class="detail-highlight-section"><h4>${title}</h4>${body}</section>` : "");
  const steps = (highlight.steps ?? []).map(step => `<li><strong>${step.label}</strong><span>${step.text}</span></li>`).join("");
  const rules = (highlight.rules ?? []).map(rule => `<li>${rule}</li>`).join("");
  return `<div class="detail-highlight">
    ${highlight.tagline ? `<p class="detail-highlight-tagline">${highlight.tagline}</p>` : ""}
    ${section(t("highlight.steps", "Como funciona"), steps && `<ol class="detail-steps">${steps}</ol>`)}
    ${section(t("highlight.podium", "Pódio"), talkPodiumMarkup(highlight.podium))}
    ${section(t("highlight.rules", "Regras"), rules && `<ul class="detail-rules">${rules}</ul>`)}
  </div>`;
}
