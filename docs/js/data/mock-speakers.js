/**
 * Palestrantes MOCK: fonte única de pessoas do line-up de mentira.
 * Cada um tem `id` estável (é por ele que as palestras em
 * mock-talks.js e as âncoras da página Palestrantes se ligam), cargo,
 * empresa "GDG Campinas", avatar gerado (mock-avatar.js) e LinkedIn
 * mock (URL única, abaixo). Nomes misturam origens de propósito.
 * Substituir por line-up real na revelação: mesmo formato, foto real
 * em `photo` e o perfil real em `linkedin`.
 */
const MOCK_LINKEDIN_URL = "https://www.linkedin.com";
const MOCK_COMPANY = "GDG Campinas";

/** [id, nome, cargo] — a posição na lista define o seed do avatar. */
const MOCK_SPEAKER_ROWS = [
  ["ana-souza", "Ana Souza", "Engenheira de IA"],
  ["james-carter", "James Carter", "Staff ML Engineer"],
  ["amara-okafor", "Amara Okafor", "Engenheira de Machine Learning"],
  ["priya-nair", "Priya Nair", "Pesquisadora em IA"],
  ["fatima-al-sayed", "Fatima Al-Sayed", "Cientista de Dados"],
  ["chen-wei", "Wei Chen", "Engenheiro de Segurança"],
  ["rafael-lima", "Rafael Lima", "Tech Lead de Dados"],
  ["sophia-bennett", "Sophia Bennett", "Engenheira de Software"],
  ["noah-bryant", "Noah Bryant", "Developer Advocate"],
  ["ethan-wright", "Ethan Wright", "Engenheiro de Cloud"],
  ["camila-rocha", "Camila Rocha", "Tech Lead"],
  ["olivia-chen", "Olivia Chen", "Engenheira de Front-end"],
  ["omar-haddad", "Omar Haddad", "Engenheiro Backend"],
  ["kwame-mensah", "Kwame Mensah", "Engenheiro de Dados"],
  ["daniel-reyes", "Daniel Reyes", "Engenheiro de Plataforma"],
  ["carlos-mendes", "Carlos Mendes", "Arquiteto de Software"],
  ["nathalia-ribeiro", "Nathália Ribeiro", "Engenheira de Dados"],
  ["thiago-araujo", "Thiago Araújo", "Especialista em Performance Web"],
  ["isabella-moore", "Isabella Moore", "Desenvolvedora Full-stack"],
  ["yasmin-khalil", "Yasmin Khalil", "Analista de Dados"],
  ["hiro-tanaka", "Hiro Tanaka", "Engenheiro Android"],
  ["joao-pedro-almeida", "João Pedro Almeida", "Engenheiro iOS"],
  ["pedro-santos", "Pedro Santos", "Desenvolvedor Flutter"],
  ["mateus-oliveira", "Mateus Oliveira", "Desenvolvedor Android"],
  ["juliana-ferreira", "Juliana Ferreira", "Agile Coach"],
  ["sofia-alvarez", "Sofia Álvarez", "Especialista em Acessibilidade"],
  ["mia-robinson", "Mia Robinson", "QA Engineer"],
  ["vinicius-barbosa", "Vinícius Barbosa", "Scrum Master"],
  ["marcus-lee", "Marcus Lee", "Engenheiro Mobile Sênior"],
  ["leandro-pires", "Leandro Pires", "Fundador de Startup"],
  ["elisa-duarte", "Elisa Duarte", "Gerente de Engenharia"],
  ["larissa-nunes", "Larissa Nunes", "Engineering Manager"],
  ["renata-cardoso", "Renata Cardoso", "Líder de Comunidade"],
  ["lucas-turner", "Lucas Turner", "Mentor de Carreira em Tecnologia"],
  ["gabriela-martins", "Gabriela Martins", "Recrutadora Técnica"],
  ["beatriz-costa", "Beatriz Costa", "Product Designer"],
  ["grace-coleman", "Grace Coleman", "Head de Engenharia"],
  ["aline-teixeira", "Aline Teixeira", "Psicóloga e Mentora"],
];

const MOCK_SPEAKERS = MOCK_SPEAKER_ROWS.map(([id, name, title], index) => ({
  id,
  name,
  title,
  company: MOCK_COMPANY,
  photo: mockAvatar(index + 1),
  linkedin: MOCK_LINKEDIN_URL,
}));

const mockSpeakersRepository = createRepository(MOCK_SPEAKERS, {
  getById: id => MOCK_SPEAKERS.find(speaker => speaker.id === id),
});
