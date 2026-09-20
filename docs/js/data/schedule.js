/**
 * Dados PROD do DevFest Campinas 2026 — line-up MOCK liberado pra todos
 * (EVENT.lineupRevealed true). Quando o line-up real for confirmado:
 * trocar o catálogo mock pelos dados reais (mesmo formato) e manter
 * schedule.dev.js idêntico a este arquivo.
 *
 * TBD: data, horário, local e trilhas ainda não confirmados — ajustar
 * abaixo assim que o time fechar.
 */
const EVENT = {
  name: "DevFest Campinas",
  date: "2026-11-28", // America/Sao_Paulo, sem horário de verão
  timezone: "America/Sao_Paulo",
  utcOffset: "-03:00",
  url: "https://gdgcampinas.github.io/DevFest-Campinas-2026/", // endereço público (canonical, compartilhamento, dados estruturados)
  description: "Um dia de tecnologia em Campinas: 4 trilhas de palestras, comunidade e networking. 28 de novembro de 2026.",
  image: "assets/img/og-image.png", // imagem de compartilhamento (relativa a url)
  venue: "Local a definir",
  venueConfirmed: false, // false = calendário/agenda usam só o endereço (cidade) em vez do nome do local
  address: "Campinas, SP",
  lineupRevealed: true,
  // 1..N coanfitriões/patrocinadores exibidos no header, nessa ordem.
  // Adicionar entradas aqui quando parceiros forem confirmados — o
  // separador "+" entre logos é gerado automaticamente (ver app.js renderBrand).
  // Reaproveitado também na seção "Realização" (features/realizacao.js).
  hosts: [
    { name: "GDG Campinas", icon: "assets/icons/gdg-icon.png" },
  ],
  // CTA de inscrição (cabeçalho, barra mobile, hero e cards de ingresso, ver
  // features/tickets.js): url preenchida = compra; vazia + waitlistUrl = "avise-me";
  // os dois vazios = só o status. Tipos de ingresso: data/tickets.js.
  tickets: {
    url: "https://www.sympla.com.br", // página principal do Sympla enquanto o evento não está publicado
    label: "Garanta sua vaga",
    status: "Em breve",
    salesOpen: false, // true quando as vendas abrirem de verdade (dados estruturados: PreOrder vira InStock)
    waitlistUrl: "", // opcional: sem url de compra, vira "Avise-me quando abrir" (Instagram/WhatsApp)
  },
};

/**
 * Trilhas do evento — id precisa ser único e é usado como chave em
 * SCHEDULE[].talks. `color` é a única coisa que o CSS/JS de trilha
 * precisa pra pintar qualquer componente (card, tab, legenda, modal):
 * nenhuma regra de estilo por id de trilha existe em styles.css.
 * `room` é o nome da sala (roomFor + lugar histórico). `icon` é o nome de um ícone de data/icons.js (usado na seção "Trilhas" da home;
 * sem ele cai no ícone padrão). `description` é opcional — usada na seção "Trilhas" da home
 * (features/tracks-overview.js), reaproveitando o card genérico de
 * info-card.js. Sem ela, a trilha só não aparece lá.
 */
/**
 * Nome de uma sala a partir de um lugar histórico de Campinas — o padrão
 * ("Sala <lugar>") fica só aqui. Trocar o lugar de uma trilha (ou de um
 * banner do DAY_PLAN), ou o padrão do nome, é editar este helper ou o
 * argumento onde ele é usado.
 */
const roomFor = place => `Sala ${place}`;

const TRACKS = [
  { id: "ia", label: "IA", shortLabel: "IA", room: roomFor("Observatório"), mc: "MC a definir", color: "var(--ia)", icon: "sparkles",
    description: "Modelos, agentes e aplicações de inteligência artificial na prática — do fundamento ao que já roda em produção." },
  { id: "webdata", label: "Front-end / Back-end / Data", shortLabel: "Front/Back/Data", room: roomFor("Estação"), mc: "MC a definir", color: "var(--webdata)", icon: "code",
    description: "Arquitetura, engenharia de dados e desenvolvimento web — as bases que sustentam qualquer produto digital." },
  { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", room: roomFor("Lagoa do Taquaral"), mc: "MC a definir", color: "var(--mobile)", icon: "phone",
    description: "Apps nativos e multiplataforma, e os métodos ágeis que fazem times entregarem rápido e com qualidade." },
  { id: "mentoring", label: "Carreiras & Mentorias", shortLabel: "Carreiras", room: roomFor("Mercadão Central"), mc: "MC a definir", color: "var(--mentoring)", icon: "rocket",
    description: "Trajetórias, mentoria e como crescer na área — de quem já passou pelos mesmos desafios." },
];

function eventTime(hhmm) {
  return new Date(`${EVENT.date}T${hhmm}:00${EVENT.utcOffset}`);
}

/**
 * Plano do dia — palestra = 40 min (com perguntas) + 5 min de troca,
 * via talkWindows() de schedule-builder.js. Almoço 12:00-13:20 mais
 * 10 min pra voltar pra sala. Talks mock vêm do catálogo; sem ele rotacionam o pool
 * o catálogo mock (mock-talks.js + mock-speakers.js) até o line-up real ser fechado.
 */
const DAY_PLAN = [
  { banner: "Credenciamento", room: "Recepção", start: "08:00", end: "08:30" },
  { banner: "Abertura — GDG Campinas", room: roomFor("Calçadão Central"), start: "08:30", end: "08:55" },
  { talks: talkWindows("09:00", 4) },
  { banner: "Almoço", start: "12:00", end: "13:20" },
  { banner: "Retorno para a sala", start: "13:20", end: "13:30" },
  { talks: talkWindows("13:30", 5) },
  { banner: "Encerramento", room: roomFor("Calçadão Central"), start: "17:15", end: "18:00" },
];

const SCHEDULE = buildSchedule(DAY_PLAN, { eventTime, tracks: TRACKS, speakerPool: mockSpeakersRepository.getAll(), talkCatalog: mockTalksRepository });
