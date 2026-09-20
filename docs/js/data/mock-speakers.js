/**
 * Palestrantes MOCK: fonte única de pessoas do line-up de mentira.
 * Cada um tem `id` estável (é por ele que as palestras em
 * mock-talks.js e as âncoras da página Palestrantes se ligam), cargo,
 * empresa "GDG Campinas", foto de pessoa (mock-photo.js) e LinkedIn
 * mock (URL única em mock-links.js). Nomes misturam origens de propósito.
 * Substituir por line-up real na revelação: mesmo formato, foto real
 * em `photo` e o perfil real em `linkedin`.
 */
const MOCK_COMPANY = "GDG Campinas";

/** [id, nome, cargo, número da foto em mock-photo.js] */
const MOCK_SPEAKER_ROWS = [
  ["ana-souza", "Ana Souza", "Engenheira de IA", 16],
  ["james-carter", "James Carter", "Staff ML Engineer", 12],
  ["amara-okafor", "Amara Okafor", "Engenheira de Machine Learning", 34],
  ["priya-nair", "Priya Nair", "Pesquisadora em IA", 42],
  ["fatima-al-sayed", "Fatima Al-Sayed", "Cientista de Dados", 5],
  ["chen-wei", "Wei Chen", "Engenheiro de Segurança", 18],
  ["rafael-lima", "Rafael Lima", "Tech Lead de Dados", 13],
  ["sophia-bennett", "Sophia Bennett", "Engenheira de Software", 25],
  ["noah-bryant", "Noah Bryant", "Developer Advocate", 8],
  ["ethan-wright", "Ethan Wright", "Engenheiro de Cloud", 1],
  ["camila-rocha", "Camila Rocha", "Tech Lead", 26],
  ["olivia-chen", "Olivia Chen", "Engenheira de Front-end", 35],
  ["omar-haddad", "Omar Haddad", "Engenheiro Backend", 14],
  ["kwame-mensah", "Kwame Mensah", "Engenheiro de Dados", 64],
  ["daniel-reyes", "Daniel Reyes", "Engenheiro de Plataforma", 11],
  ["carlos-mendes", "Carlos Mendes", "Arquiteto de Software", 17],
  ["nathalia-ribeiro", "Nathália Ribeiro", "Engenheira de Dados", 32],
  ["thiago-araujo", "Thiago Araújo", "Especialista em Performance Web", 53],
  ["isabella-moore", "Isabella Moore", "Desenvolvedora Full-stack", 45],
  ["yasmin-khalil", "Yasmin Khalil", "Analista de Dados", 27],
  ["hiro-tanaka", "Hiro Tanaka", "Engenheiro Android", 59],
  ["joao-pedro-almeida", "João Pedro Almeida", "Engenheiro iOS", 52],
  ["pedro-santos", "Pedro Santos", "Desenvolvedor Flutter", 60],
  ["mateus-oliveira", "Mateus Oliveira", "Desenvolvedor Android", 54],
  ["juliana-ferreira", "Juliana Ferreira", "Agile Coach", 21],
  ["sofia-alvarez", "Sofia Álvarez", "Especialista em Acessibilidade", 36],
  ["mia-robinson", "Mia Robinson", "QA Engineer", 30],
  ["vinicius-barbosa", "Vinícius Barbosa", "Scrum Master", 57],
  ["marcus-lee", "Marcus Lee", "Engenheiro Mobile Sênior", 55],
  ["leandro-pires", "Leandro Pires", "Fundador de Startup", 65],
  ["elisa-duarte", "Elisa Duarte", "Gerente de Engenharia", 23],
  ["larissa-nunes", "Larissa Nunes", "Engineering Manager", 24],
  ["renata-cardoso", "Renata Cardoso", "Líder de Comunidade", 28],
  ["lucas-turner", "Lucas Turner", "Mentor de Carreira em Tecnologia", 51],
  ["gabriela-martins", "Gabriela Martins", "Recrutadora Técnica", 38],
  ["beatriz-costa", "Beatriz Costa", "Product Designer", 44],
  ["grace-coleman", "Grace Coleman", "Head de Engenharia", 31],
  ["aline-teixeira", "Aline Teixeira", "Psicóloga e Mentora", 41],
  ["rodrigo-menezes", "Rodrigo Menezes", "Engenheiro e Entrevistador Técnico", 68],
  ["tatiane-gomes", "Tatiane Gomes", "Engenheira de Software e Mentora", 49],
];

const MOCK_SPEAKERS = MOCK_SPEAKER_ROWS.map(([id, name, title, photoId]) => ({
  id,
  name,
  title,
  company: MOCK_COMPANY,
  photo: mockPhoto(photoId),
  linkedin: MOCK_LINKEDIN_URL,
}));

const mockSpeakersRepository = createRepository(MOCK_SPEAKERS, {
  getById: id => MOCK_SPEAKERS.find(speaker => speaker.id === id),
});
