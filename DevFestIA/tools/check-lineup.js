/**
 * Confere a integridade do line-up MOCK (não roda no CI porque as regras
 * são do mock: 36 palestras, 38 palestrantes). Verifica: toda palestra
 * tem título, formato válido, descrição, tags e palestrantes; ninguém
 * fala em duas trilhas no mesmo horário; nenhum palestrante órfão; ids e
 * avatares únicos; markup sem "undefined". Ao trocar pelo line-up real,
 * ajustar as expectativas (contagens) antes de usar.
 *   node DevFestIA/tools/check-lineup.js docs js/data/schedule.js
 *   node DevFestIA/tools/check-lineup.js docs js/data/schedule.dev.js
 */
const fs=require("fs"),vm=require("vm"),path=require("path");
const root=process.argv[2];
const files=["js/data/repository.js","js/data/mock-links.js","js/data/mock-photo.js","js/data/mock-speakers.js","js/data/mock-talks.js","js/data/schedule-builder.js",process.argv[3]||"js/data/schedule.js","js/data/talk-formats.js","js/data/icons.js","js/components/avatar.js","js/components/icon.js","js/components/favorite-button.js","js/components/speaker-link.js","js/components/talk-meta.js","js/components/track-card.js","js/components/person-card.js","js/features/agenda.js","js/features/speakers.js"];
const warns=[];
const ctx=vm.createContext({console:{warn:m=>warns.push(m),log:console.log},CSS:{escape:x=>x},Date,Intl,Math,JSON,Map,Set,Array,Object});
let src=files.map(f=>fs.readFileSync(path.join(root,f),"utf8")).join("\n;\n");
src+="\n;globalThis.__out={EVENT,TRACKS,SCHEDULE,extractSpeakers,speakerGalleryCardMarkup,trackCardMarkup,talkDetailMarkup,TALK_FORMATS,MOCK_SPEAKERS};";
vm.runInContext(src,ctx);
const o=ctx.__out;let fails=0;const fail=m=>{fails++;console.log("FAIL:",m)};
const slots=o.SCHEDULE.filter(s=>s.talks);
console.log("slots with talks",slots.length,"tracks",o.TRACKS.length,"warns",warns.length);
warns.forEach(w=>fail(w));
const fmt=new Set(o.TALK_FORMATS.map(f=>f.id));
slots.forEach((s,i)=>{const ids=[];o.TRACKS.forEach(t=>{const d=s.talks[t.id];
 if(!d){fail(`slot ${i} sem talk ${t.id}`);return}
 if(!d.title||d.title==="Título a confirmar")fail(`slot ${i} ${t.id} sem título real`);
 if(!fmt.has(d.format))fail(`slot ${i} ${t.id} formato inválido ${d.format}`);
 if(!d.description)fail(`slot ${i} ${t.id} sem descrição`);
 if(!d.tags||!d.tags.length)fail(`slot ${i} ${t.id} sem tags`);
 if(!d.speakers||!d.speakers.length)fail(`slot ${i} ${t.id} sem palestrante`);
 (d.speakers||[]).forEach(p=>{["id","name","title","company","photo","linkedin"].forEach(k=>{if(!p[k])fail(`speaker ${p.id||p.name} sem ${k}`)});
  if(ids.includes(p.id))fail(`slot ${i}: ${p.id} em duas trilhas ao mesmo tempo`);ids.push(p.id)})})});
const people=o.extractSpeakers(o.SCHEDULE,o.TRACKS,o.EVENT.timezone);
console.log("speakers in gallery",people.length,"of",o.MOCK_SPEAKERS.length);
if(people.length!==o.MOCK_SPEAKERS.length)fail("palestrante fora da agenda ou repetido");
const anchors=new Set();people.forEach(p=>{if(anchors.has(p.id))fail("id dup "+p.id);anchors.add(p.id);if(!p.talks.length)fail("sem palestras "+p.id)});
const multi=people.filter(p=>p.talks.length>1);console.log("speakers com 2+ palestras:",multi.map(p=>p.id+"("+p.talks.length+")").join(", "));
const html=people.map(o.speakerGalleryCardMarkup).join("");
if(/undefined|null|NaN/.test(html))fail("markup com undefined/null: "+html.match(/.{30}(undefined|null|NaN).{30}/)?.[0]);
const avs=new Set(o.MOCK_SPEAKERS.map(p=>p.photo));console.log("avatares distintos",avs.size);
if(avs.size!==o.MOCK_SPEAKERS.length)fail("avatares repetidos");
const modal=o.talkDetailMarkup(o.TRACKS[0],slots[0].talks.ia,{reveal:true,timeRange:"09:00",room:"Sala",talkKey:"k",favorite:false});
if(/undefined|null/.test(modal))fail("modal com undefined");
console.log(fails?`${fails} FALHAS`:"OK: todas as invariantes passaram");process.exit(fails?1:0);
