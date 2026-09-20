/**
 * Comunidades parceiras — MOCK (fictícias) até confirmar as reais.
 * Mesmo formato de logo+link de sponsor-card.js, sem tier.
 */
const community = (name, shape, color) => ({
  name,
  link: MOCK_SPONSOR_URL,
  imageUrl: mockLogo({ name, shape, color }),
});

const PARTNER_COMMUNITIES = [
  community("Devs do Interior", "hex", "#4285f4"),
  community("Campinas Front", "bars", "#f59e0b"),
  community("Mulheres em Dados", "circle", "#ea4335"),
  community("Cloud Meetup", "ring", "#34a853"),
];

const partnerCommunitiesRepository = createRepository(PARTNER_COMMUNITIES);
