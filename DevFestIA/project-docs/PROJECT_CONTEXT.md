# DevFest Campinas 2026 — Project Context

Multi-page site for DevFest Campinas 2026 (GDG Campinas), built the same way as [EloTech 2026](https://github.com/gdgcampinas/EloTech-Agibank): static HTML/CSS/JS, no build step, no framework, deployed via GitHub Pages from `docs/`. The only shared data (check-in, ratings, registrations total) lives in Firebase (Spark plan, free) and is fed by a scheduled GitHub Actions job that reads Sympla; there is no server of ours.

## Stack (non-negotiable)

- Plain HTML/CSS/JS. Zero build, zero npm dependency (the Node tools in `DevFestIA/tools/` are dependency-free too: only `node:` built-ins). Fonts are self-hosted (Google Sans, OFL, `assets/fonts/`, `css/fonts.css`); no runtime calls to Google Fonts.
- GitHub Pages source: `docs/` folder on `main`.
- Nomes dos workflows no GitHub Actions (campo `name:`, com ícone pra achar rápido): ✅ Validar, 🚀 Publicar no main, 🎫 Sincronizar Sympla, 📊 Relatório do evento, 🧹 Limpar dados de teste. **Atenção:** o Promote escuta o nome exato do Validate (`workflow_run`), e roda com o arquivo do `main`; renomear o Validate exige, antes, ensinar o Promote o nome novo e promover, senão a publicação automática para.
- Working branch: `development`. CI (`.github/workflows/validate.yml`) runs `node --check` on every push/PR to `development`; if it passes, `.github/workflows/promote.yml` fast-forward-merges `development` into `main` automatically. Never commit directly to `main`.

## Diretiva de Código — Clean Code + Clean Architecture

Regra permanente pra qualquer código escrito neste repo, não só sugestão de estilo:

- **Zero duplicação.** Se uma lógica, markup ou regra está escrita 2x, está errado — vira função, componente ou parâmetro reusável antes de seguir. O repo já segue isso (`track-card.js`, `info-card.js`, `person-card.js` servem qualquer trilha/pessoa/card sem duplicar HTML por instância).
- **Modular, uma responsabilidade por arquivo, separado por feature.** Já é o padrão: `data/` (dado puro) → `components/` (template puro) → `features/` (dado+template+comportamento) → `pages/` (bootstrap por página). Novo comportamento entra na camada certa, não misturado.
- **Tudo data-driven / injetável via parâmetro, nunca hardcoded.** Cor, ícone, contagem de trilha, lista de páginas do nav (`SITE_PAGES` em `site-nav.js`), hosts do header (`EVENT.hosts`) — tudo vem de dado passado como parâmetro pra função de render, nunca fixo no HTML/CSS. Ver "zero CSS por trilha" abaixo, é o exemplo canônico.
- **Repository pattern pra qualquer fonte de dado** — banco, API, ou (como aqui) array estático em memória. `docs/js/data/repository.js` (`createRepository()`) é esse padrão aplicado: acesso sempre via `algumaCoisaRepository.getAll()`, nunca a `const` global direto, mesmo sem backend hoje — se um dia isso virar API real, só a implementação de `createRepository()` muda, nada que consome via `getAll()` precisa mudar. Estilo "DI-lite" (parecido com repository pattern + injeção de dependência do Android): a peça que consome não sabe nem precisa saber de onde o dado realmente vem.
- **Cada peça pode ter método próprio quando fizer sentido** — não forçar toda função a caber numa interface genérica só por uniformidade; `extraMethods` em `createRepository()` existe exatamente pra isso (ex.: `sponsorsRepository.getByTier()`).

## Pages

Seven pages, all zero-build HTML that share most of the same `<script>`
block (see `initShell()` below) and only differ in their last `<script>`
(`js/pages/*.js`) — a page with a lighter feature set (e.g. Ingressos)
also trims the shared block to what it actually uses, see the note below:

| Page | File | Bootstrap |
|---|---|---|
| Principal (home) | `index.html` | `js/pages/home.js` |
| Grade completa | `grade.html` | `js/pages/grade.js` |
| Palestrantes | `palestrantes.html` | `js/pages/palestrantes.js` |
| Ingressos | `ingressos.html` | `js/pages/ingressos.js` |
| Time | `time.html` | `js/pages/time.js` |
| Patrocínio | `patrocinio.html` | `js/pages/patrocinio.js` |
| Código de conduta | `codigo-de-conduta.html` | `js/pages/cod.js` |

**Nota sobre o `<script>` block de uma página nova e enxuta:** `initShell()`
sempre chama `renderHeaderMeta()`, que usa `hourLabel`/`eventDateLabel` de
`features/agenda.js` — esse arquivo precisa carregar em toda página mesmo
que ela não renderize a agenda (Ingressos é o primeiro caso; só define
funções, não executa nada sozinho, então incluir sem `favorites.js`/
`track-card.js` é seguro contanto que a página não chame `talkCardOptions`).
`data/tickets.js` também é obrigatório em toda página: `injectEventSchema()`
(em `initShell()`) lê `ticketsRepository.getAll()` para o schema.org.

## File architecture (one responsibility per file, zero duplication)

```
docs/
  index.html, grade.html, palestrantes.html, ingressos.html, time.html,
  patrocinio.html, codigo-de-conduta.html   structure only, no logic (the 7 public pages)
  quiz.html                                 quiz "Monte sua trilha" (public, out of the menu), see "Quiz"
  checkin-display.html                      internal tool: QUADRO DA SALA (talk + live approved questions + QR), not a public page — see "Perguntas ao vivo, moderação e quadro da sala"
  moderacao.html                            internal tool (moderador de perguntas por sala), see "Perguntas ao vivo, moderação e quadro da sala"
  reset-teste.html                          internal tool (clears THIS browser's local test data), not a public page — see "Limpeza dos dados de teste"
  DEV/index.html, DEV/grade.html, ... , DEV/dev-loader.js   DEV shortcut, see "PROD x DEV"
  PROD/index.html                           DEV-exit shortcut, see "PROD x DEV"
  css/fonts.css                              @font-face for the self-hosted Google Sans (loads first)
  css/tokens.css                             design tokens ONLY: brand palette, per-track colors, accent, fonts (loads first)
  css/styles.css                             all visual rules; consumes tokens, no literal brand color or font name
  css/checkin-display.css                    standalone "presentation mode" styles for checkin-display.html only
  assets/brand/                               logo oficial em SVG: gdg-icon.svg (4 cores), gdg-logo-dark.svg / gdg-logo-light.svg (horizontal, texto claro/escuro)
  assets/icons/, assets/img/highlights/       favicons e ícones do app (gerados do SVG), event photos
  js/
    data/                    static data — nothing here touches the DOM
      repository.js            createRepository() factory — see below
      persisted-set-repository.js  createPersistedSetRepository(): set of keys in an injected storage (localStorage)
      favorites.js              favoritesRepository + talkKey(slot, trackId)
      hero-galaxy.js            HERO_GALAXY (imagem, volta em segundos, opacidade, tamanho, posição) + heroGalaxyRepository
      icons.js                  ICONS (svg paths by name) + iconsRepository.get(); also the per-track icons (`TRACKS[].icon`)
      install-guides.js         INSTALL_GUIDES (passo a passo por plataforma) + installGuidesRepository.getByPlatform()
      firebase-config.js         FIREBASE_CONFIG (chave pública) + CURRENT_EDITION/KNOWN_EDITIONS
      firebase-client.js         type="module": inicializa o app, expõe window.firebaseClient (db, auth, ensureAnonymousUid)
      firestore-repository.js    type="module": createFirestoreRepository() genérica, expõe window.createFirestoreRepository
      checkin-repository.js      checkinRepository sobre createFirestoreRepository (coleção "checkins")
      feedback-repository.js     feedbackRepository sobre createFirestoreRepository (coleção "talk-feedback")
      event-feedback-repository.js  eventFeedbackRepository sobre createFirestoreRepository (coleção "event-feedback")
      public-lookup-repository.js   type="module": createPublicLookupRepository() (get por id conhecido, sem lista/login), expõe window.createPublicLookupRepository
      registrations-repository.js   registrationsRepository sobre ele (coleção "registrations", escrita só pelo job do Sympla)
      event-stats-repository.js     eventStatsRepository sobre ele (coleção "event-stats": total público de inscritos)
      email-hash.js                 DUAL (navegador + Node): normalizeEmail/sha256Hex/registrationKey; única fonte da chave "<edição>_<sha256 do e-mail>"
      verified-registrations.js     verifiedRegistrationsRepository (localStorage, só a chave, nunca o e-mail)
      my-feedback.js                myCheckinsRepository / myRatingsRepository (localStorage: o que ESTE navegador já fez de check-in e avaliação)
      event-feedback-form.js        EVENT_FEEDBACK_FORM (aspectos e pergunta 0-10 do feedback do evento) + eventFeedbackFormRepository
      starfield.js               STAR_LAYERS (posições geradas, box-shadow) + BG_CIRCUIT_SRC + starfieldRepository
      analytics.js              ANALYTICS config (provider, endpoint, notice); empty endpoint = off
      tickets.js                TICKET_TYPES (Grátis / com camiseta / VIP, mock values) + TICKETS_NOTE
      talk-formats.js           TALK_FORMATS (palestra/workshop/painel/bate-papo) + getById()
      mock-links.js             MOCK_LINKEDIN_URL / MOCK_FACEBOOK_URL / MOCK_SPONSOR_URL (one place for all mock links)
      mock-photo.js             mockPhoto(id): hand-picked stock portraits (pravatar.cc) by number
      mock-logo.js              mockLogo({name, shape, color}): fictional company logo as inline SVG
      mock-speakers.js          40 mock speakers (id, name, cargo, photo, LinkedIn) + getById (loads before schedule)
      mock-talks.js             36 mock talks (9 per track, by position) linked to speakers by speakerIds
      schedule-builder.js        talkWindows/buildSchedule/catalogTalks (loads before schedule)
      schedule.js               PROD: EVENT, TRACKS, DAY_PLAN → SCHEDULE (mock until reveal)
      i18n/languages.js, i18n/en.js  idiomas (I18N_LANGUAGES) e dicionário em inglês, ver "Internacionalização"
      schedule.dev.js            DEV schedule (real, gitignored, local only)
      placeholder.js             placeholder image generator (mock logos)
      sponsors.js                sponsors/partners by tier
      partner-communities.js     partner community logos
      highlights.js               "highlights" photo grid data
      video.js                    recap video embed data
      stats.js                    last-edition stats (home)
      about.js                    "about the event" copy
      team.js, team-intro.js   organizers (Time page)
      cod.js                      code of conduct text
      footer.js                   footer columns
      testimonials.js             testimonial quotes
      patrocinio.js                Patrocínio page copy/benefits
    components/              reusable templates, one responsibility each
      modal.js                   createModal(id): the only modal markup and close behavior (X, backdrop, Esc)
      talk-feedback.js          talkFeedbackMarkup(state): check-in/avaliação (fases checkin/waiting/rate/done)
      rating-inputs.js         starRatingMarkup / npsScaleMarkup: estrelas 1-5 e escala 0-10, reusados pelos dois feedbacks
      event-feedback.js        eventFeedbackMarkup({phase, form}): avaliação do evento (fases closed/rate/done: nota geral, aspectos, 0-10, textos)
      my-talks.js              myTalksMarkup: tela "Minhas palestras" (lista + progresso + bloco do evento)
      feedback-nudge.js        feedbackNudgeMarkup: barra fixa "avalie"
      share-card.js             shareCardModalMarkup(): conteúdo do modal do cartão pessoal "Eu vou!" (nome + canvas + ações)
      registration-gate.js      registrationGateMarkup({phase}): "confirme sua inscrição" (e-mail do Sympla)
      registration-counter.js   registrationCounterMarkup({count}): "N pessoas já garantiram a vaga"
      construction-notice.js     constructionNoticeMarkup(message): "será revelado em breve" card, reused by every mock section
      install-guide.js           installGuideMarkup(guide): body of the "how to install" modal
      avatar.js                 photo or initials — automatic fallback
      hero-galaxy.js             heroGalaxyMarkup(config): camada decorativa (logo girando), valores como variáveis CSS
      icon.js                    iconMarkup(name) — only svg template
      calendar-links.js          "Adicionar ao calendário" buttons of the talk modal
      agenda-actions.js          Minha agenda action bar markup (export, WhatsApp, copy link)
      speaker-link.js            speakerAnchorId/speakerProfileHref: how a speaker links to palestrantes.html#speaker-<id>
      favorite-button.js         favoriteButtonMarkup() — star, used in card/hero/modal
      talk-meta.js               talkTagsMarkup/talkAvatarsMarkup/talkLinksMarkup (format+tags, avatars, LinkedIn)
      site-nav.js                nav links shared by every page
      track-card.js               talk card (agenda + hero) + detail modal; options come from talkCardOptions() (agenda.js)
      info-card.js                 generic "before you come" card
      sponsor-card.js               sponsor/community item (logo box + name + optional description)
      person-card.js                 person card (team/speakers)
    features/                data + template + behavior, one section each
      agenda.js, track-filter.js, a11y.js, pwa.js, install-platform.js, starfield.js, talk-feedback.js, event-feedback.js, my-talks.js, feedback-nudge.js, feedback-flow.js, hero-galaxy.js, share-card.js, registration-gate.js, registration-counter.js, reveal-gate.js, checkin-display.js, analytics.js, calendar.js, talk-index.js, calendar-actions.js, agenda-share.js, live-status.js, talk-modal.js, favorites.js, favorites-filter.js, speakers.js,
      featured-speakers.js, sponsors.js, partner-communities.js,
      team.js, cod.js, seo.js, stats.js, about.js, highlights.js,
      video.js, realizacao.js, tickets.js, footer.js,
      tracks-overview.js, testimonials.js, ticker.js, patrocinio.js
    pages/                   one bootstrap per page (see table above)
      home.js, grade.js, palestrantes.js, ingressos.js, time.js, patrocinio.js, cod.js, checkin-display.js
    app.js                   initShell(): header, ticker, nav, footer, SEO,
                              ?demo=/?lineup= overrides — shared by every page

DevFestIA/                  ← AI continuity and dev tooling, not part of the site
  CLAUDE.md, AGENTS.md, NEW_CHAT_PROMPT.md
  project-docs/PROJECT_CONTEXT.md, project-docs/Continuidade.md
  handoff/HANDOFF_CURRENT.md
  firebase/firestore.rules  security rules, paste manually into the Firebase console — see "Firebase (Firestore)"
  tools/                     check-meta.js (CI), check-install.js (CI), check-lineup.js, check-calendar.js, e2e-offline.js, e2e-kill-switch.js
    purge-test-data/           limpeza dos dados de teste no Firestore (plano com as travas, caso de uso, raiz de composição) + testes (CI)
    lib/                       google-auth.js (JWT de conta de serviço), firestore-rest.js (repository do Firestore via REST), zero npm
    sympla-sync/               sync Sympla -> Firestore (repository do Sympla, reconcile puro, caso de uso, raiz de composição) + testes (CI)
    event-report/              relatório pós-evento (inscritos, presença, check-in e notas) + teste (CI)
  design/                    og-image.html, app-icon.html (sources of generated images) + build-brand-assets.sh (regera favicon, ícones do app e og-image a partir do SVG)

.github/workflows/
  validate.yml               CI: node --check on every .js, every push/PR
  promote.yml                CI: auto fast-forward development → main
  sync-sympla.yml            a cada 10 min: Sympla -> Firestore (só roda no main; sem secrets só avisa)
  event-report.yml           sob demanda: relatório pós-evento no resumo da execução
  purge-test-data.yml        sob demanda: apaga os dados de teste do feedback (simulação por padrão)
```

## Check-in e avaliação de palestra (fase 5.2; o formulário evoluiu na sessão 6, ver "Feedback v2")

Dentro do modal de detalhe (mesmo em Home/Grade/Palestrantes), abaixo do
resto do conteúdo: `components/talk-feedback.js` (`talkFeedbackMarkup`)
desenha 5 fases — `loading`, `checkin`, `waiting`, `rate`, `done` —
`features/talk-feedback.js` (`initTalkFeedback`) decide qual mostrar.

- **Check-in por QR (ou link manual de honra):** cada palestra já tem um
  código curto (`talkShareCode`, `features/talk-index.js`, o mesmo usado
  em `?agenda=` da Grade). Um QR na sala aponta pra
  `grade.html?checkin=<código>`; ao carregar, o check-in é gravado
  sozinho. Sem câmera à mão, o botão dentro do modal faz o mesmo (honra).
  Geração do QR pra exibir na sala: `checkin-display.html?trilha=<id>`
  (ferramenta interna — fora de `SITE_PAGES`, sitemap e `check-meta.js`
  via `INTERNAL_PAGES`, `noindex` na meta tag, não linkada de lugar
  nenhum). `features/checkin-display.js` (`initCheckinDisplay`) reusa
  `resolveEventState()` (live-status.js, mesmo cálculo do "AO VIVO") pra
  achar a palestra ao vivo daquela trilha, gera o QR com a lib
  `qrcodejs` (CDN, `window.QRCode`, script clássico, sem módulo) e
  atualiza sozinho a cada 5 s, sem piscar quando a palestra não mudou
  (guarda o último código gerado). CSS isolado (`css/checkin-display.css`,
  "modo apresentação": tela cheia, fonte grande, cor da trilha), sem
  header/nav/footer — página própria, não usa `initShell()`. Sem
  `?trilha=` (ou id inválido) mostra a lista de trilhas em vez de
  quebrar.
- **Confirmação antes do check-in é inline, não `confirm()` nativo:** o
  navegador mostra o próprio diálogo do sistema (feio, sem estilo, com o
  domínio do site escrito nele) — trocado por uma fase própria
  (`"checkin-confirm"` em `talkFeedbackMarkup`) dentro do mesmo cartão,
  com o título da palestra e os botões "Confirmar"/"Cancelar" no visual
  do site. Só no botão manual — o check-in por `?checkin=` (QR) não
  confirma, escanear já é a ação deliberada. O bloco de check-in/avaliar
  tem destaque visual próprio (cartão com borda e fundo na cor de destaque),
  não é mais um detalhe discreto no rodapé do modal.
- **Avaliar só libera depois que a palestra terminou** (`slot.end` já
  passou, mesmo relógio simulado de `?demo=` que o resto do site usa) **e**
  a pessoa fez check-in nela — as duas condições, não uma OU outra.
- **Anônimo x nome (atualizado na sessão 6):** o uid do Firebase segue anônimo, e um nome digitado à
  mão não impede sabotagem (qualquer um inventa um): quem impede é o check-in (prova de presença), e
  desde a sessão 6 as regras do Firestore também o exigem. O nome, porém, agora é **obrigatório**
  no formulário (decisão do Renato), mesmo sem ser verificado.
- **Cuidado de ordem de execução (crítico):** `window.firebaseClient`/
  `checkinRepository`/`feedbackRepository` só existem depois que os
  módulos do SDK rodam — sempre DEPOIS de qualquer script clássico,
  mesmo que apareça antes no HTML (ver "Firebase (Firestore)" acima).
  `initTalkFeedback()` nunca toca nesses globais no próprio corpo (que
  roda no bootstrap síncrono da página); só dentro de handlers de
  clique/submit e do handler de `?checkin=` (agendado pra depois de
  `DOMContentLoaded`). Testado ponta a ponta contra o projeto real:
  abrir palestra → check-in → formulário libera após o horário →
  enviar → estado "avaliado" persiste ao reabrir.

## Limpeza dos dados de teste (antes do evento)

Duas ferramentas, uma pra cada lado, sem tocar no que é dado real:
- **Banco** (`.github/workflows/purge-test-data.yml`, Actions > Run workflow): apaga os
  documentos da edição atual em `checkins`, `talk-feedback` e `event-feedback`. As travas
  vivem num lugar só, `DevFestIA/tools/purge-test-data/purge-plan.js` (puro, com testes no
  CI): (1) lista FIXA de coleções, nunca `registrations`/`event-stats`/`sync-state`, sem
  parâmetro pra outra; (2) recusa a partir do início do evento (28/11 08:00 de Brasília,
  lido da própria grade do site, sem forçar); (3) modo teste ligado por padrão (só conta),
  e pra apagar precisa desligar o modo teste E digitar `APAGAR`. O resumo da execução mostra
  encontrados e apagados por coleção. Documentos de outra edição nunca são tocados.
- **Navegador** (`docs/reset-teste.html`, ferramenta interna, noindex, fora do nav/sitemap
  e de `check-meta.js` via `INTERNAL_PAGES`): botão que limpa NESTE navegador as chaves
  `devfest-campinas-2026:*` (check-ins, avaliações, nome, favoritos), o usuário anônimo do
  Firebase (IndexedDB), caches e service worker. `resetLocalData` recebe todas as APIs por
  parâmetro (`features/local-reset.js`). Só mexe em quem abre a página.
- Ordem no dia anterior: workflow em modo teste, conferir os números, rodar de verdade com
  `APAGAR`, depois abrir `reset-teste.html` nos aparelhos usados nos testes.

## Feedback v2 (sessão 6): Minhas palestras, aviso e avaliação do evento

- **Estado local-first:** `data/my-feedback.js` guarda neste navegador os check-ins
  e as avaliações (chaves de palestra e `event-end`). O uid anônimo do Firebase
  também é por navegador, então é equivalente ao que existe no Firestore e a tela
  não gasta leitura (plano grátis: 50 mil leituras por dia). O Firestore só recebe
  escrita. Check-in que falha por rede NÃO vira "feito" (só `permission-denied` conta
  como "já existia"); envio que falha mantém o formulário e mostra o aviso.
- **Minhas palestras** (`features/my-talks.js`): lista as palestras com check-in,
  cada uma com o mesmo bloco de feedback do modal (`feedback.render`), progresso
  "N de M avaliadas" e a avaliação do evento no fim. Abre por `?avaliar=1`
  (link pro e-mail do Sympla e QR do encerramento), pelo botão "Avaliar" do
  cabeçalho (aparece quando o evento começa) e pelo aviso.
- **Aviso "avalie"** (`features/feedback-nudge.js`): a cada 20 s, se há palestra
  terminada com check-in e sem avaliação (ou evento terminado sem avaliação), mostra
  uma barra fixa; "✕" esconde por 15 min; some com um modal aberto.
- **Composição** (`features/feedback-flow.js`, `initFeedbackFlow`): liga tudo numa
  chamada só, em Home, Grade e Palestrantes (antes a fiação se repetia). Em PROD
  (line-up mock, `reveal` falso) só o feedback do evento fica ativo.
- **Avaliação do evento v2** (`data/event-feedback-form.js` é a fonte das perguntas):
  nota geral (obrigatória), 6 aspectos (organização, local e estrutura, alimentação,
  conteúdo, networking, comunicação, 1-5 cada, opcionais), "recomendaria?" de 0 a 10,
  nome, "o que mais gostou", "o que melhorar". Aparece no hero "Encerrado" da Home e
  em Minhas palestras. `render` é síncrono (fase por estado local), então não trava.
- **Por palestra:** nota 1-5 e **nome (obrigatórios)**; "o que mais gostou" e "o que melhorar"
  opcionais. **Evento:** nota geral, **os 6 aspectos, a nota 0-10 e o nome obrigatórios**; textos
  opcionais. O nome é digitado (não verificado), lembrado em `myNameRepository` e preenche os
  outros formulários abertos (`rememberName`). Isso substitui a decisão antiga de feedback
  "totalmente anônimo": o uid segue anônimo, mas cada avaliação leva um nome.
- **Estrelas** (`components/rating-inputs.js` + `.feedback-star` em styles.css): já vêm com 5
  cheias (`defaultValue`), clicar numa anterior esvazia as seguintes (preenchimento até a
  marcada por CSS `:has()`), com prévia no hover.
- **QR de avaliação na sala** (`features/checkin-display.js`, `resolveRoomPanels` pura): a tela
  da sala mostra "Check-in nesta palestra" (palestra atual), "Avalie esta palestra" (a última
  terminada, fica até a próxima terminar; vira "Avalie a palestra anterior" com outra em
  andamento) e, depois do fim, "Avalie o evento". O QR de avaliação abre
  `grade.html?avaliar=<código>`: registra a presença (escanear na sala vale como check-in) e
  abre o formulário daquela palestra destacado (`?avaliar=1` abre a lista inteira).
- **Regras** (`DevFestIA/firebase/firestore.rules`, colar à mão): a avaliação de
  palestra só é aceita se existir o check-in do mesmo id (`exists()`), todo `create`
  aceita só os campos conhecidos (`hasOnly`) e o evento valida aspectos (ids
  espelham `event-feedback-form.js`) e 0-10. Não dá pra exigir "depois do fim da
  palestra" nas regras (o horário não está no banco), isso segue só na tela.
- **Relatório** (`DevFestIA/tools/event-report`, workflow `event-report.yml`, sob
  demanda e a cada 30 min no dia 28/11): lê a grade do próprio site
  (`site-schedule.js` carrega os arquivos do navegador num contexto isolado, sem copiar
  a grade nem `talkKey`) e mostra, por palestra, título, trilha, horário,
  palestrantes, check-ins, nota média, distribuição de estrelas e comentários; por
  palestrante (nota média); e o evento (nota geral, aspectos, indicação 0-10 em
  pontos, comentários). É privado (comentários e nomes, quando dados). Nota média
  pública nos cards NÃO foi feita de propósito (decisão: só interno por ora).

## Avaliação do evento (fase 5.3; formulário atual na seção "Feedback v2")

Dentro do hero "Encerrado" da home (`renderHeroAfter()` em
`features/live-status.js`, só aparece depois que o último horário do
`SCHEDULE` já passou — real ou simulado por `?demo=`): `components/event-feedback.js`
(`eventFeedbackMarkup`) desenha 3 fases — `loading`, `rate`, `done` —
`features/event-feedback.js` (`initEventFeedback`) decide qual mostrar.
Mesmo padrão de `talk-feedback.js` (nota 1-5 + nome/comentário
opcionais, sobre `window.eventFeedbackRepository`), mas **sem** a fase
de check-in: aqui não tem gate de presença, é avaliação do evento
inteiro, uma vez por pessoa por edição (`EVENT_FEEDBACK_KEY`, chave
fixa, não por palestra). Atributos com prefixo `data-event-feedback-*`
(nunca `data-feedback-*`) pra o listener delegado nunca disputar
clique/submit com o de `talk-feedback.js`, mesmo os dois ligados no
mesmo `document.body` (ver `initHome()` em `pages/home.js`).
`live-status.js` não sabe nada de Firebase: `createLiveStatus()` recebe
um `onEventEnd(containerEl)` opcional e só chama, a página (`home.js`)
é quem injeta `eventFeedback.render`. Regra de segurança e coleção
(`event-feedback`) e o repository (`data/event-feedback-repository.js`)
já existiam desde a fundação do Firebase (sessão 5); só faltava a UI.

## Quiz "Monte sua trilha" (sessão 7)

Página `quiz.html` (fora do menu, CTA na seção "Trilhas" da home; sitemap e OG como as demais),
100% estática, sem Firebase. 5 perguntas, cada resposta pesa em uma ou mais trilhas; vence a
soma maior, empate vai pra trilha que vem primeiro em `TRACKS`.
- `data/quiz.js`: `QUIZ_QUESTIONS` e `QUIZ_COPY` via `quizRepository` (pesos por id de trilha; trilha nova entra só ganhando peso).
- `features/quiz-scoring.js` (dual, navegador e Node): `scoreQuiz`, `pickSpread`. Funções puras.
- `components/quiz.js` (markup) e `features/quiz.js` (`initQuiz`, máquina de passos, tudo por parâmetro).
- `features/clipboard.js`: `copyWithFeedback`, único lugar que copia texto (reusado pela Minha agenda).
- Resultado: trilha vencedora (e a segunda, se pontuou). Com `reveal` (DEV ou line-up revelado) sugere 3 palestras espalhadas pelo dia e "Adicionar à minha agenda" (`favoritesRepository.addAll`); em PROD só a trilha e o aviso "será revelado em breve".
- `?trilha=<id>` abre direto o resultado (link de compartilhar/WhatsApp).
- Testes: `node --test DevFestIA/tools/quiz/quiz.test.js` (roda no CI; confere pesos x trilhas, que toda trilha pode vencer, empate e `pickSpread`).

## Perguntas ao vivo, moderação e quadro da sala (sessão 7)

Um fluxo só, da pergunta ao quadro. Regras do jogo (as do banco, espelhadas na tela):
- **Só quem fez check-in NA palestra** pergunta e vota; a pergunta fica ligada à palestra pela chave (`talkKey`).
- **Só do início ao fim da palestra** (limites inclusos): antes, a tela avisa; depois, só leitura. O banco confere pelo relógio do servidor e pelo horário que vem na chave (`talkIsLive` nas regras, duração 40 min = `talkDurationMinutes()`, espelho de `talkMin` do `schedule-builder.js`, com teste que compara). `features/question-window.js` (dual) é o espelho na tela.
- **Até 10 perguntas por pessoa por palestra** (`maxPerPerson`): espaço `<talkKey>#1..#10`; o id do documento tem que ser `<uid>_<entryKey>` (`idMatchesEntry`), senão dava pra furar o limite.
- **O moderador aprova antes de ir ao ar.** `status`: `pending` (nasce assim) -> `approved` (aparece pra plateia, no voto e no quadro) | `rejected` | `answered` (sai do quadro). Só e-mail Google verificado da lista em `isModerator()` (hoje `gdgcampinascontato@gmail.com`) muda o `status`. Plateia lista só `approved` (consulta filtra `status == approved`); cada pessoa lista as próprias (`uid == a dela`) e vê o estado de cada uma.
- **Voto:** 1 por pessoa por pergunta aprovada, só na janela, sem desfazer.
- **Tudo em `data/talk-questions.js`:** `enabled`, `maxLength` 280, `maxPerPerson`, `pollMs`, `boardPollMs`, `QUESTION_STATUS`. As regras espelham `maxLength`/`maxPerPerson` (testes conferem).

**Três telas, cada uma com um trabalho**
1. **Modal da palestra no celular** (`components/talk-questions.js`, `features/talk-questions.js`): envia, acompanha o estado das próprias, vota. O QR de check-in (`?checkin=<código>`) agora faz o check-in E abre a própria palestra (`OPEN_TALK_EVENT`, `talk-modal.js`).
2. **Moderação** (`moderacao.html?trilha=<id>`, interna, uma por sala; `components/question-moderation.js`, `features/question-moderation.js`): login Google; fila para aprovar, no ar, respondidas, rejeitadas; atualiza a cada `boardPollMs`.
3. **Quadro da sala** (`checkin-display.html?trilha=<id>`, o endereço antigo da tela de QR): TV/tablet, só leitura, sem login. Junta a palestra da sala (título, quem fala, horário, progresso), as perguntas aprovadas (mais votadas primeiro, 6) e os QR (check-in da atual, avaliação da anterior, avaliação do evento). `features/room-board.js` (dual, `resolveRoomBoard`) decide o que mostrar a cada horário; `features/board-questions.js` lê e desenha; `components/room-board.js` é o markup.

**Dados (Firestore):** `talk-questions` (`talkKey`, `uid`, `text`, `name`, `status`) e `talk-question-votes` (`entryKey` = id da pergunta, `talkKey`), via `createFirestoreRepository` (`getWhere`, `update`). `features/question-ranking.js` (dual): `rankQuestions` filtra e ordena por estado. `features/question-slots.js` (dual): primeiro espaço livre.

**Modo ensaio** (`features/rehearsal.js`, `setupRehearsal` em `app.js`): `?ensaio=HH:MM` desloca a grade inteira pra a 1ª palestra começar naquele horário de hoje, liga o modo DEV e mostra a faixa "MODO ENSAIO". Serve pra testar tudo com o banco de verdade em qualquer dia (as regras olham o relógio real e a chave). Todo aparelho do ensaio usa o MESMO horário: os QR do quadro carregam `&ensaio=HH:MM&lineup=1` sozinhos. `?ensaio=0` desliga. Dados de teste saem pelo workflow "Limpar dados de teste" (agora inclui as duas coleções de perguntas).

**Como testar (teste primeiro):**
- Regras no emulador do Firestore, sem tocar o banco real: `DevFestIA/tools/questions/run-rules-tests.sh` (Java 21 + Firebase CLI; 21 casos: janela, limites, id trocado, moderador, votos). Cliente em `DevFestIA/tools/lib/firestore-emulator.js` (só `node:`). Palestras de teste com horário relativo a agora. Fora do CI (baixa o emulador); rodar sempre que mexer nas regras.
- Lógica pura no CI: `DevFestIA/tools/questions/questions.test.js`, `DevFestIA/tools/room/*.test.js`.

## Internacionalização (sessão 7): PT padrão, EN pronto

Idioma por `?lang=en|pt` (gravado em localStorage; sem detecção automática do navegador) e seletor "PT | EN" nas ações do cabeçalho
(`components/language-switcher.js`, só aparece com mais de um idioma cadastrado). Trocar de idioma recarrega a página.
**Português é o padrão e mora no próprio código**: cada texto é `t("chave", "Texto em português")`; só os OUTROS idiomas têm dicionário,
então idioma novo = uma linha em `data/i18n/languages.js` + um arquivo `data/i18n/<id>.js` (ES/FR entram assim, sem mexer em código).
- `features/i18n-core.js` (dual, testado em Node): `createI18n` (idioma, `t`, `tn` plural via `chave.one`/`chave.other`, `tt`, `{marcadores}`), `localizeStrings`.
- `features/i18n.js` (navegador): globais `i18n`, `t`, `tn`, `tt`; `applyStaticTranslations` (HTML com `data-i18n="chave"` e `data-i18n-attrs="atributo:chave"`, o PT continua escrito no HTML), `languageHref`.
- Dicionário: `{ strings: { chave: texto }, texts: { "texto PT": texto } }`. `strings` = chaves de `t()/tn()`; `texts` = **dados** (trilhas, ingressos, banners da grade, sobre, estatísticas, guias de instalação, quiz, rodapé...) traduzidos por igualdade de texto em `LOCALIZED_DATASETS` (`app.js`, lista de funções), uma vez no `initShell`, no lugar: quem consome o dado não sabe de idioma. Dado novo que aparece na tela entra nessa lista.
- Datas/moeda seguem `i18n.locale`; horários da grade sempre em 24h; códigos curtos (QR, `?agenda=`) usam `CODE_LOCALE = "pt-BR"` pra nunca mudarem com o idioma.
- **Conferidor no CI:** `node DevFestIA/tools/i18n/check-i18n.js` (toda chave usada existe em todo idioma, sem chave sobrando, mesmos `{marcadores}`, `t()` só com chave literal, todo texto de tela dos dados traduzido; `KEEP_AS_IS`/`SKIP_KEYS` no script). Testes do núcleo: `DevFestIA/tools/i18n/i18n.test.js`.
- **Escopo do EN (v1):** casca de todas as páginas (cabeçalho, menu, rodapé, faixa, status ao vivo, PWA), Principal, Grade, Ingressos, quiz, check-in/avaliação/perguntas/Minhas palestras/cartão. **Continuam em PT** (conteúdo do line-up e páginas que ainda não foram traduzidas): títulos, descrições, palestrantes e tags das palestras, time, patrocinadores, depoimentos, Código de Conduta e o corpo de Palestrantes/Time/Patrocínio, e as ferramentas internas (`checkin-display`, `moderacao`, `reset-teste`). O texto dos metadados de compartilhamento (OG/Twitter) segue em PT (robôs não rodam JS).

## Cartão pessoal "Eu vou!" (compartilhamento)

Zero backend — `features/share-card.js`
desenha um cartão 1080×1350 (formato feed/stories) num `<canvas>`
client-side: nome do evento, data (`eventDateLabel()` de `agenda.js`,
mesma função do header/ticker, nunca recalculada aqui), cidade, nome da
pessoa opcional ("Eu vou!"/"‹nome› vai!") e a legenda das 4 trilhas.
Cores e fontes vêm sempre de `getComputedStyle` sobre os tokens
(`--google-*`, `--bg`, `--accent`, `--font-display`, `--font-body`) —
nunca hex/fonte fixa, herda qualquer troca de paleta ou logo sozinho.
`components/share-card.js` (`shareCardModalMarkup`) é só o HTML do
modal (nome + preview + botões); `features/share-card.js`
(`initShareCard`) abre via `createModal` (mesmo componente de
`install-guide.js`), redesenha a cada tecla no nome, baixa o PNG
(`canvas.toDataURL`) ou usa a Web Share API com arquivo quando o
navegador suporta (`navigator.canShare`/`navigator.share`, feature-detect,
sem fallback quebrado). Ponto de entrada hoje: botão "Já vou! Gerar meu
cartão" em `ingressos.html` (`data-share-card-open`); a feature é
genérica (recebe `event`/`schedule`/`createModal` por parâmetro), então
o mesmo botão funciona em qualquer outra página só chamando
`initShareCard()` de novo.

## Inscritos do Sympla: sync, gate do cartão e contador

**Inscrição acontece só no Sympla** (evento `s36cd5d`, `reference_id` 3591517).
A API do Sympla é só de leitura e sem webhook; o site é estático e o token é
segredo, então a ponte é um job agendado, sem servidor nosso e sem custo:

- **Job** (`.github/workflows/sync-sympla.yml`, a cada 10 min, só no `main`):
  `DevFestIA/tools/sympla-sync/sync.js` lê participantes (API v1.5.1, paginação por
  página, com e-mail, tipo de ingresso, `order_status`, check-in) e pedidos
  (v1.6.0, cursor, com `buyer_email`). A v1.6.0 devolveu participantes vazios em
  evento passado (medido no 2025), por isso as duas versões, ambas parâmetros do
  `createSymplaRepository`. Conta como inscrito só `order_status = APPROVED`.
- **Reconciliação idempotente** (`reconcile.js`, puro): cada participante entra pelo
  e-mail dele e pelo do comprador do pedido (participante tem prioridade). Estado
  anterior = 1 documento (`sync-state/<edição>`, um JSON), então cada rodada custa
  1 leitura e só as escritas do que mudou (cabe no plano grátis Spark).
  Cancelamento/reembolso remove sozinho. Se cair no meio, a próxima rodada refaz.
- **Dados no Firestore** (regras em `DevFestIA/firebase/firestore.rules`, colar à mão):
  `registrations/<edição>_<sha256(e-mail em minúsculas)>` = `{ edition, ticketName }`
  (nunca e-mail nem nome), `event-stats/<edição>` = `{ total }` (público),
  `sync-state/<edição>` (interno). Leitura só por `get` (sem `list`); escrita só
  pelo job (conta de serviço ignora as regras).
- **Chave única** (`docs/js/data/email-hash.js`, dual): o site e o job usam o MESMO
  arquivo pra derivar a chave, então escrita e leitura nunca divergem. Mesma ideia
  em `firebase-config.js` (dual): o job lê projeto e edição de lá.
- **Gate do cartão** (`features/registration-gate.js`, ligado por `EVENT.tickets.registrationGate`, hoje `false`: só virar `true` depois que o sync estiver rodando, senão o cartão trava pra todos): a pessoa digita o e-mail do
  Sympla, o navegador calcula a chave e faz `get`. Achou = libera o cartão e guarda
  a chave em `verified-registrations` (localStorage). E-mail sem inscrição mostra o
  botão de compra. `initShareCard({ gate })` é opcional (sem gate o cartão é livre);
  `?cartao=1` abre o modal sozinho (link pro e-mail de confirmação do Sympla).
  Limite conhecido: qualquer um pode testar se um e-mail conhecido está inscrito
  (só revela "tem cartão", sem nome nem dado). A avaliação de palestra NÃO ganhou
  gate de inscrição de propósito: sem servidor ele seria só de interface (burlável
  no DevTools); a defesa real continua sendo o check-in por palestra.
- **Contador** (`features/registration-counter.js`, chamado uma vez em `initShell()`):
  lê `event-stats/<edição>` e mostra "N pessoas já garantiram a vaga" em qualquer
  página que tenha `#registrationCounter` (Home e Ingressos). Só com
  `EVENT.tickets.salesOpen` e a partir de `EVENT.tickets.counterMin` (30). Qualquer
  falha deixa escondido. `runAfterModules()` (app.js) é o jeito único de esperar os
  módulos do Firebase; `talk-feedback.js` usa o mesmo.
- **Painel privado**: o resumo de cada execução do job (Actions) mostra inscritos,
  check-ins no Sympla, por tipo de ingresso e respostas do formulário (camiseta),
  sem ir pro Firestore. Formato do `custom_form` ainda não observado (2026 sem vendas
  no dia da implementação): confirmar na primeira execução real.
- **Relatório pós-evento** (`event-report.yml`, sob demanda): inscritos, presença na
  porta, check-in por palestra e notas médias, pro media kit e patrocinadores.
- **Configuração única** (secrets do repositório): `SYMPLA_TOKEN` e
  `FIREBASE_SERVICE_ACCOUNT` (conta de serviço com a função "Cloud Datastore User").
  O hash do evento (`SYMPLA_EVENT_ID_HASH`) não é segredo e fica nos workflows.
  Sem os secrets o job só avisa e termina com sucesso.
- Testes: `node --test DevFestIA/tools/sympla-sync/sync.test.js DevFestIA/tools/event-report/build-report.test.js` (rodam no CI).

## Firebase (Firestore) — check-in e feedback

Único pedaço do site com escrita compartilhada entre visitantes; todo o
resto continua estático/sem backend (decisão mantida). Um projeto
Firebase só (`DevFest-Campinas`, console.firebase.google.com), nunca um
por edição — o ano é dado (`CURRENT_EDITION`/`KNOWN_EDITIONS` em
`data/firebase-config.js`), não projeto nem coleção separada, pra
permitir comparar edições depois sem UNION manual entre bancos.

- **SDK via CDN, `type="module"`** (o Firebase 9+ só existe como ES
  module; o resto do site é script clássico, então só os arquivos que
  tocam o SDK viram módulo — `firebase-client.js`, `firestore-repository.js`
  e os 3 repositories finos). Um módulo não expõe nada por `export` pro
  resto do site: cada um termina com `window.algumaCoisa = algumaCoisa`,
  então quem consome (`checkinRepository`, `feedbackRepository`) usa como
  qualquer outro repository do repo, sem saber que por baixo é módulo.
- **Ordem de execução importa:** scripts clássicos rodam sincronamente,
  na ordem do HTML, sempre antes de qualquer `type="module"` (que é
  sempre adiado pro fim do parsing, como `defer`). Então nada no
  bootstrap síncrono de uma página (`initShell()`, `initXxx()` chamado
  direto no `<script>` da página) pode depender de `window.checkinRepository`
  existir ainda — só dentro de um handler de clique, depois que a página
  carregou de verdade, é seguro.
- **1 documento por pessoa por chave:** id do documento é
  `"<uid>_<entryKey>"` (uid anônimo do Firebase Authentication, sem
  senha/e-mail). `createFirestoreRepository().add()` sempre faz
  `setDoc` "criar"; a regra de segurança recusa a segunda tentativa como
  "update", travando "1 registro por pessoa" sem checagem no cliente
  (que dá pra burlar).
- **Regra de segurança é a única defesa de verdade** — o site é estático
  e público (GitHub Pages), a `apiKey` do Firebase não é segredo. Texto
  da regra vive em `DevFestIA/firebase/firestore.rules` (sem deploy
  automático: colar manualmente em Firebase Console → Firestore →
  Regras a cada mudança). Valida `edition` contra `KNOWN_EDITIONS`, só
  permite `create` (nunca `update`/`delete` do client), tipo/tamanho de
  campo, e que o prefixo do id do documento bata com o uid de quem
  escreve.
- Coleções do visitante hoje: `checkins`, `talk-feedback`, `event-feedback`. Nenhuma
  tem leitura pública pelo client (`allow read: if false`); `registrations`/`event-stats` são
  do job do Sympla (ver seção própria); exibir
  agregado (nota média etc.) é trabalho futuro (ver handoff, fase 5.4).

## Repository pattern for static data

`docs/js/data/repository.js` exports `createRepository(data, extraMethods)`,
a thin factory (`{ getAll: () => data, ...extraMethods }`) that every
`data/*.js` collection file wraps its export in (`statsRepository`,
`sponsorsRepository`, `teamRepository`, `testimonialsRepository`, ...);
page bootstraps read through `getAll()`. **Not wrapped yet:** `EVENT`,
`TRACKS`, `SCHEDULE` (read directly in dozens of places; needs its own pass). It exists purely to
standardize *access* (`repository.getAll()` instead of referencing the
global `const` directly) — this site has no backend or API, so there is
no real fetch to hide. Must load before any `data/*.js` that calls
`createRepository()` (see script order in every page's `<head>`).

## Schedule: day plan and builder

`schedule.js` only *declares* the day (`DAY_PLAN`); the time math and mock
talks live once in `data/schedule-builder.js`:

- `talkWindows("09:00", 4)` → 4 consecutive windows, each `talkMin` (40,
  Q&A included) + `gapMin` (5 changeover) = 45 min pitch.
- `buildSchedule(plan, { eventTime, tracks, speakerPool })` turns the plan
  into `SCHEDULE`. Plan items: `{ banner, room?, start, end }` (combined
  session) or `{ talks: [{start,end},...] }` (one slot per window, one
  mock talk per track, rotating `MOCK_SPEAKERS`).
- Current plan: 08:00 Credenciamento, 08:30 Abertura, 4 slots from 09:00,
  12:00 to 13:20 Almoço, 13:20 to 13:30 Retorno, 5 slots from 13:30,
  17:15 to 18:00 Encerramento (9 slots × 4 tracks).
- Changing hours or slot count = editing `DAY_PLAN`. `schedule.dev.js`
  must mirror it (edit both).
- Load order in every page: `repository.js`, `mock-links.js`, `mock-photo.js`,
  `mock-logo.js`, `mock-speakers.js`, `mock-talks.js`, `schedule-builder.js`, then `schedule.dev.js`/`schedule.js`.

## Design tokens (colors and fonts)

All in `docs/css/tokens.css`, in three layers (only the first holds literals):
1. Brand palette `--google-blue/red/yellow/green` (same 4 colors as the new GDG Campinas logo; hex fallback then oklch).
2. Semantic: track colors `--ia`, `--webdata`, `--mobile`, `--mentoring` point at palette items; `--accent` (green, was `--neon`), `--live`, `--amber`.
3. Typography: `--font-display` and `--font-body`, both Google Sans (variable, weight 400-700, latin subset, self-hosted). Google Sans Text is NOT bundled: it is not in the open-source `google/fonts` repo, so its license for self-hosting is unconfirmed. `styles.css` never names a font.
Changing a color = edit `tokens.css`; changing the font = `fonts.css` + `tokens.css` + the `<link rel=preload>` in the 7 pages. Google Sans tops out at weight 700 on Google Fonts, so `800` declarations render as 700.

## Key design decision: zero per-track CSS

Every track-colored element (talk card, tab, legend item, modal detail,
"before you come" card) reads its color from `track.color` in
`schedule.js` and sets `--track-color` inline via JS. **No CSS rule
targets a track id** (no `.talk[data-track="ia"]{...}` style blocks).
Adding, renaming, or recoloring a track is a one-line change in
`TRACKS`; the only CSS involved is the color token itself
(`--ia`, `--webdata`, `--mobile`, `--mentoring` in `tokens.css`), never a per-track rule. 4 tracks today: IA,
Front-end/Back-end/Data, Mobile/Agile, Carreiras & Mentorias.

Same principle applies to track count: the agenda grid and legend use
`repeat(var(--track-count), 1fr)`, set once from `TRACKS.length` in
`initShell()` (`app.js`). Generic card grids (`.faq-grid`, used by
"Antes de vir", "Trilhas", Patrocínio benefits) use
`repeat(auto-fit, minmax(240px, 1fr))` instead, so column count follows
the number of cards, not the number of tracks.

## Dev/prod pattern for sensitive data (line-up)

`docs/js/data/schedule.dev.js` holds real speaker data and is
gitignored — never committed before the public reveal. Every page's
`<script>` block tries to load it first (`onerror` fallback, no async);
if it 404s (always the case in production), it falls back to
`schedule.js` (mock/"coming soon"). `mock-speakers.js` must load before
either, since the mock schedule references `MOCK_SPEAKERS` directly.

To reveal the real line-up: copy `schedule.dev.js` content into
`schedule.js`, commit, push. From reveal onward, keep both files
identical — always edit both together.

## Marca e logo (sessão 6)

- **Fonte única:** `docs/assets/brand/gdg-icon.svg` (espiral em 4 cores) e as duas versões
  horizontais `gdg-logo-dark.svg` (texto claro, pra fundo escuro, a usada no site) e
  `gdg-logo-light.svg` (texto escuro, pra fundo claro, ex.: certificado). Foram extraídos do vetor
  do PDF oficial (`gdg-campinas-logo.pdf`, Illustrator): as formas vêm do PDF, as CORES são as do
  PNG oficial (`#3186FF` azul, `#FC413D` vermelho, `#FFEC00` amarelo, `#00AF57` verde), porque o
  PDF traz uma conversão de cor mais apagada. Mono (1 cor) existe só como PNG do Renato, não usado.
- **Paleta do site = cores do logo:** `css/tokens.css` (`--google-blue/red/yellow/green`, hex +
  oklch) foi alinhada a essas 4 cores; as cores das trilhas seguem a paleta.
- **Onde aparece:** header (`EVENT.hosts[].logo`, logo horizontal; sem `logo` cai em ícone + nome),
  favicon SVG + PNG 32, `apple-touch-icon` 180, ícones do app 192/512 (zona segura de 60%),
  `og-image.png` 1200x630, cartão "Eu vou!" (desenha `event.hosts[0].logo` no canvas; sem logo,
  cai pro texto) e a galáxia do hero.
- **Regerar tudo:** `DevFestIA/design/build-brand-assets.sh` (rsvg-convert + Chrome + sips) lê o
  SVG e os designs em `DevFestIA/design/`. Trocar o logo = trocar o SVG e rodar o script.
  O service worker cacheia `/assets/` por caminho: ao trocar ícones, subir `SW_VERSION` em `sw.js`.
- **Galáxia do hero** (`features/hero-galaxy.js`, dados em `data/hero-galaxy.js`): o próprio ícone
  girando muito devagar atrás do hero da home (tema "Do Local ao Infinito"), dentro do palco
  `#heroStage`, PRESA no retângulo do card (mesmas laterais e cantos arredondados, `clip-path` além de
  `overflow` por causa do Safari do iPhone); nada dela aparece fora do card. O card do hero fica 72% opaco
  pra ela aparecer.
  Ela gira em volta de UM centro (`pivotX`/`pivotY` em `data/hero-galaxy.js`, o "olho" azul+vermelho do logo,
  que tem dois olhos), colocado no meio do card: girar pelo meio do desenho fazia os olhos orbitarem e o
  quadro parecer descentralizado. Tudo é dado (imagem, volta em
  segundos, opacidade, tamanho relativo à ALTURA do hero com teto `maxWidth` em `vw` (no celular a
  espiral não passa da tela), posição; centralizada, igual em qualquer aparelho). Com "Reduzir
  movimento" ligado no aparelho (macOS/iOS: Acessibilidade > Movimento) ela gira MAIS DEVAGAR
  (`reducedMotionSeconds`, 240 s por volta contra 80 s), sem parar; `null` = parada nesse caso.
  Decisão do Renato: o logo precisa girar, então não fica parada por padrão. `?movimento=1`
  força a velocidade normal mesmo com "Reduzir movimento" (telão do evento).

## Fundo estrelado

`initStarfield()` (features/starfield.js) injeta, uma vez por página via
`initShell()`, uma camada fixa atrás de todo o conteúdo (`.site-bg`,
`z-index:-1`, `pointer-events:none`): o acento de circuito colorido
(`assets/img/bg-circuit.webp`, `object-fit:contain`, sem esticar/cortar) e
duas camadas de estrelas geradas por CSS puro (`box-shadow` por ponto,
coordenadas fixas em `data/starfield.js`, não geradas em runtime). O circuito
entra em duas janelas (`.bg-circuit--top`/`--bottom`, `background-position`
topo/rodapé, `background-size:100% auto`): a mesma imagem ancorada nas duas
bordas da tela sem esticar e sem cortar os cantos — uma imagem centralizada
só deixaria o desenho flutuando no meio. Tremeluzir
via `@keyframes`; a regra global de `prefers-reduced-motion` (topo do
styles.css) já zera a duração da animação para quem pede menos movimento,
sem código extra aqui. Nenhuma página tem esse HTML no próprio arquivo —
mesmo padrão do rodapé e do nav, uma função, sete páginas.

## Header hosts (co-hosts/sponsors)

`EVENT.hosts` in `schedule.js` is an array, not a fixed pair — the
header renders 1..N logos with an auto-generated "+" separator
(`renderBrand()` in `app.js`). Add entries there when partners are
confirmed; no HTML/CSS change needed.

## Talk card and "Minha agenda" (favorites)

- Card (`trackCardMarkup`): track label + time chip (turns into "Em N min" for the next slot, "AGORA" + progress bar when live), title, optional format chip + up to 2 `#tags`, ringed avatar(s) with name, "cargo · empresa" and LinkedIn, footer with duration, star and room. Everything optional appears only if the talk data has it: `format` (id of `TALK_FORMATS`), `tags: []`, `speakers[].photo/title/company/linkedin`. The old `level` field is gone. Card options for agenda and "ao vivo agora" come from one place: `talkCardOptions()` in `agenda.js`.
- Favorites: `favoritesRepository` (localStorage key `devfest-campinas-2026:favorites`, no backend, per browser). Key = `talkKey(slot, trackId)` = slot start ISO + track id. `initFavorites(rootEl, repo)` is one delegated listener that syncs every star sharing a key (grade card, home hero, modal). Grade also has the "Minha agenda" toggle (`favorites-filter.js`), which respects the active track tab. Home hero shows the star too.
- Swap storage (or the whole repository for an API) by changing only the `createPersistedSetRepository` call in `data/favorites.js`.
- Formats and icons are data (`talk-formats.js`, `icons.js`): a new format is one line, no CSS.

## Track rooms (historic places)

`TRACKS[].room` and the room of the Abertura/Encerramento banners in `DAY_PLAN` are built with `roomFor(place)` in schedule.js/.dev.js ("Sala <lugar>"): IA `Observatório`, Front/Back/Data `Estação`, Mobile/Agile `Lagoa do Taquaral`, Carreiras `Mercadão Central`, opening and closing `Calçadão Central`. The name pattern lives only in `roomFor`; changing a place is one argument. It shows in the Grade legend, talk cards, modal and the home "ao vivo agora" with no other code. Names are decorative and may not match the real venue rooms (venue still TBD).

## Track icons

Each entry in `TRACKS` (schedule.js/.dev.js) has `icon`, a name from `data/icons.js` (IA `sparkles`, Front/Back/Data `code`, Mobile/Agile `phone`, Carreiras `rocket`). Only the home "Trilhas" section shows it (`tracks-overview.js` via `iconMarkup`, default `grid` when a track has none). New track icon = one entry in `icons.js` + the `icon` field.

## Line-up model: talk <-> speaker <-> schedule (all interlinked)

- One source of people (`mock-speakers.js`, later the real line-up) and one catalog of talks (`mock-talks.js`). A talk references people only by `speakerIds`; `buildSchedule(plan, { speakerPool, talkCatalog })` resolves them into the same speaker objects (no copies) and warns in the console on an unknown id.
- Everything else derives from `SCHEDULE`: `extractSpeakers()` (features/speakers.js) builds the Palestrantes gallery AND the home "Destaques" pool, dedup by `id`, listing every talk of each person.
- Navigation both ways: speaker card -> talk (same modal as Grade, via `[data-slot-index][data-track]`), talk modal -> speaker profile (`palestrantes.html#speaker-<id>`, highlighted and scrolled on arrival), Destaques -> profile. LinkedIn appears on the talk card, the modal, the gallery card (mock URL: `MOCK_LINKEDIN_URL` in `mock-links.js`, one place).
- Favorites (`Minha agenda`) work in Grade, home hero, modal, and Palestrantes.
- Track filter (`features/track-filter.js`): one module for the tabs (`renderTabs`, optional per-track counts, `initTabSelection`) reused by Grade (`initTrackFilter`, cards) and Palestrantes (`initSpeakerTrackFilter`, people with a talk in that track, showing only that track's talks). A link to a speaker hidden by the filter (`#speaker-<id>`) resets the filter to "Todas as trilhas" via the injected `showAll`. The selected tab is centered on narrow screens.
- The line-up is public (`EVENT.lineupRevealed = true`) with mock data, by decision of the organizers. Real line-up = replace the catalog/speakers with same-shape data (photo, real LinkedIn).

## Site nav

`docs/js/components/site-nav.js` is the single source of the page list
(`SITE_PAGES`). Every page calls `renderSiteNav(activePageId, mountEl)`
once from `initShell()`. Adding, renaming, or reordering a page is a
one-line change there — never edit nav HTML per page. `nav: false` keeps a page
out of the menu but in the offline pre-cache (the quiz, linked from a home CTA).

## Mock content (until real data arrives)

All mock people, companies and links are fictional and live in `data/`: speakers and talks (see "Line-up model"), team (`team.js`, 6 organizers and 8 volunteers with Brazilian names; the Time page has no photo gallery), sponsors (`sponsors.js`, 5 tiers, 12 fictional companies with generated logos), partner communities (4), testimonials (3, with optional `role`). Person photos come from `mockPhoto()` (external stock service, hand-picked numbers; do not add numbers without looking at the image), logos from `mockLogo()`. Replacing mock with real = same shapes, real `photo`/`imageUrl`/`link`.

## Usage analytics

- Screens never call analytics. They tag elements with `data-track-event` (plus optional `data-track-place`, `data-track-target`, `data-track-kind`) and one delegated click listener in `features/analytics.js` turns each click into an event. Current events: `cta_click`, `talk_open`, `favorite_toggle`, `track_filter`, `my_agenda_view`, `calendar_add`, `agenda_export`, `agenda_share`, `shared_agenda_save`, `speaker_profile`, `sponsor_click`, `footer_link`, `pwa_install`. New event = add the attribute in the markup.
- The provider is an injected adapter (`ANALYTICS_ADAPTERS`, today only GoatCounter: cookieless, free, no personal data). `data/analytics.js` has `endpoint: ""`, so nothing loads until it is filled with `https://<code>.goatcounter.com/count` (account creation is up to the organizers). Moving to Google Analytics later = one new adapter + `provider`.
- Debug: open any page with `?analytics=debug` to log every event in the console.

## Offline (PWA)

- `docs/manifest.webmanifest` (installable, standalone), icons `assets/icons/icon-192.png` and `icon-512.png` (source `DevFestIA/design/app-icon.html`, regenerate when the new logo arrives), `docs/sw.js` (service worker) and `features/pwa.js` (registration, "Instalar app" button, "sem internet" bar).
- `sw.js` has no hand-written file list: on install it reads `SITE_PAGES` (importScripts of `site-nav.js`), fetches every page, everything they reference (src/href, including the schedule loaded through `onerror`), CSS `url()`s and the manifest icons. Pages are network-first (cache when offline, keyed by path so `?demo=`/`?agenda=` reuse it), files with `?v=N` or under `/assets/` are cache-first (the URL changes when the file does), everything else network-first. Same origin only (mock avatars from pravatar are not cached).
- Bump `SW_VERSION` in `sw.js` only when the worker logic changes (it drops old caches). Emergency: open any page with `?nosw=1` to remove the worker and its caches.
- "Instalar app" (`initInstallPrompt` in `pwa.js`): the button is always shown until the app is installed (`isRunningAsInstalledApp()`). With the native `beforeinstallprompt` (Chrome, Edge, Android) it opens the browser dialog; without it (iPhone/Safari, Firefox, in-app browsers) it opens a modal with the steps of the platform. `features/install-platform.js` picks the platform id from ordered rules (`INSTALL_PLATFORM_RULES`, pure, takes `{ ua, maxTouchPoints }`), `data/install-guides.js` holds the steps, `components/install-guide.js` the markup, `components/modal.js` the modal. New platform = one guide + one rule. The click carries `data-track-kind` `native` or `guide`. Every page that loads `pwa.js` must also load the six scripts above; `tools/check-install.js` (CI) fails if one is missing (Patrocínio was missing two, so the button would have thrown there).
- The manifest lists `any` and `maskable` icons separately (same files: the artwork already sits in the 60% safe zone) and has an `id`.
- The Browser pane in the desktop app does NOT support service workers; test with real Chrome (a CDP script drove it: install, offline reload of home/grade/speakers, kill switch).

## Share metadata and SEO

- Every page has static `og:*`, `twitter:*`, `canonical` and a per-page `description` in its `<head>` (social crawlers do not run JavaScript, so this repetition across the 7 pages is unavoidable in a zero-build site). `DevFestIA/tools/check-meta.js` (also a CI step) fails if any page is missing tags or has a wrong `og:url`, `og:image`, sitemap entry or robots line.
- `EVENT.url`, `EVENT.description`, `EVENT.image` in schedule.js/.dev.js are the source; `docs/assets/img/og-image.png` (1200x630) is rendered from `DevFestIA/design/og-image.html` (headless Chrome command in the file). Re-render it when the new logo arrives.
- `features/seo.js` builds the schema.org `Event` JSON-LD from EVENT, SCHEDULE and the ticket types (one `Offer` per type, `PreOrder` until `EVENT.tickets.salesOpen` is true; the venue name only when `EVENT.venueConfirmed`).
- `docs/sitemap.xml` and `docs/robots.txt` are static; add a page there and in `SITE_PAGES`.

## Calendar and sharing

- `features/calendar.js` is pure: one entry shape `{ uid, title, start, end, location, details, url }` feeds the Google Agenda link and the `.ics` (RFC 5545: CRLF, escapes, 75-octet folding, UTC times, 10 min alarm). `eventLocationLabel()` only includes the venue when `EVENT.venueConfirmed` is true.
- `features/talk-index.js` maps talkKey and a short share code (`0945.ia` = start time + track id) to schedule entries, and turns a talk into a calendar entry.
- `features/calendar-actions.js` (delegated click): per-talk `.ics` from the modal, and "Exportar (.ics)" for the whole Minha agenda. It returns the `{ index, event, siteUrl }` context that `initTalkDetails` and the share feature reuse.
- Sharing has no backend: `?agenda=0900.ia,1030.webdata` on the Grade. The owner gets a bar (export, WhatsApp, copy link); whoever opens the link sees a banner and can save all of it to their own agenda (`favoritesRepository.addAll`). Unknown codes are ignored.

## Accessibility rules (keep them)

- `--muted-dim` (tokens.css) is text-safe: at least 4.5:1 (WCAG AA) over cards and background. Do not go darker.
- No visible text below 12px. Keyboard focus is one global `:focus-visible` rule in styles.css; only add a specific one if the offset or radius must differ.
- `features/a11y.js`: skip link ("Pular para o conteúdo", target = first block after `<header>`, no markup per page), `prefersReducedMotion()` and `motionSafeBehavior()` for programmatic scrolling; CSS also shortens animations and transitions under `prefers-reduced-motion`.

## Tickets and the registration CTA

`features/tickets.js` has one source of CTA state, `ticketCtaState(EVENT.tickets)`: `url` set = buy button (Sympla), no url but `waitlistUrl` = "Avise-me quando abrir", neither = status pill ("Em breve"). It feeds every place the button shows: header (all pages, via `initShell`), fixed bottom bar on mobile (hides while the tickets section is on screen), hero countdown card, and the ticket cards on the home. Ticket types are data (`data/tickets.js`): name, price, benefits, color, `featured`/`badge`, optional per-type `url`. A type without `price` shows `TICKET_PRICE_TBD` ("Valor a definir") and no schema.org Offer; today only Grátis has a price (0). `EVENT.tickets.url` now points to the published Sympla event (`https://www.sympla.com.br/evento/devfest-campinas-2026/3591517`, no tracking params) and `salesOpen` is `true`, so every CTA (header, bar, hero, cards) is a buy button. Empty `url` again brings back the "Em breve" pill.

## Sponsors section

`docs/js/data/sponsors.js` exports `SPONSORS`, a list of
`{ tier, elements: [{name, link, imageUrl, description?}] }`. The
section (`js/features/sponsors.js`) hides itself entirely while empty.
`description` is optional; `sponsor-card.js` renders logo (white box) +
name + description when present. Partner communities reuse the same
function without a description. Currently mock data (1 placeholder item
per tier). Fill in tiers when sponsors are confirmed.

## Ticker

`features/ticker.js` builds the scrolling banner from `EVENT`/`SCHEDULE`
(no separate copy of name/date). `initShell()` calls it on every page
that has a `#ticker` element (all seven do, right after `<body>`).

## PROD x DEV (mesmo site, um parâmetro, salvo no navegador)

Não existe deploy/config separado pra PROD e DEV — os dois são a mesma
URL publicada, só muda o estado de `reveal`. `EVENT.lineupRevealed = false`
(PROD, padrão). `?lineup=1` entra no modo DEV **e grava em
`sessionStorage`** (`devfest-campinas-2026:dev-mode`, `resolveReveal()` em
app.js): assim, clicar no menu pra outra página continua em DEV mesmo
sem o link carregar o parâmetro de novo — antes disso, `?lineup=1` se
perdia a cada navegação, o que o Renato relatou como "horrível". Um selo
fixo "DEV — sair" (`warnIfDevMode()`, canto inferior direito, só aparece
quando o modo veio do sessionStorage) linka pra `?lineup=0`, que limpa o
armazenamento e volta pro PROD de vez. **`sessionStorage`, não
`localStorage`, de propósito:** reseta sozinho quando a aba/navegador
fecha — depois de o Renato ficar preso em modo DEV por dias num
navegador de teste (achando que era bug do site), trocamos pra isso:
persiste enquanto navega dentro da mesma sessão, mas nunca fica "grudado"
pra sempre. Sem `sessionStorage` (modo privado bloqueado): `?lineup=1`
ainda funciona nessa página, só não sobrevive à navegação — nunca quebra
a página.

`resolveReveal()` controla, em cada página, TUDO que ainda é mock:
- **Grade:** `reveal` falso troca a página inteira (`<main>`) por um
  aviso único — não faz sentido mostrar 36 cards "Título a confirmar"
  quando dá pra dizer isso uma vez só.
- **Patrocinadores, comunidades parceiras, time (organizadores e
  voluntários), ingressos:** cada seção usa `renderOrConstruction()`
  (`features/reveal-gate.js`) — chama a função de render de verdade só
  se `reveal`; senão troca o conteúdo por `constructionNoticeMarkup()`
  (`components/construction-notice.js`), com uma mensagem própria por
  seção. Generic o suficiente pra qualquer seção nova entrar no mesmo
  gate sem duplicar lógica.
- **Título/palestrante do line-up** (Home/Grade/Palestrantes/modal):
  infra mais antiga (sessão 2) que já existia — "Título a confirmar",
  "Em breve" em `track-card.js`, não mexida por essa mudança.

A antiga faixa amarela fixa no topo (`warnIfMockContent`) foi removida —
virou redundante depois que cada seção já mostra o próprio aviso.

`docs/DEV/` e `docs/PROD/` são páginas de atalho pra ativar/desativar o
modo DEV sem repetir `?lineup=1`/`?lineup=0` — pedido do Renato depois
de reclamar que o parâmetro se perdia a cada clique no menu.
`DEV/dev-loader.js` é o único arquivo com lógica (grava a chave,
busca a página real via `fetch()`, reescreve o documento com
`<base href="../">` pra resolver os caminhos relativos); cada
`DEV/<página>.html` (index, grade, palestrantes, time, patrocinio,
ingressos, codigo-de-conduta) é só um wrapper de uma linha com
`data-target="<página>.html"` — zero lógica duplicada entre eles. A URL
fica em `/DEV/<página>` (nunca pula pra fora, era o que o Renato queria);
sem `fetch` (offline/CORS) cai pro redirect simples. `PROD/index.html`
só limpa a chave e redireciona pra `index.html` (sair do DEV não precisa
manter URL própria). Ambos ficam fora do sitemap/OG (`check-meta.js` só
varre `docs/*.html` no nível raiz, não entra em subpasta) e com
`noindex`.

`/DEV/*` e `/PROD/*` também pulam o service worker inteiro
(`isUtilityRoute()` em `sw.js`) — nunca respondem do cache, sempre rede
direto; sem isso, uma rede instável podia cair pro fallback offline e
servir uma página velha ali (aconteceu: o Renato viu mock numa `/PROD/`
que já devia estar limpa). `dev-loader.js` também busca a página real com
`{cache: "reload"}`, ignorando o cache HTTP normal do navegador.


## URL overrides (testing)

- `?demo=2026-11-28T09:15` (seconds optional) — simulates event time,
  advances in real time from that offset (never freezes).
- `?lineup=1` — forces the line-up to show even before
  `EVENT.lineupRevealed` is true.
- `?lang=en` / `?lang=pt` — idioma da página (fica gravado no navegador).

## Deploy checklist

1. Edit files.
2. `node --check` every changed `.js` file.
3. Bump `?v=N` on every `<link>`/`<script>` in every `.html` whose
   referenced file content changed.
4. Test locally (`cd docs && python3 -m http.server 8080`), walk
   through `?demo=` transition points, check console for errors.
5. `git commit` (English, no AI co-author line, no AI mention, ever).
6. `git push origin development`.
7. CI runs `node --check`, then auto-promotes to `main`. Confirm live
   via `curl`/browser before considering it done.

## TBD (fill in before the event)

- Event venue and address (`EVENT.venue`, `venueConfirmed`; the date is set).
- Real room names and MCs (`TRACKS[].room/mc`; rooms are landmark mocks, MCs "MC a definir").
- Plenárias (full-width featured-speaker slot): mockup approved, variant A/B/C pending, see handoff.
- Real line-up (replace `mock-talks.js` and `mock-speakers.js` with same-shape data, real photos and LinkedIn), real sponsors and communities, testimonials, team, ticket values (the Sympla link is already set).
- The recap video of 2025 (`data/video.js` still has the 2017 one). (New logo: done, see "Marca e logo".)
- Parking/food images (`PARKING_IMAGES`/`FOOD_IMAGES` in `app.js`, still empty).
- Before the event: run "🧹 Limpar dados de teste" (dry run, then for real) and `reset-teste.html` on the test devices; switch `EVENT.tickets.registrationGate` on after a real registration test; see handoff "Pendências".
- Logística física do QR ao vivo (`checkin-display.html`): qual tela/tablet por sala, quem monta no dia.

## Documentation upkeep (standing directive)

Documentation must stay in sync with the real state of the repo, not
just with what a past session remembers. After any change with
architectural, functional, or data-state impact:

1. Check whether it changed something described in this file
   (architecture, file list, design decisions) — update it if so.
2. Update `handoff/HANDOFF_CURRENT.md` with what changed.
3. If in doubt whether docs are stale, cross-check against
   `git log`/`git status`, not against memory of a previous session.

See `project-docs/Continuidade.md` for the full rule.
