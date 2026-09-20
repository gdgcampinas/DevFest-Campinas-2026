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
- Salas e MCs das 4 trilhas: `"Sala a definir"` / `"MC a definir"`.
- `EVENT.lineupRevealed` é `false`. `schedule.dev.js` existe local
  (gitignored) espelhando o `schedule.js` mock; line-up real não carregado.
  Sempre editar os dois juntos.
- `sponsors.js` e `partner-communities.js`: mock (`example.com`).
- Fotos dos palestrantes (Destaques e agenda) são stock do pravatar.cc
  (não há ferramenta de imagem/IA na sessão). Trocar pelas reais.
- Time, testimonials, team-photos: mock.
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
