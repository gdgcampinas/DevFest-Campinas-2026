/**
 * Patrocinadores/parceiros por tier — MOCK (empresas fictícias) até
 * confirmar os reais. Mesma estrutura serve pra qualquer número de
 * tiers/logos. Tier sem `elements` (ou array vazio) simplesmente não
 * aparece. `description` é opcional: com ela, o card mostra o texto
 * (padrão inspirado no Campinas Innovation Week); sem ela, sobra só
 * logo+nome. Logo mock vem de mock-logo.js, link de mock-links.js.
 */
const sponsor = (name, description, shape, color) => ({
  name,
  link: MOCK_SPONSOR_URL,
  imageUrl: mockLogo({ name, shape, color }),
  description,
});

const SPONSORS = [
  { tier: "Master", elements: [
    sponsor("Tecnova Sistemas", "Software e cloud sob medida para empresas de médio e grande porte, com sede em Campinas.", "hex", "#4285f4"),
  ] },
  { tier: "Especialista", elements: [
    sponsor("Vértice Dados", "Plataforma de análise de dados e inteligência de negócios para varejo e indústria.", "bars", "#34a853"),
    sponsor("Órbita Cloud", "Infraestrutura em nuvem com suporte em português e operação no interior de São Paulo.", "ring", "#7c3aed"),
  ] },
  { tier: "Senior", elements: [
    sponsor("Brisa Pagamentos", "Meios de pagamento e antifraude para lojas online e marketplaces.", "circle", "#ea4335"),
    sponsor("Nuvem Sul Tecnologia", "Consultoria em arquitetura de software e cultura DevOps.", "triangle", "#0ea5e9"),
    sponsor("Pixel Forge Studio", "Estúdio de produtos digitais, design de interfaces e prototipação.", "square", "#f59e0b"),
  ] },
  { tier: "Intern", elements: [
    sponsor("Astro Labs", "Laboratório de inovação e prototipagem rápida para startups.", "ring", "#14b8a6"),
    sponsor("Campo Digital", "Soluções de tecnologia e dados para o agronegócio.", "bars", "#65a30d"),
    sponsor("Trilha Educação", "Cursos e bootcamps de programação para quem está começando.", "triangle", "#f43f5e"),
  ] },
  { tier: "Apoio", elements: [
    sponsor("Café do Dev", "Cafeteria e espaço de cowork no coração de Campinas.", "circle", "#92400e"),
    sponsor("Cowork Barão", "Espaços de trabalho compartilhados em Barão Geraldo.", "square", "#6366f1"),
    sponsor("Gráfica Expressa", "Impressos, banners e brindes para eventos.", "hex", "#64748b"),
  ] },
];

const sponsorsRepository = createRepository(SPONSORS, {
  getByTier: tier => SPONSORS.find(t => t.tier === tier),
});
