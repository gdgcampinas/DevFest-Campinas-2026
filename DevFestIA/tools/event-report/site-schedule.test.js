/**
 * Testa a leitura da grade do site pelo relatório do evento e pela limpeza dos dados de teste (site-schedule.js):
 * elas rodam no Node, sem o i18n do navegador, e já quebraram quando a grade passou a formatar o horário pelo idioma da tela.
 *   node --test DevFestIA/tools/event-report/site-schedule.test.js
 */
const test = require("node:test");
const assert = require("node:assert");
const { readSiteSchedule } = require("./site-schedule.js");

test("lê a grade do site no Node, sem o i18n do navegador, com horário em HH:MM e chave de palestra", () => {
  const { talks, form, startsAt } = readSiteSchedule();
  assert.ok(talks.size > 0, "nenhuma palestra lida");
  assert.ok(form, "formulário de feedback do evento");
  assert.ok(Number.isFinite(startsAt.getTime()), "início do evento");
  [...talks.entries()].forEach(([key, talk]) => {
    assert.match(key, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\|[a-z]+$/, "chave de palestra");
    assert.match(talk.time, /^\d{2}:\d{2}$/);
    assert.ok(talk.title && talk.track, "título e trilha");
  });
});
