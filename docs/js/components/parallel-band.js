/**
 * Faixa "Em paralelo" da grade (data/parallel-sessions.js): o horário da rodada, o nome da sessão, o lugar e o link. Atravessa todas as trilhas, em diagonal
 * (listras da cor da sessão no CSS). Puro template: recebe a colocação (features/parallel-sessions.js) e as frases prontas. Não leva `.slot`: a grade
 * e o "ao vivo agora" contam as sessões pela posição de `.slot`, e esta faixa não é uma delas.
 */
function parallelBandMarkup({ session, round, roundIndex }, texts) {
  const range = `${round.start}–${round.end}`;
  const label = session.rounds.length > 1 ? `${session.name} · ${roundIndex + 1}` : session.name;
  return `
    <div class="parallel-band" style="--band-color:${session.color}" data-session="${session.id}">
      <div class="slot-time">${round.start}</div>
      <a class="parallel-body" href="${session.href}">
        <span class="parallel-tag">${texts.tag}</span>
        <span class="parallel-title">${label}</span>
        <span class="parallel-meta">${iconMarkup("clock")}${range}${iconMarkup("pin")}${session.place}</span>
        <span class="parallel-link">${texts.details} →</span>
      </a>
    </div>`;
}
