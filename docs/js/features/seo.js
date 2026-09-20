/**
 * Feature: dados estruturados (schema.org/Event) pro Google — montados
 * 100% a partir de EVENT/SCHEDULE/tipos de ingresso, sem duplicar
 * nenhum dado do evento. As tags OG/Twitter ficam estáticas no <head>
 * de cada página (os robôs de WhatsApp e LinkedIn não rodam JavaScript);
 * DevFestIA/tools/check-meta.js confere que continuam coerentes.
 */
const SCHEMA_AVAILABILITY = {
  open: "https://schema.org/InStock",
  soon: "https://schema.org/PreOrder",
};

/** Um Offer por tipo de ingresso com preço definido; "PreOrder" enquanto EVENT.tickets.salesOpen for false. */
function buildOffers(event, ticketTypes) {
  const availability = event.tickets?.salesOpen ? SCHEMA_AVAILABILITY.open : SCHEMA_AVAILABILITY.soon;
  return ticketTypes.filter(type => type.price != null).map(type => ({
    "@type": "Offer",
    name: type.name,
    price: type.price,
    priceCurrency: "BRL",
    ...((type.url ?? event.tickets?.url) ? { url: type.url ?? event.tickets.url } : {}),
    availability,
  }));
}

function buildEventSchema(event, schedule, ticketTypes = []) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: `${event.name} ${event.date.slice(0, 4)}`,
    description: event.description,
    url: event.url,
    image: [new URL(event.image, event.url).href],
    inLanguage: "pt-BR",
    startDate: schedule[0].start.toISOString(),
    endDate: schedule[schedule.length - 1].end.toISOString(),
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    // sem o nome do local enquanto ele não estiver confirmado: só a cidade
    location: {
      "@type": "Place",
      ...(event.venueConfirmed ? { name: event.venue } : {}),
      address: event.address,
    },
    organizer: {
      "@type": "Organization",
      name: event.hosts.map(host => host.name).join(" + "),
    },
  };
  const offers = buildOffers(event, ticketTypes);
  if (offers.length) schema.offers = offers;
  return schema;
}

function injectEventSchema(schema) {
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}
