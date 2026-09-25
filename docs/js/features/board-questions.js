/**
 * Feature: perguntas aprovadas no quadro da sala. Segue UMA palestra por vez (a que o quadro mostra) e a cada
 * `config.boardPollMs` lê as perguntas aprovadas e os votos, ordena (mais votadas primeiro) e mostra as `limit`
 * primeiras. Só leitura, sem login: usa o login anônimo do site, e as regras do Firestore já deixam qualquer pessoa
 * autenticada listar as aprovadas. Se a leitura falhar, mantém a última lista e avisa.
 *
 * `follow({ mountEl, key, phase })` diz onde desenhar, qual palestra seguir e se as perguntas ainda estão abertas;
 * `follow(null)` para (sem palestra na sala). Chamar de novo com o mesmo `key` (a tela foi redesenhada) só troca o
 * `mountEl`. Tudo por parâmetro: `config` (data/talk-questions.js), `deps()` ({ questions, votes, getUid }) e `whenReady`
 * (roda a primeira leitura só depois dos módulos do Firebase, ver runAfterModules em app.js).
 */
function createBoardQuestions({ config, deps = defaultBoardDeps, limit = 6, whenReady = runAfterModules }) {
  let target = null;
  let timer = null;
  let lastQuestions = [];

  function draw(offline = false) {
    if (target) target.mountEl.innerHTML = boardQuestionsMarkup({ questions: lastQuestions, phase: target.phase, offline });
  }

  async function refresh() {
    if (!target) return;
    const { key } = target;
    const { questions, votes, getUid } = deps();
    try {
      await getUid();
      const [approved, voteDocs] = await Promise.all([
        questions.getWhere({ talkKey: key, status: [...PUBLIC_QUESTION_STATUSES] }),
        votes.getWhere({ talkKey: key }),
      ]);
      if (target?.key !== key) return; // a sala já passou pra outra palestra enquanto lia
      lastQuestions = rankQuestions(approved, voteDocs, { statuses: PUBLIC_QUESTION_STATUSES }).slice(0, limit);
      draw();
    } catch (error) {
      console.warn("[quadro da sala] não consegui ler as perguntas:", error);
      draw(true);
    }
  }

  function follow(next) {
    const sameTalk = next && target && next.key === target.key;
    target = next;
    if (!next) {
      clearInterval(timer);
      timer = null;
      lastQuestions = [];
      return;
    }
    if (!sameTalk) lastQuestions = [];
    draw();
    if (!sameTalk) whenReady(refresh); // os repositories do Firebase são módulos: só existem depois do carregamento da página
    if (!timer) timer = setInterval(refresh, config.boardPollMs);
  }

  return { follow };
}

/** Padrão de produção: os repositories do Firebase (módulos, só existem depois do carregamento). */
function defaultBoardDeps() {
  return {
    questions: window.talkQuestionsRepository,
    votes: window.talkQuestionVotesRepository,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
