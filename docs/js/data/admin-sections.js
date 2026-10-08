/**
 * Dados da ÁREA DE ADMIN (admin.html), a central de CONTROLE da equipe: telão, palestras e moderação num lugar só (não é configuração nem alimentação do site). Só dado: a tela, o menu e os
 * cartões leem daqui, nada de endereço ou título solto no código.
 *   ADMIN_SECTIONS      as seções do menu, na ordem (`id` = o que vai depois do # na URL)
 *   ADMIN_SHORTCUTS     links soltos pra telas grandes que continuam na própria página (seção Atalhos): `id`, `title`, `description`, `href`
 *   ADMIN_TRACK_LINKS   o que se abre POR TRILHA (seção Palestras), sempre em aba própria: `href` recebe `?trilha=<id>`; `withTalkCode` junta `&palestra=<código>` da palestra da sala; `requires: "contest"`
 *                       só aparece quando a palestra tem concurso (Coding Jam)
 *   ADMIN_OVERVIEW      os cartões da visão geral, na ordem: `id` (liga ao desenhista em features/admin-overview-cards.js), `title` e o ritmo de cada um (`refreshMs`: redesenha; `intervalMs`: relê o banco/intermediário;
 *                       cada leitura conta no plano grátis do Firebase, por isso os intervalos são folgados)
 * Todas as telas são internas (fora do menu e do sitemap, sem versão /DEV/): abrem na raiz. As de moderação pedem login Google de moderador.
 */
const ADMIN_PAGE = "admin.html";

const ADMIN_SECTIONS = [
  { id: "visao-geral", title: "Visão geral" },
  { id: "telao", title: "Telão" },
  { id: "fotos", title: "Fotos" },
  { id: "palestras", title: "Palestras" },
  { id: "atalhos", title: "Atalhos" },
];

const ADMIN_SHORTCUTS = [
  { id: "mural", title: "Mural do telão", description: "A tela do LED. Abra no computador do telão, em tela cheia (Chrome em modo quiosque).", href: "mural.html" },
  { id: "sorteio", title: "Sorteio (telão)", description: "A roda do sorteio em modo telão, no notebook do palco.", href: "DEV/sorteio.html?telao=1" },
  { id: "reset-teste", title: "Limpar dados de teste", description: "Zera os dados de teste de um aparelho (check-ins, favoritos e cache). Use antes do evento, nos aparelhos em que o site foi testado.", href: "reset-teste.html" },
];

const ADMIN_TRACK_LINKS = [
  { id: "perguntas", label: "Perguntas", href: "moderacao.html" },
  { id: "quadro", label: "Quadro da sala", href: "checkin-display.html" },
  { id: "codejam", label: "Pódio do Coding Jam", href: "moderacao.html", withTalkCode: true, requires: "contest" },
];

const ADMIN_OVERVIEW = [
  { id: "control", title: "Telão", refreshMs: 15000 },
  { id: "rooms", title: "Salas agora", refreshMs: 30000 },
  { id: "pending", title: "Perguntas pendentes", intervalMs: 60000 },
  { id: "photos", title: "Fotos do telão", intervalMs: 60000 },
  { id: "registered", title: "Inscritos", intervalMs: 300000 },
];

const adminSectionsRepository = createRepository(ADMIN_SECTIONS, { page: ADMIN_PAGE, get: id => ADMIN_SECTIONS.find(section => section.id === id) });
const adminShortcutsRepository = createRepository(ADMIN_SHORTCUTS);
const adminTrackLinksRepository = createRepository(ADMIN_TRACK_LINKS);
const adminOverviewRepository = createRepository(ADMIN_OVERVIEW);
