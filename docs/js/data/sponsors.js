/**
 * Patrocinadores/parceiros por tier. SÓ MARCAS REAIS (os patrocinadores de teste saíram em 2026-10-22, decisão do Renato): cada marca nova entra na sua cota, `public: true` quando liberada.
 * Mesma estrutura serve pra qualquer número de tiers/logos. Tier sem `elements` (ou array vazio) simplesmente não aparece (nem no site nem no telão). `description` é opcional: com ela, o
 * card mostra o texto (padrão inspirado no Campinas Innovation Week); sem ela, sobra só logo+nome.
 * `public: true` = marca CONFIRMADA e liberada: aparece em produção mesmo antes da revelação geral (reveal); sem a marca (uma nova que ainda está sendo conferida) só aparece em DEV
 * ou depois da revelação (ver publicSponsorTiers em features/sponsors.js).
 */
const SPONSORS = [
  { id: "master", tier: "Master", elements: [
    // REAL: logo horizontal OFICIAL do Google Developer Groups (Brand Guide for Organizers), sem redesenhar. Versão de texto ESCURO, na caixa branca padrão dos cards de patrocínio.
    { public: true, name: "Google Developer Groups", link: "https://gdg.community.dev/", imageUrl: "assets/brand/google-developer-groups.webp", description: "Comunidade global de desenvolvedores do Google Developer Groups." },
  ] },
  { id: "especialista", tier: "Especialista", elements: [
    // REAL, CONFIRMADA e LIBERADA em produção (2026-10-22, `public: true`). Logo oficial do brandbook (preto horizontal, com o slogan; não recolorir nem alterar).
    { public: true, name: "FalaBoss", link: "https://falaboss.com", imageUrl: "assets/brand/falaboss.svg", description: "Contrate pelo chat. Simples assim!" },
  ] },
  // cotas ainda sem marca confirmada (ficam prontas; vazias, não aparecem em lugar nenhum):
  { id: "senior", tier: "Sênior", elements: [] },
  { id: "pleno", tier: "Pleno", elements: [
    // REAL e LIBERADA em produção (`public: true`). Logo vetorial do arquivo oficial da FIAP, versão rosa na caixa branca.
    { public: true, name: "FIAP", link: "https://www.fiap.com.br/", imageUrl: "assets/brand/fiap.webp", description: "A FIAP é o centro de excelência em tecnologia mais respeitado do país." },
  ] },
  { id: "junior", tier: "Júnior", elements: [] },
  { id: "intern", tier: "Intern", elements: [] },
  { id: "permuta", tier: "Cota Permuta", elements: [] },
  { id: "apoio", tier: "Apoio", elements: [
    // REAL, só em DEV até o Renato liberar (sem `public`). Logo institucional da PUC-Campinas (brasão + nome), baixado do site oficial, na caixa branca padrão; não recolorir nem alterar. É a casa do evento (Campus I).
    { name: "PUC-Campinas", link: "https://www.puc-campinas.edu.br/", imageUrl: "assets/brand/puc-campinas.webp" },
  ] },
];

const sponsorsRepository = createRepository(SPONSORS, {
  getByTier: tier => SPONSORS.find(t => t.tier === tier),
});
