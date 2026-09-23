# Handoff — Current State

**Last updated:** 2026-09-23, sessão 6 (em andamento). Antes de confiar neste texto, rode
`git status --short --branch` e `git log --oneline --decorate -10` (o git não mente).

## Status em uma olhada

- Site estático de **7 páginas** (Principal, Grade, Palestrantes, Ingressos,
  Time, Patrocínio, Código de Conduta), sem build, sem backend pra conteúdo.
  Publicado por GitHub Pages a partir de `docs/` no `main`; trabalho no
  `development`, o CI valida e promove sozinho.
- **Um pedaço tem backend agora:** Firebase (Firestore + Authentication
  anônimo) para check-in, avaliação de palestra **e agora avaliação do
  evento inteiro** (fase 5.3, ver abaixo) — único dado compartilhado
  entre visitantes. Resto do site continua 100% estático.
- **PROD (público) esconde todo mock por padrão** — line-up, patrocinadores,
  comunidades, time e ingressos mostram "será revelado em breve" em vez de
  dado fictício. **DEV** (`/DEV/` ou `?lineup=1`) mostra tudo.
- **Sessão 6 (commitado e no ar; Sympla -> site pronto, aguardando secrets):** feedback de fim de
  evento (fase 5.3) implementado — hero "Encerrado" da home agora mostra
  o formulário de avaliação do evento; e cartão pessoal "Eu vou!"
  (`ingressos.html`, canvas client-side, baixar/compartilhar). Bug
  achado e corrigido na sessão 6: o hero "Encerrado" é desenhado no bootstrap
  síncrono, antes dos módulos do Firebase, então o formulário travava em
  "Carregando…" (agora `render()` espera `runAfterModules()`). A escrita
  real do feedback de evento no Firestore ainda precisa ser confirmada (o
  Browser pane carrega o Firebase normalmente; o erro antigo era esse bug,
  não limitação do painel).
- Último commit da sessão anterior: `9a3ba39` / `973a0e2` (refresh de docs).

## O que o site tem hoje

**Grade e agenda:** 4 trilhas (IA, Front/Back/Data, Mobile/Agile, Carreiras &
Mentorias), 9 slots × 4 = 36 palestras, geradas por `schedule-builder.js` a
partir do `DAY_PLAN`. Salas com nomes de lugares históricos via
`roomFor(lugar)`. Cards (formato, tags, LinkedIn, duração, sala),
"acontecendo agora" (hero da home, pílula AO VIVO, barra fixa, progresso,
"Em N min"), filtro por trilha com contadores, "Minha agenda" (favoritos em
localStorage) com exportar .ics, WhatsApp, copiar link e banner para quem
abre `?agenda=`. **Em PROD, a Grade inteira mostra um aviso único** em vez
da grade mock (ver "PROD x DEV").

**Line-up ligado:** 36 palestras (`mock-talks.js`) e 40 palestrantes, 10 por
trilha (`mock-speakers.js`), ligados só por `speakerIds`. Galeria de
Palestrantes lista as palestras de cada pessoa, o modal leva ao perfil,
Destaques da home também.

**Check-in + avaliação de palestra (Firebase, fase 5.1-5.2 prontas):**
dentro do modal de qualquer palestra — botão de check-in (QR via
`?checkin=<código>` ou botão manual de honra com confirmação inline),
formulário de avaliação (estrelas 1-5, nome opcional, "o que mais gostou")
liberado só depois que a palestra terminou **e** teve check-in. Anônimo por
decisão (uid do Firebase, sem login — ver PROJECT_CONTEXT). Tela de QR ao
vivo pra sala: `checkin-display.html?trilha=<id>`.
**Falta:** confirmar em Chrome real o feedback de fim de evento (fase 5.3, implementado) e decidir a
logística física de onde exibir o QR (tablet/monitor por sala).

**Conversão e alcance:** 3 tipos de ingresso (Grátis, com camiseta, VIP) numa
página própria (`ingressos.html`); preços pagos mostram "Valor a definir"
(só Grátis tem R$ 0); todo CTA leva ao evento no Sympla (id 3591517, `salesOpen: true`). Tags OG/Twitter/canonical, imagem 1200×630, sitemap, robots,
JSON-LD do evento. Em PROD a seção de ingressos também vira aviso.

**Qualidade:** contraste AA, fonte mínima 12px, foco global, skip link,
`prefers-reduced-motion`. Fontes locais (Google Sans). PWA instalável e
funcionando sem internet — botão "Instalar app" sempre visível, com guia por
plataforma quando não há prompt nativo (iPhone/Firefox/apps embutidos).
Analytics: GoatCounter (conta `gdgcampinas`), sem cookies.
Fundo estrelado + acento de circuito em toda página.

Arquitetura, padrões e decisões completas: `project-docs/PROJECT_CONTEXT.md`
(seções "Firebase (Firestore)", "Check-in e avaliação de palestra", "PROD x
DEV", "Fundo estrelado", "Offline (PWA)", "Line-up model", "Tickets and the
registration CTA", "Calendar and sharing", "Share metadata and SEO", "Usage
analytics", "Accessibility rules", "Design tokens", "Track rooms").

## Decisões que o Renato já tomou (não reabrir sem motivo)

- Nada de backend pra conteúdo; Firebase só pra check-in/feedback
  (compartilhado entre visitantes), sempre atrás de repository.
- Cores/marca: paleta do Google, tokens em `css/tokens.css`. Fonte: Google
  Sans (Google Sans Text não entra: licença de hospedagem não confirmada).
- Fotos: pessoas (pravatar.cc por número, escolhidas à mão), não avatares
  ilustrados. Salas: lugares históricos, não bairros. Time sem galeria de
  fotos.
- Ingressos: Grátis, Ingresso com camiseta, VIP; Sympla (evento publicado, link em
  `EVENT.tickets.url`).
- Check-in/feedback: **anônimo** (uid do Firebase, sem login/nome
  verificado) — quem impede sabotagem é o check-in (prova de presença), não
  a identidade. Firebase: **um projeto só** (`DevFest-Campinas`), edição
  (ano) como dado (`CURRENT_EDITION`), nunca projeto/coleção por ano.
- Confirmação de check-in é **inline** no visual do site, nunca o
  `confirm()` nativo do navegador (achado feio).
- Modo DEV usa `sessionStorage`, não `localStorage` — precisa persistir
  navegando, mas nunca pode ficar "grudado" pra sempre.

## Pendências (com quem depende)

1. **Logo novo (chegou, ainda não aplicado; Renato pediu só pra anotar):** arquivos em
   `~/Downloads/gdg-campinas-logos/` (a pasta mais nova; `gdg-campinas-logo` e
   `gdg-campinas-logo 2` são versões anteriores, com o mesmo conteúdo menos 2 arquivos).
   Conteúdo: ícone em 4 cores e em 1 cor (amarelo, azul, branco, preto, verde,
   vermelho), logo com texto em 4 cores (fundo branco e fundo preto), em 1 cor
   (branco, preto) e perfil, todos PNG, mais `gdg-campinas-logo.ai`, `.pdf` e um `.zip`.
   **Não há SVG**: o redemoinho animado do hero (e a troca nítida em qualquer tamanho)
   precisa de SVG; dá pra extrair do `.ai`/`.pdf` (vetor) e conferir com o Renato.
   Trocar: `EVENT.hosts[].icon` (header), favicons, ícones do app (fonte
   `DevFestIA/design/app-icon.html`), imagem de compartilhamento (fonte
   `DevFestIA/design/og-image.html`), `theme-color`, e o cartão "Eu vou!"
   (hoje só texto "GDG Campinas", pode ganhar o logo). Copiar pro repo só o que for
   usado (`docs/assets/`), não a pasta inteira.
2. **Plenárias (decisão do Renato):** faixa larga com palestrante de
   destaque ocupando todas as trilhas. Mockup aprovado (avatar 104px, anel
   multi-cor, selo "Plenária", barra com as 4 cores). Variantes: A — 3
   plenárias (28 talks); **B — só 17:15 (36 talks, custo zero, recomendada)**;
   C — só 13:30 (32 talks). Falta escolher A, B ou C. Implementação: item
   `{ plenary: {...} }` no `DAY_PLAN` (schedule.js e .dev.js), ramo em
   `buildSchedule()`, `plenaryMarkup()` reusando componentes existentes, CSS
   com tokens (sem regra por trilha).
3. **Feedback de fim de evento (fase 5.3):** implementado nesta sessão
   (`components/event-feedback.js` + `features/event-feedback.js`, no
   hero "Encerrado" da home) — falta só **confirmar a escrita no
   Firestore** (abrir `/DEV/index.html?demo=2026-11-28T18:10`, enviar, conferir
   a coleção `event-feedback` e apagar o documento de teste).
4. **QR ao vivo — logística física:** `checkin-display.html?trilha=<id>`
   está pronto e testado; falta decidir onde exibir (tablet, notebook, TV
   com Chromecast por sala) e testar com internet fraca de verdade no dia.
5. **Dados reais (Renato/organização):** local (`EVENT.venue`,
   `venueConfirmed`), salas/MCs reais, line-up real (mesmo formato de
   `mock-talks.js`/`mock-speakers.js`), patrocinadores/comunidades reais,
   depoimentos, time, valores reais dos ingressos (link do Sympla já
   configurado, `salesOpen: true`), vídeo de recap
   2025 (`data/video.js` ainda tem o de 2017). Quando o line-up real
   chegar: `EVENT.lineupRevealed` volta pra `true` (não precisa mexer em
   mais nada — todas as seções leem o mesmo `reveal`).
6. Confirmar grafia/existência dos lugares das salas (não verificado online).
7. Opcional: estender o repository pattern a `EVENT`/`TRACKS`/`SCHEDULE`.
8. **Internacionalização (backlog, não desenhado):** PT/EN/ES/FR. Precisa
   decidir seletor de idioma, onde vive o texto traduzível (hoje hardcoded
   em `data/*.js` e HTML), e se o line-up real também traduz. Escopo grande,
   task própria antes de tocar em código.
9. **Sympla -> site (no ar e rodando):** conta de serviço `sympla-sync` (função Cloud
   Datastore User), secrets `SYMPLA_TOKEN` e `FIREBASE_SERVICE_ACCOUNT` no GitHub, regras
   publicadas, job rodando a cada 10 min (testado em 2026-09-23: dry run e execução real
   com sucesso, 0 inscritos ainda). Falta: (a) quando entrarem as primeiras inscrições,
   conferir o resumo da execução (formato do `custom_form`/camiseta e paginação v1.5.1
   parâmetro `page`); (b) virar `EVENT.tickets.registrationGate: true` em `schedule.js` e
   `schedule.dev.js` (hoje `false`, cartão livre) só depois de testar o gate com o e-mail de
   uma inscrição real; (c) colocar o link `.../ingressos.html?cartao=1` na mensagem de
   confirmação do Sympla; (d) apagar os documentos de teste em `checkins`/`talk-feedback`
   antes do evento (senão sujam o relatório).
10. **Mural eletrônico / telão de LED (task anotada, não iniciada):** página interna em
    tela cheia com cenas em rodízio (agora/próximas, álbum, fênix, patrocinadores,
    QR codes, números ao vivo, dicas, avisos). Detalhes e perguntas em aberto
    (tamanho do painel, origem das fotos) em `project-docs/IDEAS_BACKLOG.md`.
11. **Feedback v2 (no ar, regras publicadas e testadas; falta só limpar os testes):**
    Minhas palestras (`?avaliar=1`), QR de avaliação na sala (`?avaliar=<código>`), aviso
    "avalie", estrelas cheias, nome obrigatório, avaliação do evento com aspectos e 0-10,
    relatório v2 (ver PROJECT_CONTEXT, "Feedback v2"). As regras de 2026-09-23 foram testadas
    contra o Firestore real com um usuário novo: 8 casos inválidos recusados (sem check-in, sem
    nome, nome vazio, evento sem aspectos, sem 0-10, sem nome, faltando 1 aspecto, 0-10 = 11) e
    os válidos aceitos, e a 2ª avaliação recusada. Falta: (a) apagar as coleções de teste
    `checkins`, `talk-feedback` e `event-feedback` no console (e os dados locais dos
    navegadores de teste) antes do evento; (b) colocar o link `.../index.html?avaliar=1` na
    mensagem final do Sympla e o QR no encerramento; (c) definir quem monta o tablet de cada
    sala (`checkin-display.html?trilha=<ia|webdata|mobile|mentoring>`). Não feito: nota média
    pública nos cards (decisão: só interno).
12. **Certificado de participação (task anotada, não iniciada):** decisões em aberto (quem tem
    direito, carga horária, nome, validação, textos e assinaturas) em
    `project-docs/IDEAS_BACKLOG.md`. Depende também do logo novo em SVG.
13. **Script de limpeza dos dados de teste (proposto, aguardando aprovação do Renato):** workflow
    "Limpar dados de teste" (só `checkins`, `talk-feedback` e `event-feedback`; simulação por
    padrão; exige digitar `APAGAR`; recusa depois do início do evento) e página interna
    `reset-teste.html` pra limpar o navegador de teste. Enquanto isso, apagar as coleções pelo
    console do Firebase.

## Backlog de ideias (aprovadas em espírito, nada implementado)

Lista completa, com contexto técnico de cada ideia, em
`project-docs/IDEAS_BACKLOG.md` (cole a seção que quiser retomar num chat
novo). Resumo:

**Identidade e "uau":** redemoinho do logo animado (depende do logo novo
em SVG). Cartão de compartilhamento pessoal "Eu vou!" **saiu do backlog,
implementado nesta sessão** (`ingressos.html`, ver PROJECT_CONTEXT.md
seção "Cartão pessoal").

**Engajamento:** quiz "Monte sua trilha", certificado de participação,
perguntas ao vivo/enquetes, passaporte com QR nos estandes, mural da
hashtag.

**Conteúdo/utilidade:** nota média por palestra (fase 5.4 do feedback),
depoimento público x privado (decisão adiada de propósito), mapa do
local, credencial digital com QR, vagas dos patrocinadores, mentorias com
agendamento, votação da comunidade pras salas.

**Infra/base:** analytics mais profundo (GA4 + consentimento, separado do
GoatCounter), QR físico por sala, internacionalização, restringir a chave
do Firebase por domínio.

## Como trabalhar e testar aqui

- Servidor local: `cd docs && python3 -m http.server 8080`.
- **PROD x DEV** (ver PROJECT_CONTEXT para os detalhes técnicos):
  - `/DEV/` (ou `?lineup=1`) mostra todo mock; `/PROD/` (ou `?lineup=0`)
    limpa. Persiste em `sessionStorage` navegando pela mesma aba, some
    sozinho ao fechar a aba/navegador — nunca fica preso pra sempre.
  - Selo vermelho "DEV — sair" no canto quando em DEV.
  - `/DEV/*` e `/PROD/*` nunca passam por cache (nem HTTP nem service
    worker) — sempre a versão mais nova, de propósito.
- Outros parâmetros: `?demo=2026-11-28T09:20` (simula o horário; testar
  09:20, 10:27 "Em N min", 12:30 almoço, 17:30, 18:30 encerrado),
  `?analytics=debug` (loga eventos), `?nosw=1` (remove service worker e
  caches), `?checkin=<código>` (grava check-in — é o que o QR codifica).
- Toda mudança em `.js`/`.css` exige `node --check` e bump de `?v=N` em
  todas as páginas que o referenciam. `?v=` esquecido = navegador serve
  versão velha. `docs/js/data/schedule.dev.js` é gitignored e carregado
  sem `?v=` — edite sempre junto com `schedule.js`, nunca commite o dev.
- Ferramentas em `DevFestIA/tools/`: `check-meta.js` e `check-install.js`
  rodam no CI; `check-lineup.js`, `check-calendar.js` são manuais (Node,
  sem navegador); `e2e-offline.js`/`e2e-kill-switch.js` usam Chrome real via
  DevTools (o painel do app não roda service worker).
- Firebase: console em console.firebase.google.com, projeto
  `DevFest-Campinas`. Regra de segurança em
  `DevFestIA/firebase/firestore.rules` — **sem deploy automático**, colar
  manualmente em Firestore Database → Regras → Publicar a cada mudança.
- Fluxo de entrega aprovado: implementar → testar de verdade (Chrome real,
  mobile, node) → atualizar `PROJECT_CONTEXT.md`/handoff → **um commit por
  melhoria**, inglês, sem menção de IA → push no `development` → conferir
  CI e promoção. "ENTENDI.. AUTORIZADO TODOS E PODE SIM IMPLEMENTAR" vale
  sim pro plano mostrado. Chamar de "Renatão"; sem travessão; objetivo.
- Push rejeitado (non-fast-forward): `git pull --rebase origin development`.
  Runbook se `Promote to main` falhar: `git fetch origin && git checkout
  main && git merge --ff-only origin/development && git push origin main
  && git checkout development`.
- `[hidden]` é `display:none !important` global — não conflitar com
  `display` de componente.
- Fotos do pravatar são de terceiros (se cair, cai para iniciais); só usar
  números conferidos visualmente.

## Histórico resumido (para arqueologia; detalhes no git)

**Sessão 1:** 4 trilhas, `schedule-builder.js`, repository pattern, páginas
Time/Palestrantes/Código de Conduta/Patrocínio, ticker.
**Sessão 2:** cards e favoritos, tokens, ícones de trilha, line-up mock
ligado, mock brasileiro, filtro por trilha, salas com lugares históricos.
**Sessão 3:** ingressos/CTA, acessibilidade, calendário/compartilhar,
SEO/imagem, fontes locais, PWA offline, analytics (GoatCounter).
**Sessão 4:** botão "Instalar app" corrigido (guia por plataforma pro iOS,
que não dispara `beforeinstallprompt`); ícone PWA/favicon trocado (era
sobra do scaffold EloTech).
**Sessão 5 (2026-09-22/23):** fundo estrelado + circuito em toda página;
página Ingressos própria (saiu da home); linha do tempo de melhorias no
line-up (10 palestrantes por trilha); Firebase: fundação (5.1) + check-in
e avaliação de palestra funcionando ponta a ponta (5.2), confirmação
inline, destaque visual; tela de QR ao vivo por sala
(`checkin-display.html`); **PROD esconde todo mock** (line-up, Grade
inteira, patrocinadores, comunidades, time, ingressos) com aviso "será
revelado em breve", DEV acessível por `/DEV/` (persistente via
`sessionStorage`, nunca `localStorage`) com `/PROD/` como reset — depois
de vários rounds de bug real (parâmetro se perdendo na navegação, storage
que não expirava, service worker servindo cache velho pras rotas de
utilidade) até ficar robusto. Internacionalização anotada como backlog.
