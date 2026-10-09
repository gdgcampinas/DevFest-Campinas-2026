/**
 * Regra PURA do "Daqui a pouco" do mural (dual: navegador e Node, testada em DevFestIA/tools/mural/teasers.test.js): de todas as atrações de data/mural-teasers.js, qual está dentro da janela de
 * aviso e começa primeiro. O início vem da grade (destaque da sessão ou bloco como o encerramento) ou de uma hora fixa; atração sem início conhecido, já começada ou ainda longe não entra.
 * Devolve { teaser, startsAt (Date), msLeft } ou null.
 */
function teaserStart(source, schedule) {
  if (source.highlight) return schedule.find(slot => slot.talks && Object.values(slot.talks).some(talk => talk.highlight === source.highlight))?.start ?? null;
  if (source.moment) return schedule.find(slot => slot.moment === source.moment)?.start ?? null;
  if (source.at) {
    const parsed = new Date(source.at);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

function nextTeaser({ teasers, schedule, now }) {
  return teasers
    .map(teaser => ({ teaser, startsAt: teaserStart(teaser.source ?? {}, schedule) }))
    .filter(({ teaser, startsAt }) => startsAt && startsAt > now && startsAt - now <= teaser.leadMinutes * 60000)
    .map(({ teaser, startsAt }) => ({ teaser, startsAt, msLeft: startsAt - now }))
    .sort((a, b) => a.msLeft - b.msLeft)[0] ?? null;
}

if (typeof module !== "undefined") module.exports = { nextTeaser, teaserStart };
