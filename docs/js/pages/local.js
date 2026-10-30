/** Página: Como chegar. O endereço e os botões do local (renderVenueInfo), o mapa do campus com os pontos (features/venue-campus-map.js) e a galeria de fotos do campus (features/venue-photo-gallery.js). O mapa só em DEV até `public: true` em data/venue-map.js; antes, o aviso "em breve". A galeria só em DEV até `public: true` em data/venue-photos.js; antes, some. O botão para o site do campus usa o endereço do link "about" de data/venue.js. */
function initLocalPage() {
  initShell("local");
  renderVenueInfo(EVENT, document.getElementById("venueInfo"), SCHEDULE);
  initVenueCampusMap(document.getElementById("campusMap"), {
    map: venueMapRepository.getAll(), points: venueMapPointsRepository.getAll(), groups: venueMapGroupsRepository.getAll(), types: venueMapTypesRepository.getAll(),
    text: venueMapTextsRepository.getAll(), config: venueMapConfigRepository.getAll(), devMode: isDevModeStored(), soon: true,
  });
  const photoText = venuePhotosTextsRepository.getAll();
  const about = (EVENT.venueLinks ?? []).find(link => link.id === "about");
  initVenuePhotoGallery(document.getElementById("venuePhotos"), {
    photos: venuePhotosRepository.ordered(), text: photoText, link: about ? { label: photoText.linkLabel, url: about.url } : null,
    config: venuePhotosConfigRepository.getAll(), devMode: isDevModeStored(),
  });
}

initLocalPage();
