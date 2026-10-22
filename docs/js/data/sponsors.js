/**
 * Patrocinadores/parceiros por tier — o Master (Google Developer Groups) é REAL;
 * os demais são MOCK (empresas fictícias) até confirmar os reais. Mesma estrutura serve pra qualquer número de
 * tiers/logos. Tier sem `elements` (ou array vazio) simplesmente não
 * aparece. `description` é opcional: com ela, o card mostra o texto
 * (padrão inspirado no Campinas Innovation Week); sem ela, sobra só
 * logo+nome. Logo mock vem de mock-logo.js, link de mock-links.js.
 * `public: true` = marca CONFIRMADA e liberada: aparece em produção mesmo antes da revelação geral (reveal); as sem a marca (mocks) só
 * aparecem em DEV ou depois da revelação (ver publicSponsorTiers em features/sponsors.js).
 */
const sponsor = (name, description, shape, color) => ({
  name,
  link: MOCK_SPONSOR_URL,
  imageUrl: mockLogo({ name, shape, color }),
  description,
});

const SPONSORS = [
  { id: "master", tier: "Master", elements: [
    // REAL: logo horizontal OFICIAL do Google Developer Groups (Brand Guide for Organizers), sem redesenhar. Versão de texto ESCURO, na caixa branca padrão dos cards de patrocínio.
    { public: true, name: "Google Developer Groups", link: "https://gdg.community.dev/", imageUrl: "assets/brand/google-developer-groups.webp", description: "Comunidade global de desenvolvedores do Google Developer Groups." },
  ] },
  { id: "especialista", tier: "Especialista", elements: [
    // REAL, CONFIRMADA (2026-10-22), ainda SÓ EM DEV (sem `public: true`): vira `public: true` quando o Renato mandar liberar. Logo oficial do brandbook (preto horizontal, com o slogan; não recolorir nem alterar).
    { name: "FalaBoss", link: "https://falaboss.com", imageUrl: "assets/brand/falaboss.svg", description: "Contrate pelo chat. Simples assim!" },
    sponsor("Vértice Dados", "Plataforma de análise de dados e inteligência de negócios para varejo e indústria.", "bars", "#34a853"),
    sponsor("Órbita Cloud", "Infraestrutura em nuvem com suporte em português e operação no interior de São Paulo.", "ring", "#7c3aed"),
  ] },
  { id: "senior", tier: "Sênior", elements: [
    sponsor("Brisa Pagamentos", "Meios de pagamento e antifraude para lojas online e marketplaces.", "circle", "#ea4335"),
    sponsor("Nuvem Sul Tecnologia", "Consultoria em arquitetura de software e cultura DevOps.", "triangle", "#0ea5e9"),
    sponsor("Pixel Forge Studio", "Estúdio de produtos digitais, design de interfaces e prototipação.", "square", "#f59e0b"),
  ] },
  { id: "pleno", tier: "Pleno", elements: [
    // REAL e LIBERADA em produção (`public: true`). Logo vetorial do arquivo oficial da FIAP, versão rosa na caixa branca.
    { public: true, name: "FIAP", link: "https://www.fiap.com.br/", imageUrl: "assets/brand/fiap.webp", description: "A FIAP é o centro de excelência em tecnologia mais respeitado do país." },
    sponsor("Astro Labs", "Laboratório de inovação e prototipagem rápida para startups.", "ring", "#14b8a6"),
  ] },
  { id: "junior", tier: "Júnior", elements: [
    sponsor("Campo Digital", "Soluções de tecnologia e dados para o agronegócio.", "bars", "#65a30d"),
  ] },
  { id: "intern", tier: "Intern", elements: [
    sponsor("Trilha Educação", "Cursos e bootcamps de programação para quem está começando.", "triangle", "#f43f5e"),
  ] },
  { id: "permuta", tier: "Cota Permuta", elements: [
    sponsor("Café do Dev", "Cafeteria e espaço de cowork no coração de Campinas.", "circle", "#92400e"),
    sponsor("Gráfica Expressa", "Impressos, banners e brindes para eventos.", "hex", "#64748b"),
  ] },
  { id: "apoio", tier: "Apoio", elements: [
    sponsor("Cowork Barão", "Espaços de trabalho compartilhados em Barão Geraldo.", "square", "#6366f1"),
  ] },
];

const sponsorsRepository = createRepository(SPONSORS, {
  getByTier: tier => SPONSORS.find(t => t.tier === tier),
});
