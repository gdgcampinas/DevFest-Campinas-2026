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
  event.venueConfirmed = true;
  event.venueLinks = venue.links ?? [];
  return true;
}

if (typeof module !== "undefined") module.exports = { applyVenue };
