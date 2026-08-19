/**
 * Dados PROD do DevFest Campinas 2026 — mock genérico até a revelação
 * pública do line-up. Quando confirmado: copiar schedule.dev.js pra cá
 * (os dois ficam idênticos a partir da revelação) e trocar
 * EVENT.lineupRevealed pra true.
 *
 * TBD: data, horário, local e trilhas ainda não confirmados — ajustar
 * abaixo assim que o time fechar.
 */
const EVENT = {
  name: "DevFest Campinas",
  date: "2026-11-14", // TBD — ajustar quando confirmado (America/Sao_Paulo, sem horário de verão)
  timezone: "America/Sao_Paulo",
  utcOffset: "-03:00",
  venue: "Local a definir",
  address: "Campinas, SP",
  lineupRevealed: false,
  // 1..N coanfitriões/patrocinadores exibidos no header, nessa ordem.
  // Adicionar entradas aqui quando parceiros forem confirmados — o
  // separador "+" entre logos é gerado automaticamente (ver app.js renderBrand).
  hosts: [
    { name: "GDG Campinas", icon: "assets/icons/gdg-icon.png" },
  ],
};

/**
 * Trilhas do evento — id precisa ser único e é usado como chave em
 * SCHEDULE[].talks. `color` é a única coisa que o CSS/JS de trilha
 * precisa pra pintar qualquer componente (card, tab, legenda, modal):
 * nenhuma regra de estilo por id de trilha existe em styles.css.
 */
const TRACKS = [
  { id: "ia", label: "IA", shortLabel: "IA", room: "Sala a definir", mc: "MC a definir", color: "var(--ia)" },
  { id: "webdata", label: "Front-end / Back-end / Data", shortLabel: "Front/Back/Data", room: "Sala a definir", mc: "MC a definir", color: "var(--webdata)" },
  { id: "mentoring", label: "Carreira em Tecnologia", shortLabel: "Carreira", room: "Sala a definir", mc: "MC a definir", color: "var(--mentoring)" },
];

function eventTime(hhmm) {
  return new Date(`${EVENT.date}T${hhmm}:00${EVENT.utcOffset}`);
}

// Mock — horários e conteúdo de placeholder até o line-up ser fechado.
const SCHEDULE = [
  { start: eventTime("08:00"), end: eventTime("08:30"), banner: "Credenciamento", room: "Recepção" },
  { start: eventTime("08:30"), end: eventTime("08:50"), banner: "Abertura — GDG Campinas", room: "Auditório principal" },
  { start: eventTime("09:00"), end: eventTime("09:35"), talks: {
      ia: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
      webdata: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
      mentoring: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
  }},
  { start: eventTime("09:40"), end: eventTime("10:15"), talks: {
      ia: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
      webdata: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
      mentoring: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
  }},
  { start: eventTime("10:20"), end: eventTime("10:55"), banner: "Pausa / Intervalo" },
  { start: eventTime("11:00"), end: eventTime("11:35"), talks: {
      ia: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
      webdata: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
      mentoring: { speaker: "Palestrante a confirmar", title: "Título a confirmar", description: "" },
  }},
  { start: eventTime("11:40"), end: eventTime("12:00"), banner: "Encerramento", room: "Auditório principal" },
];
