/**
 * Feature: o pódio do concurso da sessão nos cards da grade. Quando o moderador publica o pódio (`contest-results/<talkKey>`), o card do
 * Coding Jam troca os lugares vazios (1º, 2º, 3º) pelo projeto e pela pessoa de cada um. Os cards já nascem com o pódio vazio
 * (components/talk-highlight.js); aqui só se preenche, nunca se redesenha o card.
 * Leitura barata (plano grátis): só confere sessões com concurso que JÁ acabaram (ou sempre, com a trava de horário desligada, em DEV), 1
 * leitura por sessão a cada `config.resultsPollMs` até o pódio aparecer; depois disso não lê mais nada, só reaplica o que já sabe.
 * Tudo por parâmetro: `index`, `config` (data/talk-contest.js), `enforceWindow`, `now` (respeita ?demo=), `deps()` ({ results }) e
 * `whenReady` (só liga depois dos módulos do Firebase, ver runAfterModules em app.js).
 */
function initContestResults(rootEl, { index, config, enforceWindow, now = () => new Date(), deps = defaultContestDeps, whenReady = runAfterModules, highlightOf = talkHighlightsRepository.forTalk, hasContest = talkHighlightsRepository.hasContest }) {
  const podiums = new Map(); // talkKey -> pódio publicado ([{ place, project, name }])

  const contestCards = () => [...rootEl.querySelectorAll(".talk--highlight[data-talk-key]")].filter(card => hasContest(index.get(card.dataset.talkKey)?.data));

  /** Preenche o pódio de cada card cujo resultado já se conhece (idempotente: reaplicar o mesmo pódio não muda nada). */
  function apply() {
    contestCards().forEach(card => {
      const key = card.dataset.talkKey;
      const winners = podiums.get(key);
      const podiumEl = card.querySelector(".talk-podium");
      if (!winners || !podiumEl || podiumEl.dataset.contestWinners === "1") return;
      podiumEl.outerHTML = talkPodiumMarkup(highlightOf(index.get(key).data).podium, winners).replace("<ol ", `<ol data-contest-winners="1" `);
    });
  }

  /** 1 leitura por sessão ainda sem pódio, só das que já podem ter resultado. */
  async function check() {
    const keys = [...new Set(contestCards().map(card => card.dataset.talkKey))].filter(key => !podiums.has(key));
    const { results } = deps();
    await Promise.all(keys.map(async key => {
      const entry = index.get(key);
      if (enforceWindow && questionWindowState(entry.slot, now(), { enforce: true }) !== "closed") return;
      const podium = (await results.get(key).catch(() => null))?.podium;
      if (podium?.length) podiums.set(key, podium);
    }));
  }

  async function scan() {
    await check();
    apply();
  }

  whenReady(() => {
    scan();
    setInterval(scan, config.resultsPollMs);
  });
  return { scan };
}
