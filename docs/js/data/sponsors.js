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
  { id: "senior", tier: "Sênior", elements: [
    // REAL, patrocinadora OFICIAL (cota Sênior, fechada em 2026-11-05). SEM `public`: aparece só em DEV até o Renato liberar (aí `public: true`). `telao: true` = já aparece no TELÃO de produção (decisão do Renato, 2026-11-06), mesmo sem `public`. Logo atual (kit da marca, versão preta recolorida para o vermelho Bosch #ED0007 a pedido do Renato), na caixa branca padrão.
    { telao: true, name: "Bosch", link: "https://www.bosch.com.br", imageUrl: "assets/brand/bosch-vermelho.webp", description: "Fornecedora global de tecnologia e serviços." },
  ] },
  { id: "pleno", tier: "Pleno", elements: [
    // REAL e LIBERADA em produção (`public: true`). Logo vetorial do arquivo oficial da FIAP, versão rosa na caixa branca.
    { public: true, name: "FIAP", link: "https://www.fiap.com.br/", imageUrl: "assets/brand/fiap.webp", description: "A FIAP é o centro de excelência em tecnologia mais respeitado do país." },
  ] },
  { id: "junior", tier: "Júnior", elements: [] },
  { id: "intern", tier: "Intern", elements: [] },
  { id: "permuta", tier: "Cota Permuta", elements: [] },
  { id: "apoio", tier: "Apoio", elements: [
    // REAL, LIBERADA em produção em 2026-10-30 ("libera a PUC", pedido do Renato). Logo institucional da PUC-Campinas (brasão + nome), baixado do site oficial, na caixa branca padrão; não recolorir nem alterar. É a casa do evento (Campus I), cede o local sem custo: `featured` dá o destaque do Master só para ela.
    { public: true, featured: true, name: "PUC-Campinas", link: "https://www.puc-campinas.edu.br/", imageUrl: "assets/brand/puc-campinas-85.webp" },
  ] },
  { id: "parceiros", tier: "Parceiros", elements: [
    // REAL e LIBERADA em produção (2026-10-23, `public: true`). Logo vetorial oficial (versão positiva, texto preto e laranja) na caixa branca padrão.
    { public: true, name: "Novatec Editora", link: "https://novatec.com.br/", imageUrl: "assets/brand/novatec.svg", description: "Publicando livros de qualidade nas áreas de tecnologia, negócios e educação desde 1988." },
    // REAL e LIBERADA em produção (2026-10-26, `public: true`). Logo horizontal (elefante e tagline verde) enviado pelo Renato, na caixa branca padrão.
    { public: true, name: "Timbira", link: "https://www.timbira.com.br", imageUrl: "assets/brand/timbira.webp", description: "Inteligência em PostgreSQL em prol da sustentabilidade do seu negócio." },
    // REAL e LIBERADA em produção (2026-10-29, `public: true`). Logo empilhado (HACK3R_ rosa, RANGER5 azul) enviado pelo Renato, fundo cinza tornado transparente, na caixa branca padrão.
    { public: true, name: "Hacker Rangers", link: "https://hackerrangers.com/pt/", imageUrl: "assets/brand/hacker-rangers.webp", description: "Cultura de segurança com treinamentos gamificados." },
    // REAL e LIBERADA em produção (2026-10-30, `public: true`). Logo oficial do site da empresa (versão escura horizontal), na caixa branca padrão. Realiza a NewHack Campinas.
    { public: true, name: "Datarock", link: "https://datarocktecnologia.com", imageUrl: "assets/brand/datarock.svg", description: "Educação em dados e IA: treinamentos, mentorias e consultoria para empresas." },
    // REAL e LIBERADA em produção (2026-11-03, `public: true`). Logo dourado 3D enviado pelo Renato (versão com fundo branco, recortada rente ao desenho), na caixa branca padrão. Descrição: o que a empresa faz (brindes personalizados, brinquedos e protótipos em 3D); o link é o Instagram da empresa, sem os parâmetros de rastreio do QR.
    { public: true, name: "B&B", link: "https://www.instagram.com/beb.inovacao3d", imageUrl: "assets/brand/bb-inovacao-3d.webp", description: "Inovação 3D: brindes personalizados, brinquedos e protótipos." },
    // REAL, parceira nova (2026-11-06). SEM `public`: só em DEV até o Renato liberar. Logo quadrado fundo preto (arte do Renato), recortado e centralizado num banner preto largo (senão vira um quadrado minúsculo no cartão branco). Pedir a versão horizontal; não recolorir.
    { name: "Red Bridge Card Store", link: "https://www.instagram.com/redbridge_cardstore/", imageUrl: "assets/brand/red-bridge-banner.webp", description: "A maior loja de card games da região." },
    // REAL e LIBERADA em produção e no telão (2026-11-11, `public: true`, pedido do Renato). Logo azul-marinho do slide de abertura da proposta, recortado rente ao desenho (700 px de origem: se a KRIVO mandar o arquivo grande, trocar), na caixa branca padrão. Agência de marketing e tecnologia.
    { public: true, name: "KRIVO", link: "https://www.krivomkt.com.br", imageUrl: "assets/brand/krivo.webp", description: "Ecossistema de marketing e tecnologia que une criatividade, estratégia e tecnologia." },
    // REAL, parceiro novo (2026-11-11). SEM `public`: só em DEV até o Renato liberar. Logo positivo (azul e verde) tirado do PDF CMYK oficial enviado pelo Renato, recortado rente ao desenho, na caixa branca padrão.
    { name: "Agibank", link: "https://agibank.com.br", imageUrl: "assets/brand/agibank.webp", description: "Banco digital brasileiro." },
  ] },
  { id: "comunidades", tier: "Comunidades parceiras", elements: [
    // REAL e LIBERADA em produção (2026-10-30, `public: true`). Logo enviado pelo Renato, com o fundo preto original (texto branco e verde-limão), na caixa branca padrão.
    { public: true, name: "NewHack Campinas", link: "https://luma.com/NewHack", imageUrl: "assets/brand/newhack-campinas.webp", description: "Comunidade de tecnologia e dados de Campinas, realizada pela Datarock." },
    // REAL e LIBERADA em produção (2026-10-30, `public: true`). Logo horizontal enviado pelo Renato; o texto "Google Developer Group" veio em BRANCO (feito pra fundo escuro), então foi trocado pelo cinza escuro (#202124) pra aparecer na caixa branca padrão. Recortado rente ao desenho.
    { public: true, name: "GDG Americana", link: "https://gdgamericana.com.br", imageUrl: "assets/brand/gdg-americana.webp", description: "Comunidade parceira de desenvolvedores do Google Developer Group de Americana." },
    // REAL e LIBERADA em produção (2026-11-03, `public: true`). Logo roxo enviado pelo Renato (fundo cinza-claro trocado por branco, pra casar com a caixa branca padrão). O link é o Linktree da comunidade (reúne LinkedIn e Instagram).
    { public: true, name: "WoHackers", link: "https://linktr.ee/wohackers", imageUrl: "assets/brand/wohackers.webp", description: "Comunidade que incentiva e apoia a participação de mulheres em hackathons." },
    // REAL e LIBERADA em produção e no telão (2026-11-10, `public: true`, pedido do Renato). Liga Acadêmica de TI da PUC-Campinas. Logo roxo enviado pelo Renato (150 px de origem, recortado rente ao desenho e ampliado: se a Liga tiver o arquivo grande, trocar). Link: o Linktree dela, sem os parâmetros de rastreio do Instagram.
    { public: true, name: "Liga de TI PUC", link: "https://linktr.ee/ligadetipuccampinas", imageUrl: "assets/brand/liga-de-ti-puc.webp", description: "Liga Acadêmica de TI da PUC-Campinas, a primeira instituição acadêmica da PUC dedicada a fomentar tecnologia, inovação e empreendedorismo." },
  ] },
];

const sponsorsRepository = createRepository(SPONSORS, {
  getByTier: tier => SPONSORS.find(t => t.tier === tier),
});
