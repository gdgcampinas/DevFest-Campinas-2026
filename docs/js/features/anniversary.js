/**
 * Feature: o selo de aniversário da página principal ("13 anos de GDG Campinas · 10 anos de DevFest"). Tudo por parâmetro: `config` e `text`
 * (data/anniversary.js) e o ano do evento. Só aparece quando liberado (`config.public`, ou no modo DEV: features/release-gate.js).
 * Dual: `anniversaryYears` é função pura e roda no Node (testes).
 */
function anniversaryYears({ eventYear, communityFounded, firstDevFest }) {
  return { community: eventYear - communityFounded, devfest: eventYear - firstDevFest };
}

function initAnniversaryBadge(mountEl, { config, text, eventYear, devMode = false }) {
  const years = anniversaryYears({ eventYear, ...config });
  const visible = isReleased(config, { devMode }) && years.community > 0 && years.devfest > 0;
  mountEl.hidden = !visible;
  mountEl.innerHTML = visible ? anniversaryBadgeMarkup(text.badge.replace("{community}", years.community).replace("{devfest}", years.devfest)) : "";
  return visible;
}

if (typeof module !== "undefined") module.exports = { anniversaryYears };
