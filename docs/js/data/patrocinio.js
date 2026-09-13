/**
 * Conteúdo da página "Patrocínio" — intro/CTA e benefícios. Benefícios
 * reusam o card genérico de info-card.js (icon+title+body), sem
 * criar componente novo.
 */
const PATROCINIO_INTRO = {
  title: "Conecte sua marca a quem constrói o futuro da tecnologia em Campinas",
  subtitle: "Seja patrocinador do DevFest Campinas 2026 e transforme visibilidade em conexões e oportunidades.",
  ctaLabel: "Fale com a organização",
  ctaLink: "mailto:gdgcampinascontato@gmail.com",
};

const patrocinioIntroRepository = createRepository(PATROCINIO_INTRO);

const ICON_AUDIENCE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`;
const ICON_MEGAPHONE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l18-5v12L3 13v-2z"></path><path d="M11.6 16.8a3 3 0 1 1-5.2-3"></path></svg>`;
const ICON_HANDSHAKE = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l-2 2a2.83 2.83 0 0 1-4-4l4-4"></path><path d="M13 17l2 2a2.83 2.83 0 0 0 4-4l-6-6"></path><path d="M7 11l4-4 4 4"></path></svg>`;

const PATROCINIO_BENEFITS = [
  { id: "audiencia", trackColor: "var(--ia)", icon: ICON_AUDIENCE, title: "Audiência qualificada", body: "Acesso direto a desenvolvedores, arquitetos e lideranças de tecnologia de Campinas e região." },
  { id: "marca", trackColor: "var(--webdata)", icon: ICON_MEGAPHONE, title: "Visibilidade de marca", body: "Logo na agenda, no site e nos materiais do evento, durante toda a organização e no dia." },
  { id: "conexao", trackColor: "var(--mentoring)", icon: ICON_HANDSHAKE, title: "Conexão com a comunidade", body: "Presença ativa numa comunidade que cresce ano após ano — mais do que patrocínio, parceria de longo prazo." },
];

const patrocinioBenefitsRepository = createRepository(PATROCINIO_BENEFITS);
