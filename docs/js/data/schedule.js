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
  date: "2026-11-28", // America/Sao_Paulo, sem horário de verão
  timezone: "America/Sao_Paulo",
  utcOffset: "-03:00",
  venue: "Local a definir",
  address: "Campinas, SP",
  lineupRevealed: false,
  // 1..N coanfitriões/patrocinadores exibidos no header, nessa ordem.
  // Adicionar entradas aqui quando parceiros forem confirmados — o
  // separador "+" entre logos é gerado automaticamente (ver app.js renderBrand).
  // Reaproveitado também na seção "Realização" (features/realizacao.js).
  hosts: [
    { name: "GDG Campinas", icon: "assets/icons/gdg-icon.png" },
  ],
  // Seção de ingressos na home — url vazia esconde o botão de compra
  // (mostra só o status). Preencher quando as inscrições abrirem.
  tickets: {
    url: "",
    label: "Garanta sua vaga",
    status: "Em breve",
  },
};

/**
 * Trilhas do evento — id precisa ser único e é usado como chave em
 * SCHEDULE[].talks. `color` é a única coisa que o CSS/JS de trilha
 * precisa pra pintar qualquer componente (card, tab, legenda, modal):
 * nenhuma regra de estilo por id de trilha existe em styles.css.
 * `description` é opcional — usada na seção "Trilhas" da home
 * (features/tracks-overview.js), reaproveitando o card genérico de
 * info-card.js. Sem ela, a trilha só não aparece lá.
 */
const TRACKS = [
  { id: "ia", label: "IA", shortLabel: "IA", room: "Sala a definir", mc: "MC a definir", color: "var(--ia)",
    description: "Modelos, agentes e aplicações de inteligência artificial na prática — do fundamento ao que já roda em produção." },
  { id: "webdata", label: "Front-end / Back-end / Data", shortLabel: "Front/Back/Data", room: "Sala a definir", mc: "MC a definir", color: "var(--webdata)",
    description: "Arquitetura, engenharia de dados e desenvolvimento web — as bases que sustentam qualquer produto digital." },
  { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", room: "Sala a definir", mc: "MC a definir", color: "var(--mobile)",
    description: "Apps nativos e multiplataforma, e os métodos ágeis que fazem times entregarem rápido e com qualidade." },
  { id: "mentoring", label: "Carreiras & Mentorias", shortLabel: "Carreiras", room: "Sala a definir", mc: "MC a definir", color: "var(--mentoring)",
    description: "Trajetórias, mentoria e como crescer na área — de quem já passou pelos mesmos desafios." },
];

function eventTime(hhmm) {
  return new Date(`${EVENT.date}T${hhmm}:00${EVENT.utcOffset}`);
}

/**
 * Plano do dia — palestra = 40 min (com perguntas) + 5 min de troca,
 * via talkWindows() de schedule-builder.js. Almoço 12:00-13:20 mais
 * 10 min pra voltar pra sala. Talks mock rotacionam o pool
 * MOCK_SPEAKERS até o line-up real ser fechado.
 */
const DAY_PLAN = [
  { banner: "Credenciamento", room: "Recepção", start: "08:00", end: "08:30" },
  { banner: "Abertura — GDG Campinas", room: "Auditório principal", start: "08:30", end: "08:55" },
  { talks: talkWindows("09:00", 4) },
  { banner: "Almoço", start: "12:00", end: "13:20" },
  { banner: "Retorno para a sala", start: "13:20", end: "13:30" },
  { talks: talkWindows("13:30", 5) },
  { banner: "Encerramento", room: "Auditório principal", start: "17:15", end: "18:00" },
];

const SCHEDULE = buildSchedule(DAY_PLAN, { eventTime, tracks: TRACKS, speakerPool: MOCK_SPEAKERS });
