# DevFest Campinas 2026

Site de agenda ao vivo do DevFest Campinas 2026 (GDG Campinas). Página
única, estática, que muda de estado sozinha conforme o horário: antes
do evento (contador regressivo), ao vivo agora (trilha por trilha) e
encerrado.

**[Ver site no ar →](https://gdgcampinas.github.io/DevFest-Campinas-2026/)**

## Stack

HTML/CSS/JS puro. Zero build, zero framework, zero dependência de npm.
Fontes via Google Fonts CDN (Manrope + Public Sans). Publicado via
GitHub Pages direto da pasta `docs/`.

## Arquitetura de pastas

```
docs/                       ← fonte do GitHub Pages (site em si)
  index.html                  estrutura da página, sem lógica
  css/styles.css               design tokens (oklch) + todo o visual
  assets/icons/                 ícones/favicons
  js/
    data/                        dados do evento (o que muda a cada edição)
      schedule.js                  PROD — mock até a revelação do line-up
      schedule.dev.js              DEV — dados reais, gitignored, só local
      sponsors.js                  patrocinadores/parceiros por tier
      team.js                      organizadores
      cod.js                       texto do código de conduta
    components/                  templates reusáveis (uma responsabilidade cada)
      avatar.js                    foto ou iniciais — fallback automático
      track-card.js                 card de palestra (agenda + hero) + modal de detalhe
      info-card.js                  card genérico "antes de vir"
      sponsor-card.js               logo de patrocinador por tier
      person-card.js                 card de pessoa (time)
    features/                    liga dado + template + comportamento
      agenda.js                    legenda, abas de filtro, agenda completa
      live-status.js                calcula e renderiza o estado ao vivo
      talk-modal.js                  modal genérico (palestra + galerias)
      speakers.js                    galeria de palestrantes (extraída do schedule)
      sponsors.js                    seção de patrocinadores
      team.js                        seção de organizadores
      cod.js                         seção de código de conduta
      seo.js                         JSON-LD (schema.org/Event)
    app.js                       bootstrap — liga tudo, overrides de URL

project-docs/                ← documentação do projeto (não é o site)
  PROJECT_CONTEXT.md            arquitetura permanente, decisões de design
  Continuidade.md                como esses docs se relacionam

handoff/
  HANDOFF_CURRENT.md            estado atual, diário de bordo

.github/workflows/
  validate.yml                  CI: node --check em todo .js, todo push/PR
  promote.yml                   CI: auto-merge development → main quando o Validate passa
```

## Decisão central: zero CSS por trilha

Nenhuma regra de CSS depende do id de uma trilha (`ia`, `webdata`...).
Cor, ícone e nível são sempre dado (`TRACKS` em `schedule.js`),
aplicados via `--track-color` inline pelo JS. Adicionar, renomear ou
recolorir uma trilha é 1 linha em `schedule.js` — nada pra tocar em
`styles.css`. O mesmo vale pra quantidade de trilhas: os grids usam
`repeat(var(--track-count), 1fr)`.

Seções que dependem de dado que ainda não existe (patrocinadores,
organizadores, palestrantes antes da revelação) somem sozinhas até o
dado chegar — não precisam de HTML/CSS comentado esperando conteúdo.

## Dado sensível (line-up antes da revelação pública)

`docs/js/data/schedule.dev.js` tem os dados reais e é **gitignored**
— nunca é commitado antes da revelação. `index.html` tenta carregá-lo
primeiro; se não existir (sempre o caso em produção), cai pra
`schedule.js` (mock). Pra revelar de verdade: copiar o conteúdo de
`schedule.dev.js` pra `schedule.js`, commit, push.

## Testando localmente

```bash
cd docs && python3 -m http.server 8080
```

Overrides de URL:
- `?demo=2026-11-28T09:15` — simula o horário do evento (avança em
  tempo real a partir desse ponto, não congela)
- `?lineup=1` — força mostrar line-up/palestrantes mesmo antes da
  revelação oficial

## Fluxo de trabalho (gitflow)

- `development` — branch de trabalho, todo commit entra aqui primeiro
- `main` — produção, é o que o GitHub Pages publica (`main`/`docs`)
- Push em `development` → CI roda `node --check` em todo `.js` → se
  passar, outro workflow já mergeia (`--ff-only`) pra `main` sozinho
- Nada de commit direto em `main`

## Deploy manual (se precisar)

1. Editar
2. `node --check` em todo `.js` alterado
3. Bumpar `?v=N` nos `<link>`/`<script>` do `index.html` cujo arquivo mudou
4. Testar local (`?demo=` nos pontos de transição, console sem erro)
5. Commit (PT-BR, sem menção de IA) → push em `development`
6. CI cuida do resto
