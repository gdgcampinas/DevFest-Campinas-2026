# Handoff — Current State

**Last updated:** 2026-09-23, fim da sessão 6. Antes de confiar neste texto, rode
`git status --short --branch` e `git log --oneline --decorate -10` (o git não mente).

## Status em uma olhada

- Site estático de **7 páginas** (Principal, Grade, Palestrantes, Ingressos, Time, Patrocínio,
  Código de Conduta) mais 2 ferramentas internas (`checkin-display.html`, `reset-teste.html`),
  sem build. Publicado por GitHub Pages a partir de `docs/` no `main`; trabalho no
  `development`, o CI valida e promove sozinho (push no `development` = vai pro ar em minutos).
- **Backend mínimo, todo grátis (plano Spark, sem Blaze, sem servidor nosso):** Firebase
  (Firestore + Authentication anônimo) pra check-in, avaliações e o total de inscritos; um job do
  GitHub Actions (a cada 10 min) lê o Sympla e grava no Firestore. O resto do site é 100% estático.
- **PROD (público) esconde todo mock por padrão** (line-up, patrocinadores, comunidades, time,
  ingressos: "será revelado em breve"). **DEV** (`/DEV/<página>` ou `?lineup=1`) mostra tudo.
  A identidade visual (logo, galáxia, cores) vale nos dois modos.
- **Inscrição é só no Sympla** (evento `s36cd5d`, id 3591517, vendas abertas, link em
  `EVENT.tickets.url`, 0 inscritos no dia da implementação).
- **Workflows no GitHub Actions** (com ícone): ✅ Validar, 🚀 Publicar no main, 🎫 Sincronizar Sympla
  (cron 10 min), 📊 Relatório do evento (sob demanda + 30 min em 28/11), 🧹 Limpar dados de teste
  (sob demanda, com travas). Secrets no repositório: `SYMPLA_TOKEN`, `FIREBASE_SERVICE_ACCOUNT`.
- **Estado do git ao fechar a sessão 6:** `development` = `main` = `origin/*` (tudo commitado, no ar).

## Sessão 7 (2026-09-24), em andamento
Plano autorizado (sem o certificado, que segue aguardando decisões): 1) chave do Firebase por domínio
(passo a passo pro Renato), 2) quiz "Monte sua trilha" (**feito**, ver PROJECT_CONTEXT "Quiz"),
3) perguntas por palestra (**ligado**, até 3 por pessoa; falta o Renato colar as regras e testar no banco real, ver PROJECT_CONTEXT "Perguntas ao vivo"), 4) i18n: **feito para EN** (ver PROJECT_CONTEXT "Internacionalização"; PT segue padrão, seletor PT|EN no cabeçalho, conferidor no CI; ES/FR = só um dicionário novo;
falta traduzir o corpo de Palestrantes/Time/Patrocínio/Código de Conduta e o conteúdo do line-up quando for real, e alguém nativo revisar o EN).
Cada item = um commit, docs atualizados.

## Sessão 6: tudo que foi feito (2026-09-23)

1. **Feedback do evento (fase 5.3)** no hero "Encerrado"; bug de "Carregando…" eterno corrigido
   (o hero é desenhado antes dos módulos do Firebase; `render` agora é síncrono e local-first).
2. **Cartão pessoal "Eu vou!"** (canvas, baixar/compartilhar) em `ingressos.html`, com logo novo;
   `?cartao=1` abre o cartão; gate opcional por inscrição (`EVENT.tickets.registrationGate`, hoje `false`).
3. **Link real do Sympla e vendas abertas** em todos os CTAs; ticker "Ingressos: abertos".
4. **Integração Sympla -> Firestore** (job, hash de e-mail dual navegador/Node, reconciliação
   idempotente, contador "N pessoas já garantiram a vaga" a partir de 30, painel privado no resumo do
   job, testes no CI). Conta de serviço `sympla-sync`, secrets e regras publicados; rodou de verdade.
5. **Feedback v2:** "Minhas palestras" (`?avaliar=1`), aviso "avalie", botão "Avaliar" no cabeçalho,
   QR de avaliação na tela da sala (`?avaliar=<código>` faz o check-in junto), estrelas que já vêm
   cheias, **nome obrigatório**, avaliação do evento com 6 aspectos e nota 0-10 obrigatórios.
   Regras do Firestore exigem check-in pra avaliar palestra; testadas contra o Firestore real.
6. **Relatório do evento v2** (títulos, notas, distribuição, comentários, palestrantes, aspectos,
   indicação 0-10), lê a grade do próprio site; roda a cada 30 min em 28/11.
7. **Limpeza dos dados de teste:** workflow com travas (simulação por padrão, `APAGAR`, recusa
   depois do início do evento, só 3 coleções) e página `reset-teste.html` pro navegador.
8. **Workflows renomeados com ícone** (cuidado com a dependência Promote -> Validate, ver armadilhas).
9. **Logo novo aplicado:** SVG extraído do PDF, paleta do site igual às cores do logo, header,
   favicons, ícones do app, imagem de compartilhamento, script `build-brand-assets.sh`.
10. **Galáxia girando no hero da home** (o logo em espiral), presa no card, centrada no "olho"
    azul+vermelho, sempre gira (mais devagar com "Reduzir movimento"), `?movimento=1` força.
11. **Telas da sala** com dois QR alinhados (avaliar a anterior + check-in da atual).
12. **Tasks anotadas (não iniciadas):** mural do telão de LED, certificado de participação
    profissional, e as propostas descartadas/adiadas (ver Pendências).

## O que o site tem hoje

**Grade e agenda:** 4 trilhas (IA, Front/Back/Data, Mobile/Agile, Carreiras & Mentorias), 9 slots x 4 =
36 palestras (mock) geradas por `schedule-builder.js` a partir do `DAY_PLAN`. Cards, "acontecendo
agora", filtro por trilha, "Minha agenda" (favoritos em localStorage, .ics, WhatsApp, `?agenda=`).
**Em PROD a Grade mostra um aviso único.**

**Feedback (Firebase):** check-in (QR da sala `?checkin=<código>` ou honra com confirmação inline),
avaliação por palestra (nota, nome obrigatório, "o que mais gostou" e "o que melhorar" opcionais),
avaliação do evento (nota geral, 6 aspectos, 0-10, nome, textos opcionais), "Minhas palestras",
aviso "avalie". Estado local-first em `data/my-feedback.js` (sem leitura no Firestore). Regras em
`DevFestIA/firebase/firestore.rules` (colar à mão, sem deploy automático).

**Sympla:** job + `registrations/<edição>_<sha256(e-mail)>` (só o tipo de ingresso, nunca nome/e-mail),
`event-stats/<edição>` (total público), `sync-state` (interno), contador, gate opcional do cartão.

**Marca:** `docs/assets/brand/*.svg`, tokens de cor do logo, galáxia (`data/hero-galaxy.js`).

**Ferramentas internas (fora do menu, `noindex`):** `checkin-display.html?trilha=<ia|webdata|mobile|mentoring>`
(um tablet por sala), `reset-teste.html`.

**Qualidade:** contraste AA, fonte mínima 12px, foco global, skip link, PWA offline com botão
"Instalar app", GoatCounter sem cookies, fundo estrelado.

Arquitetura e decisões completas: `project-docs/PROJECT_CONTEXT.md` (seções "Inscritos do Sympla",
"Feedback v2", "Limpeza dos dados de teste", "Marca e logo", "Firebase", "PROD x DEV", "Offline (PWA)",
"Line-up model", "Design tokens" etc.).

## Decisões que o Renato já tomou (não reabrir sem motivo)

- Nada de backend pra conteúdo; Firebase só pra feedback/check-in e leitura pública do total,
  sempre atrás de repository. **Tudo grátis (sem Blaze):** Cloud Functions descartadas, o job roda no
  GitHub Actions.
- **Inscrição só no Sympla** (a API dele é só de leitura); o site é vitrine e ponte.
- Feedback: uid do Firebase segue anônimo, mas **o nome é obrigatório** em toda avaliação (digitado,
  não verificado; substitui a decisão antiga de "anônimo"). Check-in é a prova de presença e é
  exigido pelas regras. Sem perguntas rápidas extras por palestra. **Nota média pública nos cards:
  não** (só interno, no relatório). Google Sign-In: só opcional no futuro, não agora.
- QR de avaliação na sala fica até a próxima palestra da sala terminar; escanear já faz o check-in.
- Guardamos só o tipo de ingresso por e-mail (hash), nunca nome nem e-mail (LGPD).
- Cores/marca: as 4 cores do logo novo (`#3186FF`, `#FC413D`, `#FFEC00`, `#00AF57`), fonte Google
  Sans (Google Sans Text não entra).
- A galáxia **sempre gira**; com "Reduzir movimento" gira em 240 s por volta (normal 80 s).
- Fotos de pessoas (pravatar.cc por número), salas com lugares históricos, time sem galeria.
- Confirmação de check-in é inline (nunca `confirm()`); modo DEV usa `sessionStorage`.
- Regras do Firestore: colagem manual (deploy automático descartado por dar poder demais ao job).

## Pendências

**A. Só o Renato/organização pode fazer**
1. **Dados reais:** local (`EVENT.venue`, `venueConfirmed`), salas/MCs, line-up e palestrantes reais
   (mesmo formato de `mock-talks.js`/`mock-speakers.js`), patrocinadores/comunidades, time, depoimentos,
   valores dos ingressos, vídeo de recap 2025 (`data/video.js` ainda tem o de 2017). Com o line-up real:
   `EVENT.lineupRevealed = true` (todas as seções leem o mesmo `reveal`).
2. **Plenárias:** escolher A, B ou C (recomendo **B**, só 17:15, custo zero). Mockup aprovado.
3. **Mensagens do Sympla:** confirmação com `.../ingressos.html?cartao=1`; final com
   `.../index.html?avaliar=1`; QR de avaliação do evento no encerramento (QR de exemplo já gerados).
4. **Tablets das salas:** definir quem monta e abrir os 4 links com antecedência (recarga forçada).
5. Confirmar grafia/existência dos lugares das salas.

**B. Quando entrarem as primeiras inscrições**
6. Conferir o resumo do 🎫 Sincronizar Sympla: formato do `custom_form` (camiseta) e paginação da
   v1.5.1 (parâmetro `page`), ainda não vistos com dado real (2026 tinha 0).
7. Testar o gate com o e-mail de uma inscrição real e então virar `EVENT.tickets.registrationGate: true`
   em `schedule.js` (senão o cartão trava pra todos). Só o `schedule.js` importa no ar: o `/DEV/` e o
   `/PROD/` publicados leem ele. O `schedule.dev.js` é gitignored e existe só na máquina do Renato
   (line-up real); mantenha-o igual só pros testes locais não divergirem, esquecer dele NÃO quebra o site.

**C. Antes do evento (checklist do dia anterior)**
8. 🧹 Limpar dados de teste: rodar em modo teste, conferir, rodar de verdade com `APAGAR` (só antes de
   28/11 08:00), e abrir `reset-teste.html` nos aparelhos de teste. Hoje há ao menos 1 check-in de teste.
9. Recarregar (Cmd+Shift+R) os tablets e conferir `checkin-display.html?trilha=...` sem `&demo=`.

**D. Tasks anotadas (não iniciadas), detalhes em `project-docs/IDEAS_BACKLOG.md`**
10. **Certificado de participação PROFISSIONAL:** A4 PDF vetorial, identidade completa, assinaturas,
    código único e QR de validação. Não depende de dado real, mas de decisões do Renato, então
    PERGUNTE ANTES de desenhar: quem recebe (presença na porta pelo Sympla, check-ins em palestras,
    ou as duas), carga horária, nome (o digitado ou o do Sympla), se precisa de validação por QR, texto
    e assinaturas. Com isso o mockup sai; aprová-lo com o Renato antes de codar. Reusa o SVG
    `gdg-logo-light.svg` (fundo claro).
11. **Mural eletrônico do telão de LED:** página interna em tela cheia com cenas em rodízio (agora/próximas,
    álbum, fênix, patrocinadores, QR, números ao vivo, dicas, avisos, a galáxia). PERGUNTE ao Renato antes
    de desenhar: tamanho e proporção do painel, entrada (HDMI de notebook ou navegador), origem das fotos
    ao vivo, arquivo da fênix (mascote em criação: vídeo, sprites ou animação, com som?), quem opera.
    Já dá pra começar pelas cenas que não dependem disso (agora/próximas, QR, números, galáxia).
12. **Internacionalização (PT/EN/ES/FR):** grande, precisa ser desenhada.
13. Ideias em `IDEAS_BACKLOG.md`: quiz "Monte sua trilha", enquetes/perguntas ao vivo, passaporte com
    QR nos estandes, mural da hashtag, mapa do local, credencial digital, mentorias, votação das salas,
    GA4 com consentimento, restringir a chave do Firebase por domínio.
14. Pequenos: estender o repository pattern a `EVENT`/`TRACKS`/`SCHEDULE`; logos de 1 cor e de perfil
    (na pasta Downloads do Renato) ainda sem uso; galáxia como cena do mural.

## Como trabalhar e testar aqui

- Servidor local: `cd docs && python3 -m http.server 8080`.
- **PROD x DEV:** `/DEV/` ou `?lineup=1` mostra o mock (selo "DEV — sair"), `/PROD/` ou `?lineup=0` limpa.
  `/DEV/*` e `/PROD/*` nunca passam por cache.
- **Parâmetros de URL úteis:** `?demo=2026-11-28T09:20` (simula o horário; 07:30 antes, 09:20 ao vivo,
  10:00 dois QR na sala, 18:10 depois do evento), `?movimento=1` (galáxia na velocidade normal),
  `?checkin=<código>`, `?avaliar=1` ou `?avaliar=<código>`, `?cartao=1`, `?analytics=debug`, `?nosw=1`.
  Código de palestra: `HHMM.trilha` (ex.: `0900.ia`).
- **Bump de `?v=N`** em todas as páginas que referenciam qualquer `.js`/`.css` que mudou, e
  `node --check` em cada arquivo. Mudou o CONTEÚDO de um arquivo que já foi servido com aquele `?v=`
  (inclusive no navegador de teste)? Suba de novo, senão o cache serve o antigo. Trocar ícones/`/assets/`
  exige subir `SW_VERSION` em `sw.js` (cache-first por caminho).
- **Cache real do GitHub Pages: o HTML fica 10 minutos** (`max-age=600`), e o navegador do WhatsApp/Instagram
  guarda mais. Ao pedir pro Renato conferir algo: peça Safari/Chrome, Cmd+Shift+R ou um parâmetro novo
  na URL (`&v=N`). Muito "está errado" no print era versão velha em cache: confira com `curl` o que
  está publicado antes de mexer.
- **Testes de navegador com Firebase:** o Browser pane carrega o Firebase normalmente. Pra não gravar
  no banco real, troque `window.checkinRepository/feedbackRepository/eventFeedbackRepository` e
  `firebaseClient.ensureAnonymousUid` por stubs depois do carregamento. Limpar `localStorage` NÃO
  limpa os conjuntos que já estão em memória na página: use `repo.getAll().forEach(k => repo.toggle(k))`.
  Pra testar as regras de verdade use um uid novo (`auth.signOut()` + apagar o IndexedDB
  `firebaseLocalStorageDb` + recarregar) e chaves de palestra sem documento.
- **`prefers-reduced-motion`** está ligado no Browser pane e no iPhone do Renato: a galáxia gira mais
  devagar por config; regra global de styles.css zera outras animações.
- **Testes automáticos:** `node --test DevFestIA/tools/sympla-sync/sync.test.js DevFestIA/tools/event-report/build-report.test.js DevFestIA/tools/purge-test-data/purge.test.js`
  (rodam no CI; o Node 24 não aceita diretório em `--test`, passe os arquivos). `check-meta.js` e
  `check-install.js` também rodam no CI.
- **Secrets e token do Sympla:** nunca no chat, no repo ou em arquivo. Entrou por prompt oculto
  (`gh secret set NOME -R gdgcampinas/DevFest-Campinas-2026`). Se um token vazar, apagar a chave no
  Sympla e criar outra. O `eventIdHash` não é segredo.
- **Rodar workflows:** `gh workflow run sync-sympla.yml -R gdgcampinas/DevFest-Campinas-2026 --ref main -f dry_run=true`
  (idem `purge-test-data.yml`, `event-report.yml`). Agendados só rodam no `main`.
- **Não renomeie o workflow Validar sem antes ensinar o Promote:** o "🚀 Publicar no main" escuta o
  nome exato do Validate (`workflow_run`) e roda com o arquivo do `main`. Passo 1: Promote ouvindo os
  dois nomes e promover; passo 2: renomear o Validate.
- **Regenerar marca:** `DevFestIA/design/build-brand-assets.sh` (rsvg-convert, Chrome, sips).
- Firebase: projeto `DevFest-Campinas` (console.firebase.google.com). Regras em
  `DevFestIA/firebase/firestore.rules`, colar em Firestore > Regras > Publicar a cada mudança
  (`pbcopy < arquivo` deixa na área de transferência). Emulador não roda (Java 11; precisa 21).
- **Terminal no app:** o painel limita as abas que a IA abre por sessão; comandos curtos vão por Bash.
  No zsh `status` é variável reservada (não use como nome de variável).
- Fluxo de entrega aprovado: implementar, testar de verdade (navegador desktop e celular, node), atualizar
  `PROJECT_CONTEXT.md`/handoff, **um commit por melhoria** (inglês, sem menção de IA), push no
  `development`, conferir CI e promoção, conferir no ar com `curl`. Chamar de "Renatão", sem travessão,
  objetivo. "AUTORIZADO TODOS E PODE SIM IMPLEMENTAR" vale sim pro plano mostrado.
- Push rejeitado: `git pull --rebase origin development`. Se o Promote falhar: `git fetch origin && git
  checkout main && git merge --ff-only origin/development && git push origin main && git checkout development`.
- `[hidden]` é `display:none !important` global. Fotos do pravatar são de terceiros.

## Histórico resumido (para arqueologia; detalhes no git)

**Sessão 1:** 4 trilhas, `schedule-builder.js`, repository pattern, páginas Time/Palestrantes/Código de
Conduta/Patrocínio, ticker.
**Sessão 2:** cards e favoritos, tokens, ícones de trilha, line-up mock ligado, filtro por trilha, salas.
**Sessão 3:** ingressos/CTA, acessibilidade, calendário/compartilhar, SEO/imagem, fontes locais, PWA
offline, analytics (GoatCounter).
**Sessão 4:** botão "Instalar app" com guia por plataforma; ícone PWA/favicon trocado.
**Sessão 5 (2026-09-22/23):** fundo estrelado, página Ingressos, Firebase (check-in e avaliação de
palestra), tela de QR por sala, PROD esconde todo mock, DEV por `/DEV/` (sessionStorage).
**Sessão 6 (2026-09-23):** feedback do evento, cartão "Eu vou!", Sympla (link, job de sincronização,
contador, gate opcional), feedback v2 (Minhas palestras, aviso, QR de avaliação, nome obrigatório,
regras testadas), relatório v2, limpeza dos dados de teste, workflows com ícone, logo novo aplicado e
galáxia girando no hero. Tasks anotadas: mural do LED, certificado profissional.
