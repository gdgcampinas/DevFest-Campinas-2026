/**
 * Os cartões da visão geral do admin (features/admin-overview.js). Cada FÁBRICA recebe a definição do cartão (data/admin-sections.js: título e ritmo) mais as dependências e devolve um
 * `watch(onView, onError)` que entrega o que o cartão mostra, `{ headline, tone?, lines }`, e devolve a função que desliga. Nenhuma fábrica conhece o DOM, o Firebase ou o relógio do navegador:
 * repositories, regras, `now` e o agendador `timer` chegam por parâmetro (`defaultAdminOverviewDeps` monta os do site).
 *   control      estado do telão (emergência, cena fixada, avisos no ar), por escuta do documento `mural-control/current`
 *   rooms        a palestra no ar (ou a próxima) em cada trilha, só do `SCHEDULE` (sem rede)
 *   pending      perguntas pendentes por trilha: conta no servidor (1 leitura por consulta) a cada `intervalMs`
 *   photos       fotos do álbum ao vivo e quantas estão fora do ar (cada metade falha sozinha)
 *   wall         recados do mural esperando aprovação (conta no servidor a cada `intervalMs`)
 *   waitlist     quantas pessoas pediram pra ser avisadas quando os ingressos abrirem (conta no servidor a cada `intervalMs`)
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

/**
 * Cartão "Fotos do telão". Álbum sem aprovação: total de fotos e quantas estão fora do ar. Álbum com aprovação (`album.approval`): quantas fotos ESPERAM o moderador (nem aprovadas nem escondidas),
 * em alerta quando há alguma, e a contagem das aprovadas. `approvedRepository` só é usado no álbum com aprovação.
 */
function createAdminPhotosCard({ definition, album, albumsRepository, hiddenRepository, approvedRepository, timer }) {
  return (onView, onError) => {
    if (!album || !albumsRepository) {
      onError(new Error("álbum ao vivo não configurado"));
      return () => {};
    }
    const parts = { photos: undefined, hidden: undefined, approved: album.approval ? undefined : null }; // undefined = ainda lendo, null = falhou (ou não se aplica, em approved)
    const show = value => (value === undefined ? "…" : value === null ? "não consegui ler" : String(value));
    const ready = () => parts.photos && parts.hidden && (parts.approved || !album.approval);
    const failed = () => parts.photos === null || parts.hidden === null || (album.approval && parts.approved === null);
    const render = () => {
      if (album.approval && ready()) {
        const waiting = parts.photos.filter(id => !parts.approved.has(id) && !parts.hidden.has(id)).length;
        onView({ headline: waiting ? `${waiting} esperando` : "Nenhuma esperando", tone: waiting ? "warn" : "ok", lines: [`Álbum: ${album.label}`, waiting ? "Abra Fotos para aprovar" : "Tudo em dia", `No ar: ${parts.approved.size - [...parts.approved].filter(id => parts.hidden.has(id)).length}`] });
        return;
      }
      onView({ headline: `${show(parts.photos && parts.photos.length)} foto(s)`, tone: failed() ? "warn" : "ok", lines: [`Álbum: ${album.label}`, `Fora do ar: ${show(parts.hidden && parts.hidden.size)}`] });
    };
    const stopAlbum = pollOpen({ read: async () => (await albumsRepository.get(album.id)).photos.map(photo => photo.id), intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(ids => { parts.photos = ids; render(); }, () => { parts.photos = null; render(); });
    const stopHidden = hiddenRepository.listen(album.id, doc => { parts.hidden = new Set(doc?.ids ?? []); render(); }, () => { parts.hidden = null; render(); });
    const stopApproved = album.approval ? approvedRepository.listen(album.id, doc => { parts.approved = new Set(doc?.ids ?? []); render(); }, () => { parts.approved = null; render(); }) : () => {};
    return () => { stopAlbum(); stopHidden(); stopApproved(); };
  };
}

function createAdminRegisteredCard({ definition, statsRepository, edition, getUid, timer }) {
  return (onView, onError) => pollOpen({ read: async () => { await getUid(); return statsRepository.get(edition); }, intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(stats => {
    onView(Number.isFinite(stats?.total) ? { headline: String(stats.total), lines: ["inscritos (Sympla)"] } : { headline: "sem dado", tone: "warn", lines: ["o sincronismo do Sympla ainda não gravou o total"] });
  }, onError);
}

function createAdminWallCard({ definition, wallRepository, timer }) {
  return (onView, onError) => pollOpen({ read: () => wallRepository.countWhere({ status: "pending" }), intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(
    pending => onView({ headline: pending ? `${pending} esperando` : "Nenhum esperando", tone: pending ? "warn" : "ok", lines: [pending ? "Abra Recados para aprovar" : "Tudo em dia"] }),
    onError,
  );
}

function createAdminWaitlistCard({ definition, waitlistRepository, timer }) {
  return (onView, onError) => pollOpen({ read: () => waitlistRepository.countWhere({}), intervalMs: definition.intervalMs, schedule: timer, keepAlive: true })(
    total => onView({ headline: total ? `${total} na lista` : "Ninguém na lista", tone: total ? undefined : "ok", lines: [total ? "Abra Lista de espera para baixar" : "Ainda não pediram para ser avisados"] }),
    onError,
  );
}

const ADMIN_OVERVIEW_CARD_FACTORIES = {
  control: createAdminControlCard,
  rooms: createAdminRoomsCard,
  pending: createAdminPendingQuestionsCard,
  photos: createAdminPhotosCard,
  wall: createAdminWallCard,
  waitlist: createAdminWaitlistCard,
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
    wallRepository: window.moderationWallRepository,
    waitlistRepository: window.moderationWaitlistRepository,
    hiddenRepository: window.moderationMuralHiddenRepository,
    approvedRepository: window.moderationMuralApprovedRepository,
    statsRepository: window.eventStatsRepository,
    edition: CURRENT_EDITION,
    getUid: () => window.firebaseClient.ensureAnonymousUid(),
  };
}
