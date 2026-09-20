/**
 * Testa o calendário sem navegador: índice de palestras, códigos de
 * compartilhamento (ida e volta), .ics (envelope, contagem de blocos,
 * escapes, CRLF, dobra em 75 octetos com multibyte) e link do Google.
 *   node DevFestIA/tools/check-calendar.js docs
 */
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=process.argv[2];
const files=["js/data/repository.js","js/data/mock-links.js","js/data/mock-photo.js","js/data/mock-speakers.js","js/data/mock-talks.js","js/data/schedule-builder.js","js/data/schedule.js","js/data/favorites.js","js/data/persisted-set-repository.js","js/features/agenda.js","js/components/track-card.js","js/features/calendar.js","js/features/talk-index.js","js/features/agenda-share.js"];
// favorites.js precisa do persisted-set antes
const order=["js/data/repository.js","js/data/persisted-set-repository.js","js/data/mock-links.js","js/data/mock-photo.js","js/data/mock-speakers.js","js/data/mock-talks.js","js/data/schedule-builder.js","js/data/schedule.js","js/data/favorites.js","js/features/agenda.js","js/components/track-card.js","js/features/calendar.js","js/features/talk-index.js","js/features/agenda-share.js"];
const ctx=vm.createContext({console,Date,Intl,Math,JSON,Map,Set,Array,Object,TextEncoder,URLSearchParams,URL,window:{localStorage:null},location:{search:""}});
let src=order.map(f=>fs.readFileSync(path.join(root,f),"utf8")).join("\n;\n");
src+="\n;globalThis.__o={EVENT,TRACKS,SCHEDULE,buildTalkIndex,talkToCalendarEntry,buildIcs,googleCalendarLink,icsFoldLine,icsEscape,sharedAgendaKeys,agendaShareUrl,talkShareCode};";
vm.runInContext(src,ctx);const o=ctx.__o;let fails=0;const fail=m=>{fails++;console.log("FAIL:",m)};
const index=o.buildTalkIndex(o.SCHEDULE,o.TRACKS,o.EVENT.timezone);
const entries=index.getAll(); console.log("entradas no índice:",entries.length);
if(entries.length!==36)fail("índice deveria ter 36");
if(new Set(entries.map(e=>e.code)).size!==36)fail("códigos duplicados");
console.log("exemplo de código:",entries[0].code, entries[5].code);
// ida e volta dos códigos
const codes=[entries[0],entries[7],entries[20]].map(e=>e.code);
const url=o.agendaShareUrl(codes,"https://x/grade.html"); const keys=o.sharedAgendaKeys(url.split("?")[1]?"?"+url.split("?")[1]:"",index);
if(keys.length!==3||keys[0]!==entries[0].key)fail("ida e volta do link falhou: "+url);
if(o.sharedAgendaKeys("?agenda=9999.zzz,"+codes[0],index).length!==1)fail("código inválido deveria ser ignorado");
// ICS
const ics=o.buildIcs(entries.slice(0,5).map(e=>o.talkToCalendarEntry(e,o.EVENT,"https://x/grade.html")),{calendarName:"DevFest; Campinas, 2026",now:new Date("2026-09-20T12:00:00Z")});
const lines=ics.split("\r\n"); if(lines.pop()!=="")fail("ICS deve terminar com CRLF");
const enc=new TextEncoder(); const tooLong=lines.filter(l=>enc.encode(l).length>75); if(tooLong.length)fail("linhas >75 octetos: "+tooLong.length);
if(lines[0]!=="BEGIN:VCALENDAR"||lines[lines.length-1]!=="END:VCALENDAR")fail("envelope");
const count=s=>lines.filter(l=>l===s).length; if(count("BEGIN:VEVENT")!==5||count("END:VEVENT")!==5||count("BEGIN:VALARM")!==5)fail("contagem de blocos");
if(!ics.includes("X-WR-CALNAME:DevFest\\; Campinas\\, 2026"))fail("escape do nome");
if(/[^\r]\n/.test(ics))fail("quebra de linha sem CRLF");
const first=entries[0]; console.log("início UTC:",first.slot.start.toISOString(),"| DTSTART no ics:",lines.find(l=>l.startsWith("DTSTART")));
console.log(lines.slice(0,14).join(" | "));
// dobra: caracteres multibyte não podem ser cortados no meio
const long="Sessão "+"ção ".repeat(60); const folded=o.icsFoldLine("SUMMARY:"+long); if(!folded.split("\r\n").every(l=>enc.encode(l).length<=75))fail("dobra excedeu 75"); if(folded.replace(/\r\n /g,"")!=="SUMMARY:"+long)fail("dobra alterou o texto");
// Google link
const g=o.googleCalendarLink(o.talkToCalendarEntry(first,o.EVENT,"https://x/grade.html")); console.log("google:",g.slice(0,150)); if(!/dates=20261128T\d{6}Z%2F20261128T\d{6}Z/.test(g))fail("dates do google");
console.log(fails?fails+" FALHAS":"OK: calendário e compartilhamento");process.exit(fails?1:0);
