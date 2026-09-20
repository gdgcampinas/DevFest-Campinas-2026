/**
 * Feature: seção "Trilhas" na home — reusa o card genérico de
 * info-card.js (renderInfoCards/infoCardMarkup), sem criar componente
 * novo só pra isso. Trilha sem `description` (schedule.js) simplesmente
 * não entra na lista; seção inteira some se nenhuma tiver.
 */
const DEFAULT_TRACK_ICON = "grid";

function renderTracksOverview(tracks, sectionEl, gridEl) {
  const withDescription = tracks.filter(track => track.description);
  sectionEl.hidden = withDescription.length === 0;
  if (withDescription.length === 0) return;
  renderInfoCards(
    withDescription.map(track => ({
      id: `track-${track.id}`,
      trackColor: track.color,
      icon: iconMarkup(track.icon ?? DEFAULT_TRACK_ICON),
      title: track.label,
      body: track.description,
    })),
    gridEl
  );
}
