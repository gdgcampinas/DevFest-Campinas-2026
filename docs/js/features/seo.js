/**
 * Feature: dados estruturados (schema.org/Event) pro Google — montados
 * 100% a partir de EVENT/SCHEDULE que já existem em schedule.js, não
 * duplica nenhum dado do evento.
 */
function buildEventSchema(event, schedule) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: schedule[0].start.toISOString(),
    endDate: schedule[schedule.length - 1].end.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: {
      "@type": "Place",
      name: event.venue,
      address: event.address,
    },
    organizer: {
      "@type": "Organization",
      name: event.hosts.map(host => host.name).join(" + "),
    },
  };
}

function injectEventSchema(schema) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
