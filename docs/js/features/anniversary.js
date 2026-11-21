/**
 * Feature: o selo de aniversário do cabeçalho de todas as páginas (leva a historia.html) ("13 anos de GDG Campinas · 10 anos de DevFest"). Tudo por parâmetro: `config` e `text`
 * (data/anniversary.js) e o ano do evento. Só aparece quando liberado (`config.public`, ou no modo DEV: features/release-gate.js).
 * O selo REDONDO (components/anniversary-seal.js) fica ao lado do logo do GDG Campinas no topo (`showAnniversarySeal`) quando `config.siteSeal` está liberado (ou no modo DEV).
 * Dual: `anniversaryYears` é função pura e roda no Node (testes).
 */
function anniversaryYears({ eventYear, communityFounded, firstDevFest }) {
  return { community: eventYear - communityFounded, devfest: eventYear - firstDevFest };
}

function initAnniversaryBadge(mountEl, { config, text, eventYear, href, devMode = false }) {
  const years = anniversaryYears({ eventYear, ...config });
  const visible = isReleased(config, { devMode }) && years.community > 0 && years.devfest > 0;
  mountEl.hidden = !visible;
  mountEl.innerHTML = visible ? anniversaryBadgeMarkup(text.badge, years, { href }) : "";
  return visible;
}

/** O selo REDONDO ao lado do logo do GDG Campinas, no topo de toda página (`into` = o #brand): link pra história, só com `config.siteSeal` liberado (ou no modo DEV). Devolve se apareceu. */
function showAnniversarySeal({ into, config, text, eventYear, href, devMode = false }) {
  const years = anniversaryYears({ eventYear, ...config });
  const visible = Boolean(into) && isReleased(config.siteSeal ?? {}, { devMode }) && years.devfest > 0;
  if (visible) into.insertAdjacentHTML("beforeend", anniversarySealLinkMarkup({ href, sealMarkup: anniversarySealMarkup({ years, firstDevFest: config.firstDevFest, eventYear, text: text.seal }) }));
  return visible;
}

/** Põe o selo em TODA página: cria o espaço logo depois de `after` (a linha de data e local do cabeçalho) e o preenche. Devolve se apareceu. */
function showAnniversaryBadge({ after, ...options }) {
  if (!after) return false;
  const mountEl = document.createElement("div");
  mountEl.className = "anniversary";
  mountEl.id = "anniversaryBadge";
  after.insertAdjacentElement("afterend", mountEl);
  return initAnniversaryBadge(mountEl, options);
}

if (typeof module !== "undefined") module.exports = { anniversaryYears };
