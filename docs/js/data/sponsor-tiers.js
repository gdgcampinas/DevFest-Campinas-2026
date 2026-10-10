/**
 * Como cada cota de patrocínio é desenhada (só apresentação, nada de empresa aqui), por `id` da cota (o `id` de cada cota em SPONSORS não
 * muda com o idioma; o nome mostrado, `tier`, é traduzido como qualquer dado). `description` diz se o card mostra o texto da empresa; o CSS
 * escolhe layout e cor por `data-tier` (o próprio id). Cota que não está aqui usa o padrão (com descrição).
 */
const SPONSOR_TIER_STYLES = {
  master: { description: true },
  especialista: { description: true },
  senior: { description: true },
  intern: { description: true },
  apoio: { description: false },
};

const sponsorTierStyle = tier => ({ description: true, ...SPONSOR_TIER_STYLES[tier.id] });

if (typeof module !== "undefined") module.exports = { SPONSOR_TIER_STYLES, sponsorTierStyle };
