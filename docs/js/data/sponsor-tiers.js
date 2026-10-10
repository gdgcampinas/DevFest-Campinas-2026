/**
 * Como cada cota de patrocínio é desenhada (só apresentação, nada de empresa aqui): `slug` vira o `data-tier` do bloco (o CSS escolhe o
 * layout e a cor da cota por ele) e `description` diz se o card mostra o texto da empresa. Cota que não está aqui usa o padrão (slug
 * do próprio nome, com descrição). Troque a apresentação por aqui, sem mexer em componente nem em CSS de empresa.
 */
const SPONSOR_TIER_STYLES = {
  Master: { slug: "master", description: true },
  Especialista: { slug: "especialista", description: true },
  Senior: { slug: "senior", description: true },
  Intern: { slug: "intern", description: true },
  Apoio: { slug: "apoio", description: false },
};

const sponsorTierStyle = tierName => ({
  slug: String(tierName).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
  description: true,
  ...SPONSOR_TIER_STYLES[tierName],
});

if (typeof module !== "undefined") module.exports = { SPONSOR_TIER_STYLES, sponsorTierStyle };
