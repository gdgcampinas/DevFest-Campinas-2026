const test = require("node:test");
const assert = require("node:assert/strict");
const { buildEventReport, formatEventReport } = require("./build-report.js");

test("relatório junta Sympla, check-ins e notas por palestra", () => {
  const report = buildEventReport({
    stats: { total: 200, checkedIn: 150 },
    checkins: [{ entryKey: "a|ia" }, { entryKey: "a|ia" }, { entryKey: "b|mobile" }],
    talkFeedback: [{ entryKey: "a|ia", rating: 5 }, { entryKey: "a|ia", rating: 3 }],
    eventFeedback: [{ rating: 4 }, { rating: 5 }],
  });
  assert.equal(report.attendanceRate, 0.75);
  assert.deepEqual(report.talks, [{ key: "a|ia", checkins: 2, ratings: 2, average: 4 }, { key: "b|mobile", checkins: 1, ratings: 0, average: null }]);
  assert.equal(report.eventAverage, 4.5);
  const text = formatEventReport(report, { edition: "2026" });
  assert.match(text, /Inscritos: \*\*200\*\*/);
  assert.match(text, /\(75\.0%\)/);
});

test("relatório sem dados não quebra", () => {
  const report = buildEventReport({ stats: { total: 0, checkedIn: 0 }, checkins: [], talkFeedback: [], eventFeedback: [] });
  assert.equal(report.attendanceRate, null);
  assert.match(formatEventReport(report, { edition: "2026" }), /nota média -/);
});
