/** Página: Palestrantes. Galeria extraída do schedule (features/speakers.js). */
function initPalestrantes() {
  const reveal = initShell("palestrantes");
  renderSpeakersSection(SCHEDULE, TRACKS, document.getElementById("speakersSection"), document.querySelector(".speakers-grid"), { reveal });
}

initPalestrantes();
