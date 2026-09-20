/**
 * Feature: formatos de calendário, puros (sem DOM, exceto o download).
 * Um único formato de "entrada" ({ uid, title, start, end, location,
 * details, url }) alimenta o link do Google Agenda e o arquivo .ics,
 * pra uma palestra, pro evento inteiro ou pra "Minha agenda".
 */
const CRLF = "\r\n";

/** yyyymmddThhmmssZ — mesmo formato no link do Google Agenda e no .ics. */
function calendarStamp(date) {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

/** "Sala X, Local, Cidade": o local só entra quando confirmado (EVENT.venueConfirmed). */
function eventLocationLabel(event, room = "") {
  return [room, event.venueConfirmed ? event.venue : "", event.address].filter(Boolean).join(", ");
}

function googleCalendarLink({ title, start, end, location, details }) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${calendarStamp(start)}/${calendarStamp(end)}`,
    location,
    details,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function icsEscape(text) {
  return String(text).replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
}

/** RFC 5545: linhas com no máximo 75 octetos; as continuações começam com um espaço. */
function icsFoldLine(line) {
  const encoder = new TextEncoder();
  if (encoder.encode(line).length <= 75) return line;
  const chunks = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    const limit = chunks.length === 0 ? 75 : 74;
    if (bytes + size > limit) {
      chunks.push(current);
      current = char;
      bytes = size;
    } else {
      current += char;
      bytes += size;
    }
  }
  chunks.push(current);
  return chunks.join(CRLF + " ");
}

function icsEventLines(entry, { alarmMinutes, now }) {
  return [
    "BEGIN:VEVENT",
    `UID:${entry.uid}`,
    `DTSTAMP:${calendarStamp(now)}`,
    `DTSTART:${calendarStamp(entry.start)}`,
    `DTEND:${calendarStamp(entry.end)}`,
    `SUMMARY:${icsEscape(entry.title)}`,
    `DESCRIPTION:${icsEscape(entry.details)}`,
    `LOCATION:${icsEscape(entry.location)}`,
    entry.url && `URL:${entry.url}`,
    "BEGIN:VALARM",
    `TRIGGER:-PT${alarmMinutes}M`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${icsEscape(entry.title)}`,
    "END:VALARM",
    "END:VEVENT",
  ].filter(Boolean);
}

/** Arquivo .ics com N eventos, cada um com alarme `alarmMinutes` antes. */
function buildIcs(entries, { calendarName, alarmMinutes = 10, now = new Date() } = {}) {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//GDG Campinas//DevFest Campinas//PT-BR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    calendarName && `X-WR-CALNAME:${icsEscape(calendarName)}`,
    ...entries.flatMap(entry => icsEventLines(entry, { alarmMinutes, now })),
    "END:VCALENDAR",
  ].filter(Boolean);
  return lines.map(icsFoldLine).join(CRLF) + CRLF;
}

function downloadTextFile(filename, mimeType, text) {
  const url = URL.createObjectURL(new Blob([text], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
