/**
 * Patrocinadores/parceiros por tier — MOCK abaixo (1 exemplo por
 * tier) até confirmar os reais. Mesma estrutura serve pra qualquer
 * número de tiers/logos. Tier sem `elements` (ou array vazio)
 * simplesmente não aparece.
 */
const SPONSORS = [
  { tier: "Master", elements: [{ name: "Patrocinador Master", link: "https://example.com", imageUrl: placeholderImage("Master") }] },
  { tier: "Especialista", elements: [{ name: "Patrocinador Especialista", link: "https://example.com", imageUrl: placeholderImage("Especialista") }] },
  { tier: "Senior", elements: [{ name: "Patrocinador Senior", link: "https://example.com", imageUrl: placeholderImage("Senior") }] },
  { tier: "Intern", elements: [{ name: "Patrocinador Intern", link: "https://example.com", imageUrl: placeholderImage("Intern") }] },
  { tier: "Apoio", elements: [{ name: "Apoiador", link: "https://example.com", imageUrl: placeholderImage("Apoio") }] },
];
