/**
 * Feature: o pódio do concurso da sessão (Coding Jam) no quadro da sala. Segue UMA sessão por vez (a que o quadro mostra) e escuta o
 * documento do pódio dela (`contest-results/<talkKey>`, escrito pelo moderador) com listener: 1 leitura por mudança, não uma consulta
 * repetida. Mostra os lugares vazios até o resultado sair; quando ele aparece AO VIVO (o quadro já estava aberto sem pódio), dispara o
 * papel picado do sorteio (features/confetti.js): na TV a animação faz parte do show, então vale mesmo com "Reduzir movimento". Quadro
 * recarregado com o pódio já publicado não dispara nada. Só leitura, sem login: usa o login anônimo do site; se a leitura falhar, mantém
 * o último estado e avisa.
 *
 * `follow({ mountEl, key, highlight })` diz onde desenhar, qual sessão seguir e quais são os lugares (data/talk-highlights.js);
 * `follow(null)` para. Mesmo `key` com outro `mountEl` (a tela foi redesenhada) só troca o lugar de desenhar. Tudo por parâmetro:
 * `deps()` ({ results, getUid }), `whenReady` (só liga o listener depois dos módulos do Firebase) e `confetti` ({ fire }).
 */
function createBoardContest({ deps = defaultBoardContestDeps, whenReady = runAfterModules, confetti = createConfetti(), publishDetector = createFreshPublishDetector() } = {}) {
  let target = null;
  let stopListening = null;
  let winners = [];

  function draw(offline = false) {
    if (target?.mountEl) target.mountEl.innerHTML = boardContestMarkup({ podium: target.highlight?.podium ?? [], winners, offline });
  }

  function celebrate() {
    const rect = target?.mountEl?.getBoundingClientRect?.();
    const origin = rect ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 } : null;
    confetti.fire({ origin, force: true });
  }

  function stop() {
    stopListening?.();
    stopListening = null;
    winners = [];
    publishDetector.reset(); // só comemora o resultado que chega DEPOIS de ver a sessão sem pódio nesta tela
  }

  async function listenTo(key) {
    const { results, getUid } = deps();
    try {
      await getUid();
      if (target?.key !== key) return; // a sala já passou pra outra sessão enquanto entrava
      stopListening = results.listen(
        key,
        doc => {
          if (target?.key !== key) return;
          const next = doc?.podium ?? [];
          const justPublished = publishDetector.observe(next);
          winners = next;
          draw();
          if (justPublished) celebrate();
        },
        error => {
          console.warn("[quadro da sala] não consegui ler o pódio:", error);
          draw(true);
        }
      );
    } catch (error) {
      console.warn("[quadro da sala] não consegui entrar:", error);
      draw(true);
    }
  }

  function follow(next) {
    const sameSession = next && target && next.key === target.key;
    target = next;
    if (!next) return stop();
    if (!sameSession) {
      stop();
      whenReady(() => listenTo(next.key)); // os repositories do Firebase são módulos: só existem depois do carregamento da página
    }
    draw();
  }

  return { follow };
}

/** Padrão de produção: os repositories do Firebase (módulos, só existem depois do carregamento). */
function defaultBoardContestDeps() {
  return {
    results: window.contestResultsRepository,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
