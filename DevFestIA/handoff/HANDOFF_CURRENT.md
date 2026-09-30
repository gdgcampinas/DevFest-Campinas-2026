# Handoff — Current State

**Last updated:** 2026-09-29/30, sessão 9 (contínua, virou longa — recomendado abrir chat novo pra próxima task). Feito desde o marco anterior: banner "Seja patrocinador" em `patrocinio.html`; cards com ícone em "Sobre"/"GDG" na home; trilha renomeada pra "Carreira em Tecnologia"; ordem da home reorganizada (Destaques -> Sobre/GDG -> Trilhas -> Números -> Vídeo -> Fotos -> Depoimentos -> Antes de vir -> teasers de página -> Patrocinadores -> Comunidades -> Realização); teaser "Palestrantes" removido da home; quiz redesenhado (tela inicial e botões de compartilhar do resultado viraram card/botões de verdade, não mais soltos/transparentes); **página Time com gente de verdade**: 4 organizadores reais (Renato Ramos, Bianca Issa, Michel Salomé, Carlos H — só Renato e Michel têm foto/LinkedIn confirmados, ver Pendências) e 18 voluntários reais (nome, LinkedIn próprio, foto de 17 deles em `assets/img/team/`, cargo com gênero certo "Voluntária"/"Voluntário", ordem alternando mulher/homem a pedido do Renato, card com barra azul/verde separando organizador de voluntário); foto do card não corta mais rosto (proporção 4:5, foco no terço de cima); "Quem somos" ganhou card de verdade (tinha ficado sem estilo, bug de sessão anterior corrigido); **travessão ("—") removido de todo texto visível do site** (ficou só em comentário de código, invisível). Ideia "álbum ao vivo" registrada no backlog. **ARMADILHA que mordeu nesta sessão: mudei o CONTEÚDO de `schedule.js` sem subir o `?v=` que ele carrega** (`schedule.js?v=22` continuou em todas as páginas mesmo com o texto novo), então o nome da trilha ficou em cache até o commit seguinte corrigir; aproveitei pra alinhar o `checkin-display.html`, que já estava desalinhado (`?v=18` contra `?v=22` do resto) antes disso. Reforça a regra: TODO arquivo cujo conteúdo mudou precisa do `?v=` subido em TODAS as páginas que o referenciam, sem exceção, e conferir se todas já estavam na mesma versão antes de mexer. Antes de confiar neste texto, rode
`git status --short --branch` e `git log --oneline --decorate -10` (o git não mente).

## Status em uma olhada

- **Mascote e comunicação:** Gumbleton (Gumble), a fênix do GDG Campinas, foi consolidado em `../../../Design/mascote-gumbleton-2026/`. O inventário e as regras de uso estão em `../../../docs/Marca_e_Mascote_2026.md`. Nenhum arquivo do site, deploy, Firebase ou workflow foi alterado por essa consolidação; aplicar o mascote no site requer autorização explícita do Renato.

- Site estático de **8 páginas** (Principal, Grade, Palestrantes, Ingressos, Time, Patrocínio, Sorteio,
  Código de Conduta — Sorteio ainda só em modo DEV, ver "Sorteio" abaixo) mais 2 ferramentas internas
  (`checkin-display.html`, `reset-teste.html`),
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
- **Estado do git ao fechar a sessão 7:** `development` = `main` = `origin/*` (tudo commitado e no ar, último commit `1f695e5`). Dados de TESTE ficaram no Firestore de verdade (check-ins, perguntas "TESTE"/"Teste testes"): limpar com o workflow antes do evento.

## Sessão 7 (2026-09-24/25): o que foi feito

1. **Chave do Firebase restrita por domínio** (feito pelo Renato no Google Cloud: `gdgcampinas.github.io`, `localhost:8080`, `devfest-campinas.firebaseapp.com`). Login Google ativado e domínio autorizado.
2. **Quiz "Monte sua trilha"** (`quiz.html`, CTA na home; PROD só trilha, DEV/revelado sugere 3 palestras e adiciona à Minha agenda).
3. **Inglês** (`?lang=en`, seletor PT|EN, PT continua padrão no código, conferidor no CI, ES/FR = só um dicionário novo).
4. **Perguntas ao vivo v2, moderação e quadro da sala** (ver PROJECT_CONTEXT "Perguntas ao vivo, moderação e quadro da sala"): pergunta nasce `pending`, moderador aprova/rejeita/marca respondida, até 3 por pessoa (era 10, reduzido na sessão 8), só com check-in, voto só em aprovada; `moderacao.html`, quadro da sala (`checkin-display.html`, antiga tela de QR), modo ensaio (`?ensaio=agora|HH:MM`), palestra fixada (`?palestra=0900.ia`), QR de check-in abre a palestra no celular.
5. **Testes de verdade sem tocar o banco:** emulador local (`DevFestIA/tools/emulator/start.sh`, site com `?emulador=1`) e 21 casos das regras (`DevFestIA/tools/questions/run-rules-tests.sh`, roda com a trava de horário ligada e como está no arquivo). O emulador guarda os dados sob o projeto `devfest-campinas`.
6. **Logins separados:** plateia (anônimo) e moderador (Google) são apps Firebase diferentes (`window.firebaseClient` / `window.moderatorClient`), pra entrar como moderador não trocar a identidade da plateia no mesmo navegador; se o banco recusar por check-in ausente o site refaz o check-in e tenta de novo.
7. **Trava de horário das perguntas: DESLIGADA de propósito (teste em DEV).** Interruptor em dois lugares que precisam ficar iguais: `windowEnforced()` em `firestore.rules` e `enforceWindow` em `docs/js/data/talk-questions.js` (um teste confere). **LIGAR antes do evento** (checklist C, item 0).
8. **Task anotada:** área administrativa com login (CRUD de moderadores, palestrantes...), análise em `project-docs/IDEAS_BACKLOG.md` (caminho recomendado: admin grava no Firestore + job exporta JSON; começar por moderadores CRUD).

## PRÓXIMO TRABALHO (decidido com o Renato, fazer nesta ordem, teste primeiro em cada etapa)

### 1. Mini-bio dos voluntários/organizadores (2026-09-30) — CÓDIGO PRONTO, FALTAM OS TEXTOS
**Feito:** campo `bio` opcional em `data/team.js`, card clicável só com bio, modal "Descubra mais sobre" (`components/person-detail.js` + `createPersonModal()` em `features/team.js`), EN pronto, testado no navegador com bio temporária. 10 pessoas já têm bio: Renato Ramos, Ricardo Koiti Matsushita, Davi Andrade, Letícia Fernandes Camargo de Campos, Pedro Escobar Missola, João Estevão Camilo, Paula Santos, Camila Fernanda Ignacio, Mayne Gabriele da Silva e Gustavo Costa. **Faltam os outros 12** (1-3 frases por pessoa): é preencher `bio` em `team.js` (5º parâmetro de `volunteer()`, `{ bio }` em `organizer()`), subir `team.js?v=` em `time.html`. Foto do Michel Salomé entrou (recorte do corpo inteiro). Abaixo, o desenho original da task:
Clicar no card (Organizadores ou Voluntários, `time.html`) abre um **modal** "Descubra mais sobre" com
mais informação da pessoa. **Os cards continuam exatamente como estão** (foto, nome, cargo, barra
azul/verde, ícone do LinkedIn) — o modal é só uma camada a mais no clique, mesmo padrão do card de
palestra (`talk-modal.js`: card clicável abre `createModal()` com o detalhe).
- **Reusar, não duplicar:** `components/modal.js` (`createModal(id).openHTML(html)`) já é genérico e já
  serve palestra, galeria e guia de instalação — é só mais um consumidor. Não criar modal novo.
- **Falta o dado:** hoje `TEAM` (`data/team.js`) não tem campo de bio, só nome/cargo/foto/LinkedIn.
  Precisa de um texto curto por pessoa (1-3 frases: quem é, o que faz, por que ajuda o GDG) — **perguntar
  ao Renato se ele já tem isso coletado (mesmo grupo do WhatsApp das fotos?) antes de desenhar o campo.**
  Sem bio pra alguém, o card não fica clicável pra essa pessoa (ou mostra só o que já existe: nome, cargo,
  LinkedIn) — decidir com ele o comportamento de quem ainda não mandou texto.
- Forma sugerida: `bio` opcional em `person()`/`organizer()`/`volunteer()` (`data/team.js`), tornar o card
  clicável só quando `person.bio` existir (`person-card.js`, mesmo `data-item`/clique de `info-card.js`),
  modal reusa foto (maior), nome, cargo, LinkedIn e o texto da bio.

### 2. Sorteio (2026-09-30) — CÓDIGO PRONTO E TESTADO, SÓ EM MODO DEV
Aba nova `sorteio.html`: cadastro público (nome/sobrenome, opt-in explícito) + roleta (área da
organização, só quem loga como moderador). Elegibilidade decidida com o Renato: a lista é todo mundo
que já fez check-in em qualquer palestra do dia (não só quem está na sala na hora do sorteio); se a
pessoa sorteada não estiver presente, o MC gira de novo — isso é manual, sem lógica no site. Dois modos
na roleta: por rodadas (não repete ganhador) ou sorteio único (trava depois do 1º prêmio). Detalhes
técnicos completos em `PROJECT_CONTEXT.md` ("Sorteio"): 2 coleções novas no Firestore
(`raffle-entries`/`raffle-draws`, regras coladas — **falta o Renato publicar as regras novas no
console, `pbcopy < DevFestIA/firebase/firestore.rules`**), login/erro do Google extraídos pra
`features/moderator-login.js`/`components/moderator-login.js` (reusado pela moderação de perguntas
também), som sintetizado (trocar por efeito de verdade é opcional, decidir depois), 14 testes jsdom
novos. Testado no navegador desktop e mobile com repositories falsos (sem Firebase de verdade ainda —
**falta testar com o Firestore real depois que o Renato publicar as regras**). Fica **atrás de
`devOnly`** (não aparece no menu nem mostra conteúdo real fora do modo DEV/`?lineup=1`, a pedido do
Renato) até decidir abrir pro público — ver Pendências.

### Motor das perguntas ao vivo — FEITO E ESTÁVEL desde a sessão 8, sem pendência técnica
Fluxo simples: espectador com check-in pergunta (até 3) -> moderador aprova/rejeita/reabre/marca
respondida -> espectadores votam -> ordena por votos. Leitura barata (`talk-boards/<talkKey>`, sem
Blaze, dentro das 50 mil leituras/dia do Spark). Moderação testada e funcionando (login, aprovar,
publicar no quadro). **Ainda não feito, decidido mas pausado a pedido do Renato:** página **Sala ao
vivo** no celular (`sala.html?trilha=ia`, plano B sem TV) e tela **Palco** do moderador — retomar só
quando ele pedir, não é a próxima prioridade.

**Armadilhas desta sessão:** (a) `?v=` por arquivo precisa ser IGUAL em todas as páginas que o referenciam, senão o cache serve arquivo velho (já houve páginas com número desatualizado); (b) `?ensaio=` fica guardado na aba (sessionStorage): use `?ensaio=0&emulador=0` pra limpar antes de testar outra coisa; (c) o Firebase MCP daqui aponta pra outro projeto e o Firebase CLI não está logado: **regras do Firestore continuam sendo coladas à mão** (`pbcopy < DevFestIA/firebase/firestore.rules`), e o Renato já publicou a versão com a trava de horário desligada; (d) `run-rules-tests.sh` precisa da porta 8085 livre (pare o `start.sh` antes); os testes do emulador NÃO rodam no CI (baixam o emulador); (e) apagar IndexedDB do Firebase com outra aba aberta na mesma origem trava o login (`deleteDatabase` fica bloqueado); (f) testes que gravam no banco de verdade deixam dados: rodar 🧹 Limpar dados de teste (agora inclui `talk-questions` e `talk-question-votes`) antes do evento.

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
0. **Sorteio (sessão 9/30):** publicar as regras novas do Firestore no console
   (`pbcopy < DevFestIA/firebase/firestore.rules`, tem `raffle-entries`/`raffle-draws` juntas com as de
   sempre); decidir quando tirar do `devOnly` e abrir pro público; decidir se troca o som sintetizado por
   um efeito de verdade (grátis, simples, a pedido do Renato) e por qual; decidir quantos prêmios/como
   funciona no dia (a roleta já aceita "por rodadas" ou "sorteio único", só falta a operação combinar).
0b. **Dados de time em aberto (sessão 9/30):**
   - **Cargo dos 4 organizadores reais** (Renato Ramos, Bianca Issa, Michel Salomé, Carlos H): nenhum tem
     cargo confirmado ainda, o card mostra só o nome.
   - **Foto e LinkedIn de Bianca Issa e Carlos H:** faltam os dois. (Michel Salomé: foto e LinkedIn OK.)
   - **LinkedIn de Laydianne Naira:** o link colado no grupo veio cortado (`.../in/naira-ferreira-`, sem
     o resto) — confirmar com ela.
   - **LinkedIn de Davi Andrade:** ele mandou por PV no grupo, nunca confirmado aqui; o site usa o link
     da leva anterior (`davi-lima-4695b3211`), assumindo que é a mesma pessoa — confirmar.
   - **Mini-bio de todo mundo** (organizadores e voluntários), pra task acima ("PRÓXIMO TRABALHO").
1. **Dados reais:** local (`EVENT.venue`, `venueConfirmed`), salas/MCs, line-up e palestrantes reais
   (mesmo formato de `mock-talks.js`/`mock-speakers.js`), patrocinadores/comunidades, time, depoimentos,
   valores dos ingressos, vídeo de recap 2025 (`data/video.js` ainda tem o de 2017). Com o line-up real:
   `EVENT.lineupRevealed = true` (todas as seções leem o mesmo `reveal`).
2. **Plenárias:** escolher A, B ou C (recomendo **B**, só 17:15, custo zero). Mockup aprovado.
3. **Mensagens do Sympla:** confirmação com `.../ingressos.html?cartao=1`; final com
   `.../index.html?avaliar=1`; QR de avaliação do evento no encerramento (QR de exemplo já gerados).
4. **Tablets das salas:** definir quem monta e abrir os 4 links com antecedência (recarga forçada).
5. Confirmar grafia/existência dos lugares das salas.
6. **Patrocínio FIAP (PC 1427137, R$1.500,00, aprovado):** emitir a nota fiscal na **1ª semana de
   dezembro/2026** (data de entrega no PC é 02/12/2026, não pode ter competência anterior a isso) e
   sempre antes do dia 25 do mês pra cair no ciclo de pagamento; incluir o número do PC nos dados
   adicionais e os dados bancários no corpo da NF; enviar NF + boleto pra `notafiscal@fiap.com.br`
   (também `compras@fiap.com.br` e `jullieti.borba@alura.com.br`). Pagamento sai só nos dias 05/10/15/20,
   45 dias após emissão. Pendente confirmar com a Jullieti se precisa gerar boleto à parte (depósito) ou
   se a NF com dados bancários já basta — mensagem de dúvida rascunhada, aguardando envio do Renato.

**B. Quando entrarem as primeiras inscrições**
6. Conferir o resumo do 🎫 Sincronizar Sympla: formato do `custom_form` (camiseta) e paginação da
   v1.5.1 (parâmetro `page`), ainda não vistos com dado real (2026 tinha 0).
7. Testar o gate com o e-mail de uma inscrição real e então virar `EVENT.tickets.registrationGate: true`
   em `schedule.js` (senão o cartão trava pra todos). Só o `schedule.js` importa no ar: o `/DEV/` e o
   `/PROD/` publicados leem ele. O `schedule.dev.js` é gitignored e existe só na máquina do Renato
   (line-up real); mantenha-o igual só pros testes locais não divergirem, esquecer dele NÃO quebra o site.

**C. Antes do evento (checklist do dia anterior)**
0. **LIGAR A TRAVA DE HORÁRIO das perguntas** (hoje desligada pra testar): `windowEnforced()` = `true` em `DevFestIA/firebase/firestore.rules` E `enforceWindow: true` em `docs/js/data/talk-questions.js`; rodar `DevFestIA/tools/questions/run-rules-tests.sh` (o script testa com a trava ligada de qualquer jeito); colar as regras no console; fazer o ensaio (`?ensaio=agora`) pra conferir a janela de verdade; limpar os dados de teste.
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
    ao vivo, arquivo da fênix (vídeo, sprites ou animação, com som?), quem opera.
    Já dá pra começar pelas cenas que não dependem disso (agora/próximas, QR, números, galáxia).
    **Mascote (fênix) consolidada (2026-09-30):** Gumbleton (Gumble) e os materiais derivados foram arquivados
    em `../../../Design/mascote-gumbleton-2026/`, inclusive as referências aprovadas em `referencias/mascote-aprovado/`
    e `referencias/logo-oficial/`. Ainda é material estático, sem vídeo/sprite/animação.
    **Onde usar (favicon, home, og:image, ou só guardar pro mural) ainda está em aberto — perguntar ao Renato
    antes de aplicar em qualquer lugar do site.**
11b. **Área administrativa com login** (CRUD de moderadores, palestrantes, patrocinadores...; análise e caminho recomendado em `IDEAS_BACKLOG.md`): começar por moderadores CRUD; depois de fechar perguntas e quadro da sala.
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
- **Testes de tela (jsdom, sessão 8):** `npm ci --prefix DevFestIA/tools && node --test DevFestIA/tools/dom/*.test.js` (59 casos: perguntas da plateia, moderação, quadro da sala, feedback da palestra e do evento; rodam no CI). Regras do Firestore: `DevFestIA/tools/questions/run-rules-tests.sh` (35 casos, emulador, local).
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
