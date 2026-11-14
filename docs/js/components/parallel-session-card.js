/**
 * Card ALTO da sessão em paralelo na grade (data/parallel-sessions.js): fica AO LADO da grade (à direita, fora das trilhas, que mantêm a largura de sempre), na altura das palestras do horário dela. No topo,
 * a faixa do destaque da sessão ("Mão na massa", components/talk-highlight.js) na cor da trilha de IA.
 * Puro template: recebe a colocação (features/parallel-sessions.js) e as frases prontas. O grupo (`parallelGroupMarkup`) junta as sessões cobertas e o card; nada aqui leva
 * `.slot`: a grade e o "ao vivo agora" contam as sessões pela posição de `.slot`, e o card não é uma delas.
 */
/** Quem faz a sessão como se fosse quem fala: o mesmo bloco do card de palestra (avatar, nome e ícones), componentes de talk-meta.js e person-card.js. `talk`/`color` vão para o zoom da foto. */
function parallelHostMarkup(host, { talk = "", color = "" } = {}) {
  if (!host) return "";
  return `
    <div class="talk-who parallel-who">
      ${talkAvatarsMarkup([host], { talk, color })}
      <div class="talk-who-text"><div class="talk-name">${host.name}</div></div>
      <div class="talk-links">${host.social.map(socialIconMarkup).join("")}</div>
    </div>`;
}

function parallelSessionCardMarkup({ session, round, roundIndex, host, highlight }, texts) {
  const label = session.rounds.length > 1 ? `${session.name} · ${roundIndex + 1}` : session.name;
  return `
    <aside class="parallel-card" style="--band-color:${session.color};--highlight-color:${session.color};--track-color:${session.color}" data-session="${session.id}">
      ${highlight ? talkHighlightRibbonMarkup(highlight) : ""}
      <div class="parallel-card-body">
      <span class="parallel-kicker">${session.kicker}</span>
      <span class="parallel-tag">${texts.tag}</span>
      <h3 class="parallel-title">${label}</h3>
      <p class="parallel-meta">${iconMarkup("clock")}${round.start}–${round.end}</p>
      <p class="parallel-meta">${iconMarkup("pin")}${session.place}</p>
      ${parallelHostMarkup(host, { talk: session.name, color: session.color })}
      <a class="cta parallel-cta" href="${session.href}">${iconMarkup("gift")}${texts.details}</a>
      </div>
    </aside>`;
}

/** As sessões cobertas (`slotsHtml`, já em HTML) numa coluna e o card ao lado, na altura delas. Sem sessão coberta, só o card. */
function parallelGroupMarkup(placement, slotsHtml, texts) {
  return `<div class="parallel-span" data-session="${placement.session.id}"><div class="parallel-span-slots">${slotsHtml}</div>${parallelSessionCardMarkup(placement, texts)}</div>`;
}
