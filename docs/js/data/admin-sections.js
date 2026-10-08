/**
 * Dados da ÁREA DE ADMIN (admin.html), a central de CONTROLE da equipe: telão, palestras e moderação num lugar só (não é configuração nem alimentação do site). Só dado: a tela, o menu e os
 * cartões leem daqui, nada de endereço ou título solto no código.
 *   ADMIN_SECTIONS      as seções do menu, na ordem (`id` = o que vai depois do # na URL)
 *   ADMIN_SHORTCUTS     links soltos pra telas grandes que continuam na própria página (seção Atalhos): `id`, `title`, `description`, `href`
 *   ADMIN_TRACK_LINKS   o que se abre POR TRILHA (seção Palestras), sempre em aba própria: `href` recebe `?trilha=<id>`; `withTalkCode` junta `&palestra=<código>` da palestra da sala; `requires: "contest"`
 *                       só aparece quando a palestra tem concurso (Coding Jam)
 *   ADMIN_OVERVIEW      os cartões da visão geral, na ordem: `id` (liga ao desenhista em features/admin-overview-cards.js), `title` e o ritmo de cada um (`refreshMs`: redesenha; `intervalMs`: relê o banco/intermediário;
 *                       cada leitura conta no plano grátis do Firebase, por isso os intervalos são folgados)
 *   ADMIN_BEFORE_EVENT  a seção "Antes do evento": a limpeza do BANCO (roda no GitHub, com as travas dela) e a limpeza deste APARELHO; só texto e endereço
 *   ADMIN_MODERATORS    a seção Moderadores: limite da lista, prazo da confirmação de remoção e os textos da tela
 *   ADMIN_TALKS         ritmo da seção Palestras (`refreshMs`: de quanto em quanto tempo ela confere se a palestra da trilha mudou)
 * Todas as telas são internas (fora do menu e do sitemap, sem versão /DEV/): abrem na raiz. As de moderação pedem login Google de moderador.
 */
const ADMIN_PAGE = "admin.html";

const ADMIN_SECTIONS = [
  { id: "visao-geral", title: "Visão geral" },
  { id: "telao", title: "Telão" },
  { id: "fotos", title: "Fotos" },
  { id: "palestras", title: "Palestras" },
  { id: "moderadores", title: "Moderadores" },
  { id: "antes-do-evento", title: "Antes do evento" },
  { id: "atalhos", title: "Atalhos" },
];

const ADMIN_SHORTCUTS = [
  { id: "mural", title: "Mural do telão", description: "A tela do LED. Abra no computador do telão, em tela cheia (Chrome em modo quiosque).", href: "mural.html" },
  { id: "sorteio", title: "Sorteio (telão)", description: "A roda do sorteio em modo telão, no notebook do palco.", href: "DEV/sorteio.html?telao=1" },
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

const ADMIN_TALKS = { refreshMs: 30000 };

const ADMIN_MODERATORS = {
  max: 30,
  confirmMs: 5000,
  text: {
    intro: "Quem entra aqui com o Google pode moderar perguntas, o telão e as fotos. Só o dono da conta (fixo nas regras do Firestore) cadastra e remove moderadores. O e-mail precisa ser de uma conta Google.",
    addTitle: "Cadastrar moderador",
    placeholder: "e-mail do Google (ex.: nome@gmail.com)",
    addButton: "Cadastrar",
    removeButton: "Remover",
    removeConfirm: "Toque de novo para REMOVER",
    you: "você",
    empty: "Nenhum moderador cadastrado ainda (o dono sempre pode tudo).",
    added: "Moderador cadastrado.",
    removed: "Moderador removido.",
    ownerOnly: "Sem permissão: só o dono da conta cadastra e remove moderadores.",
    saveFailed: "Não consegui salvar. Tente de novo.",
    readFailed: "Não consegui ler a lista de moderadores. Confira a conexão.",
  },
};

const ADMIN_BEFORE_EVENT = {
  confirmMs: 5000,
  purge: {
    title: "Limpar o banco (dados de teste)",
    description: "Apaga os dados de teste do Firebase pra o evento começar do zero. Roda no GitHub, com as travas de segurança dele (o navegador não tem permissão pra apagar isso, de propósito).",
    clears: ["Check-ins, avaliações das palestras e do evento", "Perguntas e votos", "Cadastros e sorteios do sorteio", "Projetos, votos e pódio do Coding Jam"],
    keeps: "Nunca toca nos inscritos do Sympla nem no contador de inscritos.",
    steps: ["Toque em \"Abrir a limpeza no GitHub\" e em \"Run workflow\".", "Primeiro rode com o \"Modo teste\" LIGADO: só conta o que seria apagado.", "Conferindo o resumo, rode de novo: desmarque o modo teste e digite APAGAR."],
    lock: "A limpeza se recusa a rodar depois que o evento começa (os dados passam a ser reais).",
    workflowUrl: "https://github.com/gdgcampinas/DevFest-Campinas-2026/actions/workflows/purge-test-data.yml",
    buttonLabel: "Abrir a limpeza no GitHub",
  },
  device: {
    title: "Limpar este aparelho",
    description: "Zera os dados de teste deste celular ou computador: check-ins, avaliações, nome, favoritos, caches e o login. Use nos aparelhos em que o site foi testado.",
    warning: "Você será desconectado do admin e do site neste aparelho.",
    buttonLabel: "Limpar este aparelho",
    confirmLabel: "Toque de novo para CONFIRMAR",
    doneText: "Pronto. Este aparelho está limpo. Entre de novo com o Google para continuar.",
  },
};

const adminBeforeEventRepository = createRepository(ADMIN_BEFORE_EVENT);

const adminSectionsRepository = createRepository(ADMIN_SECTIONS, { page: ADMIN_PAGE, get: id => ADMIN_SECTIONS.find(section => section.id === id) });
const adminShortcutsRepository = createRepository(ADMIN_SHORTCUTS);
const adminTrackLinksRepository = createRepository(ADMIN_TRACK_LINKS);
const adminOverviewRepository = createRepository(ADMIN_OVERVIEW);
const adminTalksConfigRepository = createRepository(ADMIN_TALKS);
const adminModeratorsRepository = createRepository(ADMIN_MODERATORS);
