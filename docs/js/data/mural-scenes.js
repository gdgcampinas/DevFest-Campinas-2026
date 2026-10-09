/**
 * As CENAS do mural do telão, na ordem do rodízio. Tudo é dado: ligar, desligar, reordenar, mudar o tempo de tela ou o texto é editar este arquivo.
 *
 *   id         único  |  label = nome que o moderador vê ao fixar a cena (mural-controle.html)  |  type = qual desenhador de cena usa (components/mural-scenes/*.js, registrados em pages/mural.js)
 *   seconds    tempo no ar (padrão em MURAL_CONFIG.defaultSeconds)  |  enabled: false desliga  |  params = o que o desenhador pede
 *   transition como a cena ENTRA: "rise" (padrão, sobe e aparece), "slide" (desliza) ou "zoom" (cresce); a que sai some antes, nunca uma cena em cima da outra
 *   from/until janela de datas (ISO com fuso): fora dela a cena não entra no rodízio
 *   requires   reveal: true    só com o line-up revelado (a cena usa dado mock: aparece em /DEV ou com ?lineup=1, nunca em PROD enquanto for mock)
 *              phases: [...]   só nessas fases do evento ("before", "live", "after")
 *              moments: [...]  só enquanto esse bloco da GRADE está no ar (`moment` em data/schedule.js: "lunch", "closing"...): mudar o horário do almoço é editar só a grade
 *              live: "nome"    só quando a fonte ao vivo com esse nome já tem dado (data/mural-sources.js)
 * `?cenas=agora,album-2025` na URL mostra só essas, na ordem pedida (ensaio e teste).
 *
 * "Rolando agora" (spotlight): uma entrada por posição de sala (`params.slot`); o rodízio passa só pelas salas com palestra no ar. Texto curto = campo `blurb` da palestra
 * (opcional, ~110 caracteres) ou, sem ele, a descrição. "Selfie": o telão como painel de foto pra plateia (arte de fundo em `params.art`, hashtag ainda vazia; fixe com `?cenas=selfie`).
 * "Arte" (`type: "art"`): peça pronta de design em tela cheia, `params.art` = id em data/mural-arts.js (que decide como ela se adapta a qualquer proporção de telão).
 * "Vídeo" (`type: "video"`): o próximo clipe pronto de `params.playlist` (data/mural-videos.js); tempo de tela = a duração do clipe. Toca mudo e COM SOM só nos momentos/fases da playlist (almoço, encerramento, antes e depois);
 * as cenas `*-intervalo` entram só no almoço e no encerramento pra dar mais tempo de vídeo quando ninguém está em palestra. Sem o intermediário ligado ou sem clipe baixado a cena some.
 * "Linha do dia" (`type: "day-timeline"`): a grade inteira como uma faixa de blocos com o que já passou, o que está no ar e o que vem aí (usa a grade, então só com o line-up revelado).
 * "Daqui a pouco" (`type: "teaser"`): a atração grande (data/mural-teasers.js: Coding Jam, encerramento...) que começa dentro da janela de aviso dela, com contagem; fora da janela a cena some.
 * "Time" (`type: "team"`): uma pessoa do time por passada (foto, nome, cargo e mini-bio de data/team.js), a próxima a cada vez; duas entradas dão duas pessoas por volta do rodízio. Em PROD o time é público (dado real), sem `reveal`.
 * "Mensagem" (`type: "message"`): texto grande e acolhedor do conjunto `params.set` de data/mural-messages.js (quebra-gelo, "Primeira vez aqui?", saudação por horário); `params.mascot` põe o Gumbleton no canto.
 * O quebra-gelo entra no almoço, no café e quando o moderador anuncia uma pausa (`requires.live: "break"`, ver o controle remoto).
 * "Aviso" (`type: "notice"`): os avisos que o moderador escreve pelo celular (mural-controle.html); só aparece enquanto houver aviso vivo e entra na frente quando chega um novo. A emergência é a `MURAL_EMERGENCY_SCENE`, fora do rodízio.
 * "QR" (`type: "qr"`): `params.link` leva a um endereço de fora por nome (`linktree` de data/contact.js: "Continue fazendo parte", no almoço, no encerramento, na entrada e depois do evento), `params.path` a uma página do site (avaliar o evento) e `params.album` ao CONVITE do álbum colaborativo (pelo intermediário, `/join/<id>`: o link do álbum não fica no site). O QR "Monte seu cartão Eu vou!"
 * saiu do rodízio (a plateia já está no evento); a página do cartão continua existindo e o QR volta se for preciso, é uma cena nova com `path: "ingressos.html?cartao=1"`.
 * O convite ("abertura") só entra ANTES do evento: ele chama pra comprar ingresso, e durante o evento todo mundo já está lá.
 *
 * "Álbum" (`type: "album"`): X fotos de um álbum do Google Fotos (data/mural-albums.js) no modelo de `params.model` (collage, portrait-strip, polaroid, feature, mosaic ou auto, que escolhe pela
 * orientação das fotos). REGRA: o telão NUNCA mostra uma foto sozinha (só a arte do selfie é uma imagem só): cada modelo tem um mínimo de fotos e a cena some até o álbum encher. `foto-nova` aparece sozinha quando chega foto nova no álbum ao vivo (grande, com as mais recentes ao lado; fica no rodízio por 2 min). Sem o intermediário ligado (MURAL_CONFIG.albums.proxyUrl vazio) nenhuma aparece.
 *
 * Tempo de tela por cota de patrocínio: cada cota é uma cena (Master mais tempo, as demais agrupadas). Fotos: cada cena de álbum mostra as próximas da fila,
 * então repetir a cena mostra mais fotos.
 */
const MURAL_SCENES = [
  { id: "abertura", label: "Convite de abertura", type: "art", seconds: 10, transition: "zoom", requires: { phases: ["before"] }, params: { art: "invite" } },
  { id: "agora", label: "Agora e próximas", type: "now-next", seconds: 22, requires: { reveal: true, phases: ["before", "live"] }, params: {} },
  { id: "aviso", label: "Avisos", type: "notice", seconds: 12, transition: "zoom", requires: { live: "notices" }, params: {} },
  { id: "rolando-0", label: "Rolando agora (sala 1)", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 0 } },
  { id: "rolando-1", label: "Rolando agora (sala 2)", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 1 } },
  { id: "rolando-2", label: "Rolando agora (sala 3)", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 2 } },
  { id: "rolando-3", label: "Rolando agora (sala 4)", type: "spotlight", seconds: 8, requires: { reveal: true, phases: ["live"] }, params: { slot: 3 } },
  { id: "album-ao-vivo", label: "Fotos ao vivo", type: "album", seconds: 14, requires: { live: "albums" }, params: { album: "ao-vivo", model: "auto" } },
  { id: "foto-nova", label: "Foto nova da galera", type: "album", seconds: 10, transition: "zoom", requires: { live: "newPhoto" }, params: { album: "ao-vivo", latest: true, badge: "Nova foto da galera" } },
  { id: "album-2025-mosaico", label: "Mosaico DevFest 2025", type: "album", seconds: 14, transition: "zoom", requires: { live: "albums" }, params: { album: "devfest-2025", model: "mosaic" } },
  { id: "patrocinio-master", label: "Patrocínio Master", type: "sponsors", seconds: 12, requires: { reveal: true }, params: { tiers: ["Master"], title: "Quem faz o DevFest acontecer" } },
  { id: "qr-album", label: "QR: mande sua foto", type: "qr", seconds: 16, transition: "slide", requires: { live: "albums" }, params: { kicker: "Participe", heading: "Mande sua foto", hint: "Escaneie, entre no álbum e adicione suas fotos: elas aparecem aqui no telão", album: "ao-vivo" } },
  { id: "video-2025", label: "Vídeo DevFest 2025", type: "video", transition: "zoom", params: { playlist: "devfest-2025" } },
  { id: "inscritos", label: "Inscritos", type: "registered", seconds: 9, requires: { live: "registered" }, params: { min: EVENT.tickets.counterMin } },
  { id: "album-elotech", label: "Fotos Elotech Agibank", type: "album", seconds: 14, requires: { live: "albums" }, params: { album: "elotech-agibank", model: "auto" } },
  { id: "agora-2", label: "Agora e próximas (2ª vez)", type: "now-next", seconds: 22, requires: { reveal: true, phases: ["before", "live"] }, params: {} },
  { id: "album-2025-polaroid", label: "Polaroides DevFest 2025", type: "album", seconds: 14, requires: { live: "albums" }, params: { album: "devfest-2025", model: "polaroid" } },
  { id: "album-ao-vivo-2", label: "Fotos ao vivo (polaroides)", type: "album", seconds: 14, requires: { live: "albums" }, params: { album: "ao-vivo", model: "polaroid" } },
  { id: "aviso-2", label: "Avisos (2ª vez)", type: "notice", seconds: 12, transition: "zoom", requires: { live: "notices" }, params: {} },
  { id: "saudacao", label: "Saudação do horário", type: "message", seconds: 7, transition: "zoom", params: { set: "greeting", mascot: true } },
  { id: "primeira-vez", label: "Primeira vez aqui?", type: "message", seconds: 10, requires: { phases: ["before", "live"] }, params: { set: "welcome", mascot: true } },
  { id: "quebra-gelo", label: "Quebra-gelo (pausa anunciada)", type: "message", seconds: 12, transition: "zoom", requires: { live: "break" }, params: { set: "icebreaker", mascot: true } },
  { id: "quebra-gelo-intervalo", label: "Quebra-gelo (almoço e café)", type: "message", seconds: 12, transition: "zoom", requires: { moments: ["lunch", "coffee", "back-to-room"] }, params: { set: "icebreaker", mascot: true } },
  { id: "linha-do-dia", label: "Hoje no DevFest (linha do dia)", type: "day-timeline", seconds: 14, requires: { reveal: true, phases: ["before", "live"] }, params: {} },
  { id: "daqui-a-pouco", label: "Daqui a pouco (próxima atração)", type: "teaser", seconds: 12, transition: "zoom", requires: { reveal: true, phases: ["before", "live"] }, params: {} },
  { id: "time-1", label: "Quem faz o DevFest (1)", type: "team", seconds: 11, transition: "rise", params: { kicker: "Gente como você, de casa", title: "Quem faz o DevFest acontecer" } },
  { id: "dicas", label: "Dicas", type: "tips", seconds: 16, params: { title: "Aproveite o DevFest" } },
  { id: "time-2", label: "Quem faz o DevFest (2)", type: "team", seconds: 11, transition: "rise", params: { kicker: "Gente como você, de casa", title: "Quem faz o DevFest acontecer" } },
  { id: "album-2025", label: "Fotos DevFest 2025", type: "album", seconds: 14, requires: { live: "albums" }, params: { album: "devfest-2025", model: "auto" } },
  { id: "patrocinio-demais", label: "Demais patrocinadores", type: "sponsors", seconds: 14, requires: { reveal: true }, params: { tiers: ["Especialista", "Senior", "Intern", "Apoio"], title: "Quem faz o DevFest acontecer" } },
  { id: "agradecimento-patrocinio", label: "Agradecimento aos patrocinadores", type: "sponsors", seconds: 20, transition: "zoom", requires: { reveal: true, moments: ["lunch", "closing"] }, params: { kicker: "Muito obrigado", title: "A quem faz o DevFest acontecer", layout: "thanks" } },
  { id: "selfie", label: "Selfie", type: "selfie", seconds: 20, transition: "zoom", params: { hashtag: "", art: "sunset" } },
  { id: "arte-gumbleton", label: "Arte do Gumbleton", type: "art", seconds: 8, transition: "zoom", params: { art: "gumbleton" } },
  { id: "video-2025-2", label: "Vídeo DevFest 2025 (2ª vez)", type: "video", transition: "zoom", params: { playlist: "devfest-2025" } },
  { id: "album-bosch", label: "Fotos Bosch 2026", type: "album", seconds: 14, requires: { live: "albums" }, params: { album: "gdg-talks-bosch-2026", model: "auto" } },
  { id: "fenix", label: "Fênix", type: "phoenix", seconds: 10, transition: "zoom", params: {} },
  { id: "podio-jam", label: "Pódio do Coding Jam", type: "podium", seconds: 20, requires: { reveal: true, live: "podium" }, params: {} },
  { id: "video-2025-intervalo", label: "Vídeo DevFest 2025 (intervalo)", type: "video", transition: "zoom", requires: { moments: ["lunch", "closing"] }, params: { playlist: "devfest-2025" } },
  { id: "video-2025-intervalo-2", label: "Vídeo DevFest 2025 (intervalo, 2ª vez)", type: "video", transition: "zoom", requires: { moments: ["lunch", "closing"] }, params: { playlist: "devfest-2025" } },
  { id: "contagem", label: "Contagem regressiva", type: "event-phase", seconds: 12, requires: { phases: ["before"] }, params: { kind: "countdown" } },
  { id: "qr-comunidade", label: "QR: continue fazendo parte (almoço e encerramento)", type: "qr", seconds: 16, transition: "slide", requires: { moments: ["lunch", "closing"] }, params: { kicker: "Continue fazendo parte", heading: "A comunidade é de todo mundo", hint: "Escaneie e conheça o GDG Campinas: próximos eventos, grupos e mais.", link: "linktree" } },
  { id: "qr-comunidade-entrada-e-fim", label: "QR: continue fazendo parte (entrada e depois do evento)", type: "qr", seconds: 16, transition: "slide", requires: { phases: ["before", "after"] }, params: { kicker: "Continue fazendo parte", heading: "A comunidade é de todo mundo", hint: "Escaneie e conheça o GDG Campinas: próximos eventos, grupos e mais.", link: "linktree" } },
  { id: "qr-avaliar", label: "QR: avalie o evento", type: "qr", seconds: 16, transition: "slide", from: "2026-11-28T17:15:00-03:00", params: { kicker: "Obrigado por participar", heading: "Avalie o DevFest", hint: "Escaneie e conte como foi o evento", path: "index.html?avaliar=1" } },
  { id: "obrigado", label: "Obrigado", type: "event-phase", seconds: 12, requires: { phases: ["after"] }, params: { kind: "thanks" } },
];

/** A cena de reserva: aparece quando nenhuma outra pode (nada disponível, tudo falhando, sem rede). Não depende de rede nem de dado ao vivo. */
const MURAL_RESERVE_SCENE = { id: "reserva", type: "reserve", params: {} };

/** A cena de EMERGÊNCIA (controle remoto, features/mural-control.js): fora do rodízio; entra por ordem do moderador, em tela cheia, e o rodízio PARA até ele desarmar. O texto vem do controle (`ctx.live.emergency`). */
const MURAL_EMERGENCY_SCENE = { id: "emergencia", type: "emergency", params: {} };

const muralScenesRepository = createRepository(MURAL_SCENES, {
  getById: id => MURAL_SCENES.find(scene => scene.id === id),
  reserve: () => MURAL_RESERVE_SCENE,
  emergency: () => MURAL_EMERGENCY_SCENE,
  /** As cenas que o moderador pode fixar (id e nome), na ordem do rodízio. */
  options: () => MURAL_SCENES.filter(scene => scene.enabled !== false).map(scene => ({ id: scene.id, label: scene.label ?? scene.id })),
});
