/**
 * As CENAS do mural do telão, na ordem do rodízio. Tudo é dado: ligar, desligar, reordenar, mudar o tempo de tela ou o texto é editar este arquivo.
 *
 *   id         único  |  type = qual desenhador de cena usa (components/mural-scenes/*.js, registrados em pages/mural.js)
 *   seconds    tempo no ar (padrão em MURAL_CONFIG.defaultSeconds)  |  enabled: false desliga  |  params = o que o desenhador pede
 *   transition como a cena ENTRA: "rise" (padrão, sobe e aparece), "slide" (desliza) ou "zoom" (cresce); a que sai some antes, nunca uma cena em cima da outra
 *   from/until janela de datas (ISO com fuso): fora dela a cena não entra no rodízio
 *   requires   reveal: true    só com o line-up revelado (a cena usa dado mock: aparece em /DEV ou com ?lineup=1, nunca em PROD enquanto for mock)
 *              phases: [...]   só nessas fases do evento ("before", "live", "after")
 *              live: "nome"    só quando a fonte ao vivo com esse nome já tem dado (data/mural-sources.js)
 * `?cenas=agora,fotos-1` na URL mostra só essas, na ordem pedida (ensaio e teste).
 *
 * "Rolando agora" (spotlight): uma entrada por posição de sala (`params.slot`); o rodízio passa só pelas salas com palestra no ar. Texto curto = campo `blurb` da palestra
 * (opcional, ~110 caracteres) ou, sem ele, a descrição. "Selfie": o telão como painel de foto pra plateia (hashtag ainda vazia; fixe com `?cenas=selfie`).
 *
 * Tempo de tela por cota de patrocínio: cada cota é uma cena (Master mais tempo, as demais agrupadas). Fotos: cada cena mostra a próxima foto
 * da fila, então repetir a cena mostra mais fotos. Fotos da edição 2025 hoje estão a 900 px (fotos em alta resolução ficam pra quando o Renato mandar).
 */
const MURAL_SCENES = [
  { id: "agora", type: "now-next", seconds: 22, requires: { reveal: true, phases: ["before", "live"] }, params: {} },
  { id: "rolando-0", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 0 } },
  { id: "rolando-1", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 1 } },
  { id: "rolando-2", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 2 } },
  { id: "rolando-3", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 3 } },
  { id: "fotos-1", type: "photos", seconds: 9, transition: "zoom", params: {} },
  { id: "patrocinio-master", type: "sponsors", seconds: 12, requires: { reveal: true }, params: { tiers: ["Master"], title: "Quem faz o DevFest acontecer" } },
  { id: "qr-cartao", type: "qr", seconds: 14, transition: "slide", params: { kicker: "Compartilhe", heading: "Monte seu cartão Eu vou!", hint: "Escaneie, gere o seu e mostre que você está no DevFest", path: "ingressos.html?cartao=1" } },
  { id: "inscritos", type: "registered", seconds: 9, requires: { live: "registered" }, params: { min: EVENT.tickets.counterMin } },
  { id: "agora-2", type: "now-next", seconds: 22, requires: { reveal: true, phases: ["before", "live"] }, params: {} },
  { id: "fotos-2", type: "photos", seconds: 9, transition: "zoom", params: {} },
  { id: "dicas", type: "tips", seconds: 16, params: { title: "Aproveite o DevFest" } },
  { id: "patrocinio-demais", type: "sponsors", seconds: 14, requires: { reveal: true }, params: { tiers: ["Especialista", "Senior", "Intern", "Apoio"], title: "Quem faz o DevFest acontecer" } },
  { id: "selfie", type: "selfie", seconds: 20, transition: "zoom", params: { hashtag: "" } },
  { id: "fenix", type: "phoenix", seconds: 10, transition: "zoom", params: {} },
  { id: "podio-jam", type: "podium", seconds: 20, requires: { reveal: true, live: "podium" }, params: {} },
  { id: "contagem", type: "event-phase", seconds: 12, requires: { phases: ["before"] }, params: { kind: "countdown" } },
  { id: "qr-avaliar", type: "qr", seconds: 16, transition: "slide", from: "2026-11-28T17:15:00-03:00", params: { kicker: "Obrigado por participar", heading: "Avalie o DevFest", hint: "Escaneie e conte como foi o evento", path: "index.html?avaliar=1" } },
  { id: "obrigado", type: "event-phase", seconds: 12, requires: { phases: ["after"] }, params: { kind: "thanks" } },
];

/** A cena de reserva: aparece quando nenhuma outra pode (nada disponível, tudo falhando, sem rede). Não depende de rede nem de dado ao vivo. */
const MURAL_RESERVE_SCENE = { id: "reserva", type: "reserve", params: {} };

const muralScenesRepository = createRepository(MURAL_SCENES, {
  getById: id => MURAL_SCENES.find(scene => scene.id === id),
  reserve: () => MURAL_RESERVE_SCENE,
});
