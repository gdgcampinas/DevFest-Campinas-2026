/**
 * Lê a grade do PRÓPRIO site (os mesmos arquivos do navegador, num contexto
 * isolado do Node) pra o relatório mostrar título, trilha, horário e
 * palestrantes de cada palestra, sem copiar a grade nem a regra da chave
 * de palestra (`talkKey`). Usa schedule.dev.js (line-up real) quando existe
 * na máquina; no GitHub Actions usa o schedule.js publicado.
 */
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const DATA_DIR = path.join(__dirname, "../../../docs/js/data");
const SITE_DIR = path.join(DATA_DIR, "..");
const FILES = [
  "data/repository.js", "data/mock-links.js", "data/mock-photo.js", "data/mock-logo.js", "data/mock-speakers.js",
  "data/mock-talks.js", "data/schedule-builder.js", "SCHEDULE_FILE", "data/persisted-set-repository.js", "data/favorites.js",
  "data/event-feedback-form.js", "features/agenda.js", "components/track-card.js",
];

function loadSiteContext({ siteDir = SITE_DIR } = {}) {
  const scheduleFile = fs.existsSync(path.join(siteDir, "data/schedule.dev.js")) ? "data/schedule.dev.js" : "data/schedule.js";
  const context = vm.createContext({ console });
  FILES.map(file => (file === "SCHEDULE_FILE" ? scheduleFile : file))
    .forEach(file => vm.runInContext(fs.readFileSync(path.join(siteDir, file), "utf8"), context, { filename: file }));
  return context;
}

/** Map chave-da-palestra -> { title, track, time, speakers }, na ordem da grade, o formulário de feedback do evento e o início do evento. */
function readSiteSchedule(options) {
  const site = vm.runInContext("({ SCHEDULE, TRACKS, EVENT, EVENT_FEEDBACK_FORM, talkKey, formatEventTime, speakerList })", loadSiteContext(options));
  const talks = new Map();
  site.SCHEDULE.forEach(slot => {
    if (!slot.talks) return;
    site.TRACKS.forEach(track => {
      const data = slot.talks[track.id];
      if (!data) return;
      talks.set(site.talkKey(slot, track.id), {
        title: data.title,
        track: track.label,
        time: site.formatEventTime(slot.start, site.EVENT.timezone),
        speakers: site.speakerList(data).map(speaker => speaker.name),
      });
    });
  });
  return { talks, form: site.EVENT_FEEDBACK_FORM, startsAt: site.SCHEDULE[0].start };
}

module.exports = { readSiteSchedule };
