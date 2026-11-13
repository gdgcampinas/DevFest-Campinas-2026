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
  description: "Um dia de tecnologia em Campinas: 5 trilhas de palestras, comunidade e networking. 28 de novembro de 2026.",
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

/** As 5 trilhas do evento (2026-11-12): nomes da grade do Renato e frase de cada post. Valem em PROD e em DEV, só as palestras reais esperam a revelação. */
const TRACKS = [
  { id: "ia", label: "IA/Vibe Coding", shortLabel: "IA/Vibe Coding", room: roomFor("Observatório"), mc: "MC a definir", color: "var(--ia)", icon: "sparkles",
    description: "Uma pergunta pode abrir um mundo de possibilidades." },
  { id: "webdata", label: "Front-end / Back-end / Data - Full Stack", shortLabel: "Front/Back/Data - Full Stack", room: roomFor("Estação"), mc: "MC a definir", color: "var(--webdata)", icon: "code",
    description: "Da interface aos dados: conecte todas as partes." },
  { id: "mobile", label: "Mobile / Gerência de Projetos", shortLabel: "Mobile/Gerência de Projetos", room: roomFor("Lagoa do Taquaral"), mc: "MC a definir", color: "var(--mobile)", icon: "phone",
    description: "Do app ao plano de ação: ideias avançam em equipe." },
  { id: "cloudsec", label: "Cyber Segurança (Security) / Cloud", shortLabel: "Cyber Segurança/Cloud", room: roomFor("Torre do Castelo"), mc: "MC a definir", color: "var(--cloudsec)", icon: "shield",
    description: "Explore com confiança. Proteja o que importa." },
  { id: "mentoring", label: "Carreira em Tecnologia", shortLabel: "Carreira em Tecnologia", room: roomFor("Mercadão Central"), mc: "MC a definir", color: "var(--mentoring)", icon: "rocket",
    description: "Cada passo abre caminhos. O próximo também é seu." },
];

/**
 * LINE-UP REAL (grade do Renato, 2026-11-03): 5 trilhas x 9 palestras. Vaga vazia = `null` (aparece como "Título a confirmar", sem palestrante).
 * Cargo e nome vêm da grade; descrição, LinkedIn e foto vêm do C4P (foto ausente = iniciais). Nenhum e-mail ou telefone do C4P entra aqui. Só aparece em modo DEV (?lineup=1) até a revelação, ver `showRealLineup` abaixo.
 * `[id, nome, cargo, selo, foto, linkedin]`
 */
const LINEUP_SPEAKER_ROWS = [
  ["ana-andrade-gonsalves", "Ana Andrade Gonsalves", "Microsoft MVP", "", "assets/img/lineup/ana-andrade-gonsalves.webp", "https://www.linkedin.com/in/ana-andrade-in/"],
  ["alvaro-camillo-neto", "Alvaro Camillo Neto", "Staff Engineer, F1rst - Santander", "GDE", "assets/img/lineup/alvaro-camillo-neto.webp", "https://www.linkedin.com/in/alvarocamillont/"],
  ["leandro-garcia", "Leandro Garcia", "i9 Flow | co-founder", "", "assets/img/lineup/leandro-garcia.webp", "https://www.linkedin.com/in/LeandroGarcias/"],
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
  ["diego-marcos-moreira", "Diego Marcos Moreira", "IDCiber", "", "assets/img/lineup/diego-marcos-moreira.webp", "https://www.linkedin.com/in/diego-m-moreira/"],
  ["angelica-oliveira", "Angelica Oliveira", "Senior Automation Engineer, Airbnb", "GDE", "assets/img/lineup/angelica-oliveira.webp", "https://www.linkedin.com/in/angelica-oliv/"],
  ["vinicius-tavares", "Vinicius Tavares", "Gestor de TIC e Cibersegurança no Exército Brasileiro; Consultor de Cybersecurity na Divisão LTDA; Instrutor na GoHacking", "", "assets/img/lineup/vinicius-tavares.webp", "https://www.linkedin.com/in/vinicius-tavares-cyber/"],
  ["guilherme-henrique-da-silva", "Guilherme Henrique da Silva", "Sr Software Engineer Totvs", "", "assets/img/lineup/guilherme-henrique-da-silva.webp", "https://www.linkedin.com/in/br4tech/"],
  ["marco-ollivier", "Marco Ollivier", "Sr Staff Software Engineer QuintoAndar", "", "assets/img/lineup/marco-ollivier.webp", "https://linkedin.com/in/marcopollivier"],
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
  ["helson-carlos-dos-santos", "Helson Carlos dos Santos", "Senior Software Engineer - BMW TechWorks Brasil", "", "assets/img/lineup/helson-carlos-dos-santos.webp", "https://linkedin.com/in/helsonsant/"],
  ["thais-santos-souza", "Thaís Santos Souza", "Arquiteta de Soluções Sênior no Bradesco", "", "assets/img/lineup/thais-santos-souza.webp", "https://www.linkedin.com/in/thaís-santos-souza-b05845112"],
  ["ana-paula-rodrigues", "Ana Paula Rodrigues", "CEO JOBSTAR", "", "assets/img/lineup/ana-paula-rodrigues.webp", "https://www.linkedin.com/in/anacomunic"],
  ["olivar-tamele", "Olivar Tamele", "Tech Lead Mobile - iRancho", "GDE", "assets/img/lineup/olivar-tamele.webp", "https://www.linkedin.com/in/olivar-neemias/"],
  ["michael-douglas-barbosa-araujo", "Michael Douglas Barbosa Araujo", "Itaú - Especialista de arquitetura de IA/GenIA", "", "assets/img/lineup/michael-douglas-barbosa-araujo.webp", "https://www.linkedin.com/in/michaeldouglasbarbosa"],
  ["vinicius-pivetta", "Vinicius Pivetta", "Engenheiro de Analytics - Itaú", "", "assets/img/lineup/vinicius-pivetta.webp", "https://www.linkedin.com/in/viniciuspivetta"],
  ["valerio-matias", "Valério Matias", "Gerente de Desenvolvimento de Software, Bosch", "", "assets/img/lineup/valerio-matias.webp", "https://www.linkedin.com/in/valeriomatias/"],
  ["bruno-eleodoro-roza", "Bruno Roza", "Forward Deployed Engineer - Pods", "", "assets/img/lineup/bruno-eleodoro-roza.webp", "https://linkedin.com/in/brunoeleodoro"],
  ["robot-framework-a-confirmar", "Guilherme Martins", "Faber-Castell (engenheiro de dados) e Itera (desenvolvedor de software)", "", "assets/img/lineup/robot-framework-a-confirmar.webp", "https://www.linkedin.com/in/guilherme-martins-555671b3/"],
  ["arthur-dos-santos-almeida-tatay", "Arthur dos Santos Almeida Tatay", "Desenvolvedor Sênior na Globo", "", "assets/img/lineup/arthur-dos-santos-almeida-tatay.webp", "https://www.linkedin.com/in/arthursantosalmeida/"],
  ["alexandra-regina-cavalleiros", "Alexandra Regina Cavalleiros", "Otimizale Soluções em T.I. Ltda", "", "assets/img/lineup/alexandra-regina-cavalleiros.webp", "https://www.linkedin.com/in/alexandrareginacavalleiros/"],
  ["rodrigo-pokemaobr", "Rodrigo Wanderley (PokemaoBR)", "Developer Relations", "", "assets/img/lineup/rodrigo-pokemaobr.webp", "https://www.linkedin.com/in/pokemaobr/"],
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
    ["The Gemma Era: Google's Family of Open Models", "victor-ulisses-pugliese", "Entre na era Gemma. O Google apresentou uma nova família de modelos que muda o significado de IA aberta. Uma imersão clara e envolvente sobre o que é o Gemma, por que ele importa e como começar a usá-lo hoje: uma visão concisa de uma tecnologia agora acessível a todos."],
    ["O Novo Perfil do Dev Júnior em 2026: Sobrevivendo e Evoluindo na Era da IA", "paulo-candido", "O mercado mudou: o que era exigido de profissionais plenos virou o básico para juniores. Com a IA automatizando o trabalho operacional, as empresas buscam quem domina fundamentos sólidos.\nVeremos as habilidades reais para se destacar em 2026: versionamento avançado (Pull Requests e branches, não só git commit), integração de APIs, SQL e como usar a IA a seu favor sem virar refém dela. Também soft skills e como construir um perfil à prova de obsolescência."],
    ["Do Vibe Coding à Engenharia com IA: Dominando contexto, prompts e tooling para entregas reais", "guilherme-henrique-da-silva", "O termo Vibe Coding tomou conta da comunidade: a ideia sedutora de programar apenas trocando uma ideia descompromissada com a IA até a aplicação nascer. Mas o que acontece quando a \"vibe\" encontra regras de negócio complexas, débitos técnicos e o temido deploy de sexta-feira?\nNesta palestra bem-humorada, vamos desmistificar o hype e mostrar como sair da ilusão do \"aceita tudo no Tab\" para uma verdadeira Engenharia de Software Assistida por IA."],
    ["Mais com Menos: Seleção do Pool de Classificadores Visando Melhoria do Desempenho.", "sara-bandeira-coutinho", "Sistemas de múltiplos classificadores (MCS) melhoram o desempenho de modelos de classificação, mas o sucesso depende da diversidade entre os classificadores: ter mais classificadores não significa um sistema melhor. A palestra apresenta os conceitos de base e a arquitetura adotada na pesquisa de mestrado para selecionar o pool: clusterização hierárquica sobre a avaliação de diversidade, aplicada à detecção de fake news em cenários com 2 e 6 classes. O trabalho rendeu artigo publicado no IEEE SMC 2025.\nA palestra também conecta a ideia a modelos modernos que combinam vários especialistas, como as arquiteturas Mixture of Experts (MoE)."],
    ["Creating your first AI Agent with Go", "alexandre-cabral", "Vamos construir um agente conversacional inteligente com o ADK e o Gemini CLI, desenvolvendo toda a lógica do agente na linguagem Go. O agente terá personalidade própria, capacidade de fazer buscas na web e um avatar exclusivo gerado por IA, por meio de uma integração com o nano banana via MCP."],
    ["Evals: Técnicas de avaliação de aplicações com LLM", "marcelo-pinheiro", "Como você sabe qual modelo escolher? Se as respostas do seu RAG estão boas o suficiente?"],
    ["Do C4 Model ao Prompt: Como Documentação Visual Gera Código de Alta Qualidade via IA", "helson-carlos-dos-santos", "Demonstração prática de como criar um C4 Model (Containers/Componentes) e um Diagrama de Sequência.\nComo traduzir diagramas visuais diretamente em prompts estruturados para LLMs/Copilot.\nCódigo gerado por \"prompt vago\" vs. Código gerado por \"prompt baseado em diagramas de arquitetura\" (mostrando falhas de segurança e acoplamento na prática).\nPúblico alvo: Desenvolvedores de todos os níveis que querem usar IA no dia a dia sem criar código \"espaguete\" ou dívida técnica."],
  ].map(lineupTalk),
  webdata: [
    ["Expansão de Domínio: Construindo Aplicações AI-Native com Angular, Agent Skills e Jujutsu Kaisen", "alvaro-camillo-neto", "O desenvolvimento de software mudou: saímos do copiar e colar código gerado por LLMs para a engenharia agêntica, em que o desenvolvedor atua como arquiteto e revisor de decisões executadas por agentes autônomos. Como aplicar isso em uma aplicação Angular moderna? A palestra usa o estudo de caso do Culling Games Control Panel (Jujutsu Kaisen): do protótipo visual no Google AI Studio a uma aplicação de produção, combinando as novidades do Angular (Signal-based Forms, SSR, testes com Vitest e Playwright).\nTambém mostra como ensinar padrões e arquitetura ao agente de código com Angular Agent Skills e o framework OpenSpec, garantindo qualidade, segurança e conformidade técnica no código gerado."],
    ["Seu agente de IA pode executar SQL. Mas deveria?", "dickson-s-guedes", "Conectar um agente de IA a um banco de dados por meio do Model Context Protocol (MCP) abre possibilidades para consultas, diagnósticos e automação. Mas também introduz riscos de acesso indevido, vazamento de informações e execução de operações não autorizadas.\n\nNesta palestra, veremos como funciona a integração entre agentes, servidores MCP e PostgreSQL, comparando uma implementação ingênua com uma arquitetura que utiliza privilégios e isolamentos adequados."],
    ["O fim do Dashboard? Quando os AI Agents passam a conversar com seus dados.", "felipe-gustavo-silva-teodoro", "O dashboard prometeu democratizar os dados, mas poucas pessoas usam BI de fato. Com AI Agents, em vez de procurar a resposta em um painel, a pessoa faz a pergunta e o agente planeja, consulta o banco, verifica o resultado e entrega a resposta.\nVeremos o que é um AI Agent e como ele difere de um modelo generativo comum, por que o Text2SQL simples falha nas bases reais das empresas e qual o papel do MCP, da camada semântica e da governança. A demonstração, feita com Google ADK, compara um copiloto de uma chamada, um agente com ferramentas e um agente com skills respondendo às mesmas perguntas de negócio.\nO público sai sabendo se o dashboard morreu ou só deixou de ser o destino."],
    ["Otimizando a Performance do PostgreSQL no GCP: Insights, Extensões e Logs", "emerson-dos-santos-queiroz", "Aprenda a eliminar os pontos cegos do seu banco de dados no Google Cloud explorando um fluxo prático de diagnóstico de performance. Começaremos pelos alertas do painel nativo da GCP, mergulhando nas métricas do pg_stat_statements e utilizando o PGBadger para análises profundas, entregando um mapa prático para otimizar o consumo de recursos e melhorar os tempos de resposta das suas queries."],
    ["Creating AI agents for task execution in Google Earth Engine", "julia-cansado", "Uma introdução à criação de agentes de IA para tarefas diretas. A demonstração mostra como construir um agente com Gemini e Google Earth Engine (GEE) para obter dados precisos de uso e cobertura da terra, calculando áreas em mapas apenas com comandos em linguagem natural e simplificando análises geoespaciais complexas."],
    ["Projetos de Dados: usando ferramentas de predição, BI e Engenharia", "beatriz-moraes-souza-rodrigues", "O verdadeiro impacto de uma área de dados acontece quando a infraestrutura encontra a inteligência de negócios. Nesta palestra, discutiremos como estruturar Projetos de Dados que unem o rigor da Engenharia, a clareza do Business Intelligence e a visão de futuro das ferramentas de Predição. Abordaremos os desafios comuns de integração entre equipes e tecnologias, e como criar um fluxo onde os dados não apenas explicam o que aconteceu ontem, mas preveem o que vai acontecer amanhã. Um guia essencial para liderar e executar projetos que entregam resultados tangíveis."],
    ["Programação Funcional com Go. Possibilidade ou Forçação de barra?", "marco-ollivier", "Senior Staff Software Engineer no QuintoAndar, professor da FIAP e mantenedor Open Source, Marco Ollivier ajuda organizações de engenharia a entregar software com mais velocidade, qualidade e escalabilidade. Há mais de 17 anos na área, desenvolvendo plataformas distribuídas, liderando iniciativas de arquitetura e acelerando a produtividade de equipes em empresas como Nubank, OLX e Flash. Também atua como palestrante em alguns dos principais eventos de tecnologia do país."],
    ["Liberdade financeira global com blockchain", "bruno-eleodoro-roza", "Como autocustódia, stablecoins, investimentos onchain, empréstimos em DeFi e ações tokenizadas se conectam aos cartões cripto para ampliar a autonomia do indivíduo. Com exemplos práticos, você entende o que já é possível fazer hoje, quais dependências permanecem e como reduzir a concentração da sua vida financeira em um único país.\nUma conversa sobre o cidadão global: mais controle sobre o próprio patrimônio e mais liberdade para escolher onde viver, como investir e como usar seu dinheiro."],
    ["O Mercado de Cobol", "thais-santos-souza", "O mercado de mainframe, a atuação neste mercado e a modernização deste ecossistema."],
  ].map(lineupTalk),
  mobile: [
    ["Os impactos por trás do código que nós construímos", "arthur-dos-santos-almeida-tatay", "Uma reflexão sobre responsabilidade, impacto da inteligência artificial e inovação organizacional: as tecnologias que construímos têm efeitos no mundo real. Veremos acidentes causados por software, como o Therac-25, e modelos de IA enviesados contra minorias.\nA conversa mostra a importância das boas práticas de engenharia (testes, code review, documentação), inclusive na era da IA, e como a IA tem mudado nossa forma de trabalhar, os empregos e o futuro da organização corporativa. Acima de tudo, uma palestra sobre os impactos sociais da tecnologia."],
    ["IA: saindo do hype para o ROI", "leandro-garcia", "Usar IA já não basta para se diferenciar. O que importa é o resultado que você e sua equipe estão gerando com ela.\n\nLeandro Garcia, cofundador da i9 Flow, mostra por que ganhar tempo e produzir mais nem sempre melhora o negócio e o que precisa mudar para isso acontecer. Com exemplos práticos e uma demonstração ao vivo, a palestra conecta o uso da IA aos processos, às metas e às decisões de quem lidera equipes."],
    ["A IA escreveu o código. Quem garante o app?", "isaque-dias-coelho", "Quero apresentar um fluxo prático de desenvolvimento de um app nativo android utilizando IA, não focando no código, mas no que realmente importa em um app utilizável: testes, qualidade de código, arquitetura, code review e validação no emulador. \n\nEscrever código com IA é fácil, quero mostrar como garantimos a qualidade de verdade."],
    ["From Prompt to Stores: Building a Multiplatform (Android & iOS) App from Scratch with KMP and AI", "angelica-oliveira", "Como usar IA generativa e assistentes de código para construir um app pronto para produção com Kotlin Multiplatform (KMP) e Compose Multiplatform (CMP), compartilhando 100% da lógica de negócio e da interface entre Android e iOS? Nesta sessão prática, percorremos o ciclo completo de um app do zero: ideação e prototipagem com IA, estrutura do projeto KMP no Android Studio, UI declarativa compartilhada, testes automatizados multi-target, pipelines de CI/CD com GitHub Actions (build nativo para Android e iOS) e a publicação na Google Play e na App Store.", "", "maonamassa"],
    ["Do Discovery à Produção: 32 dias de IA Agêntica e um SaaS Hiperpersonalizado.", "fabio-baldin", "Nesta palestra, falaremos sobre como foi conduzida a criação de um SaaS hiperpersonalizado, do Discovery à Produção, em 32 dias, usando IA Agêntica. Abordaremos desde o entendimento do problema, a engenharia de contexto, e a orquestração de agentes até a integração entre produto, desenvolvimento, testes e segurança.\n\nO público pode esperar um case real, com decisões, desafios, erros e aprendizados, mostrando como combinar experiência humana e agentes de IA para transformar uma necessidade de negócio em software em produção.\n\nE, para apresentar os papéis dessa squad agêntica, teremos uma participação especial dos personagens de Street Fighter."],
    ["Vamos falar de Inteligência Artificial? Desenvolvendo Apps Inteligentes com Flutter e Gemini", "toshi-ossada", "Nesta apresentação vamos explorar o desenvolvimento de aplicativos multiplataforma com Flutter e como potencializá-los com a IA do Gemini, por meio da API do AI Studio. Abordaremos o Flutter, seus benefícios e como ele facilita interfaces ricas e nativas para várias plataformas, o que é o Gemini e como aplicá-lo para melhorar a experiência do usuário, além de uma demonstração prática de como conectar um projeto Flutter à API do AI Studio, com exemplos e dicas para otimizar o uso do Gemini em projetos futuros."],
    ["Physical AI: Modelando Inteligência para o Mundo Físico", "michael-douglas-barbosa-araujo", "A Inteligência Artificial está entrando em uma nova fase. Depois da revolução dos modelos generativos e dos agentes inteligentes, surge um novo paradigma conhecido como Physical AI, no qual sistemas são capazes de perceber continuamente o ambiente físico, interpretar dados provenientes de sensores, compreender o contexto e apoiar decisões em tempo real.\n\nNesta palestra, serão apresentados os fundamentos desse paradigma, mostrando como tecnologias como Edge AI, IoT, visão computacional, modelos multimodais e aprendizado de máquina trabalham em conjunto para transformar dados do mundo físico em inteligência."],
    ["On-Device vs. Cloud: Quando (e como) rodar modelos localmente para reduzir latência e custos.", "olivar-tamele", "Integrar IA em apps mobile ficou trivial, mas torná-la sustentável e performática é o verdadeiro desafio de engenharia em 2026. A palestra apresenta a matriz de decisão entre processamento em nuvem e execução local (on-device), com métricas reais de latência, consumo de bateria e o custo de queimar tokens em APIs externas.\nO foco são estratégias híbridas de Semantic Routing, em que o app decide dinamicamente o melhor caminho para cada requisição, equilibrando a experiência do usuário e o retorno para o negócio."],
    ["Usando Robot Framework para RPA e teste de interface", "robot-framework-a-confirmar", "Nesta palestra você conhecerá o Robot Framework, um framework de automação criado pela Nokia, amplamente usado em soluções de RPA (Robotic Process Automation), automação de navegadores, aplicações desktop e testes de integração.\nA apresentação é 100% prática, com código em tempo real e exemplos de problemas do dia a dia, da instalação a automações completas, passando pela sintaxe e pelas principais bibliotecas. Os exemplos: web scraping na Amazon, cadastro automatizado em um site de seguro de automóveis (um clássico de RPA), extração de recomendações de jogos da Steam (automação em aplicação desktop) e ações automatizadas no Instagram.\nNo final, você terá uma visão completa do que o Robot Framework faz e de como usá-lo para automatizar tarefas repetitivas, integrar sistemas e criar testes automatizados."],
  ].map(lineupTalk),
  mentoring: [
    ["Além do Código", "gabriel-rodrigues-de-souza", "Nem sempre quem evolui mais na carreira é o melhor tecnicamente, e sim quem consegue ser entendido e fazer o time avançar junto. Nesta palestra, mostro como a comunicação escrita, falada e assíncrona impacta sua visibilidade, sua confiança e suas oportunidades."],
    ["Jeitinho Brasileiro - Fazendo a diferença no trabalho internacional", "valerio-matias", "Aprendizados da prestação de serviços de TI em uma multinacional alemã, com foco no trabalho internacional e em como a cultura brasileira pode ajudar ou atrapalhar."],
    ["Seu desenvolvedor ficou 10x mais rápido. Seu SDLC não.", "jesse-freitas", "A IA acelerou o desenvolvedor, mas o SDLC acompanhou? Nesta palestra, vamos explorar a evolução de copilotos para agentes, passando por Agentic Engineering, Context Engineering, qualidade, evals e governança — e como preparar o ciclo de desenvolvimento para entregar resultados verificáveis, não apenas código mais rápido.\n\nJessé Freitas é CTO da Levva, com MBA em Arquitetura de Soluções pela FIAP. Atua há mais de 20 anos em tecnologia, liderando times e iniciativas de engenharia, dados e IA, com foco na aplicação prática de IA no desenvolvimento de software."],
    ["Longevidade Profissional e IA como ferramenta de reinvenção para a sua carreira", "alexandra-regina-cavalleiros", "Não adianta pensar em carreira longa sem pensar também em saúde, energia, equilíbrio e qualidade de vida. A palestra parte da trajetória de uma profissional que construiu carreira em TI, se aposentou, virou professora, entrou no universo gamer, passou a produzir conteúdo e segue aprendendo novas tecnologias.\nTemas: como a IA muda as profissões de tecnologia, o que aprender além das ferramentas, a importância de aprender continuamente, a IA como aceleradora de criatividade e produtividade, o risco de ficar parado, mulheres 40+ e 50+ no mercado, a experiência como diferencial e a reinvenção profissional depois dos 50."],
    ["Você provavelmente já faz pitch. Só talvez não chame isso de pitch.", "nakyta-nara-lucca", "Fazer um pitch não é apenas apresentar uma startup, vender um produto ou participar de um hackathon. No dia a dia profissional, estamos constantemente apresentando ideias, projetos, soluções, nossas competências e muitas vezes precisamos fazer isso em poucos minutos. Nesta palestra, vamos entender o que caracteriza um bom pitch, como selecionar as informações mais relevantes e como organizá-las de acordo com o público e o objetivo da conversa. Também vamos discutir como comunicar valor, gerar interesse e tornar uma mensagem mais clara, objetiva e convincente."],
    ["Infiltradas em Tech: mulheres que encontraram seu espaço além do código", "amanda-araujo-duaibs", "Será que para trabalhar com tecnologia é preciso ser desenvolvedora? Mulheres com caminhos diferentes e uma mesma área: dados, agilidade, comunidade e tecnologia se encontram em uma conversa sobre carreira, barreiras e oportunidades para quem nem sempre começou, ou atua, diretamente no código.\nCom base nas próprias experiências e nas histórias de pioneiras como Ada Lovelace e Florence Nightingale, discutimos como mulheres ocuparam espaços de inovação mesmo quando eles não pareciam feitos para elas. Uma conversa sobre entrar, permanecer e construir espaço em tech, mesmo fora do estereótipo."],
    ["Marketing digital para pequenos empreendedores", "bianca-bordon-weiller", "Como divulgar seu negócio de forma autêntica e eficiente. Uma palestra sobre marketing para quem tem poucos recursos: posicionamento, conteúdo e divulgação acessível para atrair clientes e fortalecer sua marca."],
    ["2035: Você Contrataria um Humano?", "irina-bezzan-miquelin", "Imagine um processo seletivo em 2035: de um lado, um profissional humano com anos de experiência; do outro, um agente de IA disponível 24 horas, capaz de executar tarefas complexas e aprender continuamente. Quem você escolheria?\nCom uma abordagem futurista e provocativa, a palestra discute a evolução do recrutamento, o impacto dos agentes autônomos nas profissões de tecnologia, os desafios da formação de talentos e as competências humanas que podem ficar ainda mais valiosas, a partir da visão de uma liderança de RH em uma HR Tech.\nO público pode esperar cenários distópicos, dilemas éticos e uma pergunta desconfortável: se a IA executa cada vez mais atividades, por que uma empresa contrataria você?"],
    ["A Promessa da IA", "ana-paula-rodrigues", "A IA chegou prometendo automatizar tarefas, aumentar a produtividade e nos devolver tempo. Mas estamos mesmo trabalhando menos ou só encontrando novas formas de trabalhar mais? A partir de pesquisas recentes sobre o impacto da IA na rotina de profissionais de tecnologia, a palestra explora o paradoxo da produtividade: quanto mais eficientes, maiores as expectativas, as demandas e a dificuldade de desconectar.\nDe forma prática e baseada em evidências, discute hiperconectividade, sobrecarga cognitiva e excesso de trabalho, e apresenta estratégias para estabelecer limites, preservar a atenção, descansar melhor e usar a IA de forma mais consciente."],
  ].map(lineupTalk),
  cloudsec: [
    ["Da Planta Industrial ao Ciberespaço: Os Desafios da Segurança OT", "diego-marcos-moreira", ""],
    ["Architectural Patterns for Multi-Agent Cloud Systems with Gemini Enterprise Agent Platform", "fernando-sedrez", "Sistemas em que um único agente resolve tudo estão dando lugar a ecossistemas multiagente complexos, em que cada entidade tem especialidades, ferramentas e memórias próprias. Como orquestrar e garantir governança sem perder o controle do fluxo?\nVamos explorar os principais padrões de arquitetura de agentes implementados nativamente no Google Cloud, ver como ampliar as capacidades da família de modelos Gemini integrando ferramentas e como aplicar segurança e governança na Gemini Enterprise Agent Platform."],
    ["Construindo a melhor arquitetura do mundo", "gustavo-caetano", "Passamos anos dominando linguagens de programação, provisionando servidores resilientes e desenhando soluções em cloud com alta disponibilidade tolerante a qualquer desastre, mas frequentemente insistimos em rodar a aplicação mais complexa e crítica de todas, nós mesmos, em uma infraestrutura negligenciada, operando a 100% de CPU e sem qualquer camada de observabilidade configurada. A melhor arquitetura do mundo não roda em datacenters, mas na capacidade de integrar mente, corpo, dinheiro e comunidade para manter você verdadeiramente sustentável no longo prazo."],
    ["Carreira, Estratégia e Lições da Experiência Militar", "vinicius-tavares", "Fazer a transição das Forças Armadas para a velocidade do mercado civil de cibersegurança traz desafios e aprendizados únicos. A palestra compartilha os bastidores da migração para tecnologia e da atuação em cibersegurança ofensiva e pentest, e como planejamento, mindset, inteligência tática e resiliência da caserna viraram diferencial.\nO que o público vai aprender: como transicionar de carreiras tradicionais para tecnologia aproveitando soft skills; o uso de princípios militares no planejamento e na execução de pentest para entender a mente do atacante e mitigar vulnerabilidades reais; e como transformar vivências fora da TI em vantagem competitiva."],
    ["Deixe a segurança de lado - Gestão de Segurança para Desenvolvedores", "davi-borges-pena", "Uma palestra irônica para devs saberem o ponto de vista de quem cuida de cyber, gosta de código aberto e adora guardrails.\nDavi é autista, com laudo e hiper foco em tecnologia, é nessa palestra vai falar sobre gestão de segurança da informação para desenvolvedores, mostrando o que a indústria pede sem ficar falando de ci/cd, devsecops e idolatrando o vibe coding. Vamos falar sobre não reinventar a roda, usar aplicações de código aberto, políticas, Supply Chain, guardrails para que usa IA e rotinas de segurança da informação."],
    ["Vença o Jogo contra o Cibercrime", "vinicius-rodrigues-da-cunha-perallis", "Em “Vença o Jogo Contra o Cibercrime”, Vinicius Perallis apresenta, de forma leve e acessível, os desafios da cibersegurança no mundo atual e mostra por que proteger nossos dados e informações se tornou tão importante diante de ataques cada vez mais sofisticados e perigosos.\n\nA partir de sua trajetória e da história por trás da criação da Hacker Rangers, Vinicius compartilha como a gamificação pode transformar a conscientização em cibersegurança, tornando o aprendizado mais envolvente, estimulando mudanças de comportamento e ajudando as pessoas a assumirem um papel ativo na proteção digital."],
    ["Criptografia Pós-Quântica e a Era Que Revolucionou a Computação", "joao-otavio-de-goes", "Estamos preparados para uma era em que os computadores poderão desafiar os fundamentos matemáticos que protegem nossas informações? A palestra percorre a evolução da criptografia, das origens aos algoritmos modernos, passando pelos princípios da física e da computação quântica.\nVeremos as ameaças da computação quântica aos sistemas criptográficos atuais, a diferença entre criptografia quântica e pós-quântica, os principais algoritmos e padrões disponíveis e os caminhos para preparar sistemas, aplicações e comunicações para a era pós-quântica."],
    ["Segurança começa na interface: riscos que o front-end ainda deixa passar para produção", "larissa-azevedo", "Segurança costuma ser tratada como uma responsabilidade exclusiva de back-end, infraestrutura ou times especializados. Só que muitas vulnerabilidades começam em decisões de interface: informações expostas sem necessidade, permissões tratadas apenas visualmente, dependências inseguras, armazenamento inadequado de dados e validações que existem apenas no navegador.\n\nNesta palestra, vamos percorrer riscos frequentes em aplicações front-end e discutir como incorporá-los às decisões diárias de desenvolvimento. O objetivo é desenvolver uma visão mais responsável sobre o que o front-end controla, comunica e precisa proteger."],
    ["Analytics com IA: dashboards criados a partir de conversas.", "vinicius-pivetta", "Uma abordagem prática sobre como usar inteligência artificial generativa para transformar perguntas em linguagem natural em análises e dashboards interativos. Veremos como o Databricks Genie aproxima usuários de negócio dos dados, simplifica a criação de visualizações e acelera a geração de insights, e qual o papel da engenharia de dados, da governança e do contexto semântico para garantir resultados confiáveis."],
  ].map(lineupTalk),
};

const lineupSpeakersRepository = createRepository(LINEUP_SPEAKERS, { getById: id => LINEUP_SPEAKERS.find(speaker => speaker.id === id) });
const lineupTalksRepository = createRepository(LINEUP_TALKS_BY_TRACK, { getFor: (trackId, index) => LINEUP_TALKS_BY_TRACK[trackId]?.[index] ?? undefined });

/**
 * Line-up REAL (trilhas, palestrantes e palestras de `LINEUP_*`) só aparece depois da revelação (`EVENT.lineupRevealed`) ou em modo DEV (`?lineup=1`, ver `devLineupRequested` em
 * schedule-builder.js). Antes disso o público vê as 5 trilhas com o mock, como sempre. Na revelação: `lineupRevealed: true` e apagar o ramo mock (mock-*.js).
 */
const showRealLineup = !globalThis.DEVFEST_FORCE_MOCK_LINEUP && (EVENT.lineupRevealed || devLineupRequested()); // DEVFEST_FORCE_MOCK_LINEUP: só os testes de tela (DevFestIA/tools/lib/dom-harness.js), que checam o formato do mock

function eventTime(hhmm) {
  return new Date(`${EVENT.date}T${hhmm}:00${EVENT.utcOffset}`);
}

/**
 * Plenária do line-up real (só DEV até a revelação): uma faixa inteira (40 min + 5 de troca) depois do almoço, na sala da trilha de IA, com todos juntos.
 * `keynote` = quem fala (ids de LINEUP_SPEAKER_ROWS), título e minibio; o card de destaque vem de components/track-card.js (bannerMarkup).
 */
const LINEUP_PLENARY = {
  banner: "Plenária", moment: "plenary", room: roomFor("Observatório"),
  keynote: {
    title: "Isso não deveria ser um stand-up",
    trackId: "ia", // a sala da plenária é a da trilha de IA (Observatório)
    speakerIds: ["rodrigo-pokemaobr"],
    description: "Streamer (Live \"Coder\") na Twitch. Apresentador do talk show The Velopers, desenvolvedor e streamer. Developer Relations, organizador e curador de eventos de TI. Bacharel em matemática aplicada e computacional com MBA em SOA. Evangelista PHPSP e criador do PokePHP e do eventosti.dev. O foco é ajudar a comunidade a disseminar conteúdos técnicos e piadas para devs.",
  },
};

/**
 * Plano do dia — palestra = 40 min (com perguntas) + 5 min de troca,
 * via talkWindows() de schedule-builder.js. Almoço 12:00-13:20 mais
 * 10 min pra voltar pra sala. `moment` (opcional) é o nome estável do bloco combinado ("registration", "opening", "lunch", "back-to-room", "closing"; um coffee entra
 * aqui como "coffee"): o mural do telão liga cenas por momento (`requires.moments`), então mudar o horário do almoço é editar SÓ esta grade. Talks mock vêm do catálogo; sem ele rotacionam o pool
 * o catálogo mock (mock-talks.js + mock-speakers.js) até o line-up real ser fechado.
 *
 * `buildDayPlan`: `afternoonStart` = primeira palestra da tarde; `plenary` (opcional) = bloco entre o retorno e a tarde, com `start`/`end`; `closing` = { start, end }.
 * O plano do mock (PROD) e o do line-up real (DEV) saem da mesma função; só o real tem a plenária e a tarde 45 min mais tarde.
 */
const buildDayPlan = ({ afternoonStart, closing, plenary = null }) => [
  { banner: "Credenciamento", moment: "registration", room: "Recepção", start: "08:00", end: "08:20" },
  { banner: "Abertura: GDG Campinas", moment: "opening", room: roomFor("Calçadão Central"), start: "08:20", end: "08:50" },
  { talks: talkWindows("09:00", 4) },
  { banner: "Almoço", moment: "lunch", start: "12:00", end: "13:20" },
  { banner: "Retorno para a sala", moment: "back-to-room", start: "13:20", end: "13:30" },
  ...(plenary ? [plenary] : []),
  { talks: talkWindows(afternoonStart, 5) },
  { banner: "Encerramento", moment: "closing", room: roomFor("Calçadão Central"), ...closing },
];
const DAY_PLAN = buildDayPlan({ afternoonStart: "13:30", closing: { start: "17:15", end: "18:00" } });
const LINEUP_DAY_PLAN = buildDayPlan({ afternoonStart: "14:15", closing: { start: "18:00", end: "18:30" }, plenary: { ...LINEUP_PLENARY, start: "13:30", end: "14:10" } });

const SCHEDULE = showRealLineup
  ? buildSchedule(LINEUP_DAY_PLAN, { eventTime, tracks: TRACKS, speakerPool: lineupSpeakersRepository.getAll(), talkCatalog: lineupTalksRepository, placeholderOptions: { rotateSpeakers: false } })
  : buildSchedule(DAY_PLAN, { eventTime, tracks: TRACKS, speakerPool: mockSpeakersRepository.getAll(), talkCatalog: mockTalksRepository });
