/**
 * Feature (regras puras, sem DOM): a HISTÓRIA da comunidade montada pro telão (components/mural-scenes/mural-history-scene.js). Tudo por parâmetro, nada global.
 *   balancedChunks(list, perPage)         parte a lista em páginas de no máximo `perPage`, equilibradas (diferem em no máximo 1): nenhuma fica com 1 ou 2 itens
 *   historyEventGroups(photos, options)   as fotos (já em ordem cronológica) em um grupo por evento ("DevFest 2016"); grupo com menos de `minPhotos` fotos e foto sem ano vão
 *                                         juntos pro último grupo, `moreLabel` ("Mais momentos da nossa história")
 *   historyPages(groups, perPage)         as páginas do telão: cada uma com o `label` do evento e o `year`
 *   historyMilestoneItems(parts)          os marcos liberados com a foto resolvida (usado pela página e pelo telão)
 *   historyTourSteps(parts)               a volta COMPLETA em ordem de ano: o cartão do marco, os mosaicos do ano e os destaques do ano, cada passo com o seu tempo
 */
function balancedChunks(list, perPage) {
  const pageCount = Math.ceil(list.length / perPage);
  if (!pageCount) return [];
  const base = Math.floor(list.length / pageCount);
  const bigPages = list.length - base * pageCount; // as primeiras `bigPages` páginas levam 1 item a mais
  return Array.from({ length: pageCount }, (_, index) => {
    const start = index * base + Math.min(index, bigPages);
    return list.slice(start, start + base + (index < bigPages ? 1 : 0));
  });
}

const HISTORY_UNDATED_YEAR = 9999; // sem ano: no fim de tudo

function historyEventGroups(photos, { minPhotos = 4, moreLabel = "" } = {}) {
  const byLabel = new Map();
  const loose = [];
  photos.forEach(photo => {
    if (!photo.year || !photo.event) return loose.push(photo);
    const label = `${photo.event} ${photo.year}`;
    if (!byLabel.has(label)) byLabel.set(label, { label, year: photo.year, photos: [] });
    byLabel.get(label).photos.push(photo);
  });
  const groups = [];
  byLabel.forEach(group => (group.photos.length >= minPhotos ? groups.push(group) : loose.push(...group.photos)));
  const looseInOrder = photos.filter(photo => loose.includes(photo)); // volta à ordem cronológica de antes
  if (looseInOrder.length >= minPhotos) groups.push({ label: moreLabel, year: HISTORY_UNDATED_YEAR, photos: looseInOrder });
  else if (looseInOrder.length && groups.length) groups[groups.length - 1].photos.push(...looseInOrder);
  return groups;
}

function historyPages(groups, perPage) {
  return groups.flatMap(group => balancedChunks(group.photos, perPage).map(photos => ({ label: group.label, year: group.year, photos })));
}

function historyTourSteps({ milestones, pages, highlights, seconds }) {
  const rank = { marco: 0, mosaico: 1, destaque: 2 };
  const steps = [
    ...milestones.map(item => ({ kind: "marco", year: Number(item.milestone.year), item, seconds: seconds.marco })),
    ...pages.map(page => ({ kind: "mosaico", year: page.year, page, seconds: seconds.mosaico })),
    ...highlights.map(photo => ({ kind: "destaque", year: photo.year ?? HISTORY_UNDATED_YEAR, photo, seconds: seconds.destaque })),
  ];
  return steps.map((step, order) => ({ ...step, order })).sort((a, b) => a.year - b.year || rank[a.kind] - rank[b.kind] || a.order - b.order);
}

/** Os marcos da linha do tempo prontos pra mostrar: só os liberados (`historyReleased`), cada um com a foto resolvida; marco sem foto só vale com `badge` (o selo no lugar dela). */
function historyMilestoneItems({ milestones, resolve, showArchive }) {
  return milestones
    .filter(milestone => historyReleased(milestone, showArchive))
    .map(milestone => ({ milestone, photo: milestone.photo ? resolve(milestone.photo) : null }))
    .filter(item => item.photo || (!item.milestone.photo && item.milestone.badge));
}

if (typeof module !== "undefined") module.exports = { historyMilestoneItems, balancedChunks, historyEventGroups, historyPages, historyTourSteps };
