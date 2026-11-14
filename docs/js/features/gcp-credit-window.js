/**
 * Regra de horário dos links de crédito (data/gcp-credits.js, `windows`): puro, sem DOM nem relógio global (a hora entra por parâmetro).
 * O link do Google só funciona dentro da janela dele, então a tela mostra o link só enquanto vale, "abre em ..." antes e "encerrou" depois.
 *   { state: "open",   window }  agora está dentro de uma janela
 *   { state: "before", window }  ainda não abriu; `window` é a próxima a abrir
 *   { state: "closed", window: null }  todas já encerraram
 */
function creditWindowState(windows, now = new Date()) {
  const at = now.getTime();
  const timed = windows.map(window => ({ window, from: Date.parse(window.start), to: Date.parse(window.end) }));
  const open = timed.find(({ from, to }) => at >= from && at < to);
  if (open) return { state: "open", window: open.window };
  const next = timed.filter(({ from }) => from > at).sort((a, b) => a.from - b.from)[0];
  return next ? { state: "before", window: next.window } : { state: "closed", window: null };
}

/** "28/11 às 07:00" no fuso de Campinas (a janela vale pelo horário daqui, não pelo do aparelho). `locale` vem do idioma da página. */
function formatCreditMoment(iso, { locale = "pt-BR", timeZone = "America/Sao_Paulo" } = {}) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat(locale, { timeZone, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso)).map(part => [part.type, part.value]));
  const date = locale.startsWith("en") ? `${parts.month}/${parts.day}` : `${parts.day}/${parts.month}`;
  return `${date} ${locale.startsWith("en") ? "at" : "às"} ${parts.hour}:${parts.minute}`;
}
