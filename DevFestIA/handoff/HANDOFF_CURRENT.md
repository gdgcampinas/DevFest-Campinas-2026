# Handoff — Current State

**Last updated:** 2026-09-20 (sessão 2: cards + favoritos)

## Status

Site publicado (`main` = `development`, CI verde na última verificação)
e em evolução ativa no branch `development`. Site de 6 páginas com dado
real parcial e o resto mock. Último commit de código: `0683580` ("Show
the ticker banner on every page, not only the home"); a sessão fecha com
um commit de documentação em cima dele. Sempre conferir `git log` antes
de confiar neste texto.

## Done (sessão 2026-09-13 a 2026-09-20)

**Grade e trilhas**
- 4 trilhas: IA, Front-end/Back-end/Data, Mobile/Agile (nova, token
  `--mobile` em `styles.css`), Carreiras & Mentorias (renomeada de
  "Carreira em Tecnologia"). Cada trilha tem `description` opcional.
- Grade do dia (evento 28/11, 08h às 18h), gerada por parâmetro:
  08:00 Credenciamento, 08:30 Abertura, 4 slots de manhã
  (09:00, 09:45, 10:30, 11:15), 12:00 até 13:20 Almoço (1h20),
  13:20 até 13:30 Retorno para a sala, 5 slots à tarde (13:30, 14:15,
  15:00, 15:45, 16:30), 17:15 até 18:00 Encerramento. Regra: palestra
  40 min (com perguntas) + 5 min de troca = 45 min por slot.
- `docs/js/data/schedule-builder.js` (novo): `talkWindows()` calcula os
  horários, `buildSchedule()` monta `SCHEDULE` a partir do `DAY_PLAN`
  declarativo em `schedule.js`, `mockTalks()` rotaciona o pool
  `MOCK_SPEAKERS`. Os 36 talks mock escritos à mão saíram. Mudar
  horário ou número de slots = editar o `DAY_PLAN`.
- `live-status.js`: texto sticky "Agora: ..." usava `speaker.name` do
  formato antigo e mostrava `undefined`; corrigido com `speakerList()`.
- `.faq-grid` passou a usar `repeat(auto-fit, minmax(240px, 1fr))`
  (colunas pelo nº de cards, não pelo nº de trilhas): "Antes de vir"
  segue com 3 cards, "Trilhas" mostra 4.

**Conteúdo novo (inspirado no Campinas Innovation Week)**
- Patrocinadores com `description` opcional e logo em caixa branca
  (`sponsor-card.js`, mesma função serve as comunidades parceiras).
- Seção "Trilhas" na home (`tracks-overview.js`, reusa `info-card.js`).
- Depoimentos (`testimonials.js`), ticker/faixa animada, página
  **Patrocínio** (6ª página, nav atualizado em `site-nav.js`).
- Ticker agora aparece nas 6 páginas: `renderTicker()` roda dentro de
  `initShell()` (guardado por `#ticker` existir na página).
- `eventDateLabel()` em `agenda.js` (formato de data em 1 lugar só).
- Home: Números reais do DevFest 2025 (700 / 36+ / 37 / 4), Destaques
  (4 palestrantes aleatórios, troca a cada reload e a cada 15 s), vídeo
  recap (youtubeId `qXGQG-G3Jw8`, é do DevFest 2017, trocar pelo de
  2025), 16 fotos reais escolhidas por contagem de rostos (Vision
  framework do macOS).
- Páginas: Time (Quem somos / Organizadores / Fotos / Voluntários),
  Palestrantes (galeria extraída do schedule), Código de Conduta.

**Arquitetura**
- Repository pattern (`repository.js`, `createRepository()`) cobre toda
  coleção standalone (sponsors, team, testimonials, stats, video,
  highlights, about, cod, footer, patrocínio, mock-speakers,
  partner-communities). Páginas consomem via `xRepository.getAll()`.
  **Fora:** `EVENT`, `TRACKS`, `SCHEDULE` continuam globals diretos (usados
  em dezenas de lugares; envolver exige passada própria).
- Bug corrigido: seção `.tracks-overview` não tinha CSS de container e
  estourava a largura toda; agora tem `max-width`/`padding` como as demais.
- Bug corrigido: ícone de LinkedIn na galeria de palestrantes usava
  classe errada e agora reusa `socialIconMarkup()`.
- Cache: URL de imagem com `?v=` via `HIGHLIGHTS_VERSION`, porque trocar
  bytes sem trocar nome não invalida o CDN do GitHub Pages.

## Sessão 2 (2026-09-20): agenda com cards novos e favoritos

- Cards de palestra redesenhados (glow na cor da trilha, avatar com anel, horário em chip, formato + tags, LinkedIn, duração, sala, AGORA com barra de progresso, "Em N min" no próximo slot). O campo `level` foi removido (Renato pediu trocar): entrou `format` + `tags`.
- "Minha agenda": estrela por palestra, salva em localStorage (cada pessoa monta a sua, sem backend). Filtro na Grade, estrela também no hero da home e no modal. Detalhes em `PROJECT_CONTEXT.md` (seção "Talk card and Minha agenda").
- Arquivos novos: `data/{persisted-set-repository,favorites,icons,talk-formats}.js`, `components/{icon,favorite-button,talk-meta}.js`, `features/{favorites,favorites-filter}.js`.
- Dado novo a preencher no line-up real: `format` e `tags` por palestra (opcionais; sem eles a linha some). Mock usa `format: "palestra"`.
- Limitações conhecidas: favorito não sincroniza entre abas abertas ao mesmo tempo; chave usa horário do slot, então mudar horário de uma palestra perde o favorito dela.
- Ideias não feitas: painel/dupla com meta por pessoa, exportar Minha agenda (calendário/compartilhar), alerta de conflito.

## Sessão 2b (2026-09-20): cores Google e fonte Google Sans

- Novo `docs/css/tokens.css` (cores e fontes, carrega antes de `styles.css`). Trilhas agora apontam pra paleta do logo novo: IA azul, Front/Back/Data amarelo, Mobile/Agile verde, Carreiras vermelho. `--neon` virou `--accent` (verde Google). Fonte: Google Sans (títulos) + Google Sans Text (corpo), no lugar de Manrope + Public Sans. `styles.css` só consome tokens (`--font-display`, `--font-body`).
- Origem: PDF `apresentacao.pdf` do Renato (proposta de logo novo, "Nova proposta", ainda sem arquivos de logo no repo).
- Pendente: logo novo (SVG/PNG do símbolo colorido, branco e completo) pra trocar `EVENT.hosts` e favicons; confirmar aprovação do logo com a organização e as regras de marca do programa GDG; link do Sympla em `EVENT.tickets.url`.

## Sessão 2c (2026-09-20): ícones das trilhas na home

- `TRACKS[].icon` (sparkles, code, phone, rocket) + 4 ícones novos em `data/icons.js`; `tracks-overview.js` usa `iconMarkup()` (o SVG fixo `ICON_TRACK` saiu). Só na home, como pedido (legenda da Grade ficou sem ícone).
- Gotcha local: `schedule.dev.js` é carregado sem `?v=`, então o navegador pode servir versão em cache depois de editar; recarregar forçado resolve. Em produção o `schedule.js?v=N` é bumpado normalmente.

## Sessão 2d (2026-09-20): estrela sobre o X do modal

- Bug: no modal de detalhe a estrela ficava por baixo do botão X (posição absoluta no canto). Correção: `.modal-card` define `--modal-close-size` e `--modal-close-inset`, usados pelo `.modal-close` e pelo `padding-right` de `.detail-top`, então o espaço do X é reservado em um lugar só. Qualquer conteúdo futuro no canto do modal deve usar as mesmas variáveis.

## Sessão 2e (2026-09-20): ordem na home

- "Números do DevFest 2025" agora fica logo antes de "Veja como foi o DevFest 2025" (vídeo): ordem hero, Destaques, Números, vídeo, fotos, Sobre. Só HTML (`index.html`); nenhum JS depende da ordem.

## Sessão 2f (2026-09-20): line-up mock completo e interligado

- 36 palestras (`data/mock-talks.js`) e 38 palestrantes (`data/mock-speakers.js`) mock, ligados por `speakerIds`; avatares SVG gerados e diversos (`data/mock-avatar.js`, sem pravatar); LinkedIn mock único (`MOCK_LINKEDIN_URL`). Painéis com 2 pessoas e 3 pessoas com 2 palestras cada (larissa-nunes, renata-cardoso, gabriela-martins) exercitam as ligações.
- `EVENT.lineupRevealed` agora é `true` (Renato liberou o mock pra todos). Destaques e Palestrantes aparecem pra qualquer visitante.
- Ligação: card do palestrante lista as palestras (abre o modal), modal leva ao perfil (`#speaker-<id>`), Destaques levam ao perfil; Palestrantes ganhou modal e favoritos. Detalhes em `PROJECT_CONTEXT.md` (seção "Line-up model").
- Testado: 36 talks x 4 trilhas com título/formato/tags/descrição, ninguém em duas trilhas no mesmo slot, 38 avatares distintos, links e hash, estados ao vivo (09:20, 10:27, 12:30, 17:30, 18:30), produção sem `schedule.dev.js`, mobile.
- Pendente: trocar o mock pelo line-up real quando existir (mesmo formato); filtro por trilha na página Palestrantes (38 cards); nomes de sala por bairro (em discussão).

## Sessão 2g (2026-09-20): fotos de pessoas de volta e mock de time/patrocínio

- Renato preferiu fotos de pessoas às ilustrações: `mock-avatar.js` saiu; `mock-photo.js` usa retratos do pravatar.cc por número, escolhidos à mão (só adequados, coerentes com o nome; a foto sensual e as caretas do pool antigo ficaram de fora).
- Mock brasileiro completo: Time (6 organizadores e 8 voluntários com fotos e redes), Fotos do time (fotos reais de 2025), Patrocinadores (5 tiers, 12 empresas fictícias com logo SVG gerado), Comunidades parceiras (4), Depoimentos (3, com cargo opcional). "Marcas que já apoiam" na página Patrocínio usa o mesmo `sponsorsRepository`.
- Novos: `data/mock-links.js`, `data/mock-photo.js`, `data/mock-logo.js`; `highlightPhoto()` em `highlights.js`.
- Atenção: pravatar.cc é serviço externo; se cair, as fotos caem para iniciais (avatarMarkup). Trocar por fotos reais quando existirem.

## Sessão 2h (2026-09-20): Time sem galeria de fotos

- Seção "Fotos" da página Time removida a pedido do Renato: HTML, `data/team-photos.js`, modal e scripts que só ela usava, e o trecho de `pages/time.js`. A página agora é Quem somos, Organizadores, Voluntários. `highlightPhoto()` continua em `highlights.js` (usado pela home).

## Sessão 2i (2026-09-20): filtro por trilha em Palestrantes

- Novo `features/track-filter.js` (abas + filtros) extraído de `agenda.js` e reusado por Grade e Palestrantes; abas com contador (38 / IA 10 / Front-Back-Data 10 / Mobile-Agile 10 / Carreiras 8), `aria-pressed`, e a aba escolhida é centralizada no mobile. `renderSpeakersSection` agora recebe a lista de palestrantes pronta (`extractSpeakers`), sem depender de schedule.
- Link `#speaker-<id>` pra alguém escondido pelo filtro volta o filtro pra "Todas as trilhas" e rola até o card.
- Testado: contagens por trilha, cards e palestras corretos, hash, regressão da Grade (trilha e Minha agenda), mobile. Obs.: o scroll suave da aba não anima na pane de teste, mas a matemática foi validada.

## Sessão 2j (2026-09-20): salas por bairro

- Salas das trilhas agora são bairros de Campinas via `roomFor()`: IA Barão Geraldo, Front/Back/Data Centro, Mobile/Agile Taquaral, Carreiras & Mentorias Guanabara (escolha minha, fácil de trocar em `TRACKS`). Só dado, mais o ajuste do rodapé do card (`.talk-foot` quebra em 2 linhas quando a sala é longa; "40 min" e a sala não quebram no meio).
- Em aberto da conversa de bairros: nomes reais das salas do local (ainda "Local a definir"), incluir cidades da RMC (crítica do PDF do logo), votação da comunidade.

## Sessão 2k (2026-09-20): salas com nomes de lugares históricos

- Renato trocou bairros por lugares da cidade ("cadê meu bairro?"): IA Sala Observatório, Front/Back/Data Sala Estação, Mobile/Agile Sala Lagoa do Taquaral, Carreiras Sala Mercadão Central, Abertura e Encerramento Sala Calçadão Central (substitui "Auditório principal"). Tudo via `roomFor(place)`; só dado (schedule.js/.dev.js).
- Não verifiquei online grafia/existência de cada lugar (Observatório e Estação foram sugestões minhas); confirmar com a organização. Salas reais do local ainda a definir.

## Sessão 3 (2026-09-20): melhorias do site (lista aprovada pelo Renato)

Ordem: 1 ingressos e CTA, 2 acessibilidade, 3 calendário e compartilhar agenda, 4 SEO e imagem de compartilhamento, 5 fontes locais, 6 PWA offline, 7 analytics (GoatCounter, sem cookies). Mocks ficam como estão.

- **1. Ingressos e CTA (feito):** 3 tipos de ingresso (Grátis, Ingresso com camiseta, VIP; valores mock) em cards na home; botão "Garanta sua vaga" no cabeçalho, barra fixa no mobile e hero; estados buy/waitlist/soon; link do Sympla é a home do Sympla enquanto o evento não existe lá (`EVENT.tickets.url`). Detalhes em `PROJECT_CONTEXT.md` (seção "Tickets and the registration CTA").

- **2. Acessibilidade (feito):** `--muted-dim` clareado para passar 4,5:1 (era ~2,7:1) e `--muted` subiu junto; nenhum texto abaixo de 12 px; foco de teclado global (uma regra só, as duplicadas saíram); link "Pular para o conteúdo"; `features/a11y.js` (`motionSafeBehavior`, usado no scroll suave); animações reduzidas com `prefers-reduced-motion`. Regras em `PROJECT_CONTEXT.md` ("Accessibility rules").

- **3. Calendário e compartilhar agenda (feito):** "Adicionar ao calendário" no modal (Google Agenda e .ics), exportar Minha agenda (.ics), link `?agenda=` com WhatsApp e copiar, banner "Salvar na minha agenda" pra quem abre o link. Testado com harness em Node (estrutura do .ics, dobra de linhas, escapes, ida e volta do link) e no navegador. Bug achado no caminho: `.status-pill` (display) ignorava o atributo `hidden` e aparecia vazio; regra global `[hidden]{display:none !important}`. `EVENT.venueConfirmed` (false) faz o calendário usar só a cidade enquanto o local não sai. Detalhes em `PROJECT_CONTEXT.md` ("Calendar and sharing").

## Decisão pendente do Renato (plenárias)

Mockups v2 (desenho aprovado visualmente, pelo Renato: faixa larga, avatar 104 px com anel multi-cor, selo "Plenária") ficaram só no scratchpad. Variantes: A 3 plenárias (28 talks), B só 17:15 (36 talks, custo zero, recomendada), C só 13:30 (32 talks). Renato disse que segue com a plenária depois da agenda.

Renato quer avaliar "plenárias": um palestrante de destaque ocupando a
faixa inteira (todas as trilhas juntas), como o "Pokemão Standup" da
planilha original. Foi mostrado um mockup (só visual, **nada implementado**).
Proposta em análise, 3 plenárias: 09:00 (abertura), 13:30 (pós-almoço),
17:15 (encerramento), com o Encerramento encolhendo pra 17:55 até 18:00.
Custo: 7 slots × 4 trilhas = 28 talks (hoje 9 × 4 = 36). Alternativa de
custo zero: destaque só dentro de Abertura/Encerramento. Se aprovar,
implementar: item `{ plenary: {...} }` no `DAY_PLAN`, ramo no
`buildSchedule()`, `plenaryMarkup()` reusando `avatarMarkup`/`speakerList`,
card largo na Grade e no "ao vivo agora" da home. Esperar o "pode fazer".

## Not done yet / TBD

- `EVENT.venue` / endereço: ainda `"Local a definir"`.
- MCs das 4 trilhas: `"MC a definir"`. Salas: lugares históricos mock (ver Sessão 2k).
- `EVENT.lineupRevealed` é `false`. `schedule.dev.js` existe local
  (gitignored) espelhando o `schedule.js` mock; line-up real não carregado.
  Sempre editar os dois juntos.
- `sponsors.js` e `partner-communities.js`: mock (`example.com`).
- Fotos dos palestrantes (Destaques e agenda) são stock do pravatar.cc
  (não há ferramenta de imagem/IA na sessão). Trocar pelas reais.
- Time, testimonials: mock.
- `PARKING_IMAGES` / `FOOD_IMAGES` (em `app.js`): vazios.
- Background/og-image: ainda gradiente puro.
- Descrição do repo no GitHub: a conta `renatoramos-7` não tem admin,
  então tem que ser pela interface (Settings do repo → About).
  Texto sugerido: "O DevFest Campinas é um evento realizado pelo GDG
  Campinas, criado para conectar pessoas, compartilhar conhecimento e
  fortalecer a comunidade de tecnologia da região."

## Gotchas conhecidos

- Push rejeitado com "non-fast-forward": outra sessão/máquina pode ter
  commitado (aconteceu com os docs em `DevFestIA/`). `git pull --rebase
  origin development` e push de novo.
- CI `Promote to main` já falhou uma vez com "fatal error in commit_refs"
  (erro transiente do GitHub). Runbook: `git fetch origin && git checkout
  main && git merge --ff-only origin/development && git push origin main
  && git checkout development`.
- O Validate às vezes demora ~2 min (normalmente ~10 s); é lentidão, não
  falha. Pages leva de 40 s a 2 min.
- Preview do browser da ferramenta é instável (screenshot em branco,
  aba some): verificar via `javascript_tool` (DOM/estilos computados).
- Todo script/CSS alterado precisa de bump de `?v=N` nas 6 páginas. Ao
  incluir arquivo novo que só uma página usa, basta incluir nela.

## Next steps

1. Decidir a variante das plenárias (A/B/C) e implementar (o card de plenária deve reusar `favoriteButtonMarkup`, `talkAvatarsMarkup`, `iconMarkup`).
2. Preencher dado real conforme confirmado: local, salas/MCs,
   patrocinadores, comunidades, fotos de palestrantes, imagens de
   estacionamento/comida.
3. Quando o line-up for revelado: copiar `schedule.dev.js` →
   `schedule.js`, commit, push (ver `PROJECT_CONTEXT.md`).
4. Opcional: estender o repository pattern a `EVENT`/`TRACKS`/`SCHEDULE`.
5. Trocar o vídeo de recap (2017) pelo de 2025 em `data/video.js`.
