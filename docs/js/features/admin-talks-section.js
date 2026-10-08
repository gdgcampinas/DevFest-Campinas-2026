/**
 * Feature: seção Palestras do admin. Uma caixa por trilha com a palestra no ar (ou a próxima) e os botões pras telas da trilha (perguntas, quadro da sala, pódio do Coding Jam), cada um em aba
 * própria. Confere de tempos em tempos se a palestra da trilha mudou (só relógio e grade, sem rede). Tudo por parâmetro: `schedule`, `tracks`, `now`, `codeOf`, `hasContest`, `links`
 * (ADMIN_TRACK_LINKS), `formatTime`, `refreshMs`, `timer` (agendador). Devolve `{ stop }`.
 */
function initAdminTalksSection(containerEl, { schedule, tracks, now, codeOf, hasContest, links, formatTime, refreshMs, timer = defaultSchedule }) {
  const draw = () => {
    const rooms = describeTrackTalks({ schedule, tracks, now: now(), codeOf, hasContest }).map(room => ({ ...room, lineOf: describeRoomLine(room, formatTime), links: adminTrackLinks(room, links) }));
    containerEl.innerHTML = adminTalksMarkup({ rooms });
  };
  return { stop: scheduleEvery(timer, refreshMs, draw) };
}
