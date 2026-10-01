/**
 * Organizadores e voluntários do DevFest Campinas 2026 — todo mundo aqui é REAL (a leva mock foi
 * substituída, ver histórico do arquivo se precisar do padrão antigo). `type` distingue organizador
 * de voluntário (mesmo grid/card, só filtra em 2 seções na página Time). `social` vira 1 ícone por rede.
 *
 * `photo` é a URL final (ou "" pra cair no fallback de iniciais de components/avatar.js — sem precisar
 * de imagem placeholder nenhuma). `linkedin` também é opcional (`""` = sem ícone ainda): quem entrou
 * na lista mas ainda não mandou a rede fica sem o badge até completar.
 */

/**
 * Foto real de organizador/voluntário (assets/img/team/, ver `DevFestIA/design/build-team-photos.sh` pra gerar
 * o `.webp` a partir do arquivo original). `TEAM_PHOTO_VERSION` funciona como o `?v=` dos scripts:
 * trocar o conteúdo de uma foto sem renomear o arquivo não invalida cache de CDN/navegador.
 */
const TEAM_PHOTO_VERSION = 2;
const teamPhoto = slug => `assets/img/team/${slug}.webp?v=${TEAM_PHOTO_VERSION}`;

/** Cor da barra do card por grupo (components/person-card.js), pra separar organizador de voluntário no
 * grid sem precisar de card diferente — mesmas cores da marca, nenhuma nova. */
const TEAM_TYPE_COLOR = { organizador: "var(--google-blue)", voluntario: "var(--accent)" };

/** Pessoa real (organizador ou voluntário). `photo` e `linkedin` opcionais: sem eles, cai pra iniciais e some o ícone.
 * `bio` (mini-bio, 1 a 3 frases) também opcional: só quem tem vira card clicável e abre o modal "Descubra mais sobre". */
const person = (type, name, { role = "", photo = "", linkedin = "", bio = "" } = {}) => ({
  name,
  role,
  type,
  photo,
  bio,
  trackColor: TEAM_TYPE_COLOR[type],
  social: linkedin ? [{ name: "linkedin", link: linkedin }] : [],
});

/**
 * Voluntários confirmados (revisão 2026-09-29 à noite, lista de verdade do grupo do WhatsApp — a
 * primeira leva tinha gente fora da lista oficial, foi substituída inteira por esta), ver
 * DevFestIA/project-docs/PROJECT_CONTEXT.md "Time".
 */
const volunteer = (name, linkedin, gender, photo = "", bio = "") => person("voluntario", name, { role: gender === "f" ? "Voluntária" : "Voluntário", photo, linkedin, bio });
/** Organizador: mesmo `person()`, só fixando o `type`. */
const organizer = (name, { role = "", photo = "", linkedin = "", bio = "" } = {}) => person("organizador", name, { role, photo, linkedin, bio });

const TEAM = [
  // Organizadores reais (2026-09-30): só 4, a leva mock inteira saiu. Cargo ainda não confirmado pelo Renato.
  organizer("Renato Ramos", {
    linkedin: "https://www.linkedin.com/in/renato-ramos-95885a38",
    photo: teamPhoto("renato-ramos"),
    bio: "Desenvolvedor de software com mais de 15 anos de experiência em soluções cross-platform (Mobile e Web), atuando tanto no back-end quanto no front-end. Especialista em aplicações mobile para Android e iOS, além de aplicações web baseadas em padrões modernos, integrando bases de dados locais e remotas em soluções robustas e escaláveis.\n\nApaixonado por tecnologias de ponta e por código simples e legível. Nas horas vagas, é músico (guitarra e violoncelo) e organizador do GDG Campinas.",
  }),
  organizer("Bianca Issa", {
    linkedin: "https://www.linkedin.com/in/bianca-issa/",
    photo: teamPhoto("bianca-issa"),
    bio: "Atuando com testes de qualidade de software e com forte veia em networking, sou organizadora do Google Developer Group (GDG) e apaixonada por conectar pessoas e tecnologia. Uno a prática de QA à gestão e ao desenvolvimento de software para criar experiências que fomentam a inovação e a melhoria contínua nas organizações.",
  }),
  organizer("Michel Salomé", {
    linkedin: "https://www.linkedin.com/in/michel-luis-salome-de-barros",
    photo: teamPhoto("michel-salome"),
    bio: "Trabalho como Analista de Suporte há 15 anos na Fatec Americana e há 6 anos como docente de curso técnico de desenvolvimento de sistemas na Etec Americana e em Nova Odessa.\n\nOrganizador do GDG Campinas e apaixonado pela comunidade de TI.",
  }),
  organizer("Carlos Santos", { linkedin: "https://www.linkedin.com/in/santos-h-carlos", photo: teamPhoto("carlos-santos") }),
  // Ordem pedida pelo Renato (2026-09-30): mulher, homem, alternando; os homens que sobrarem vão pro fim.
  volunteer("Paula Santos", "https://www.linkedin.com/in/paula-santos-", "f", teamPhoto("paula-santos"), "Paula Santos é curiosa por natureza, e foi assim que se encontrou na tecnologia. Atua como Cloud & FinOps Architect na Capgemini, com foco em otimização de custos multicloud, dados e IA.\n\nAdora eventos de tech pela troca de conhecimento e pelas conexões."),
  volunteer("João Estevão Camilo", "https://www.linkedin.com/in/joãoestevaocamilo", "m", teamPhoto("joao-estevao-camilo"), "Apaixonado por tecnologia e por entender como as coisas funcionam, começou essa jornada pela eletrônica e pela prototipagem. Foi explorando circuitos, criando projetos e resolvendo problemas que descobriu o quanto gosta de transformar ideias em soluções. Hoje segue essa trajetória como Backend Java no Agibank, desenvolvendo sistemas e tecnologias que o desafiam a aprender algo novo todos os dias."),
  volunteer("Camila Fernanda Ignacio", "https://www.linkedin.com/in/camila-fernanda-ignácio-379253103", "f", teamPhoto("camila-fernanda-ignacio"), "Estudante de Análise e Desenvolvimento de Sistemas, fez a transição da área da educação para a tecnologia movida pelo desejo de criar soluções reais.\n\nNas horas vagas, aproveita o tempo livre sobre duas rodas como ciclista."),
  volunteer("Ricardo Koiti Matsushita", "https://www.linkedin.com/in/ricardo-koiti-matsushita-545006225", "m", teamPhoto("ricardo-koiti-matsushita"), "Ricardo Koiti Matsushita é estudante de Análise e Desenvolvimento de Sistemas na FATEC Americana e acredita no poder da comunidade, das conexões e da troca de conhecimento. Atualmente trabalha como estagiário."),
  volunteer("Débora Nortes", "https://www.linkedin.com/in/deboranortes", "f", teamPhoto("debora-nortes")),
  // Real (2026-09-29): LinkedIn dele não veio no trecho do grupo (mandou por PV); mantido o da leva anterior, mesma pessoa.
  volunteer("Davi Andrade", "https://www.linkedin.com/in/davi-lima-4695b3211", "m", teamPhoto("davi-andrade"), "Trabalha como ML Engineer na Bosch, treinando modelos de inteligência artificial no dia a dia. Gosta de tecnologia porque sente que está mexendo com o futuro na prática, e é essa curiosidade que o trouxe para ser voluntário no GDG."),
  volunteer("Mayne Gabriele da Silva", "https://www.linkedin.com/in/mayne-silva-99949428b", "f", teamPhoto("mayne-gabriele-da-silva"), "Graduanda em ADS na FATEC, é movida pela curiosidade de entender como as coisas funcionam por trás dos panos, o que a levou a mergulhar em desenvolvimento e segurança de IA. Da pesquisa acadêmica ao voluntariado em eventos tech, está sempre pronta para se conectar com a comunidade e construir coisas novas."),
  volunteer("Gustavo Costa", "https://www.linkedin.com/in/guscosta7", "m", teamPhoto("gustavo-costa"), "Desde criança é apaixonado por computadores. Formado em Análise de Sistemas pela Fatec Americana.\n\nAtualmente é engenheiro de software focado em backend no Itaú, trabalhando na área de portabilidade de salário."),
  volunteer("Vânia Gomes Marinelli", "https://www.linkedin.com/in/vania-marinelli", "f", teamPhoto("vania-gomes-marinelli"), "Sou estudante de Análise e Desenvolvimento de Sistemas na Universidade Presbiteriana Mackenzie e estou direcionando minha carreira para UX/UI Design. Também atuo como voluntária em projetos que conectam tecnologia, educação e comunidade, como Embaixadora Estudantil do Google e Community Manager na comunidade Menina de UX.\n\nAcredito no poder da tecnologia para ajudar pessoas e gerar impacto positivo."),
  volunteer("Leonardo Araújo", "https://www.linkedin.com/in/leonardo-am", "m", teamPhoto("leonardo-araujo"), "Sou interessado por tecnologia no geral, apaixonado pelo ArchLinux, atualmente faço Estatística na Unicamp e desenvolvo jogos em um projeto voltado a produzir jogos educacionais para alunos do ensino fundamental."),
  // Real (2026-09-29): link colado no grupo veio cortado ("naira-ferreira-", sem o resto) — conferir com ela antes do evento.
  volunteer("Laydianne Naira", "https://www.linkedin.com/in/naira-ferreira-", "f", teamPhoto("laydianne-naira")),
  volunteer("Henrique Ferreira Rodrigues da Silva", "https://www.linkedin.com/in/henrique-ferreira-rodrigues-da-silva-302a91289", "m", teamPhoto("henrique-ferreira-rodrigues-da-silva"), "Estudante de Análise e Desenvolvimento de Sistemas na Fatec Americana, também fez o ensino médio técnico na ETEC Polivalente de Americana em Desenvolvimento de Sistemas em busca de oportunidades no mercado de TI. Movido pela curiosidade de entender como os sistemas funcionam por trás dos panos, mergulhou no desenvolvimento back-end, lógica de programação e fundamentos de redes.\n\nNas horas vagas, ama praticar esporte, principalmente futebol."),
  volunteer("Letícia Fernandes Camargo de Campos", "https://www.linkedin.com/in/leticiafccampos", "f", teamPhoto("leticia-fernandes-campos"), "Veio de operações para a tecnologia, com foco em Tech Ops e Dados. Formada em Engenharia e estudante na UNICAMP, acredita que sistemas precisam resolver problemas reais. Decidiu ser voluntária no GDG para colocar sua comunicação em jogo, trocar ideias e construir uma rede de contatos nessa transição."),
  volunteer("Pedro Escobar Missola", "https://www.linkedin.com/in/pedromissola", "m", teamPhoto("pedro-escobar-missola"), "Estudante de Gestão de TI na Fatec Campinas, atua na área de Qualidade. Estuda Gestão de Projetos e também trabalha com programação, usando Node.js e JavaScript para criar websites, APIs, automações e aplicações. Gosta de unir tecnologia e gestão para transformar problemas em soluções reais."),
  volunteer("Lorenzo da Cunha", "https://www.linkedin.com/in/lorenzodacunha", "m", teamPhoto("lorenzo-da-cunha")),
  volunteer("Felipe de Oliveira", "https://www.linkedin.com/in/felipeoliveira8", "m", teamPhoto("felipe-de-oliveira")),
  volunteer("Henrique Ribeiro Medeiros da Silva", "https://www.linkedin.com/in/henriquermdsilva", "m", teamPhoto("henrique-ribeiro-medeiros-da-silva"), "Sou apaixonado por tecnologia e pelo impacto positivo que ela pode trazer na vida das pessoas. Atualmente sou estudante de Ciência da Computação na UNICAMP, com experiência em aplicações web e mobile desenvolvidas em Flutter e React, e estagiário em uma empresa de segurança da informação.\n\nNas horas vagas, curto ouvir vários tipos de música e tocar bateria!"),
  volunteer("Joao Paulo Gomes Lima", "https://www.linkedin.com/in/joao-paulo-gomes-lima-008", "m", teamPhoto("joao-paulo-gomes-lima")),
  // Entrou em 2026-10-01 (foto, bio e LinkedIn pelo grupo). Homens que sobram vão pro fim da lista.
  volunteer("Matheus Naitzki Angeloni", "https://www.linkedin.com/in/matheus-angeloni-013960227", "m", teamPhoto("matheus-naitzki-angeloni"), "Tenho 28 anos e moro em Americana, SP. Faço Análise e Desenvolvimento de Sistemas na Fatec de Americana, sou Assistente de TI na Faculdade FAM e também faço manutenção particular em computadores e notebooks.\n\nSempre tive o sonho de trabalhar com tecnologia. Hoje busco aprofundar meus conhecimentos e agregar com toda a comunidade."),
];

const teamRepository = createRepository(TEAM, {
  getByType: type => TEAM.filter(person => person.type === type),
});
