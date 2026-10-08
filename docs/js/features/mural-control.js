/**
 * CONTROLE REMOTO do mural do telão (avisos ao vivo, fixar cena, pausar, recarregar, emergência). Um único documento no Firestore, `mural-control/current`, que o moderador grava pelo celular
 * (mural-controle.html) e o mural só LÊ por escuta (1 leitura por mudança): o computador do telão nunca é tocado. Puro, dual (navegador e Node), testado em DevFestIA/tools/mural/control.test.js.
 *
 * O documento: { notices: [{ id, text, kind: "info" | "alert", until }], emergency: { text, since } | null, hold: { sceneId | null, until } | null, reload: número }.
 *   notices    avisos com tempo de vida (`until` em ms): somem sozinhos quando vencem, mesmo que ninguém os remova
 *   emergency  aviso FIXO em tela cheia: o rodízio PARA até o moderador desarmar (sem validade, de propósito)
 *   hold       `sceneId` fixa essa cena; `null` = pausa na cena que estiver no ar; `until` solta sozinho (ninguém esquece o telão parado)
 *   reload     número que muda a cada pedido de "recarregar o mural"; o mural compara com o último que viu (nunca recarrega em laço)
 *
 * Duas metades, as duas puras: as REGRAS do moderador (`addNotice`, `removeNotice`, `holdScene`, `releaseHold`, `armEmergency`, `disarmEmergency`, `orderReload`: documento entra, documento sai, nada de relógio
 * próprio) e o APLICADOR do mural (`createMuralControl`: lê o documento e dá as ordens ao motor). Tudo injetado: limites (MURAL_CONFIG.control), motor, estado `live`, relógio, agendador.
 */
function emptyControl() {
  return { notices: [], emergency: null, hold: null, reload: 0 };
}

const cleanText = (text, max) => String(text ?? "").replace(/\s+/g, " ").trim().slice(0, max);

/** O documento como o mural o entende: só avisos válidos e vivos, emergência com texto, pausa que ainda não venceu. Nunca lança (documento ausente ou torto vira vazio). */
function normalizeControl(doc, nowMs, limits) {
  const notices = (Array.isArray(doc?.notices) ? doc.notices : [])
    .filter(notice => notice && typeof notice.id === "string" && cleanText(notice.text, limits.maxTextLength) && Number(notice.until) > nowMs)
    .map(notice => ({ id: notice.id, text: cleanText(notice.text, limits.maxTextLength), kind: notice.kind === "alert" ? "alert" : "info", until: Number(notice.until) }))
    .slice(-limits.maxNotices);
  const emergencyText = cleanText(doc?.emergency?.text, limits.maxEmergencyLength);
  const hold = doc?.hold && Number(doc.hold.until) > nowMs ? { sceneId: typeof doc.hold.sceneId === "string" ? doc.hold.sceneId : null, until: Number(doc.hold.until) } : null;
  return { notices, emergency: emergencyText ? { text: emergencyText, since: Number(doc.emergency.since) || 0 } : null, hold, reload: Number(doc?.reload) || 0 };
}

/**
 * O estado do telão em palavras: um texto só pro painel do moderador e pra visão geral do admin (nunca divergem). `state` é o documento normalizado; `sceneLabel(id)` e `formatTime(ms)` são injetados.
 * Devolve { emergency, headline, holdText, noticeCount, text }.
 */
function summarizeControl(state, { sceneLabel = id => id, formatTime = () => "" } = {}) {
  const holdText = state.hold ? `${state.hold.sceneId ? `fixo em "${sceneLabel(state.hold.sceneId)}"` : "pausado"} até ${formatTime(state.hold.until)}` : "rodando sozinho";
  const headline = state.emergency ? "EMERGÊNCIA ARMADA" : "Telão normal";
  const noticeCount = state.notices.length;
  return { emergency: Boolean(state.emergency), headline, holdText, noticeCount, text: `${headline} · ${holdText} · ${noticeCount} aviso(s) no ar` };
}

// ---------- regras do moderador (documento -> documento) ----------
function addNotice(doc, { text, kind = "info", ttlMs, id, nowMs }, limits) {
  const clean = cleanText(text, limits.maxTextLength);
  if (!clean) throw new Error("escreva o aviso");
  const alive = normalizeControl(doc, nowMs, limits).notices;
  return { ...normalizeControl(doc, nowMs, limits), notices: [...alive, { id, text: clean, kind: kind === "alert" ? "alert" : "info", until: nowMs + ttlMs }].slice(-limits.maxNotices) };
}

const removeNotice = (doc, id, nowMs, limits) => {
  const state = normalizeControl(doc, nowMs, limits);
  return { ...state, notices: state.notices.filter(notice => notice.id !== id) };
};

const holdScene = (doc, { sceneId = null, ttlMs, nowMs }, limits) => ({ ...normalizeControl(doc, nowMs, limits), hold: { sceneId, until: nowMs + ttlMs } });

const releaseHold = (doc, nowMs, limits) => ({ ...normalizeControl(doc, nowMs, limits), hold: null });

function armEmergency(doc, { text, nowMs }, limits) {
  const clean = cleanText(text, limits.maxEmergencyLength);
  if (!clean) throw new Error("escreva o texto da emergência");
  return { ...normalizeControl(doc, nowMs, limits), emergency: { text: clean, since: nowMs } };
}

const disarmEmergency = (doc, nowMs, limits) => ({ ...normalizeControl(doc, nowMs, limits), emergency: null });

const orderReload = (doc, nowMs, limits) => ({ ...normalizeControl(doc, nowMs, limits), reload: nowMs });

/**
 * O APLICADOR do mural: `apply(doc)` roda a cada mudança do documento (e quando algo vence). Dá as ordens ao motor (`mural.hold`, `mural.release`, `mural.pushInterrupt`), mantém `live.notices` e
 * `live.emergency` (o que as cenas leem) e pede a recarga. A emergência vence a pausa. `spec` (data/mural-sources.js, `bind.control`) diz quais cenas e com que prioridade.
 *   mural          { hold({ sceneId, untilMs, critical }), release(), pushInterrupt(spec) }   (`critical`: a emergência, que o motor nunca solta sozinho)
 *   live           estado compartilhado das cenas (`live.notices`, `live.emergency`)
 *   requestReload  chamado com "remote-reload" quando o moderador pede recarga
 *   reloadStore    { read(), write(token) }: o último pedido de recarga já visto (sobrevive à recarga; sem ele um mural recém-aberto só toma o valor atual como ponto de partida)
 */
function createMuralControl({ mural, live, limits, spec, nowMs = () => Date.now(), schedule = fn => { fn(); return () => {}; }, requestReload = () => {}, reloadStore = { read: () => null, write: () => {} } }) {
  let lastDoc = null;
  let appliedHold = null;
  let knownNotices = new Set();
  let cancelTimer = () => {};

  function nextDeadline(state) {
    const times = [...state.notices.map(notice => notice.until), ...(state.hold ? [state.hold.until] : [])];
    return times.length ? Math.min(...times) : null;
  }

  function applyHold(state) {
    const wanted = state.emergency ? { sceneId: spec.emergencyScene, untilMs: Infinity } : state.hold ? { sceneId: state.hold.sceneId, untilMs: state.hold.until } : null;
    const key = wanted ? `${wanted.sceneId}|${wanted.untilMs}` : null;
    if (key === appliedHold) return;
    appliedHold = key;
    if (wanted) mural.hold({ ...wanted, critical: Boolean(state.emergency) });
    else mural.release();
  }

  function apply(doc) {
    lastDoc = doc;
    cancelTimer();
    const state = normalizeControl(doc, nowMs(), limits);

    if (state.notices.length) live.notices = state.notices;
    else delete live.notices;
    if (state.emergency) live.emergency = state.emergency;
    else delete live.emergency;

    const fresh = state.notices.filter(notice => !knownNotices.has(notice.id));
    knownNotices = new Set(state.notices.map(notice => notice.id));
    if (fresh.length && !state.emergency) mural.pushInterrupt(spec.noticeInterrupt);

    applyHold(state);

    const seen = reloadStore.read();
    if (seen === null) reloadStore.write(state.reload);
    else if (state.reload !== seen) {
      reloadStore.write(state.reload);
      requestReload("remote-reload");
    }

    const deadline = nextDeadline(state);
    if (deadline !== null) cancelTimer = schedule(() => apply(lastDoc), Math.max(deadline - nowMs(), 0) + 50);
  }

  return { apply, stop: () => cancelTimer() };
}

if (typeof module !== "undefined") module.exports = { emptyControl, normalizeControl, summarizeControl, addNotice, removeNotice, holdScene, releaseHold, armEmergency, disarmEmergency, orderReload, createMuralControl };
