/**
 * Feature: o local confirmado do evento. Com `venue.public` ligado (ou em modo DEV) troca, uma vez e no lugar, o nome e o endereço de EVENT pelos de data/venue.js e marca `venueConfirmed`; os links extras
 * ficam em `EVENT.venueLinks`. Todas as telas (cabeçalho, mapa, calendário, dados estruturados) já leem de EVENT, então nenhuma muda. Devolve se o local ficou aplicado.
 */
function applyVenue(event, venue, { devMode = false } = {}) {
  if (!venue?.venue || !(venue.public || devMode)) return false;
  event.venue = venue.venue;
  event.address = venue.address;
  event.mapQuery = venue.mapQuery ?? venue.address;
  event.mapZoom = venue.mapZoom;
  event.building = venue.building;
  event.entrance = venue.entrance;
  event.venueConfirmed = true;
  event.venueLinks = venue.links ?? [];
  return true;
}

/** "Prédio H-02 · Entrada pelo portão 2": como achar o evento dentro do campus, a partir dos campos de EVENT (vazio quando o local não está confirmado). Usada no bloco do local e no cartão da principal. */
const venueAccessLine = event => [event.building, event.entrance].filter(Boolean).join(" · ");

if (typeof module !== "undefined") module.exports = { applyVenue, venueAccessLine };
