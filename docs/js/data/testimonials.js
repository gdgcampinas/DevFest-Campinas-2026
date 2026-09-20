/**
 * Depoimentos de quem participou de edições anteriores — MOCK abaixo
 * até termos os reais. `role` (cargo/ocupação) é opcional. Array vazio esconde a seção inteira.
 */
const TESTIMONIALS = [
  { quote: "Excelente vitrine do potencial de tecnologia de Campinas. Gostei da diversidade dos temas e da organização.", name: "Mariana Prado", role: "Desenvolvedora Front-end" },
  { quote: "Evento que conecta pessoas e oportunidades, com palestras de alto nível.", name: "Rogério Lacerda", role: "Gerente de Engenharia" },
  { quote: "Muito bem planejado e organizado. Extremamente proveitoso.", name: "Camila Bastos", role: "Estudante de Ciência da Computação" },
];

const testimonialsRepository = createRepository(TESTIMONIALS);
