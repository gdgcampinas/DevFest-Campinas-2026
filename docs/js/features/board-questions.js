/**
 * Feature: perguntas aprovadas no quadro da sala. Segue UMA palestra por vez (a que o quadro mostra) e escuta o documento
 * do quadro dela (`talk-boards/<talkKey>`, escrito pela tela do moderador, ver board-publisher.js) com listener: cada mudança
 * de ordem custa 1 leitura, e não uma consulta repetida de perguntas e votos (que numa TV ligada o dia todo estouraria o plano
 * grátis). Mostra as `limit` primeiras. Só leitura, sem login: usa o login anônimo do site. Se a leitura falhar, mantém a
 * última lista e avisa.
 *
 * `follow({ mountEl, key, phase })` diz onde desenhar, qual palestra seguir e se as perguntas ainda estão abertas;
 * `follow(null)` para (sem palestra na sala). Chamar de novo com o mesmo `key` (a tela foi redesenhada) só troca o
 * `mountEl`. Tudo por parâmetro: `deps()` ({ boards, getUid }) e `whenReady` (só liga o listener depois dos módulos do
 * Firebase, ver runAfterModules em app.js).
 */
function createBoardQuestions({ deps = defaultBoardDeps, limit = 6, whenReady = runAfterModules }) {
  let target = null;
  let stopListening = null;
  let lastQuestions = [];

  function draw(offline = false) {
    if (target) target.mountEl.innerHTML = boardQuestionsMarkup({ questions: lastQuestions, phase: target.phase, offline });
  }

  function stop() {
    stopListening?.();
    stopListening = null;
    lastQuestions = [];
  }

  async function listenTo(key) {
    const { boards, getUid } = deps();
    try {
      await getUid();
      if (target?.key !== key) return; // a sala já passou pra outra palestra enquanto entrava
      stopListening = boards.listen(
        key,
        board => {
          if (target?.key !== key) return;
          lastQuestions = (board?.questions ?? []).slice(0, limit);
          draw();
        },
        error => {
          console.warn("[quadro da sala] não consegui ler as perguntas:", error);
          draw(true);
        }
      );
    } catch (error) {
      console.warn("[quadro da sala] não consegui entrar:", error);
      draw(true);
    }
  }

  function follow(next) {
    const sameTalk = next && target && next.key === target.key;
    target = next;
    if (!next) return stop();
    if (!sameTalk) {
      stop();
      whenReady(() => listenTo(next.key)); // os repositories do Firebase são módulos: só existem depois do carregamento da página
    }
    draw();
  }

  return { follow };
}

/** Padrão de produção: os repositories do Firebase (módulos, só existem depois do carregamento). */
function defaultBoardDeps() {
  return {
    boards: window.talkBoardsRepository,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
