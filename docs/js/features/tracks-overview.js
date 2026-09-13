/**
 * Feature: seção "Trilhas" na home — reusa o card genérico de
 * info-card.js (renderInfoCards/infoCardMarkup), sem criar componente
 * novo só pra isso. Trilha sem `description` (schedule.js) simplesmente
 * não entra na lista; seção inteira some se nenhuma tiver.
 */
const ICON_TRACK = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;

function renderTracksOverview(tracks, sectionEl, gridEl) {
  const withDescription = tracks.filter(track => track.description);
  sectionEl.hidden = withDescription.length === 0;
  if (withDescription.length === 0) return;
  renderInfoCards(
    withDescription.map(track => ({
      id: `track-${track.id}`,
      trackColor: track.color,
      icon: ICON_TRACK,
      title: track.label,
      body: track.description,
    })),
    gridEl
  );
}
