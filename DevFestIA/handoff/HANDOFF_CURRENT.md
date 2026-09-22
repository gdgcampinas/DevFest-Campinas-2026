# Handoff — Current State

**Last updated:** 2026-09-20, sessão 4 (botão Instalar app corrigido). Antes de confiar neste texto, rode
`git status --short --branch` e `git log --oneline --decorate -10` (o git não mente).

## Status em uma olhada

- Site estático de 6 páginas (Principal, Grade, Palestrantes, Time, Patrocínio,
  Código de Conduta), sem build, sem backend. Publicado por GitHub Pages a partir
  de `docs/` no `main`; trabalho no `development`, o CI valida e promove sozinho.
- Último commit de código da sessão 3: `5f01f5b` (GoatCounter ligado). Sequência
  da sessão: `1580d1d` ingressos/CTA, `bbac628` acessibilidade, `94400b6` calendário
  e compartilhar, `6e78d11` SEO/imagem, `fac34c9` fontes locais, `88b7e82` PWA
  offline, `9ce13c7` analytics, `5f01f5b` endpoint do GoatCounter.
- Todo o conteúdo de pessoas, empresas e ingressos é **MOCK de propósito** (Renato
  pediu para deixar; os dados reais vêm depois no mesmo formato). O line-up mock
  está público (`EVENT.lineupRevealed = true`).

## O que o site tem hoje

**Grade e agenda:** 4 trilhas (IA, Front/Back/Data, Mobile/Agile, Carreiras &
Mentorias), 9 slots x 4 = 36 palestras, gerados por `schedule-builder.js` a partir
do `DAY_PLAN`. Salas com nomes de lugares históricos via `roomFor(lugar)`:
Observatório, Estação, Lagoa do Taquaral, Mercadão Central; Abertura e
Encerramento na Sala Calçadão Central. Cards novos (formato, tags, LinkedIn,
duração, sala), "acontecendo agora" (hero da home, pílula AO VIVO, barra fixa,
progresso, "Em N min"), filtro por trilha com contadores, "Minha agenda"
(favoritos em localStorage) com exportar .ics, WhatsApp, copiar link e banner para
quem abre `?agenda=`.

**Line-up ligado:** 36 palestras (`mock-talks.js`) e 40 palestrantes (10 por trilha, só a Renata Cardoso fala duas vezes)
(`mock-speakers.js`) ligados só por `speakerIds`; galeria de Palestrantes lista as
palestras de cada pessoa (abre o mesmo modal), o modal leva ao perfil
(`palestrantes.html#speaker-<id>`), Destaques da home também.

**Conversão e alcance:** 3 tipos de ingresso (Grátis, Ingresso com camiseta, VIP;
valores de exemplo) e um CTA único (`ticketCtaState`) no cabeçalho, barra fixa
mobile, hero e cards; sem link do Sympla ainda: todos os botões mostram "Em breve" e os preços pagos mostram "Valor a definir" (só o Grátis tem R$ 0). Tags
OG/Twitter/canonical nas 6 páginas, imagem 1200x630, sitemap, robots, JSON-LD do
evento com ingressos.

**Qualidade:** contraste AA no texto secundário, fonte mínima 12 px, foco global,
link "Pular para o conteúdo", `prefers-reduced-motion`. Fontes locais (Google Sans,
OFL). PWA: instalável e funcionando sem internet. Analytics: GoatCounter (conta
`gdgcampinas`, painel em https://gdgcampinas.goatcounter.com), sem cookies, 13
eventos por `data-track-event`.

Arquitetura, padrões e decisões: `project-docs/PROJECT_CONTEXT.md` (seções "Line-up
model", "Tickets and the registration CTA", "Calendar and sharing", "Share
metadata and SEO", "Offline (PWA)", "Usage analytics", "Accessibility rules",
"Design tokens", "Track rooms").

## Decisões que o Renato já tomou (não reabrir sem motivo)

- Nada de backend; persistência opcional só atrás de repository (sem banco hoje).
- Cores/marca: paleta do Google (azul, amarelo, verde, vermelho), tokens em
  `css/tokens.css`. Fonte: Google Sans (o Google Sans Text não entra: licença de
  hospedagem não confirmada).
- Fotos: pessoas (pravatar.cc por número, escolhidas à mão) em vez de avatares
  ilustrados. Nomes mistos, brasileiros e internacionais.
- Salas: lugares históricos, não bairros ("cadê meu bairro?"). Time sem galeria de
  fotos. Mock público.
- Ingressos: Grátis, Ingresso com camiseta, VIP; Sympla (link real ainda não existe).

## Pendências (com quem depende)

0. **NOVO (sessão 5): fundo estrelado + acento de circuito em todas as páginas.**
   `features/starfield.js` injeta a camada uma vez por página via `initShell()`
   (`.site-bg`, atrás de tudo, `pointer-events:none`): `assets/img/bg-circuit.webp`
   (contain, sem esticar) + estrelas geradas por CSS (`data/starfield.js`, coordenadas
   fixas). Aprovado pelo Renato após preview (imagem de referência dele). Verificado no
   Chrome real, home e patrocinadores, contraste ok, `prefers-reduced-motion` já zera o
   tremeluzir (regra global existente).
0. **CORRIGIDO (sessão 4, falta conferir no aparelho): botão "Instalar app".**
   Causa confirmada pelo Renato: no iPhone (Safari e Chrome do iOS, ambos WebKit) não
   existe `beforeinstallprompt`, então o botão não nascia. Em Chrome real via CDP a
   instalabilidade não tinha erro e o evento disparava, ou seja, servidor e manifesto
   estavam certos. Correção: botão sempre visível até instalar, nativo quando há
   evento, senão modal com o guia da plataforma (ver "Offline (PWA)" no
   PROJECT_CONTEXT). Extras: Patrocínio não carregava `icons.js`/`icon.js` (o botão
   lançaria erro lá); manifesto com `any` e `maskable` separados e `id`; modal
   genérico (`components/modal.js`, o modal de palestra agora é criado por ele e some
   do HTML das páginas); `tools/check-install.js` no CI (detecção, guias, dependências
   de script por página, ícones). O guia do Chrome iOS assume Compartilhar > Adicionar
   à Tela de Início (iOS 16.4+) com o Safari como plano B.
   Instalou no iPhone; o Renato viu que o ícone era o do EloTech (GDG + Agibank): o
   `apple-touch-icon.png` e o `favicon-32.png` eram sobra do scaffold. Regerados a
   partir do ícone do app (comandos no `design/app-icon.html`) e linkados com `?v=2`
   (o iOS e o service worker guardam ícone pela URL).
   **Falta o Renato:** conferir o ícone novo no iPhone (remover o app antigo e
   reinstalar; o iOS guarda o ícone) e testar o Android (Chrome).
1. **Plenárias (decisão do Renato):** faixa larga com o palestrante de destaque
   ocupando todas as trilhas. Desenho aprovado no mockup (avatar 104 px com anel
   multi-cor, selo "Plenária", barra com as 4 cores). Variantes: A 3 plenárias
   (09:00, 13:30, 17:15; 28 talks), **B só 17:15 (36 talks, custo zero,
   recomendada)**, C só 13:30 (32 talks). Falta escolher A, B ou C. Implementação:
   item `{ plenary: { start, end, room, speakers, title } }` no `DAY_PLAN`
   (schedule.js e .dev.js), ramo em `buildSchedule()`, `plenaryMarkup()` reusando
   `avatarMarkup`/`speakerList`/`speakerMetaLine`/`favoriteButtonMarkup`/
   `iconMarkup`, card largo na Grade e no "ao vivo agora" (`live-status.js`),
   CSS com tokens (sem regra por trilha), `talkKey` para favoritar.
2. **Logo novo (Renato envia):** SVG/PNG do símbolo colorido, branco e completo
   ("GDG Campinas"). Trocar: `EVENT.hosts[].icon` (header), favicons
   (`assets/icons/favicon-32.png`, `apple-touch-icon.png`), ícones do app
   (`assets/icons/icon-192.png` e `icon-512.png`, fonte
   `DevFestIA/design/app-icon.html`), imagem de compartilhamento
   (`assets/img/og-image.png`, fonte `DevFestIA/design/og-image.html`),
   `theme-color`. O PDF `apresentacao.pdf` chama de "Nova proposta": confirmar
   aprovação e regras de marca do programa GDG.
3. **Dados reais (Renato/organização):** local (`EVENT.venue`, `venueConfirmed`),
   salas reais e MCs (`TRACKS[].room/mc`), line-up real (mesmo formato de
   `mock-talks.js`/`mock-speakers.js`, com `format`, `tags`, foto e LinkedIn reais),
   patrocinadores e comunidades reais, depoimentos, time, estacionamento e comida
   (`PARKING_IMAGES`/`FOOD_IMAGES` em `app.js`), vídeo de recap 2025 em
   `data/video.js` (hoje é o de 2017), valores e benefícios reais dos ingressos,
   link real do Sympla (`EVENT.tickets.url`, `salesOpen: true` quando abrir).
   Descrição do repo no GitHub só pela interface (conta sem admin); texto sugerido:
   "O DevFest Campinas é um evento realizado pelo GDG Campinas, criado para conectar
   pessoas, compartilhar conhecimento e fortalecer a comunidade de tecnologia da
   região."
4. Confirmar grafia/existência dos lugares das salas (não verifiquei online).
5. Opcional: estender o repository pattern a `EVENT`/`TRACKS`/`SCHEDULE`.

## Backlog de ideias (aprovadas em espírito, nada implementado)

**Identidade e "uau" (o Renato citou de novo no fim da sessão 3):**
- **Redemoinho do logo animado / ícone girando**: o símbolo em espiral do logo
  novo girando (CSS/SVG) como fundo do hero, sob o tema "Do Local ao Infinito", com
  estrelas sutis (respeitar `prefers-reduced-motion`, já há infraestrutura).
  Depende do logo novo em SVG.
- **Cartão de compartilhamento pessoal** "Vou ao DevFest Campinas": imagem gerada no
  navegador (canvas) com nome, foto opcional e a Minha agenda, para baixar/compartilhar.

**Outras ideias da análise:** quiz "Monte sua trilha" (preenche a Minha agenda),
feedback por palestra (formulário do Google pré-preenchido por palestra),
certificado de participação gerado no navegador (horas complementares),
mentorias com agendamento (trilha Carreiras & Mentorias), vagas dos patrocinadores,
mapa do local com as salas, credencial digital com QR, perguntas ao vivo/enquetes,
passaporte DevFest com QR nos estandes, mural da hashtag; card de painel mostrando
os dois cargos; incluir cidades da RMC nas salas ou votação da comunidade.

## Como trabalhar e testar aqui

- Servidor local: `cd docs && python3 -m http.server 8080`. Parâmetros úteis:
  `?lineup=1` (força o line-up), `?demo=2026-11-28T09:20` (simula o horário; teste
  09:20, 10:27 "Em N min", 12:30 almoço, 17:30, 18:30 encerrado), `?analytics=debug`
  (loga eventos), `?nosw=1` (remove service worker e caches).
- Toda mudança em `.js`/`.css` exige `node --check` e bump de `?v=N` em todas as
  páginas que o referenciam (arquivo novo: tag em todas as páginas do bloco
  compartilhado). `?v=` esquecido = navegador serve versão velha.
- `docs/js/data/schedule.dev.js` (gitignored, espelho local) é carregado SEM `?v=`:
  o navegador pode servir cache depois de editar; força com
  `fetch('/js/data/schedule.dev.js',{cache:'reload'})` e recarrega. Edite sempre
  `schedule.js` e `schedule.dev.js` juntos. Nunca commitar o dev.
- Ferramentas em `DevFestIA/tools/`: `check-meta.js` (roda no CI: OG, sitemap,
  robots, manifesto, ícones, sw.js), `check-lineup.js` e `check-calendar.js`
  (Node, sem navegador; o de line-up tem contagens do mock), `e2e-offline.js` e
  `e2e-kill-switch.js` (Chrome real via DevTools; o painel do app NÃO roda service
  worker). Fontes das imagens geradas em `DevFestIA/design/` (comando de regerar
  dentro de cada arquivo).
- O painel de navegador do app é instável (screenshot preto, aba some): tire uma
  segunda captura ou confira via `javascript_tool`. O scroll suave não anima lá.
  Clicar em link real navega de verdade (o CTA do Sympla abre o Sympla): em testes,
  intercepte cliques em `a[href]`.
- Fluxo de entrega que o Renato aprovou: implementar, testar (navegador, mobile,
  node), atualizar `PROJECT_CONTEXT.md` e este arquivo, **um commit por melhoria**
  em inglês e sem menção de IA, push no `development`, conferir CI e promoção.
  Frase "ENTENDI.. AUTORIZADO TODOS E PODE SIM IMPLEMENTAR" vale sim para o plano
  mostrado. Chamar de "Renatão"; sem travessão nos textos; resposta objetiva.
- Push rejeitado (non-fast-forward): `git pull --rebase origin development`.
  `Promote to main` já falhou por erro transiente do GitHub; runbook:
  `git fetch origin && git checkout main && git merge --ff-only origin/development
  && git push origin main && git checkout development`. Validate costuma levar
  ~10 s, Pages 40 s a 2 min.
- `[hidden]` é forçado a `display:none !important` (regra global); não use `display`
  em componente esperando que `hidden` seja ignorado.
- Mock que precisa de cuidado: fotos do pravatar são de terceiros (se cair, cai
  para iniciais); só use números de foto que você conferiu visualmente.

## Histórico resumido (para arqueologia; detalhes no git)

Sessão 1: 4 trilhas, `schedule-builder.js`, repository pattern, páginas Time,
Palestrantes, Código de Conduta, Patrocínio, ticker. Sessão 2: cards e favoritos,
tokens (`tokens.css`), ícones de trilha, line-up mock ligado, mock brasileiro de
time/patrocínio/depoimentos, filtro por trilha em Palestrantes, salas com lugares
históricos. Sessão 3: os 7 itens da lista de melhorias (ingressos/CTA,
acessibilidade, calendário/compartilhar, SEO/imagem, fontes locais, PWA offline,
analytics).
