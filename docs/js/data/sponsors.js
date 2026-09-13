/**
 * Patrocinadores/parceiros por tier — MOCK abaixo (1 exemplo por
 * tier) até confirmar os reais. Mesma estrutura serve pra qualquer
 * número de tiers/logos. Tier sem `elements` (ou array vazio)
 * simplesmente não aparece. `description` é opcional: com ela, o card
 * mostra o texto (padrão inspirado no Campinas Innovation Week);
 * sem ela, sobra só logo+nome.
 */
const SPONSORS = [
  { tier: "Master", elements: [{ name: "Patrocinador Master", link: "https://example.com", imageUrl: placeholderImage("Master"), description: "Descrição de 1-2 linhas sobre o que a empresa faz — trocar pelo texto real do patrocinador." }] },
  { tier: "Especialista", elements: [{ name: "Patrocinador Especialista", link: "https://example.com", imageUrl: placeholderImage("Especialista"), description: "Descrição de 1-2 linhas sobre o que a empresa faz — trocar pelo texto real do patrocinador." }] },
  { tier: "Senior", elements: [{ name: "Patrocinador Senior", link: "https://example.com", imageUrl: placeholderImage("Senior"), description: "Descrição de 1-2 linhas sobre o que a empresa faz — trocar pelo texto real do patrocinador." }] },
  { tier: "Intern", elements: [{ name: "Patrocinador Intern", link: "https://example.com", imageUrl: placeholderImage("Intern"), description: "Descrição de 1-2 linhas sobre o que a empresa faz — trocar pelo texto real do patrocinador." }] },
  { tier: "Apoio", elements: [{ name: "Apoiador", link: "https://example.com", imageUrl: placeholderImage("Apoio"), description: "Descrição de 1-2 linhas sobre o que a empresa faz — trocar pelo texto real do patrocinador." }] },
];
