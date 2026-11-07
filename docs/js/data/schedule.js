/**
 * Dados PROD do DevFest Campinas 2026 — line-up ainda é MOCK
 * (EVENT.lineupRevealed false), escondido do público por padrão pra
 * ninguém confundir com a programação oficial (gente já achou que era
 * real). Quem precisa ver o mock (time interno) abre com `?lineup=1` —
 * "modo DEV" por URL, mesmo site/config, nada separado (ver
 * warnIfMockContent/resolveReveal em app.js). Quando o line-up real for
 * confirmado: trocar o catálogo mock pelos dados reais (mesmo formato),
 * voltar `lineupRevealed` pra `true`, e manter schedule.dev.js idêntico
 * a este arquivo.
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
  lineupRevealed: false, // PROD: mock escondido por padrão; "?lineup=1" (modo DEV) força mostrar
  // 1..N coanfitriões/patrocinadores exibidos no header, nessa ordem. `logo` (opcional) é o logo
  // horizontal com o nome, mostrado no lugar de "icon + nome"; o cartão "Eu vou!" usa o do 1º host.
  // Adicionar entradas aqui quando parceiros forem confirmados — o
  // separador "+" entre logos é gerado automaticamente (ver app.js renderBrand).
  // Reaproveitado também na seção "Realização" (features/realizacao.js).
  hosts: [
    { name: "GDG Campinas", icon: "assets/brand/gdg-icon.svg", logo: "assets/brand/gdg-logo-dark.svg" },
  ],
  // CTA de inscrição (cabeçalho, barra mobile, hero e cards de ingresso, ver
  // features/tickets.js): url preenchida = compra; vazia + waitlistUrl = "avise-me";
  // os dois vazios = só o status. Tipos de ingresso: data/tickets.js.
  tickets: {
    url: "https://www.sympla.com.br/evento/devfest-campinas-2026/3591517", // link do evento no Sympla; vazio = todos os botões viram o status ("Ingressos em breve") (sem link morto)
    pageHref: "ingressos.html", // os botões "Garanta sua vaga" (cabeçalho, barra, topo da home) levam à página de ingressos; os cards dela vão ao Sympla (url acima)
    label: "Garanta sua vaga",
    status: "Ingressos em breve",
    openStatus: "abertos", // texto do ticker quando salesOpen for true
    tickerStatus: "em breve", // texto do ticker quando salesOpen for false (cabe depois de "Ingressos:"; sem ele usa `status`, que já é uma frase)
    salesOpen: true, // true quando as vendas abrirem de verdade (dados estruturados: PreOrder vira InStock)
    showCounter: false, // "N pessoas já garantiram a vaga" (features/registration-counter.js): DESLIGADO por decisão do Renato em 2026-10-21 (número pode conflitar com o "vagas limitadas"); `true` volta, e só aparece a partir de `counterMin`
    counterMin: 30, // só mostra o contador "N pessoas já garantiram a vaga" a partir desse total de inscritos
    registrationGate: { enabled: true, public: true }, // LIBERADO em produção em 2026-10-20: cartão "Eu vou!" só pra quem tem ingresso (e-mail do Sympla, com "confirmando…" + sync na hora): `public: false` = só em modo DEV (teste); `true` = produção; `false` (ou enabled:false) = cartão livre
    waitlistUrl: "", // opcional: sem url de compra, vira "Avise-me quando abrir" (Instagram/WhatsApp)
    waitlist: { enabled: false, public: true }, // LISTA DE ESPERA ENCERRADA em 2026-10-18 (ingressos abertos em produção; `enabled: true` volta a oferecer o "Avise-me"). Antes: `public: false` = só em modo DEV; `true` = em produção (LIBERADA em 2026-10-16). Ver applyWaitlistMode (features/tickets.js)
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

/** Trilhas ao público até a revelação (o line-up real tem uma a mais, ver LINEUP_TRACKS). */
const PUBLIC_TRACKS = [
  { id: "ia", label: "IA", shortLabel: "IA", room: roomFor("Observatório"), mc: "MC a definir", color: "var(--ia)", icon: "sparkles",
    description: "Modelos, agentes e aplicações de inteligência artificial na prática, do fundamento ao que já roda em produção." },
  { id: "webdata", label: "Front-end / Back-end / Data - Full Stack", shortLabel: "Front/Back/Data - Full Stack", room: roomFor("Estação"), mc: "MC a definir", color: "var(--webdata)", icon: "code",
    description: "Arquitetura, engenharia de dados e desenvolvimento web: as bases que sustentam qualquer produto digital." },
  { id: "mobile", label: "Mobile / Agile", shortLabel: "Mobile/Agile", room: roomFor("Lagoa do Taquaral"), mc: "MC a definir", color: "var(--mobile)", icon: "phone",
    description: "Apps nativos e multiplataforma, e os métodos ágeis que fazem times entregarem rápido e com qualidade." },
  { id: "mentoring", label: "Carreira em Tecnologia", shortLabel: "Carreira em Tecnologia", room: roomFor("Mercadão Central"), mc: "MC a definir", color: "var(--mentoring)", icon: "rocket",
    description: "Trajetórias, mentoria e como crescer na área, com quem já passou pelos mesmos desafios." },
];

/** Trilhas da grade real (5): nomes e cores da grade do Renato. Só em modo DEV até a revelação. */
const LINEUP_TRACKS = [
  { id: "ia", label: "IA/Vibe Coding", shortLabel: "IA/Vibe Coding", room: roomFor("Observatório"), mc: "MC a definir", color: "var(--ia)", icon: "sparkles",
    description: "Modelos, agentes e aplicações de inteligência artificial na prática, do fundamento ao que já roda em produção." },
  { id: "webdata", label: "Front-end / Back-end / Data - Full Stack", shortLabel: "Front/Back/Data - Full Stack", room: roomFor("Estação"), mc: "MC a definir", color: "var(--webdata)", icon: "code",
    description: "Arquitetura, engenharia de dados e desenvolvimento web: as bases que sustentam qualquer produto digital." },
  { id: "mobile", label: "Mobile / Gerência de Projetos", shortLabel: "Mobile/Gerência de Projetos", room: roomFor("Lagoa do Taquaral"), mc: "MC a definir", color: "var(--mobile)", icon: "phone",
    description: "Apps nativos e multiplataforma e a gerência de projetos que faz times entregarem rápido e com qualidade." },
  { id: "cloudsec", label: "Cyber Segurança (Security) / Cloud", shortLabel: "Cyber Segurança/Cloud", room: roomFor("Torre do Castelo"), mc: "MC a definir", color: "var(--cloudsec)", icon: "shield",
    description: "Segurança, criptografia e arquitetura em nuvem: como proteger e escalar sistemas de verdade." },
  { id: "mentoring", label: "Carreira em Tecnologia", shortLabel: "Carreira em Tecnologia", room: roomFor("Mercadão Central"), mc: "MC a definir", color: "var(--mentoring)", icon: "rocket",
    description: "Trajetórias, mentoria e como crescer na área, com quem já passou pelos mesmos desafios." },
];

/**
 * LINE-UP REAL (grade do Renato, 2026-11-03): 5 trilhas x 9 palestras. Vaga vazia = `null` (aparece como "Título a confirmar", sem palestrante).
 * Cargo e nome vêm da grade; descrição, LinkedIn e foto vêm do C4P (foto ausente = iniciais). Nenhum e-mail ou telefone do C4P entra aqui. Só aparece em modo DEV (?lineup=1) até a revelação, ver `showRealLineup` abaixo.
 * `[id, nome, cargo, selo, foto, linkedin]`
 */
const LINEUP_SPEAKER_ROWS = [
  ["ana-andrade-gonsalves", "Ana Andrade Gonsalves", "Microsoft MVP", "", "assets/img/lineup/ana-andrade-gonsalves.webp", "https://www.linkedin.com/in/ana-andrade-in/"],
  ["alvaro-camillo-neto", "Alvaro Camillo Neto", "Staff Engineer, F1rst - Santander", "GDE", "assets/img/lineup/alvaro-camillo-neto.webp", "https://www.linkedin.com/in/alvarocamillont/"],
  ["leandro-garcia", "Leandro Garcia", "i9 Flow | co-founder", "", "assets/img/lineup/leandro-garcia.webp", ""],
  ["dickson-s-guedes", "Dickson S Guedes", "Eng. Sustentabilidade de Dados", "", "assets/img/lineup/dickson-s-guedes.webp", "https://linkedin.com/in/dicksonguedes"],
  ["bianca-bordon-weiller", "Bianca Bordon Weiller", "Marketing e Criação", "", "assets/img/lineup/bianca-bordon-weiller.webp", "https://www.linkedin.com/in/bianca-bordon"],
  ["gabriel-rodrigues-de-souza", "Gabriel Rodrigues de Souza", "Ci&t", "", "assets/img/lineup/gabriel-rodrigues-de-souza.webp", "https://www.linkedin.com/in/gabrielroodriz"],
  ["fernando-sedrez", "Fernando Sedrez", "Staff AI Platform Engineer, Globo", "GDE", "assets/img/lineup/fernando-sedrez.webp", "https://linkedin.com/in/fmsedrez"],
  ["victor-ulisses-pugliese", "Victor Ulisses Pugliese", "Researcher, Federal University of São Paulo", "GDE", "assets/img/lineup/victor-ulisses-pugliese.webp", "https://www.linkedin.com/in/victorpug-exe/"],
  ["gustavo-caetano", "Gustavo Caetano", "Head de Educação na LINUXtips", "", "assets/img/lineup/gustavo-caetano.webp", "https://www.linkedin.com/in/oguscaetano/"],
  ["isaque-dias-coelho", "Isaque Dias Coelho", "CI&T - Android Developer Senior", "", "assets/img/lineup/isaque-dias-coelho.webp", "https://www.linkedin.com/in/isaque-coelho/"],
  ["amanda-araujo-duaibs", "Amanda Araújo Duaibs", "Analista BI", "", "assets/img/lineup/amanda-araujo-duaibs.webp", "https://www.linkedin.com/in/amanda-duaibs/"],
  ["felipe-gustavo-silva-teodoro", "Felipe Gustavo Silva Teodoro", "Head of Data Science e Co-Founder na Kogui", "", "assets/img/lineup/felipe-gustavo-silva-teodoro.webp", "https://www.linkedin.com/in/teodorofelipe/"],
  ["paulo-candido", "Paulo Cândido", "Tech Lead na TOTVS", "", "assets/img/lineup/paulo-candido.webp", "https://www.linkedin.com/in/paulhenriquev/"],
  ["emerson-dos-santos-queiroz", "Emerson dos Santos Queiroz", "Timbira, Consultor de Banco de Dados", "", "assets/img/lineup/emerson-dos-santos-queiroz.webp", "https://www.linkedin.com/in/emerson-dos-santos-queiroz-95595761/"],
  ["angelica-oliveira", "Angelica Oliveira", "Senior Automation Engineer, Airbnb", "GDE", "assets/img/lineup/angelica-oliveira.webp", "https://www.linkedin.com/in/angelica-oliv/"],
  ["vinicius-tavares", "Vinicius Tavares", "Gestor de TIC e Cibersegurança no Exército Brasileiro; Consultor de Cybersecurity na Divisão LTDA; Instrutor na GoHacking", "", "assets/img/lineup/vinicius-tavares.webp", "https://www.linkedin.com/in/vinicius-tavares-cyber/"],
  ["guilherme-henrique-da-silva", "Guilherme Henrique da Silva", "Sr Software Engineer Totvs", "", "assets/img/lineup/guilherme-henrique-da-silva.webp", "https://www.linkedin.com/in/br4tech/"],
  ["marco-ollivier", "Marco Ollivier", "Sr Staff Software Engineer @ Neon", "", "assets/img/lineup/marco-ollivier.webp", "https://linkedin.com/in/marcopollivier"],
  ["toshi-ossada", "Toshi Ossada", "Specialist, Farmácias APP", "GDE", "assets/img/lineup/toshi-ossada.webp", "https://www.linkedin.com/in/toshiossada/"],
  ["nakyta-nara-lucca", "Nakyta Nara Lucca", "Gerente de Projetos", "", "assets/img/lineup/nakyta-nara-lucca.webp", "https://www.linkedin.com/in/nakyta-lucca/"],
  ["davi-borges-pena", "Davi Borges Pena", "Founder", "", "assets/img/lineup/davi-borges-pena.webp", "https://www.linkedin.com/in/daviborgespena"],
  ["alexandre-cabral", "Alexandre Cabral", "Senior Software Engineer, Alpaca", "GDE", "assets/img/lineup/alexandre-cabral.webp", "https://www.linkedin.com/in/alexandre-cabral-bedeschi/"],
  ["beatriz-moraes-souza-rodrigues", "Beatriz Moraes Souza Rodrigues", "Analytics Engineer no Albert Einstein", "", "assets/img/lineup/beatriz-moraes-souza-rodrigues.webp", "https://www.linkedin.com/in/beatrizmsrodrigues"],
  ["fabio-baldin", "Fabio Baldin", "Fabrica de Inovação Limeira - Diretor Geral", "", "assets/img/lineup/fabio-baldin.webp", "https://br.linkedin.com/in/fabiobaldin"],
  ["jesse-freitas", "Jessé Freitas", "levva - CTO", "", "assets/img/lineup/jesse-freitas.webp", "https://www.linkedin.com/in/jesse--freitas"],
  ["vinicius-rodrigues-da-cunha-perallis", "Vinicius Rodrigues da Cunha Perallis", "CEO da Hacker Rangers", "", "assets/img/lineup/vinicius-rodrigues-da-cunha-perallis.webp", "https://www.linkedin.com/in/vperallis/"],
  ["sara-bandeira-coutinho", "Sara Bandeira Coutinho", "Banco do Brasil | Assessor de TI III", "", "assets/img/lineup/sara-bandeira-coutinho.webp", "https://www.linkedin.com/in/sarabcoutinho/"],
  ["julia-cansado", "Júlia Cansado", "Developer, Lab. QUAPÁ / Solved", "GDE", "assets/img/lineup/julia-cansado.webp", "https://www.linkedin.com/in/julia-cansado/"],
  ["joao-otavio-de-goes", "João Otávio de Góes", "San Jose Institute of Technology, Coordenador", "", "assets/img/lineup/joao-otavio-de-goes.webp", "https://www.linkedin.com/in/j0hngoes/"],
  ["marcelo-pinheiro", "Marcelo Pinheiro", "Fellow AI Enginner - Levva", "", "assets/img/lineup/marcelo-pinheiro.webp", "https://www.linkedin.com/in/marcelo-c-pinheiro/"],
  ["irina-bezzan-miquelin", "Irina Bezzan Miquelin", "Diretora de RH - Jobstar", "", "assets/img/lineup/irina-bezzan-miquelin.webp", "https://www.linkedin.com/in/irinabezzanmiquelin"],
  ["larissa-azevedo", "Larissa Azevedo", "Microsoft MVP | Mentora de carreira | Software Engineer", "", "assets/img/lineup/larissa-azevedo.webp", "https://www.linkedin.com/in/larissasazevedo/"],
  ["helson-carlos-dos-santos", "Helson Carlos dos Santos", "Senior Software Engineer - BMW TechWorks Brasil", "", "assets/img/lineup/helson-carlos-dos-santos.webp", ""],
  ["thais-santos-souza", "Thaís Santos Souza", "Arquiteta de Soluções Sênior no Bradesco", "", "assets/img/lineup/thais-santos-souza.webp", "https://www.linkedin.com/in/thaís-santos-souza-b05845112"],
  ["ana-paula-rodrigues", "Ana Paula Rodrigues", "CEO JOBSTAR", "", "assets/img/lineup/ana-paula-rodrigues.webp", "https://www.linkedin.com/in/anacomunic"],
  ["olivar-tamele", "Olivar Tamele", "Tech Lead Mobile - iRancho", "", "", ""],
  ["maycon-silva", "Maycon Silva", "Product Manager & Software Architect, Bosch", "", "", ""],
  ["arthur-dos-santos-almeida-tatay", "Arthur dos Santos Almeida Tatay", "Desenvolvedor Sênior na Globo", "", "", ""],
  ["alexandra-regina-cavalleiros", "Alexandra Regina Cavalleiros", "Otimizale Soluções em T.I. Ltda", "", "", ""],
];

/** Nome por extenso de cada selo (o selo curto, "GDE", vai no cartão e na foto; o por extenso, na faixa da palestra). */
const LINEUP_BADGE_LABELS = { GDE: "Google Developer Expert" };
const LINEUP_SPEAKERS = LINEUP_SPEAKER_ROWS.map(([id, name, title, badge, photo, linkedin]) => ({ id, name, title, company: "", ...(badge && { badge, badgeLabel: LINEUP_BADGE_LABELS[badge] ?? badge }), photo, linkedin }));

/** `[título, id do palestrante, descrição, formato (opcional, padrão "palestra")]` por posição do slot de palestra (0 = 09:00 ... 8 = 16:30); `null` = vaga em aberto. Todas começam como "palestra". */
const lineupTalk = row => row && { title: row[0], format: row[3] ?? "palestra", ...(row[4] && { highlight: row[4] }), tags: [], speakerIds: [row[1]], description: row[2] }; // 4º item (opcional): o formato ("" = sem chip de formato); 5º (opcional): o destaque de sessão (data/talk-highlights.js), ex. "maonamassa" (sem concurso)
const LINEUP_TALKS_BY_TRACK = {
  ia: [
    ["O Poder do Low-Code: Criando aplicativos com ferramentas Microsoft (Power Apps)", "ana-andrade-gonsalves", "Ana Andrade Gonsalves é Microsoft MVP em Power Apps e atua como consultora há mais de 5 anos no desenvolvimento de soluções Low-Code. Como criadora de conteúdo no YouTube e LinkedIn, tem a missão de democratizar o desenvolvimento low-code e o design (UI/UX). Seu foco é capacitar a comunidade técnica a explorar todo o potencial do ecossistema Microsoft na criação de aplicações reais e impactantes.\n\nNesta apresentação, vamos direto ao ponto: como o low-code resolve problemas do mundo real. Através de cases aplicados, demonstrarei o verdadeiro potencial das ferramentas Microsoft para o desenvolvimento de soluções robustas, escaláveis e com excelente usabilidade. O público pode esperar uma visão prática de como explorar a capacidade máxima do Power Apps para superar desafios técnicos do dia a dia, acelerar entregas e criar aplicativos que geram alto valor para o negócio."],
    null,
    ["The Gemma Era: Google's Family of Open Models", "victor-ulisses-pugliese", "Victor, a PhD student at UNIFESP and a master's degree student at ITA, has over 10 years of industry experience and a portfolio of 15+ scientific publications 🎓."],
    ["Do Prompt ao Time: Orquestrando Subagentes de IA no Desenvolvimento Real", "paulo-candido", "IA generativa já não é sobre um prompt bem escrito, é sobre um time bem estruturado. Nesta palestra, a partir da experiência real de construção do projeto Agenda Tech, vamos discutir como organizar subagentes com papéis, contratos e limites de contexto claros, transformando o desenvolvimento assistido por IA em um processo previsível, escalável e correto, e não em tentativa e erro."],
    ["Do Vibe Coding à Engenharia com IA: Dominando contexto, prompts e tooling para entregas reais", "guilherme-henrique-da-silva", "O termo Vibe Coding tomou conta da comunidade: a ideia sedutora de programar apenas trocando uma ideia descompromissada com a IA até a aplicação nascer. Mas o que acontece quando a \"vibe\" encontra regras de negócio complexas, débitos técnicos e o temido deploy de sexta-feira?\nNesta palestra bem-humorada, vamos desmistificar o hype e mostrar como sair da ilusão do \"aceita tudo no Tab\" para uma verdadeira Engenharia de Software Assistida por IA"],
    ["Mais com Menos: Seleção do Pool de Classificadores Visando Melhoria do Desempenho.", "sara-bandeira-coutinho", "Sistemas de múltiplos classificadores (MCS) é uma estratégia eficaz para melhoria do desempenho de modelos de classificação, mas seu sucesso é dependente da diversidade entre os classificadores escolhidos. Ter mais classificadores não implica em melhoria do sistema. Assim, a proposta da palestra é apresentar os conceitos de base e a arquitetura que adotei na  minha pesquisa de mestrado para essa seleção: clusterização hierárquica sobre a avaliação da diversidade feita. O projeto foi aplicado sobre detecção de fake news, em cenários com 2 e 6 classes e diversos contextos. A ideia é apresentar isso. Esse projeto rendeu um artigo publicado no IEEE SMC 2025. Se for possível também pretendo abordar modelos modernos que se apoiam em ideias similares do uso de diversos especialistas juntos, como arquiteturas MoE (Misture of Experts). Assim, objetiva-se que o publico saia com uma compreensão sobre o tema e possível paralelo com modelos mais recentes da IA."],
    ["Creating your first AI Agent with Go", "alexandre-cabral", "Engenheiro de software sênior e \"quebrador de código\" brasileiro de Minas Gerais. Apaixonado por Go e orgulhoso pai de gato laranja. Cofundador e organizador de comunidade da Tech Hub JF, organização brasileira sem fins lucrativos de eventos de tecnologia. Mentor e palestrante internacional, com passagens por GopherCon Latam, GoLab e ContainerDays."],
    ["Evals: Técnicas de avaliação de aplicações com LLM", "marcelo-pinheiro", "Como você sabe qual modelo escolher? Se as respostas do seu RAG estão boas o suficiente?"],
    ["Do C4 Model ao Prompt: Como Documentação Visual Gera Código de Alta Qualidade via IA", "helson-carlos-dos-santos", "Demonstração prática de como criar um C4 Model (Containers/Componentes) e um Diagrama de Sequência.\nComo traduzir diagramas visuais diretamente em prompts estruturados para LLMs/Copilot.\nCódigo gerado por \"prompt vago\" vs. Código gerado por \"prompt baseado em diagramas de arquitetura\" (mostrando falhas de segurança e acoplamento na prática).\nPúblico alvo: Desenvolvedores de todos os níveis que querem usar IA no dia a dia sem criar código \"espaguete\" ou dívida técnica."],
  ].map(lineupTalk),
  webdata: [
    ["Expansão de Domínio: Construindo Aplicações AI-Native com Angular, Agent Skills e Jujutsu Kaisen", "alvaro-camillo-neto", "Álvaro é engenheiro de software, palestrante e instrutor no Brasil. Atua há mais de 10 anos na indústria de tecnologia, desenvolvendo soluções de negócio em uma grande empresa do setor. Entusiasta de tecnologia, vê o compartilhamento de conhecimento como a melhor forma de aprender e de retribuir à comunidade que tanto o ajudou. Acredita na tecnologia como ferramenta para empoderar pessoas. Já palestrou de pequenos meetups a grandes eventos, com foco em desenvolvimento de soluções web. Também compartilha conhecimento em seu blog (https://alvarocamillont.dev/) e participa da organização do AngularSP."],
    ["Seu agente de IA pode executar SQL. Mas deveria?", "dickson-s-guedes", "Conectar um agente de IA a um banco de dados por meio do Model Context Protocol (MCP) abre possibilidades para consultas, diagnósticos e automação. Mas também introduz riscos de acesso indevido, vazamento de informações e execução de operações não autorizadas.\n\nNesta palestra, veremos como funciona a integração entre agentes, servidores MCP e PostgreSQL, comparando uma implementação ingênua com uma arquitetura que utiliza privilégios e isolamentos adequados."],
    ["O fim do Dashboard? Quando os AI Agents passam a conversar com seus dados.", "felipe-gustavo-silva-teodoro", "O dashboard prometeu democratizar os dados, mas na maioria das empresas só uma parte pequena das pessoas usa BI de fato. Com os AI Agents isso começa a mudar: em vez de procurar a resposta em um painel, a pessoa faz a pergunta e o agente planeja, consulta o banco, verifica o resultado e entrega a resposta.\n\nNesta palestra vou mostrar o que é um AI Agent e como ele difere de um modelo generativo comum. Também vou explicar por que o Text2SQL simples funciona bem em sala de aula, mas falha nas bases reais das empresas. Por fim, vou falar do papel do MCP, da camada semântica e da governança para tornar essas respostas confiáveis.\n\nO ponto alto é uma demonstração construída com Google ADK. Um copiloto de uma única chamada, um agente com ferramentas e um agente com skills respondem às mesmas perguntas de negócio. O placar mostra na prática o que separa um chatbot de um agente de dados.\n\nFecho com o panorama do mercado em 2026 (Databricks, Snowflake, Microsoft, Google, OpenAI e casos brasileiros), os riscos que ninguém conta no keynote e um checklist para começar. O público sai sabendo se o dashboard morreu ou se só deixou de ser o destino.\n\nMinibio:\n\nFelipe Teodoro é fundador da Kogui Tecnologia, consultoria de IA e dados, eAdvisor na Cognus Capital. É professor do MBA em Data Science & AI da FIAP e doutorando em Sistemas de Informação na EACH-USP, onde pesquisa wavelets aprendíveis para séries temporais financeiras. Tem mais de 20 anos em TI e é mestre pela USP."],
    ["Os impactos por trás do código que nós construímos", "arthur-dos-santos-almeida-tatay", "Uma reflexão sobre responsabilidade, impacto da Inteligência Artificial e inovação organizacional. A palestra fala de acidentes causados por software (como o Therac-25) e de modelos de IA enviesados contra minorias, da importância das boas práticas de engenharia (testes, code review, documentação) mesmo na era da IA, e de como a IA tem mudado a forma de trabalhar, os empregos e o futuro da organização corporativa."],
    ["Creating AI agents for task execution in Google Earth Engine", "julia-cansado", "Meu nome é Júlia. Nasci em São Paulo e vivi a maior parte da vida na região metropolitana. Cursei arquitetura e urbanismo e me interessei por dados espaciais, principalmente sobre temas e análises urbanas. Nos últimos anos da graduação, comecei a estudar linguagens de programação como R e JavaScript (principalmente para usar o Earth Engine) e sensoriamento remoto. Desde então trabalho como desenvolvedora e analista. Além das áreas urbanas, já explorei outros temas, como detecção de mineração e mapeamento de recifes de coral rasos. Algo que me apaixona é a representação: sempre gostei de desenhar desde pequena e, na universidade e em outras oportunidades, passei a explorar a produção e a visualização de dados."],
    ["Projetos de Dados: usando ferramentas de predição, BI e Engenharia", "beatriz-moraes-souza-rodrigues", "O verdadeiro impacto de uma área de dados acontece quando a infraestrutura encontra a inteligência de negócios. Nesta palestra, discutiremos como estruturar Projetos de Dados que unem o rigor da Engenharia, a clareza do Business Intelligence e a visão de futuro das ferramentas de Predição. Abordaremos os desafios comuns de integração entre equipes e tecnologias, e como criar um fluxo onde os dados não apenas explicam o que aconteceu ontem, mas prevêem o que vai acontecer amanhã. Um guia essencial para liderar e executar projetos que entregam resultados tangíveis."],
    ["Programação Funcional com Go. Possibilidade ou Forçação de barra?", "marco-ollivier", "Senior Staff Software Engineer na Neon, professor da FIAP e mantenedor Open Source, Marco Ollivier ajuda organizações de engenharia a entregar software com mais velocidade, qualidade e escalabilidade. Há mais de 17 anos na área, desenvolvendo plataformas distribuídas, liderando iniciativas de arquitetura e acelerando a produtividade de equipes em empresas como Nubank, OLX e Flash. Também atua como palestrante em alguns dos principais eventos de tecnologia do país."],
    null,
    ["O Mercado de Cobol", "thais-santos-souza", "mercado de mainframe, atuação neste mercado e modernização deste ecossistema."],
  ].map(lineupTalk),
  mobile: [
    ["Liderança Técnica Sob Pressão: Lições do \"Caos\" entre a Arquitetura e o Negócio", "maycon-silva", "Lições de liderança técnica sob pressão: como conduzir decisões na ponte entre a arquitetura e o negócio."],
    ["IA: saindo do hype para o ROI", "leandro-garcia", "Usar IA já não basta para se diferenciar. O que importa é o resultado que você e sua equipe estão gerando com ela.\n\nLeandro Garcia, cofundador da i9 Flow, mostra por que ganhar tempo e produzir mais nem sempre melhora o negócio e o que precisa mudar para isso acontecer. Com exemplos práticos e uma demonstração ao vivo, a palestra conecta o uso da IA aos processos, às metas e às decisões de quem lidera equipes."],
    ["A IA escreveu o código. Quem garante o app?", "isaque-dias-coelho", "Quero apresentar um fluxo pratico de desenvolvimento de um app nativo android utilizando IA, não focando no código, mas no que realmente importa em um app utilizável: testes, qualidade de código, arquitetura, code review e validação no emulador. \n\nEscrever código com IA é fácil, quero mostrar como garantimos a qualidade de verdade."],
    ["From Prompt to Stores: Building a Multiplatform (Android & iOS) App from Scratch with KMP and AI", "angelica-oliveira", "Trabalho com desenvolvimento Android desde 2012. Nesse período atuei principalmente em startups e consultorias, criando aplicativos para diversos segmentos, como educação, saúde, finanças e comércio. Também tive a oportunidade de trabalhar em grandes projetos existentes, ajudando a repensar a arquitetura em estratégias de refatoração. Além de desenvolver novas funcionalidades para aplicativos Android, também construí ambientes de CI/CD do zero, com cobertura de testes automatizados, tarefas Gradle personalizadas para automatizar a atualização de versão, distribuição via Firebase ou Google Play, verificações de lint e mais. Ao longo dessa experiência, trabalhei em times pequenos e grandes, como desenvolvedora e, mais recentemente, como líder técnica em projetos maiores, ajudando os times a seguir boas práticas de código e a resolver problemas técnicos e de segurança. Também sou ativa em comunidades de desenvolvedores: produzo conteúdo técnico, apresento palestras em eventos pequenos e grandes, escrevo artigos, implemento projetos de exemplo e compartilho com a comunidade pelo GitHub.", "", "maonamassa"],
    ["Do Discovery à Produção: 32 dias de IA Agêntica e um SaaS Hiperpersonalizado.", "fabio-baldin", "Nesta palestra, falaremos sobre como foi conduzida a criação de um SaaS hiperpersonalizado, do Discovery à Produção, em 32 dias, usando IA Agêntica. Abordaremos desde o entendimento do problema, a engenharia de contexto, e a orquestração de agentes até a integração entre produto, desenvolvimento, testes e segurança.\n\nO público pode esperar um case real, com decisões, desafios, erros e aprendizados, mostrando como combinar experiência humana e agentes de IA para transformar uma necessidade de negócio em software em produção.\n\nE, para apresentar os papéis dessa squad agêntica, teremos uma participação especial dos personagens de Street Fighter."],
    ["Vamos falar de Inteligência Artificial? Desenvolvendo Apps Inteligentes com Flutter e Gemini", "toshi-ossada", "Com a paixão por tecnologia despertada em 2006, Toshi Ossada é um desenvolvedor de software de destaque, com contribuições importantes para a comunidade Flutter brasileira. Em quase duas décadas, criou aplicativos de alto desempenho em diversos setores, atuando em empresas como CVC, Raízen, DPaschoal, Coca-Cola, Makro Atacadista, Grupo Santa Cruz e Sage. Hoje é Mobile Tech Lead na FarmaciasApp, onde lidera o desenvolvimento de soluções móveis que transformam o setor farmacêutico. É reconhecido como pioneiro do Flutter no Brasil e fundador da Flutter Brasil, iniciativa dedicada ao aprendizado e à colaboração entre pessoas que usam Flutter. Por meio da Flutter Brasil, de eventos, workshops e conteúdo online, já impactou mais de 20 mil pessoas. Esse trabalho de crescimento da comunidade e compartilhamento de conhecimento foi reconhecido com o prêmio Microsoft Most Valuable Professional (MVP) na categoria Developer Technologies. Toshi também é organizador do GDG Americana, palestrante e criador de conteúdo sobre Flutter. São mais de 90 contribuições, que você pode conferir em https://docs.google.com/document/d/1-EI1eQBHZLUWg8i_w7yrDtw6LO4PsAKZQLa8RwPyuF0/edit#heading=h.pawzzlj1tfu6"],
    null,
    ["On-Device vs. Cloud: Quando (e como) rodar modelos localmente para reduzir latência e custos.", "olivar-tamele", "Quando rodar modelos de IA no próprio dispositivo e quando usar a nuvem: como decidir para reduzir latência e custos em apps mobile."],
    null,
  ].map(lineupTalk),
  mentoring: [
    ["Além do Código", "gabriel-rodrigues-de-souza", "Nem sempre quem evolui mais na carreira é o melhor tecnicamente, e sim quem consegue ser entendido e fazer o time avançar junto. Nesta palestra, mostro como a comunicação escrita, falada e assíncrona impacta sua visibilidade, sua confiança e suas oportunidades"],
    null,
    ["Seu desenvolvedor ficou 10x mais rápido. Seu SDLC não.", "jesse-freitas", "A IA acelerou o desenvolvedor, mas o SDLC acompanhou? Nesta palestra, vamos explorar a evolução de copilotos para agentes, passando por Agentic Engineering, Context Engineering, qualidade, evals e governança — e como preparar o ciclo de desenvolvimento para entregar resultados verificáveis, não apenas código mais rápido.\n\nJessé Freitas é CTO da Levva, com MBA em Arquitetura de Soluções pela FIAP. Atua há mais de 20 anos em tecnologia, liderando times e iniciativas de engenharia, dados e IA, com foco na aplicação prática de IA no desenvolvimento de software."],
    ["Longevidade Profissional e IA como ferramenta de reinvenção para a sua carreira", "alexandra-regina-cavalleiros", "Como a IA pode ser uma ferramenta de reinvenção e de longevidade profissional na carreira em tecnologia."],
    ["Você provavelmente já faz pitch. Só talvez não chame isso de pitch.", "nakyta-nara-lucca", "Fazer um pitch não é apenas apresentar uma startup, vender um produto ou participar de um hackathon. No dia a dia profissional, estamos constantemente apresentando ideias, projetos, soluções, nossas competências e muitas vezes precisamos fazer isso em poucos minutos. Nesta palestra, vamos entender o que caracteriza um bom pitch, como selecionar as informações mais relevantes e como organizá-las de acordo com o público e o objetivo da conversa. Também vamos discutir como comunicar valor, gerar interesse e tornar uma mensagem mais clara, objetiva e convincente."],
    ["Infiltradas em Tech: mulheres que encontraram seu espaço além do código", "amanda-araujo-duaibs", "Será que para trabalhar com tecnologia é preciso ser desenvolvedora?\nMulheres com caminhos diferentes e uma mesma área: Tech. Dados, Agilidade, Comunidade e tecnologia se encontram em uma conversa sobre carreira, barreiras e oportunidades para mulheres que nem sempre começaram — ou atuam — diretamente no código. \nA partir das nossas próprias experiências e das histórias de mulheres pioneiras como Ada Lovelace e Florence Nightingale, vamos discutir como mulheres historicamente ocuparam espaços de inovação mesmo quando esses espaços não pareciam ter sido feitos para elas. Uma conversa sobre entrar, permanecer e construir espaço em Tech, mesmo quando você não se encaixa no estereótipo de quem trabalha com tecnologia.\nE quem somos? Mulheres que trabalham com tecnologia por diferentes portas de entrada."],
    ["Marketing digital para pequenos empreendedores", "bianca-bordon-weiller", "Como divulgar seu negócio de forma autêntica e eficiente. Uma palestra sobre marketing para quem tem poucos recursos: posicionamento, conteúdo e divulgação acessível para atrair clientes e fortalecer sua marca."],
    ["2035: Você Contrataria um Humano?", "irina-bezzan-miquelin", "2035: Você Contrataria um Humano?\nQuando a inteligência artificial se torna o candidato ideal, qual será o diferencial das pessoas?\n\nImagine um processo seletivo em 2035. De um lado, um profissional humano com anos de experiência. Do outro, um agente de inteligência artificial disponível 24 horas por dia, capaz de executar tarefas complexas, aprender continuamente e operar em escala. Quem você escolheria?\n\nNesta palestra, vamos explorar um futuro em que a inteligência artificial deixa de ser apenas uma ferramenta e passa a integrar as equipes como força de trabalho digital.\n\nCom uma abordagem futurista e provocativa, discutiremos a evolução do recrutamento, os impactos dos agentes autônomos nas profissões de tecnologia, os desafios da formação de talentos e as competências humanas que poderão se tornar ainda mais valiosas.\n\nA partir da perspectiva de uma liderança de RH em uma HR Tech, vamos questionar como as organizações selecionarão talentos, distribuirão responsabilidades entre humanos e máquinas e redefinirão o próprio conceito de trabalho.\n\nO público pode esperar cenários distópicos, dilemas éticos, tendências tecnológicas e reflexões sobre uma pergunta desconfortável: em um mundo onde a inteligência artificial pode executar cada vez mais atividades, por que uma empresa escolheria contratar você?\n\nEmpreendedora e executiva com mais de 30 anos de experiência nas áreas de Operações e Recursos Humanos, com trajetória dedicada à conexão entre pessoas, negócios, tecnologia e inovação.\n\nCEO da Talentx Digital, empresa especializada em recrutamento e seleção de profissionais de Tecnologia, Inovação, Produtos Digitais e Design, e Diretora de RH da Jobstar AI, plataforma de inteligência artificial aplicada ao recrutamento e à gestão de talentos.\n\nPresidente da Associação Campinas Tech, membro do Conselho Municipal de Tecnologia e Inovação de Campinas, investidora-anjo e mentora de startups, atua ativamente no desenvolvimento do ecossistema de tecnologia, inovação e empreendedorismo.\n\nPalestrante sobre o futuro do trabalho, inteligência artificial e transformação das carreiras, dedica-se a explorar como a evolução tecnológica está redefinindo as profissões, as competências humanas e as relações entre pessoas e máquinas.\n\nSua visão combina experiência executiva, inovação e uma perspectiva futurista sobre os desafios e as oportunidades de um mundo em que humanos e inteligências artificiais passarão a compartilhar cada vez mais decisões, responsabilidades e espaços de trabalho."],
    ["A Promessa da IA", "ana-paula-rodrigues", "A Promessa da IA\n\nProdutividade, saúde e os limites de trabalhar na era da inteligência artificial.\n\nA inteligência artificial chegou com uma grande promessa: automatizar tarefas, aumentar a produtividade e nos devolver tempo. Mas será que estamos realmente trabalhando menos ou apenas encontrando novas formas de trabalhar mais?\n\nA partir de pesquisas recentes sobre o impacto da IA na rotina de profissionais de tecnologia, a palestra explora o paradoxo da produtividade: quanto mais eficientes nos tornamos, maiores podem ser as expectativas, as demandas e a dificuldade de desconectar.\n\nCom uma abordagem prática e baseada em evidências, vamos discutir os impactos da hiperconectividade, da sobrecarga cognitiva e do excesso de trabalho na saúde física e mental. Mais do que apontar problemas, a proposta é apresentar estratégias para estabelecer limites, preservar a atenção, melhorar a qualidade do descanso e utilizar a inteligência artificial de maneira mais consciente.\n\nAfinal, a tecnologia deve ampliar nossas possibilidades, não consumir nossa saúde. Como podemos aproveitar todo o potencial da IA sem ultrapassar os limites do nosso próprio corpo e mente?"],
  ].map(lineupTalk),
  cloudsec: [
    ["Otimizando a Performance do PostgreSQL no GCP: Insights, Extensões e Logs", "emerson-dos-santos-queiroz", "Aprenda a eliminar os pontos cegos do seu banco de dados no Google Cloud explorando um fluxo prático de diagnóstico de performance. Começaremos pelos alertas do painel nativo da GCP, mergulhando nas métricas do pg_stat_statements e utilizando o PGBadger para análises profundas, entregando um mapa prático para otimizar o consumo de recursos e melhorar os tempos de resposta das suas queries"],
    ["Architectural Patterns for Multi-Agent Cloud Systems with Gemini Enterprise Agent Platform", "fernando-sedrez", "Fernando Sedrez é staff engineer com mais de 15 anos de experiência em tecnologia. Apaixonado por compartilhar conhecimento sobre a área de dados e ajudar outras pessoas a aprender e crescer."],
    ["Construindo a melhor arquitetura do mundo", "gustavo-caetano", "Passamos anos dominando linguagens de programação, provisionando servidores resilientes e desenhando soluções em cloud com alta disponibilidade tolerante a qualquer desastre, mas frequentemente insistimos em rodar a aplicação mais complexa e crítica de todas, nós mesmos, em uma infraestrutura negligenciada, operando a 100% de CPU e sem qualquer camada de observabilidade configurada. A melhor arquitetura do mundo não roda em datacenters, mas na capacidade de integrar mente, corpo, dinheiro e comunidade para manter você verdadeiramente sustentável no longo prazo."],
    ["Carreira, Estratégia e Lições da Experiência Militar", "vinicius-tavares", "Fazer a transição de um ambiente tradicional e estruturado, como as Forças Armadas, para a velocidade do mercado civil de cibersegurança traz desafios e aprendizados únicos. Nesta palestra, vou compartilhar os bastidores da minha transição para a área de tecnologia e atuação como especialista em cibersegurança ofensiva e pentest. Vamos conversar sobre como a capacidade de planejamento, mindset, inteligência tática e resiliência aprendidas na caserna não apenas facilitaram essa mudança de percurso, mas se tornaram meu maior diferencial para antecipar ameaças, conduzir análises de risco e lidar com incidentes no dia a dia da segurança da informação.\n\nO que o público vai aprender:\n- A Ponte entre Dois Mundos: Como transicionar de carreiras tradicionais para a área de tecnologia aproveitando soft skills e outras experiências.\n- Planejamento e Execução em Pentest: O uso de princípios militares para entender a mente do atacante e mitigar vulnerabilidades reais.\n- Construção de Valor no Mercado: Como transformar vivências fora da TI tradicional em vantagens competitivas na sua carreira técnica.\n\nEsta palestra traz uma visão autêntica e inspiradora sobre transição de carreira, mostrando à comunidade de tecnologia como repertórios multidisciplinares fortalecem a atuação técnica e estratégica em cibersegurança."],
    ["Deixe a segurança de lado - Gestão de Segurança para Desenvolvedores", "davi-borges-pena", "Uma palestra irônica para devs saberem o ponto de vista de quem cuida de cyber, gosta de código aberto e adora guardrails.\nDavi é autista, com laudo e hiper foco em tecnologia, é nessa palestra vai falar sobre gestão de segurança da informação para desenvolvedores, mostrando o que a indústria pede sem ficar falando de ci/cd, devsecops e idolatrando o vibe coding. Vamos falar sobre não reinventar a roda, usar aplicações de código aberto, políticas, Supply Chain, guardrails para que usa IA e rotinas de segurança da informação."],
    ["Vença o Jogo contra o Cibercrime", "vinicius-rodrigues-da-cunha-perallis", "Em “Vença o Jogo Contra o Cibercrime”, Vinicius Perallis apresenta, de forma leve e acessível, os desafios da cibersegurança no mundo atual e mostra por que proteger nossos dados e informações se tornou tão importante diante de ataques cada vez mais sofisticados e perigosos.\n\nA partir de sua trajetória e da história por trás da criação da Hacker Rangers, Vinicius compartilha como a gamificação pode transformar a conscientização em cibersegurança, tornando o aprendizado mais envolvente, estimulando mudanças de comportamento e ajudando as pessoas a assumirem um papel ativo na proteção digital."],
    ["Criptografia Pós-Quântica e a Era Que Revolucionou a Computação", "joao-otavio-de-goes", "Estamos preparados para uma era em que os computadores poderão desafiar os fundamentos matemáticos que protegem nossas informações?\n\nNesta palestra, exploro a evolução da criptografia, desde suas origens até os algoritmos modernos, passando pelos princípios fundamentais da física e da computação quântica para compreender como essas tecnologias poderão transformar a segurança da informação.\n\nAbordarei as ameaças que a computação quântica representa para os sistemas criptográficos atuais, as diferenças entre criptografia quântica e pós-quântica e, principalmente, como a criptografia pós-quântica está sendo desenvolvida para enfrentar esses novos desafios.\n\nPor fim, traremos a evolução desse campo, os principais algoritmos, padrões e tecnologias disponíveis atualmente, além dos caminhos para preparar sistemas, aplicações e comunicações para a era pós-quântica."],
    ["Segurança começa na interface: riscos que o front-end ainda deixa passar para produção", "larissa-azevedo", "Segurança costuma ser tratada como uma responsabilidade exclusiva de back-end, infraestrutura ou times especializados. Só que muitas vulnerabilidades começam em decisões de interface: informações expostas sem necessidade, permissões tratadas apenas visualmente, dependências inseguras, armazenamento inadequado de dados e validações que existem apenas no navegador.\n\nNesta palestra, vamos percorrer riscos frequentes em aplicações front-end e discutir como incorporá-los às decisões diárias de desenvolvimento. O objetivo é desenvolver uma visão mais responsável sobre o que o front-end controla, comunica e precisa proteger."],
    null,
  ].map(lineupTalk),
};

const lineupSpeakersRepository = createRepository(LINEUP_SPEAKERS, { getById: id => LINEUP_SPEAKERS.find(speaker => speaker.id === id) });
const lineupTalksRepository = createRepository(LINEUP_TALKS_BY_TRACK, { getFor: (trackId, index) => LINEUP_TALKS_BY_TRACK[trackId]?.[index] ?? undefined });

/**
 * Line-up REAL (trilhas, palestrantes e palestras de `LINEUP_*`) só aparece depois da revelação (`EVENT.lineupRevealed`) ou em modo DEV (`?lineup=1`, ver `devLineupRequested` em
 * schedule-builder.js). Antes disso o público vê as 4 trilhas e o mock, como sempre. Na revelação: `lineupRevealed: true` e apagar o ramo mock (mock-*.js).
 */
const showRealLineup = !globalThis.DEVFEST_FORCE_MOCK_LINEUP && (EVENT.lineupRevealed || devLineupRequested()); // DEVFEST_FORCE_MOCK_LINEUP: só os testes de tela (DevFestIA/tools/lib/dom-harness.js), que checam o formato do mock
const TRACKS = showRealLineup ? LINEUP_TRACKS : PUBLIC_TRACKS;

function eventTime(hhmm) {
  return new Date(`${EVENT.date}T${hhmm}:00${EVENT.utcOffset}`);
}

/**
 * Plano do dia — palestra = 40 min (com perguntas) + 5 min de troca,
 * via talkWindows() de schedule-builder.js. Almoço 12:00-13:20 mais
 * 10 min pra voltar pra sala. `moment` (opcional) é o nome estável do bloco combinado ("registration", "opening", "lunch", "back-to-room", "closing"; um coffee entra
 * aqui como "coffee"): o mural do telão liga cenas por momento (`requires.moments`), então mudar o horário do almoço é editar SÓ esta grade. Talks mock vêm do catálogo; sem ele rotacionam o pool
 * o catálogo mock (mock-talks.js + mock-speakers.js) até o line-up real ser fechado.
 */
const DAY_PLAN = [
  { banner: "Credenciamento", moment: "registration", room: "Recepção", start: "08:00", end: "08:20" },
  { banner: "Abertura: GDG Campinas", moment: "opening", room: roomFor("Calçadão Central"), start: "08:20", end: "08:50" },
  { talks: talkWindows("09:00", 4) },
  { banner: "Almoço", moment: "lunch", start: "12:00", end: "13:20" },
  { banner: "Retorno para a sala", moment: "back-to-room", start: "13:20", end: "13:30" },
  { talks: talkWindows("13:30", 5) },
  { banner: "Encerramento", moment: "closing", room: roomFor("Calçadão Central"), start: "17:15", end: "18:00" },
];

const SCHEDULE = showRealLineup
  ? buildSchedule(DAY_PLAN, { eventTime, tracks: TRACKS, speakerPool: lineupSpeakersRepository.getAll(), talkCatalog: lineupTalksRepository, placeholderOptions: { rotateSpeakers: false } })
  : buildSchedule(DAY_PLAN, { eventTime, tracks: TRACKS, speakerPool: mockSpeakersRepository.getAll(), talkCatalog: mockTalksRepository });
