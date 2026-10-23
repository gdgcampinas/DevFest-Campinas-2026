/** Página: Como chegar. O endereço e os botões do local (renderVenueInfo) e o mapa do campus com os pontos (features/venue-campus-map.js). O mapa só em DEV até `public: true` em data/venue-map.js; antes, o aviso "em breve". */
function initLocalPage() {
  initShell("local");
  renderVenueInfo(EVENT, document.getElementById("venueInfo"), SCHEDULE);
  initVenueCampusMap(document.getElementById("campusMap"), {
    map: venueMapRepository.getAll(), points: venueMapPointsRepository.getAll(), groups: venueMapGroupsRepository.getAll(), types: venueMapTypesRepository.getAll(),
    text: venueMapTextsRepository.getAll(), config: venueMapConfigRepository.getAll(), devMode: isDevModeStored(), soon: true,
  });
}

initLocalPage();
