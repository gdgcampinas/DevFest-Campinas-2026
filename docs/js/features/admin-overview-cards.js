/**
 * Os cartões da visão geral do admin (features/admin-overview.js). Cada FÁBRICA recebe a definição do cartão (data/admin-sections.js: título e ritmo) mais as dependências e devolve um
 * `watch(onView, onError)` que entrega o que o cartão mostra, `{ headline, tone?, lines }`, e devolve a função que desliga. Nenhuma fábrica conhece o DOM, o Firebase ou o relógio do navegador:
 * repositories, regras, `now` e o agendador `timer` chegam por parâmetro (`defaultAdminOverviewDeps` monta os do site).
 *   control      estado do telão (emergência, cena fixada, avisos no ar), por escuta do documento `mural-control/current`
 *   rooms        a palestra no ar (ou a próxima) em cada trilha, só do `SCHEDULE` (sem rede)
 *   pending      perguntas pendentes por trilha: conta no servidor (1 leitura por consulta) a cada `intervalMs`
 *   photos       fotos do álbum ao vivo e quantas estão fora do ar (cada metade falha sozinha)
 *   registered   total de inscritos do Sympla (`event-stats`)
 * Nomes: `schedule` = a grade do evento; `timer` = o agendador de tempo (`defaultSchedule`).
 */
function createAdminControlCard({ definition, controlRepository, normalize, summarize, limits, sceneLabel, formatTime, nowMs, timer }) {
  return (onView, onError) => {
    let doc = null;
    let loaded = false;
    const render = () => {
      if (!loaded) return;
      const summary = summarize(normalize(doc, nowMs(), limits), { sceneLabel, formatTime });
      onView({ headline: summary.headline, tone: summary.emergency ? "danger" : "ok", lines: [summary.holdText, `${summary.noticeCount} aviso(s) no ar`] });
    };
    const stopListening = controlRepository.listen(limits.docKey, next => { doc = next; loaded = true; render(); }, onError);
    const stopTick = scheduleEvery(timer, definition.refreshMs, render); // avisos que vencem saem da conta sem esperar o banco
    return () => { stopListening(); stopTick(); };
  };
}

function createAdminRoomsCard({ definition, schedule, tracks, now, codeOf, hasContest, formatTime, timer }) {
  return onView => scheduleEvery(timer, definition.refreshMs, () => {
    const rooms = describeTrackTalks({ schedule, tracks, now: now(), codeOf, hasContest });
    const live = rooms.filter(room => room.phase === "live").length;
    onView({ headline: `${live} de ${rooms.length} com palestra no ar`, tone: live ? "ok" : undefined, lines: rooms.map(room => `${room.track.shortLabel}: ${describeRoomLine(room, formatTime)}`) });
  });
}

function createAdminPendingQuestionsCard({ definition, schedule, tracks, now, allowsQuestions, questionsRepository, pendingStatus, pickTalk, timer }) {
  const readTrack = async track => {
    const talk = pickTalk({ schedule, track, now: now(), allowsQuestions });
    if (!talk) return { track, line: "sem palestra", pending: 0 };
    if (!talk.questionsEnabled) return { track, line: "perguntas desligadas nesta sessão", pending: 0 };
    try {
      const pending = await questionsRepository.countWhere({ talkKey: talk.key, status: pendingStatus });
      return { track, line: `${pending} pendente(s)`, pending };
    } catch {
      return { track, line: "não consegui ler", pending: 0 };
    }
  };
  return (onView, onError) => pollOpen({ read: () => Promise.all(tracks.map(readTrack)), intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(rows => {
    const total = rows.reduce((sum, row) => sum + row.pending, 0);
    onView({ headline: `${total} na fila`, tone: total ? "warn" : "ok", lines: rows.map(row => `${row.track.shortLabel}: ${row.line}`) });
  }, onError);
}

function createAdminPhotosCard({ definition, album, albumsRepository, hiddenRepository, timer }) {
  return (onView, onError) => {
    if (!album || !albumsRepository) {
      onError(new Error("álbum ao vivo não configurado"));
      return () => {};
    }
    const parts = { total: undefined, hidden: undefined }; // undefined = ainda lendo, null = falhou
    const show = value => (value === undefined ? "…" : value === null ? "não consegui ler" : String(value));
    const render = () => onView({ headline: `${show(parts.total)} foto(s)`, tone: parts.total === null || parts.hidden === null ? "warn" : "ok", lines: [`Álbum: ${album.label}`, `Fora do ar: ${show(parts.hidden)}`] });
    const stopAlbum = pollOpen({ read: async () => (await albumsRepository.get(album.id)).photos.length, intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(total => { parts.total = total; render(); }, () => { parts.total = null; render(); });
    const stopHidden = hiddenRepository.listen(album.id, doc => { parts.hidden = doc?.ids?.length ?? 0; render(); }, () => { parts.hidden = null; render(); });
    return () => { stopAlbum(); stopHidden(); };
  };
}

function createAdminRegisteredCard({ definition, statsRepository, edition, getUid, timer }) {
  return (onView, onError) => pollOpen({ read: async () => { await getUid(); return statsRepository.get(edition); }, intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(stats => {
    onView(Number.isFinite(stats?.total) ? { headline: String(stats.total), lines: ["inscritos (Sympla)"] } : { headline: "sem dado", tone: "warn", lines: ["o sincronismo do Sympla ainda não gravou o total"] });
  }, onError);
}

const ADMIN_OVERVIEW_CARD_FACTORIES = {
  control: createAdminControlCard,
  rooms: createAdminRoomsCard,
  pending: createAdminPendingQuestionsCard,
  photos: createAdminPhotosCard,
  registered: createAdminRegisteredCard,
};

/** Os cartões na ordem de `definitions` (data/admin-sections.js); definição sem fábrica é ignorada. Cada fábrica recebe `{ definition, ...deps }`. */
function buildAdminOverviewCards({ definitions, deps, factories = ADMIN_OVERVIEW_CARD_FACTORIES }) {
  return definitions.filter(definition => factories[definition.id]).map(definition => ({ id: definition.id, title: definition.title, watch: factories[definition.id]({ definition, ...deps }) }));
}

/**
 * As dependências do site pros cartões: repositories do moderador, as regras e limites do painel do telão (as mesmas do mural-controle), a grade, o relógio e o agendador.
 * `album` e `albumsRepository` (o ao vivo e o leitor dele) vêm de fora: dependem do intermediário de álbuns estar ligado.
 */
function defaultAdminOverviewDeps({ album, albumsRepository }) {
  const control = defaultMuralControlPanelDeps();
  const talks = defaultAdminTalksDeps();
  return {
    ...talks,
    controlRepository: control.repository, normalize: control.rules.normalize, summarize: control.rules.summarize, limits: control.limits,
    sceneLabel: id => control.scenes.find(scene => scene.id === id)?.label ?? id,
    nowMs: () => talks.now().getTime(),
    timer: defaultSchedule,
    allowsQuestions: talkHighlightsRepository.allowsQuestions,
    questionsRepository: window.moderationQuestionsRepository,
    pendingStatus: QUESTION_STATUS.pending,
    pickTalk: pickModerationTalk,
    album, albumsRepository,
    hiddenRepository: window.moderationMuralHiddenRepository,
    statsRepository: window.eventStatsRepository,
    edition: CURRENT_EDITION,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
